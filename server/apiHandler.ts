import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  isGeminiConfigured,
  generateConceptsWithGemini,
  explainTradeoffsWithGemini,
  explainUrgentTasksWithGemini,
} from './geminiService'
import {
  validateConceptRequest,
  validateTradeoffRequest,
  validateCopilotTaskAdviceRequest,
  RateLimiter,
} from './validator'

const MAX_BODY_BYTES = 64 * 1024 // 64 KB maximum request size to avoid DoS
const rateLimiter = new RateLimiter(30, 60000) // 30 requests per minute

/**
 * Extracts and safely parses JSON body with size bounding
 */
export async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const preParsed = req as unknown as { body?: unknown }
  if (preParsed.body !== undefined) {
    if (typeof preParsed.body === 'object' && preParsed.body !== null) {
      return preParsed.body
    }
    if (typeof preParsed.body === 'string') {
      try {
        return JSON.parse(preParsed.body)
      } catch {
        throw new Error('MALFORMED_JSON: Invalid JSON body')
      }
    }
  }

  return new Promise((resolve, reject) => {
    let raw = ''
    let receivedBytes = 0

    req.on('data', (chunk) => {
      receivedBytes += chunk.length
      if (receivedBytes > MAX_BODY_BYTES) {
        if (typeof req.destroy === 'function') {
          req.destroy()
        }
        reject(new Error('PAYLOAD_TOO_LARGE: Request exceeds 64KB limit'))
        return
      }
      raw += chunk
    })

    req.on('end', () => {
      if (!raw.trim()) {
        resolve({})
        return
      }
      try {
        const parsed = JSON.parse(raw)
        resolve(parsed)
      } catch {
        reject(new Error('MALFORMED_JSON: Invalid JSON body'))
      }
    })

    req.on('error', (err) => {
      reject(err)
    })
  })
}

/**
 * Helper to write JSON response with security headers
 */
function sendJson(res: ServerResponse, statusCode: number, data: unknown, headers?: Record<string, string>): void {
  const payload = JSON.stringify(data)
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    ...headers,
  })
  res.end(payload)
}

/**
 * Whitelist of permitted API endpoints.
 * Strict validation prevents arbitrary route traversal or execution of unauthorized handlers.
 */
export const ALLOWED_API_ENDPOINTS = new Set([
  '/api/health',
  '/api/plan/generate-concepts',
  '/api/plan/explain-tradeoffs',
  '/api/copilot/explain-urgent-tasks',
  '/api/plan/copilot-task-advice',
])

export interface ResolvedRoute {
  /** The normalized route path, e.g. '/api/health' */
  path: string
  /** Whether the request targets the /api namespace */
  isApi: boolean
  /** Whether the resolved path is in the authorized whitelist */
  isAllowed: boolean
}

/**
 * Resolves the effective API path from an incoming HTTP request.
 * Supports:
 *  1. Direct paths: req.url = '/api/health'
 *  2. Vercel path-preserving rewrites: req.url = '/api?endpoint=health'
 *  3. Fallback proxy headers: x-forwarded-uri, x-matched-path (secondary only)
 *
 * Strict sanitization & security checks:
 *  - Strips leading/trailing slashes
 *  - Rejects HTTP parameter pollution / duplicate endpoint parameters
 *  - Rejects single and double-encoded directory traversal sequences ('..', '%2e%2e', '%252e%252e')
 *  - Rejects backslashes ('\\', '%5c'), null bytes ('\0', '%00'), and control characters
 *  - Rejects malformed percent-encoding
 *  - Normalizes to canonical '/api/...' format
 *  - Strictly validates against the ALLOWED_API_ENDPOINTS whitelist
 */
