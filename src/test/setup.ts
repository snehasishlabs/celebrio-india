import '@testing-library/jest-dom/vitest'
import { vi, beforeEach } from 'vitest'

// Default mock for fetch in jsdom tests to prevent network socket hangs
beforeEach(() => {
  globalThis.fetch = vi.fn().mockImplementation(async (url: string | URL | Request) => {
    const urlStr = String(url)
    if (urlStr.includes('/api/health')) {
      return {
        ok: true,
        json: async () => ({
          status: 'ok',
          hasGeminiKey: false,
          model: 'gemini-2.5-flash',
          mode: 'demo',
          version: '1.0.0',
        }),
      } as Response
    }
    return {
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not found' }),
    } as Response
  })
})
