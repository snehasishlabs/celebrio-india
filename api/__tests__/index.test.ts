import { describe, it, expect, vi } from 'vitest'
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
  it('delegates rewritten GET /api?endpoint=health and responds with 200', async () => {
    const req = createMockReq('GET', '/api?endpoint=health')
    const { res, getStatusCode, getJsonBody } = createMockRes()

    await handler(req, res)

    expect(getStatusCode()).toBe(200)
    const json = getJsonBody()
    expect(json.status).toBe('ok')
    expect(json.model).toBe('gemini-2.5-flash')
  })

  it('delegates OPTIONS CORS preflight and responds with 204', async () => {
    const req = createMockReq('OPTIONS', '/api?endpoint=plan/generate-concepts')
    const { res, getStatusCode, getHeaders } = createMockRes()

    await handler(req, res)

    expect(getStatusCode()).toBe(204)
    expect(getHeaders()['Access-Control-Allow-Origin']).toBe('*')
  })

  it('returns 404 for non-handled route', async () => {
    const req = createMockReq('GET', '/not-an-api-route')
    const { res, getStatusCode, getJsonBody } = createMockRes()

    await handler(req, res)

    expect(getStatusCode()).toBe(404)
    expect(getJsonBody().error).toBe('NOT_FOUND')
  })
})