export function resolveApiPath(req: IncomingMessage): ResolvedRoute {
  const rawUrl = req.url || '/'

  let pathname = '/'
  let endpointParams: string[] = []

  try {
    const parsed = new URL(rawUrl, 'http://localhost')
    pathname = parsed.pathname
    endpointParams = parsed.searchParams.getAll('endpoint')
  } catch {
    pathname = rawUrl.split('?')[0] || '/'
  }

  // Also check parsed query object if attached by serverless runtime (e.g. Vercel)
  const preQuery = (req as unknown as { query?: Record<string, string | string[]> }).query
  if (endpointParams.length === 0 && preQuery && preQuery.endpoint !== undefined) {
    if (Array.isArray(preQuery.endpoint)) {
      endpointParams = preQuery.endpoint
    } else if (typeof preQuery.endpoint === 'string') {
      endpointParams = [preQuery.endpoint]
    }
  }

  // Security check: Reject ambiguous HTTP parameter pollution (duplicate endpoint parameters)
  if (endpointParams.length > 1) {
    return { path: '/api/invalid-ambiguous', isApi: true, isAllowed: false }
  }

  const endpointParam = endpointParams[0] ?? null

  // Strict decoding and sanitization helper
  const sanitizeAndValidate = (input: string): { normalized: string; valid: boolean } => {
    // 1. Reject control characters (ASCII 0-31 and 127)
    for (let i = 0; i < input.length; i++) {
      const code = input.charCodeAt(i)
      if ((code >= 0 && code <= 31) || code === 127) {
        return { normalized: '/api/invalid', valid: false }
      }
    }

    // 2. Strict URL decoding verification
    let decoded = input
    try {
      decoded = decodeURIComponent(input)
    } catch {
      // Malformed percent-encoding (e.g. %FF)
      return { normalized: '/api/invalid', valid: false }
    }

    // 3. Double-decoding check against nested percent encoding (e.g. %252e%252e -> %2e%2e -> ..)
    let doubleDecoded = decoded
    try {
      doubleDecoded = decodeURIComponent(decoded)
    } catch {
      // Ignore if not further decodable
    }

    // 4. Reject traversal sequences, backslashes, or null bytes
    if (
      decoded.includes('..') ||
      doubleDecoded.includes('..') ||
      decoded.includes('\\') ||
      doubleDecoded.includes('\\') ||
      decoded.includes('\0') ||
      doubleDecoded.includes('\0')
    ) {
      return { normalized: '/api/invalid', valid: false }
    }

    const cleaned = decoded.trim().replace(/^\/+|\/+$/g, '')
    if (!cleaned) {
      return { normalized: '/api', valid: false }
    }

    const normalized = cleaned.startsWith('api/') ? `/${cleaned}` : `/api/${cleaned}`
    return {
      normalized,
      valid: ALLOWED_API_ENDPOINTS.has(normalized),
    }
  }

  // Case 1: Explicit rewrite query parameter from Vercel rewrite: /api?endpoint=...
  if (endpointParam !== null && (pathname === '/api' || pathname === '/api/')) {
    const { normalized, valid } = sanitizeAndValidate(endpointParam)
    return {
      path: normalized,
      isApi: true,
      isAllowed: valid,
    }
  }

  // Case 2: Direct request URL: /api/health or /api/...
  if (pathname === '/api' || pathname.startsWith('/api/')) {
    const { normalized, valid } = sanitizeAndValidate(pathname)
    return {
      path: normalized,
      isApi: true,
      isAllowed: valid,
    }
  }

  // Case 3: Secondary fallback to proxy headers (if server was invoked via an upstream proxy)
  const forwardedUri = (req.headers?.['x-forwarded-uri'] as string) || (req.headers?.['x-matched-path'] as string)
  if (forwardedUri) {
    try {
      const forwardedPath = new URL(forwardedUri, 'http://localhost').pathname
      if (forwardedPath === '/api' || forwardedPath.startsWith('/api/')) {
        const { normalized, valid } = sanitizeAndValidate(forwardedPath)
        return {
          path: normalized,
          isApi: true,
          isAllowed: valid,
        }
      }
    } catch {
      // Ignore malformed header
    }
  }

  return {
    path: pathname,
    isApi: false,
    isAllowed: false,
  }
}

/**
 * Central Node HTTP Request Handler for Celebrio AI Planning Service
 */
