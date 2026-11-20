import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleApiRequest } from '../server/apiHandler'

/**
 * Vercel Serverless Function entry point.
 * Delegates all /api/* requests to the central Celebrio AI API handler.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const handled = await handleApiRequest(req, res)
  if (!handled && !res.writableEnded) {
    res.statusCode = 404
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ error: 'NOT_FOUND', message: 'API route not found' }))
  }
}
