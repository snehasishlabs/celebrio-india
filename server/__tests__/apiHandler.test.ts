import { describe, it, expect, vi } from 'vitest'
import { EventEmitter } from 'node:events'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleApiRequest, resolveApiPath, ALLOWED_API_ENDPOINTS } from '../apiHandler'

function createMockReq(method: string, url: string, body?: any): IncomingMessage {
  const req = new EventEmitter() as any
  req.method = method
  req.url = url
  req.headers = { 'content-type': 'application/json' }
  req.socket = { remoteAddress: '127.0.0.1' }
  req.destroy = vi.fn()

  process.nextTick(() => {
    if (body !== undefined) {
      req.emit('data', Buffer.from(typeof body === 'string' ? body : JSON.stringify(body)))
    }
    req.emit('end')
  })

  return req
}

function createMockRes() {
  let statusCode = 200
  let headers: Record<string, string> = {}
  let body = ''

  const res = {
    writeHead: (code: number, hdrs?: Record<string, string>) => {
      statusCode = code
      if (hdrs) headers = { ...headers, ...hdrs }
    },
    setHeader: (name: string, val: string) => {
      headers[name] = val
    },
    end: (chunk?: string) => {
      if (chunk) body += chunk
    },
  } as unknown as ServerResponse

  return {
    res,
    getStatusCode: () => statusCode,
    getHeaders: () => headers,
    getJsonBody: () => (body ? JSON.parse(body) : null),
  }
}

