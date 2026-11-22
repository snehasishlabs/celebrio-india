import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleApiRequest } from './apiHandler'

export const config = {
  maxDuration: 60,
}
export const maxDuration = 60

/**
 * Serverless Function entry point.
 * Delegates all /api/* requests to the central Celebrio AI API handler.
 * Wrapped with robust top-level error handling.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const handled = await handleApiRequest(req, res)
    if (!handled && !res.writableEnded) {
      res.statusCode = 404
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ error: 'NOT_FOUND', message: 'API route not found' }))
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    if (!res.writableEnded) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ error: 'INTERNAL_SERVER_ERROR', message }))
    }
  }
}

