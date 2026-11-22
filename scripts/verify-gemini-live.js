import dotenv from 'dotenv'
import { EventEmitter } from 'node:events'
dotenv.config()
dotenv.config({ path: '.env.local' })

import handler from '../api/index.js'

function createMockReq(method, url, body) {
  const emitter = new EventEmitter()
  const req = Object.assign(emitter, {
    method,
    url,
    headers: { 'content-type': 'application/json' },
    socket: { remoteAddress: '127.0.0.1' },
    destroy: () => {},
  })

  process.nextTick(() => {
    if (body !== undefined) {
      emitter.emit('data', Buffer.from(typeof body === 'string' ? body : JSON.stringify(body)))
    }
    emitter.emit('end')
  })

  return req
}

function createMockRes() {
  return new Promise((resolve) => {
    let statusCode = 200
    let headers = {}
    let body = ''

    const res = {
      writeHead: (code, hdrs) => {
        statusCode = code
        if (hdrs) headers = { ...headers, ...hdrs }
      },
      setHeader: (name, val) => {
        headers[name] = val
      },
      end: (chunk) => {
        if (chunk) body += chunk
        resolve({
          statusCode,
          headers,
          body: body ? JSON.parse(body) : null,
        })
      },
      get writableEnded() {
        return false
      },
      set statusCode(code) {
        statusCode = code
      },
      get statusCode() {
        return statusCode
      },
    }

    return res
  })
}

async function runVerification() {
  console.log('================================================================================')
  console.log('CELEBRIO INDIA — SERVERLESS API & GEMINI AI LIVE VERIFICATION')
  console.log('================================================================================')
  
  const key = process.env.GEMINI_API_KEY
  const hasKey = typeof key === 'string' && key.trim().length > 0
  console.log(`Server Environment GEMINI_API_KEY: ${hasKey ? 'PRESENT (Configured)' : 'NOT PRESENT (Demo Mode)'}`)

  // 1. Health check
  console.log('\n[1/2] Testing GET /api/health ...')
  {
    const req = createMockReq('GET', '/api/health')
    let resObj
    const resPromise = new Promise((resolve) => {
      let statusCode = 200
      let headers = {}
      let body = ''
      resObj = {
        writeHead: (code, hdrs) => { statusCode = code; if (hdrs) headers = { ...headers, ...hdrs } },
        setHeader: (name, val) => { headers[name] = val },
        end: (chunk) => { if (chunk) body += chunk; resolve({ statusCode, headers, body: JSON.parse(body) }) },
      }
    })

    await handler(req, resObj)
    const healthRes = await resPromise
    console.log(`Status: ${healthRes.statusCode}`)
    console.log(`Payload:`, JSON.stringify(healthRes.body, null, 2))
    if (healthRes.statusCode !== 200) {
      console.error('Health check failed!')
      process.exit(1)
    }
  }

  // 2. Concept generation
  console.log('\n[2/2] Testing POST /api/plan/generate-concepts ...')
  const testPayload = {
    eventId: 'evt-verify-bengali-biye',
    title: 'Siddharth & Trisha Bengali Biye',
    category: 'wedding',
    city: 'Kolkata',
    targetGuestCount: 150,
    totalBudget: 300000,
    currency: 'INR',
    themePreference: 'Shantiniketan terracotta & heritage Rajbari',
    priorities: ['Authentic Bengali Cuisine', 'Traditional Alpona Decor', 'Senior Guest Accessibility'],
    dietaryRequirements: ['Vegetarian Bou Bhaat Counter', 'Fish Paturi Live Station'],
    accessibilityRequirements: ['Ground-floor seating', 'Step-free entrance ramp'],
  }

  const startTime = Date.now()
  {
    const req = createMockReq('POST', '/api/plan/generate-concepts', testPayload)
    let resObj
    const resPromise = new Promise((resolve) => {
      let statusCode = 200
      let headers = {}
      let body = ''
      resObj = {
        writeHead: (code, hdrs) => { statusCode = code; if (hdrs) headers = { ...headers, ...hdrs } },
        setHeader: (name, val) => { headers[name] = val },
        end: (chunk) => { if (chunk) body += chunk; resolve({ statusCode, headers, body: JSON.parse(body) }) },
      }
    })

    await handler(req, resObj)
    const conceptRes = await resPromise
    const elapsed = Date.now() - startTime

    console.log(`Status: ${conceptRes.statusCode} (${elapsed}ms)`)
    const result = conceptRes.body

    console.log(`- Source: ${result.source}`)
    console.log(`- Model: ${result.model}`)
    console.log(`- Generated At: ${result.generatedAt}`)
    console.log(`- Total Concepts: ${result.concepts?.length}`)

    result.concepts?.forEach((concept, idx) => {
      console.log(`\n  [Concept ${idx + 1}] Tier: "${concept.tier}" | Title: "${concept.title}"`)
      console.log(`  Tagline: "${concept.tagline}"`)
      console.log(`  Budget: ₹${concept.costEstimation.estimatedTotal.toLocaleString()} (${concept.costEstimation.percentOfBudget}%)`)
      console.log(`  Color Palette: ${concept.colorPalette.map(c => `${c.name} (${c.hex})`).join(', ')}`)
      console.log(`  Decor Focal: ${concept.decor.focalPoint}`)
      console.log(`  F&B Highlights: ${concept.foodAndBeverage.highlights.join(' | ')}`)
    })

    if (hasKey && result.source === 'gemini-live') {
      console.log('\n================================================================================')
      console.log('VERIFICATION SUCCESS: Genuine Gemini 2.5 Flash response received and validated.')
      console.log('================================================================================')
    } else if (!hasKey && result.source === 'deterministic-demo') {
      console.log('\n================================================================================')
      console.log('VERIFICATION SUCCESS: Deterministic fallback engine operates correctly in unconfigured environment.')
      console.log('================================================================================')
    }
  }
}

runVerification()
