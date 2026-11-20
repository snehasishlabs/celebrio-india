import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { EventEmitter } from 'node:events'
import type { IncomingMessage, ServerResponse } from 'node:http'
import handler from '../index'

function createMockReq(method: string, url: string, body?: unknown): IncomingMessage {
  const emitter = new EventEmitter()
  const req = Object.assign(emitter, {
    method,
    url,
    headers: { 'content-type': 'application/json' },
    socket: { remoteAddress: '127.0.0.1' },
    destroy: vi.fn(),
  }) as unknown as IncomingMessage

  process.nextTick(() => {
    if (body !== undefined) {
      emitter.emit('data', Buffer.from(typeof body === 'string' ? body : JSON.stringify(body)))
    }
    emitter.emit('end')
  })

  return req
}

function createMockRes() {
  let statusCode = 200
  let headers: Record<string, string> = {}
  let body = ''
  let writableEnded = false

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
      writableEnded = true
    },
    get writableEnded() {
      return writableEnded
    },
    set statusCode(code: number) {
      statusCode = code
    },
    get statusCode() {
      return statusCode
    },
  } as unknown as ServerResponse

  return {
    res,
    getStatusCode: () => statusCode,
    getHeaders: () => headers,
    getJsonBody: () => (body ? JSON.parse(body) : null),
  }
}

