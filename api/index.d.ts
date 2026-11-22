import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * Celebrio AI Vercel Serverless Function entry point.
 */
export default function handler(req: IncomingMessage, res: ServerResponse): Promise<void>

