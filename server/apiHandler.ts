import type { IncomingMessage, ServerResponse } from 'node:http'
import { isGeminiConfigured, generateConceptsWithGemini, explainTradeoffsWithGemini } from './geminiService'
import { validateConceptRequest, validateTradeoffRequest, RateLimiter } from './validator'

const MAX_BODY_BYTES = 64 * 1024 // 64 KB maximum request size to avoid DoS
const rateLimiter = new RateLimiter(30, 60000) // 30 requests per minute

/**
 * Extracts and safely parses JSON body with size bounding
 */
export async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = ''
    let receivedBytes = 0

    req.on('data', (chunk) => {
      receivedBytes += chunk.length
      if (receivedBytes > MAX_BODY_BYTES) {
        req.destroy()
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
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Cache-Control': 'no-store',
    ...headers,
  })
  res.end(payload)
}

/**
 * Central Node HTTP Request Handler for Celebrio AI Planning Service
 */
export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url || '/'
  const method = req.method?.toUpperCase() || 'GET'

  // Only handle routes starting with /api/
  if (!url.startsWith('/api/')) {
    return false
  }

  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || 'unknown-client'

  try {
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

    // Unmatched API endpoint
    sendJson(res, 404, { error: 'API endpoint not found' })
    return true
  } catch (err: any) {
    const isPayloadTooLarge = err?.message?.includes('PAYLOAD_TOO_LARGE')
    const isMalformedJson = err?.message?.includes('MALFORMED_JSON')

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
