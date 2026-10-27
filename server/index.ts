import http from 'node:http'
import dotenv from 'dotenv'
import { handleApiRequest } from './apiHandler'

// Load environment variables for standalone execution
dotenv.config()
dotenv.config({ path: '.env.local' })

const PORT = Number(process.env.PORT) || 3001

const server = http.createServer(async (req, res) => {
  // Enable CORS for local Vite dev client if needed
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const handled = await handleApiRequest(req, res)
  if (!handled) {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not Found' }))
  }
})

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[Celebrio Server] AI Planning Service running at http://localhost:${PORT}`)
})