describe('Server API Request Handler (apiHandler.ts)', () => {
  it('ignores non-api routes and returns false', async () => {
    const req = createMockReq('GET', '/index.html')
    const { res } = createMockRes()

    const handled = await handleApiRequest(req, res)
    expect(handled).toBe(false)
  })

  describe('GET /api/health', () => {
    it('returns 200 status with server health and mode flag', async () => {
      const req = createMockReq('GET', '/api/health')
      const { res, getStatusCode, getJsonBody, getHeaders } = createMockRes()

      const handled = await handleApiRequest(req, res)
      expect(handled).toBe(true)
      expect(getStatusCode()).toBe(200)

      const body = getJsonBody()
      expect(body.status).toBe('ok')
      expect(body).toHaveProperty('hasGeminiKey')
      expect(body.model).toBe('gemini-2.5-flash')
      expect(['live', 'demo']).toContain(body.mode)

      // Security header check
      expect(getHeaders()['X-Content-Type-Options']).toBe('nosniff')
    })
  })

  describe('POST /api/plan/generate-concepts', () => {
    it('returns 200 with structured concepts for valid input', async () => {
      const payload = {
        eventId: 'evt-test-api',
        title: 'Midsummer Gala',
        category: 'community',
        city: 'Denver, CO',
        targetGuestCount: 150,
        totalBudget: 35000,
        currency: 'USD',
      }

      const req = createMockReq('POST', '/api/plan/generate-concepts', payload)
      const { res, getStatusCode, getJsonBody } = createMockRes()

      const handled = await handleApiRequest(req, res)
      expect(handled).toBe(true)
      expect(getStatusCode()).toBe(200)

      const body = getJsonBody()
      expect(body.concepts).toHaveLength(3)
      expect(body.source).toBeDefined()
    })

    it('returns 400 when request fails validation', async () => {
      const invalidPayload = {
        eventId: 'evt-test-invalid',
        title: '', // Empty title
        category: 'wedding',
        targetGuestCount: -10, // Invalid guest count
        totalBudget: 50000,
        currency: 'USD',
      }

      const req = createMockReq('POST', '/api/plan/generate-concepts', invalidPayload)
      const { res, getStatusCode, getJsonBody } = createMockRes()

      const handled = await handleApiRequest(req, res)
      expect(handled).toBe(true)
      expect(getStatusCode()).toBe(400)

      const body = getJsonBody()
      expect(body.error).toMatch(/Invalid planning parameters/i)
      expect(body.details.length).toBeGreaterThan(0)
    })

    it('returns 413 Payload Too Large when request body exceeds 64KB', async () => {
      const oversizedPayload = {
        eventId: 'evt-oversized',
        title: 'Huge Plan',
        category: 'wedding',
        targetGuestCount: 100,
        totalBudget: 50000,
        currency: 'USD',
        bloat: 'x'.repeat(70 * 1024), // 70 KB
      }

      const req = createMockReq('POST', '/api/plan/generate-concepts', oversizedPayload)
      const { res, getStatusCode, getJsonBody } = createMockRes()

      const handled = await handleApiRequest(req, res)
      expect(handled).toBe(true)
      expect(getStatusCode()).toBe(413)

      const body = getJsonBody()
      expect(body.error).toMatch(/Payload too large/i)
    })

    it('returns 400 when request contains malformed JSON', async () => {
      const req = createMockReq('POST', '/api/plan/generate-concepts', '{ bad json: invalid ')
      const { res, getStatusCode, getJsonBody } = createMockRes()

      const handled = await handleApiRequest(req, res)
      expect(handled).toBe(true)
      expect(getStatusCode()).toBe(400)

      const body = getJsonBody()
      expect(body.error).toMatch(/Malformed JSON/i)
    })
  })

  describe('POST /api/plan/explain-tradeoffs', () => {
    it('returns 200 with trade-off recommendations for valid replanning simulation', async () => {
      const payload = {
        eventId: 'evt-tradeoff-sim',
        baseline: { category: 'wedding', totalBudget: 40000, guestCount: 100 },
        proposed: { totalBudget: 35000, guestCount: 80, dateDeltaDays: 0 },
        deltas: { budgetDelta: -5000, perGuestDelta: -12, contingencyDelta: -500 },
        affectedCategories: ['Catering'],
      }

      const req = createMockReq('POST', '/api/plan/explain-tradeoffs', payload)
      const { res, getStatusCode, getJsonBody } = createMockRes()

      const handled = await handleApiRequest(req, res)
      expect(handled).toBe(true)
      expect(getStatusCode()).toBe(200)

      const body = getJsonBody()
      expect(body.strategicSummary).toBeDefined()
      expect(body.culinaryRecommendations.length).toBeGreaterThan(0)
    })
  })

  describe('POST /api/copilot/explain-urgent-tasks', () => {
    it('returns 200 with Copilot urgent task analyses and cultural advice', async () => {
      const payload = {
        eventId: 'ev-bengali-kolkata',
        eventTitle: "Ananya & Debabrata's Bengali Wedding",
        category: 'wedding',
        city: 'Kolkata',
        eventDate: '2026-11-28',
        targetGuestCount: 150,
        totalBudget: 300000,
        currency: 'INR',
        traditions: ['bengali-biye'],
        urgentTasks: [
          {
            id: 't-1',
            title: 'Execute Venue Contract & Transmit Deposit',
            deadline: '2026-11-04',
            isCriticalPath: true,
            priority: 'critical',
            phase: 'concept-planning',
            status: 'todo',
          },
          {
            id: 't-2',
            title: 'Secure Primary Catering & Beverage Proposal',
            deadline: '2026-11-08',
            isCriticalPath: true,
            priority: 'critical',
            phase: 'vendor-curation',
            status: 'todo',
          },
        ],
      }

      const req = createMockReq('POST', '/api/copilot/explain-urgent-tasks', payload)
      const { res, getStatusCode, getJsonBody } = createMockRes()

      const handled = await handleApiRequest(req, res)
      expect(handled).toBe(true)
      expect(getStatusCode()).toBe(200)

      const body = getJsonBody()
      expect(body.headline).toBeDefined()
      expect(body.urgentTaskAnalyses.length).toBeGreaterThan(0)
      expect(body.budgetGuidance).toBeDefined()
    })
  })

  describe('Unmatched routes', () => {
    it('returns 404 for unknown /api/* endpoints', async () => {
      const req = createMockReq('GET', '/api/unknown-endpoint')
      const { res, getStatusCode } = createMockRes()

      const handled = await handleApiRequest(req, res)
      expect(handled).toBe(true)
      expect(getStatusCode()).toBe(404)
    })
  })

  describe('CORS preflight (OPTIONS)', () => {
    it('returns 204 with CORS headers for direct API path', async () => {
      const req = createMockReq('OPTIONS', '/api/plan/generate-concepts')
      const { res, getStatusCode, getHeaders } = createMockRes()

      const handled = await handleApiRequest(req, res)
      expect(handled).toBe(true)
      expect(getStatusCode()).toBe(204)
      const headers = getHeaders()
      expect(headers['Access-Control-Allow-Origin']).toBe('*')
      expect(headers['Access-Control-Allow-Methods']).toContain('POST')
    })

    it('returns 204 with CORS headers for rewritten Vercel query path', async () => {
      const req = createMockReq('OPTIONS', '/api?endpoint=copilot/explain-urgent-tasks')
      const { res, getStatusCode, getHeaders } = createMockRes()

      const handled = await handleApiRequest(req, res)
      expect(handled).toBe(true)
      expect(getStatusCode()).toBe(204)
      const headers = getHeaders()
      expect(headers['Access-Control-Allow-Origin']).toBe('*')
    })
  })

  describe('Vercel path-preserving rewrites (/api?endpoint=...) simulation', () => {
    it('handles GET /api?endpoint=health preserving 200 health response', async () => {
      const req = createMockReq('GET', '/api?endpoint=health')
      const { res, getStatusCode, getJsonBody } = createMockRes()

      const handled = await handleApiRequest(req, res)
      expect(handled).toBe(true)
      expect(getStatusCode()).toBe(200)

      const body = getJsonBody()
      expect(body.status).toBe('ok')
      expect(body.model).toBe('gemini-2.5-flash')
      expect(body.mode).toBeDefined()
    })

    it('preserves query strings alongside rewritten endpoint: GET /api?endpoint=health&source=test', async () => {
      const req = createMockReq('GET', '/api?endpoint=health&source=test&version=1')
      const { res, getStatusCode, getJsonBody } = createMockRes()

      const handled = await handleApiRequest(req, res)
      expect(handled).toBe(true)
      expect(getStatusCode()).toBe(200)
      expect(getJsonBody().status).toBe('ok')
    })

    it('handles POST /api?endpoint=plan/generate-concepts with full request body', async () => {
      const payload = {
        eventId: 'evt-rewrite-test',
        title: 'Rewritten Route Test Reception',
        category: 'wedding',
        city: 'Mumbai',
        totalBudget: 450000,
        targetGuestCount: 200,
        currency: 'INR',
        traditions: ['punjabi'],
      }

      const req = createMockReq('POST', '/api?endpoint=plan/generate-concepts', payload)
      const { res, getStatusCode, getJsonBody } = createMockRes()

      const handled = await handleApiRequest(req, res)
      expect(handled).toBe(true)
      expect(getStatusCode()).toBe(200)

      const body = getJsonBody()
      expect(body.concepts).toBeDefined()
      expect(body.concepts.length).toBeGreaterThan(0)
    })

    it('handles POST /api?endpoint=plan/explain-tradeoffs with full request body', async () => {
      const payload = {
        eventId: 'evt-rewrite-tradeoff',
        baseline: { category: 'wedding', totalBudget: 500000, guestCount: 250 },
        proposed: { totalBudget: 420000, guestCount: 200, dateDeltaDays: 0 },
        deltas: { budgetDelta: -80000, perGuestDelta: -100, contingencyDelta: -6400 },
        affectedCategories: ['Catering', 'Decor'],
      }

      const req = createMockReq('POST', '/api?endpoint=plan/explain-tradeoffs', payload)
      const { res, getStatusCode, getJsonBody } = createMockRes()

      const handled = await handleApiRequest(req, res)
      expect(handled).toBe(true)
      expect(getStatusCode()).toBe(200)

      const body = getJsonBody()
      expect(body.strategicSummary).toBeDefined()
    })

    it('handles POST /api?endpoint=copilot/explain-urgent-tasks with full request body', async () => {
      const payload = {
        eventId: 'ev-test-rewrite',
        eventTitle: 'Kolkata Biye',
        category: 'wedding',
        city: 'Kolkata',
        eventDate: '2026-11-28',
        targetGuestCount: 150,
        totalBudget: 300000,
        currency: 'INR',
        traditions: ['bengali-biye'],
        urgentTasks: [
          {
            id: 't-1',
            title: 'Confirm Caterer',
            deadline: '2026-11-05',
            isCriticalPath: true,
            priority: 'critical',
            phase: 'concept-planning',
            status: 'todo',
          },
        ],
      }

      const req = createMockReq('POST', '/api?endpoint=copilot/explain-urgent-tasks', payload)
      const { res, getStatusCode, getJsonBody } = createMockRes()

      const handled = await handleApiRequest(req, res)
      expect(handled).toBe(true)
      expect(getStatusCode()).toBe(200)

      const body = getJsonBody()
      expect(body.headline).toBeDefined()
    })

    it('enforces 64KB payload limit on rewritten endpoints', async () => {
      const oversizedPayload = {
        eventId: 'evt-rewrite-oversized',
        title: 'Huge Payload Test',
        category: 'wedding',
        city: 'Kolkata',
        totalBudget: 500000,
        targetGuestCount: 200,
        currency: 'INR',
        extraData: 'x'.repeat(70 * 1024),
      }

      const req = createMockReq('POST', '/api?endpoint=plan/generate-concepts', oversizedPayload)
      const { res, getStatusCode } = createMockRes()

      const handled = await handleApiRequest(req, res)
      expect(handled).toBe(true)
      expect(getStatusCode()).toBe(413)
    })
  })

  describe('Security: strict route whitelist & traversal prevention', () => {
    it('rejects directory traversal attempts via endpoint param', async () => {
      const req = createMockReq('GET', '/api?endpoint=../../etc/passwd')
      const { res, getStatusCode, getJsonBody } = createMockRes()

      const handled = await handleApiRequest(req, res)
      expect(handled).toBe(true)
      expect(getStatusCode()).toBe(404)
      expect(getJsonBody().error).toBe('API endpoint not found')
    })

    it('rejects arbitrary unauthorized endpoints', async () => {
      const req = createMockReq('GET', '/api?endpoint=admin/dump-database')
      const { res, getStatusCode } = createMockRes()

      const handled = await handleApiRequest(req, res)
      expect(handled).toBe(true)
      expect(getStatusCode()).toBe(404)
    })

    it('rejects bare /api route without endpoint', async () => {
      const req = createMockReq('GET', '/api')
      const { res, getStatusCode } = createMockRes()

      const handled = await handleApiRequest(req, res)
      expect(handled).toBe(true)
      expect(getStatusCode()).toBe(404)
    })

    it('rejects empty endpoint parameter /api?endpoint=', async () => {
      const req = createMockReq('GET', '/api?endpoint=')
      const { res, getStatusCode } = createMockRes()

      const handled = await handleApiRequest(req, res)
      expect(handled).toBe(true)
      expect(getStatusCode()).toBe(404)
    })

    it('rejects ambiguous duplicate endpoint parameters (HTTP parameter pollution)', async () => {
      const req = createMockReq('GET', '/api?endpoint=health&endpoint=../../etc/passwd')
      const { res, getStatusCode, getJsonBody } = createMockRes()

      const handled = await handleApiRequest(req, res)
      expect(handled).toBe(true)
      expect(getStatusCode()).toBe(404)
      expect(getJsonBody().error).toBe('API endpoint not found')
    })

    it('rejects single-encoded directory traversal attempts (%2e%2e)', async () => {
      const req = createMockReq('GET', '/api?endpoint=%2e%2e%2fetc%2fpasswd')
      const { res, getStatusCode } = createMockRes()

      const handled = await handleApiRequest(req, res)
      expect(handled).toBe(true)
      expect(getStatusCode()).toBe(404)
    })

    it('rejects double-encoded directory traversal attempts (%252e%252e)', async () => {
      const req = createMockReq('GET', '/api?endpoint=%252e%252e%252fetc%252fpasswd')
      const { res, getStatusCode } = createMockRes()

      const handled = await handleApiRequest(req, res)
      expect(handled).toBe(true)
      expect(getStatusCode()).toBe(404)
    })

    it('rejects backslash directory traversal attempts (%5c)', async () => {
      const req = createMockReq('GET', '/api?endpoint=..%5cwindows%5csystem32')
      const { res, getStatusCode } = createMockRes()

      const handled = await handleApiRequest(req, res)
      expect(handled).toBe(true)
      expect(getStatusCode()).toBe(404)
    })

    it('rejects null byte injection (%00)', async () => {
      const req = createMockReq('GET', '/api?endpoint=health%00evil')
      const { res, getStatusCode } = createMockRes()

      const handled = await handleApiRequest(req, res)
      expect(handled).toBe(true)
      expect(getStatusCode()).toBe(404)
    })

    it('rejects malformed percent-encoding gracefully', async () => {
      const req = createMockReq('GET', '/api?endpoint=health%FF')
      const { res, getStatusCode } = createMockRes()

      const handled = await handleApiRequest(req, res)
      expect(handled).toBe(true)
      expect(getStatusCode()).toBe(404)
    })
  })

  describe('resolveApiPath() routing helper', () => {
    it('contains exact authorized whitelist endpoints', () => {
      expect(ALLOWED_API_ENDPOINTS.has('/api/health')).toBe(true)
      expect(ALLOWED_API_ENDPOINTS.has('/api/plan/generate-concepts')).toBe(true)
      expect(ALLOWED_API_ENDPOINTS.has('/api/plan/explain-tradeoffs')).toBe(true)
      expect(ALLOWED_API_ENDPOINTS.has('/api/copilot/explain-urgent-tasks')).toBe(true)
      expect(ALLOWED_API_ENDPOINTS.has('/api/plan/copilot-task-advice')).toBe(true)
      expect(ALLOWED_API_ENDPOINTS.size).toBe(5)
    })

    it('resolves direct URLs', () => {
      const req = createMockReq('GET', '/api/health')
      const route = resolveApiPath(req)
      expect(route.path).toBe('/api/health')
      expect(route.isApi).toBe(true)
      expect(route.isAllowed).toBe(true)
    })

    it('resolves rewritten query parameter URLs', () => {
      const req = createMockReq('GET', '/api?endpoint=health')
      const route = resolveApiPath(req)
      expect(route.path).toBe('/api/health')
      expect(route.isApi).toBe(true)
      expect(route.isAllowed).toBe(true)
    })

    it('resolves rewritten query parameter with leading slash', () => {
      const req = createMockReq('GET', '/api?endpoint=/plan/generate-concepts')
      const route = resolveApiPath(req)
      expect(route.path).toBe('/api/plan/generate-concepts')
      expect(route.isApi).toBe(true)
      expect(route.isAllowed).toBe(true)
    })

    it('detects and disallows path traversal attempts', () => {
      const req = createMockReq('GET', '/api?endpoint=../secret')
      const route = resolveApiPath(req)
      expect(route.isApi).toBe(true)
      expect(route.isAllowed).toBe(false)
    })

    it('correctly marks non-api requests as isApi: false', () => {
      const req = createMockReq('GET', '/index.html')
      const route = resolveApiPath(req)
      expect(route.isApi).toBe(false)
      expect(route.isAllowed).toBe(false)
    })

    it('preserves original query parameters on direct request: /api/health?source=test', () => {
      const req = createMockReq('GET', '/api/health?source=test')
      const route = resolveApiPath(req)
      expect(route.path).toBe('/api/health')
      expect(route.isAllowed).toBe(true)
      const parsed = new URL(req.url!, 'http://localhost')
      expect(parsed.searchParams.get('source')).toBe('test')
    })

    it('preserves original query parameters on rewritten request: /api?endpoint=health&source=test', () => {
      const req = createMockReq('GET', '/api?endpoint=health&source=test')
      const route = resolveApiPath(req)
      expect(route.path).toBe('/api/health')
      expect(route.isAllowed).toBe(true)
      const parsed = new URL(req.url!, 'http://localhost')
      expect(parsed.searchParams.get('source')).toBe('test')
    })

    it('detects and disallows duplicate endpoint parameters in query string', () => {
      const req = createMockReq('GET', '/api?endpoint=health&endpoint=evil')
      const route = resolveApiPath(req)
      expect(route.isApi).toBe(true)
      expect(route.isAllowed).toBe(false)
    })

    it('detects and disallows duplicate endpoint parameters in parsed query object', () => {
      const req = createMockReq('GET', '/api')
      ;(req as any).query = { endpoint: ['health', 'evil'] }
      const route = resolveApiPath(req)
      expect(route.isApi).toBe(true)
      expect(route.isAllowed).toBe(false)
    })

    it('detects and disallows double-encoded traversal (%252e%252e)', () => {
      const req = createMockReq('GET', '/api?endpoint=%252e%252e%252fsecret')
      const route = resolveApiPath(req)
      expect(route.isAllowed).toBe(false)
    })
  })
})