export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const route = resolveApiPath(req)

  // Only handle routes starting with or targeting /api
  if (!route.isApi) {
    return false
  }

  const method = req.method?.toUpperCase() || 'GET'

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    })
    res.end()
    return true
  }

  // If route is under /api but not in authorized whitelist, return 404
  if (!route.isAllowed) {
    sendJson(res, 404, { error: 'API endpoint not found' })
    return true
  }

  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || 'unknown-client'

  try {
    const url = route.path
    // 1. Health check endpoint
    if (url === '/api/health' && method === 'GET') {
      const configured = isGeminiConfigured()
      sendJson(res, 200, {
        status: 'ok',
        hasGeminiKey: configured,
        model: 'gemini-2.5-flash',
        mode: configured ? 'live' : 'demo',
        version: '1.0.0',
      })
      return true
    }

    // 2. Generate Concepts
    if (url === '/api/plan/generate-concepts' && method === 'POST') {
      // Check rate limiter
      const rate = rateLimiter.check(clientIp)
      if (!rate.allowed) {
        sendJson(
          res,
          429,
          {
            error: 'Rate limit exceeded. Please wait before making more planning requests.',
            retryAfterSeconds: rate.retryAfterSeconds,
          },
          { 'Retry-After': String(rate.retryAfterSeconds || 60) },
        )
        return true
      }

      const body = await readJsonBody(req)
      const validation = validateConceptRequest(body)

      if (!validation.isValid || !validation.sanitized) {
        sendJson(res, 400, {
          error: 'Invalid planning parameters',
          details: validation.errors,
        })
        return true
      }

      const result = await generateConceptsWithGemini(validation.sanitized)
      sendJson(res, 200, result)
      return true
    }

    // 3. Explain What-If Replanning Trade-offs
    if (url === '/api/plan/explain-tradeoffs' && method === 'POST') {
      const rate = rateLimiter.check(clientIp)
      if (!rate.allowed) {
        sendJson(
          res,
          429,
          {
            error: 'Rate limit exceeded.',
            retryAfterSeconds: rate.retryAfterSeconds,
          },
          { 'Retry-After': String(rate.retryAfterSeconds || 60) },
        )
        return true
      }

      const body = await readJsonBody(req)
      const validation = validateTradeoffRequest(body)

      if (!validation.isValid || !validation.sanitized) {
        sendJson(res, 400, {
          error: 'Invalid trade-off parameters',
          details: validation.errors,
        })
        return true
      }

      const result = await explainTradeoffsWithGemini(validation.sanitized)
      sendJson(res, 200, result)
      return true
    }

    // 4. AI Copilot: Explain Urgent Tasks & Recommendations
    if ((url === '/api/copilot/explain-urgent-tasks' || url === '/api/plan/copilot-task-advice') && method === 'POST') {
      const rate = rateLimiter.check(clientIp)
      if (!rate.allowed) {
        sendJson(
          res,
          429,
          {
            error: 'Rate limit exceeded.',
            retryAfterSeconds: rate.retryAfterSeconds,
          },
          { 'Retry-After': String(rate.retryAfterSeconds || 60) },
        )
        return true
      }

      const body = await readJsonBody(req)
      const validation = validateCopilotTaskAdviceRequest(body)

      if (!validation.isValid || !validation.sanitized) {
        sendJson(res, 400, {
          error: 'Invalid Copilot request parameters',
          details: validation.errors,
        })
        return true
      }

      const result = await explainUrgentTasksWithGemini(validation.sanitized)
      sendJson(res, 200, result)
      return true
    }

    // Unmatched API endpoint
    sendJson(res, 404, { error: 'API endpoint not found' })
    return true
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    const isPayloadTooLarge = message.includes('PAYLOAD_TOO_LARGE')
    const isMalformedJson = message.includes('MALFORMED_JSON')

    if (isPayloadTooLarge) {
      sendJson(res, 413, { error: 'Payload too large. Maximum size is 64KB.' })
      return true
    }

    if (isMalformedJson) {
      sendJson(res, 400, { error: 'Malformed JSON payload.' })
      return true
    }

    sendJson(res, 500, { error: 'Internal server error processing AI planning request' })
    return true
  }
}
