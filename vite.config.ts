import { defineConfig } from 'vitest/config'
import type { Plugin } from 'vite'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { handleApiRequest } from './server/apiHandler'

function celebrioAiServerPlugin(): Plugin {
  return {
    name: 'celebrio-ai-server',
    config(_, { mode }) {
      // Safely load server-side environment variables into process.env
      // Note: Only VITE_ prefixed variables are ever exposed to the client bundle.
      // GEMINI_API_KEY remains exclusively on the server.
      const env = loadEnv(mode, process.cwd(), '')
      for (const [key, val] of Object.entries(env)) {
        if (!process.env[key]) {
          process.env[key] = val
        }
      }
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          if (req.url && req.url.startsWith('/api/')) {
            const handled = await handleApiRequest(req, res)
            if (handled) return
          }
        } catch (err) {
          next(err)
          return
        }
        next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          if (req.url && req.url.startsWith('/api/')) {
            const handled = await handleApiRequest(req, res)
            if (handled) return
          }
        } catch (err) {
          next(err)
          return
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), celebrioAiServerPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false,
  },
})
