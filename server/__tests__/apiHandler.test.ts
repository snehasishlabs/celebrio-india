import { describe, it, expect, vi } from 'vitest'
import { EventEmitter } from 'node:events'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleApiRequest } from '../apiHandler'

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
})