describe('Vercel Serverless Function Entry Point (api/index.ts)', () => {
  const originalKey = process.env.GEMINI_API_KEY

  beforeEach(() => {
    delete process.env.GEMINI_API_KEY
  })

  afterEach(() => {
    if (originalKey) {
      process.env.GEMINI_API_KEY = originalKey
    } else {
      delete process.env.GEMINI_API_KEY
    }
  })

  describe('Health Endpoint Routing', () => {
    it('delegates rewritten GET /api?endpoint=health and responds with 200 in demo mode', async () => {
      const req = createMockReq('GET', '/api?endpoint=health')
      const { res, getStatusCode, getJsonBody, getHeaders } = createMockRes()

      await handler(req, res)

      expect(getStatusCode()).toBe(200)
      const json = getJsonBody()
      expect(json.status).toBe('ok')
      expect(json.hasGeminiKey).toBe(false)
      expect(json.model).toBe('gemini-2.5-flash')
      expect(json.mode).toBe('demo')
      expect(json.geminiStatus).toBe('unconfigured')
      expect(json.fallbackMode).toBe('active-primary')
      expect(json.version).toBe('1.0.0')

      // Security headers
      const hdrs = getHeaders()
      expect(hdrs['X-Content-Type-Options']).toBe('nosniff')
      expect(hdrs['X-Frame-Options']).toBe('DENY')
      expect(hdrs['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
    })

    it('delegates GET /api?endpoint=health in live mode when GEMINI_API_KEY is configured', async () => {
      process.env.GEMINI_API_KEY = 'test-gemini-key-12345'
      const req = createMockReq('GET', '/api?endpoint=health')
      const { res, getStatusCode, getJsonBody } = createMockRes()

      await handler(req, res)

      expect(getStatusCode()).toBe(200)
      const json = getJsonBody()
      expect(json.status).toBe('ok')
      expect(json.hasGeminiKey).toBe(true)
      expect(json.mode).toBe('live')
      expect(json.geminiStatus).toBe('configured')
      expect(json.fallbackMode).toBe('ready-as-backup')
      // Ensure API key is NEVER leaked in response
      expect(JSON.stringify(json)).not.toContain('test-gemini-key')
    })

    it('handles direct GET /api/health path without query rewrite', async () => {
      const req = createMockReq('GET', '/api/health')
      const { res, getStatusCode, getJsonBody } = createMockRes()

      await handler(req, res)

      expect(getStatusCode()).toBe(200)
      expect(getJsonBody().status).toBe('ok')
    })
  })

  describe('Planning Endpoints Routing', () => {
    it('delegates POST /api?endpoint=plan/generate-concepts with valid payload', async () => {
      const payload = {
        eventId: 'evt-vercel-test',
        title: 'Vercel Deployment Verification Gala',
        category: 'community',
        city: 'Bengaluru',
        targetGuestCount: 120,
        totalBudget: 400000,
        currency: 'INR',
      }

      const req = createMockReq('POST', '/api?endpoint=plan/generate-concepts', payload)
      const { res, getStatusCode, getJsonBody } = createMockRes()

      await handler(req, res)

      expect(getStatusCode()).toBe(200)
      const json = getJsonBody()
      expect(json.concepts).toHaveLength(3)
      expect(json.source).toBe('deterministic-demo')
      expect(json.concepts[0].costEstimation.estimatedTotal).toBeGreaterThan(0)
    })

    it('delegates POST /api?endpoint=plan/explain-tradeoffs with valid scenario', async () => {
      const payload = {
        eventId: 'evt-tradeoff-test',
        baseline: { category: 'wedding', totalBudget: 500000, guestCount: 150 },
        proposed: { totalBudget: 450000, guestCount: 130 },
        deltas: { budgetDelta: -50000, perGuestDelta: -100, contingencyDelta: -4000 },
        affectedCategories: ['Catering', 'Decor'],
      }

      const req = createMockReq('POST', '/api?endpoint=plan/explain-tradeoffs', payload)
      const { res, getStatusCode, getJsonBody } = createMockRes()

      await handler(req, res)

      expect(getStatusCode()).toBe(200)
      const json = getJsonBody()
      expect(json.strategicSummary).toBeDefined()
      expect(json.culinaryRecommendations.length).toBeGreaterThan(0)
    })

    it('delegates POST /api?endpoint=copilot/explain-urgent-tasks with valid task set', async () => {
      const payload = {
        eventId: 'evt-copilot-test',
        eventTitle: 'Bengaluru Heritage Celebration',
        category: 'community',
        city: 'Bengaluru',
        targetGuestCount: 100,
        totalBudget: 300000,
        currency: 'INR',
        urgentTasks: [
          {
            id: 't-1',
            title: 'Confirm Event Venue',
            priority: 'critical',
            isCriticalPath: true,
            status: 'todo',
          },
        ],
      }

      const req = createMockReq('POST', '/api?endpoint=copilot/explain-urgent-tasks', payload)
      const { res, getStatusCode, getJsonBody } = createMockRes()

      await handler(req, res)

      expect(getStatusCode()).toBe(200)
      const json = getJsonBody()
      expect(json.headline).toBeDefined()
      expect(json.urgentTaskAnalyses.length).toBeGreaterThan(0)
    })
  })

  describe('Validation & Security Handling', () => {
    it('returns 400 for invalid request payload', async () => {
      const invalidPayload = {
        eventId: '',
        title: '',
        category: 'invalid-category',
      }

      const req = createMockReq('POST', '/api?endpoint=plan/generate-concepts', invalidPayload)
      const { res, getStatusCode, getJsonBody } = createMockRes()

      await handler(req, res)

      expect(getStatusCode()).toBe(400)
      expect(getJsonBody().error).toBe('Invalid planning parameters')
    })

    it('returns 413 for oversized request payload (>64KB)', async () => {
      const oversizedPayload = {
        eventId: 'evt-huge',
        title: 'Huge Payload',
        category: 'wedding',
        targetGuestCount: 100,
        totalBudget: 500000,
        currency: 'INR',
        padding: 'A'.repeat(70 * 1024),
      }

      const req = createMockReq('POST', '/api?endpoint=plan/generate-concepts', oversizedPayload)
      const { res, getStatusCode, getJsonBody } = createMockRes()

      await handler(req, res)

      expect(getStatusCode()).toBe(413)
      expect(getJsonBody().error).toMatch(/Payload too large/i)
    })

    it('rejects directory traversal and unauthorized route traversal', async () => {
      const req = createMockReq('GET', '/api?endpoint=../../etc/passwd')
      const { res, getStatusCode, getJsonBody } = createMockRes()

      await handler(req, res)

      expect(getStatusCode()).toBe(404)
      expect(getJsonBody().error).toBe('API endpoint not found')
    })

    it('delegates OPTIONS CORS preflight and responds with 204', async () => {
      const req = createMockReq('OPTIONS', '/api?endpoint=plan/generate-concepts')
      const { res, getStatusCode, getHeaders } = createMockRes()

      await handler(req, res)

      expect(getStatusCode()).toBe(204)
      expect(getHeaders()['Access-Control-Allow-Origin']).toBe('*')
      expect(getHeaders()['Access-Control-Allow-Methods']).toContain('POST')
    })

    it('returns 404 for non-handled route', async () => {
      const req = createMockReq('GET', '/not-an-api-route')
      const { res, getStatusCode, getJsonBody } = createMockRes()

      await handler(req, res)

      expect(getStatusCode()).toBe(404)
      expect(getJsonBody().error).toBe('NOT_FOUND')
    })
  })
})
