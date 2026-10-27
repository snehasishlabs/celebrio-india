# Celebrio AI — Adaptive Celebration & Event Planner

> *"Plans change. Budgets shift. Deadlines shrink. Celebrio AI keeps your entire celebration plan in sync."*

Built for **PromptWars Virtual Challenge 5**, **Celebrio AI** is a competition-grade celebration planning platform engineered around adaptive event synchronization, deterministic budget protection, critical-path timeline generation, supplier management, and server-side Google Gemini 2.5 Flash GenAI planning.

---

## 🌟 The Core Differentiator: Adaptive Event Planning vs. Generic Chatbots

Traditional GenAI event tools and generic chatbots generate unstructured walls of text, hallucinate financial sums, lose track of confirmed supplier commitments, and fail when conditions change. 

**Celebrio AI solves the fundamental problem of real-world event coordination: ripple effects.**
When an event date changes, a guest list swells, or a budget is cut by 25%, Celebrio AI's **Adaptive What-If Simulator & Ripple Replanning Engine**:
1. **Detects affected downstream components** across budget allocations, vendor availability, and task deadlines.
2. **Executes deterministic financial recalculations** without arithmetic drift or hallucinations.
3. **Preserves user intent** by locking confirmed vendor contracts, paid deposits, and completed milestones so they are never silently overwritten.
4. **Delivers AI-powered narrative trade-off analysis** using Google Gemini 2.5 Flash, providing tailored culinary, décor, and entertainment adaptations.
5. **Requires explicit user confirmation** before synchronizing changes into the live celebration ledger.

---

## 🚀 Key Features

### 1. Executive Dashboard & Planning Vitals
- Real-time event vitals: Total planned spend, remaining funds, task completion percentage, and supplier booking pipeline.
- Upcoming celebrations selector with instant switching between events.
- 30-item rolling FIFO activity ledger tracking every user decision, contract revision, and milestone completion.
- Seamless zero-state onboarding for first-time celebration hosts.

### 2. Multi-Category Event Creation Flow
- Tailored planning templates for **Weddings**, **Milestone Birthdays**, **Anniversaries**, and **Community Celebrations**.
- Comprehensive event profiling: Name, date, city, target guest count, spending cap, currency selector, and theme hints.
- Accessibility accommodations and dietary restriction tracking (vegan, gluten-free, nut-free, mobility access, sensory-friendly spaces).
- Inline field validation with sensible regional benchmarks.

### 3. Personalized GenAI Concept Studio (Gemini 2.5 Flash)
- Generates 3 distinct event concepts per celebration:
  - **Budget-Conscious** (Cost-optimized, smart DIY elements, high aesthetic impact at 82% budget).
  - **Creative & Distinctive** (Unique experiential elements, themed installations, personalized storytelling at 98% budget).
  - **Premium** (High-touch hospitality, live entertainment, luxury finishes at 100% budget).
- Detailed concept cards featuring color palettes, décor, menu curation, sensory arrival moments, and guest experience highlights.
- **Honest Labeling System**: Clear distinction between `✨ Live Gemini 2.5 Flash` and `💡 Deterministic Demo Mode (Simulated)` with visible pricing disclaimers.

### 4. Budget Guardian (Deterministic Financial Ledger)
- Strict mathematical precision using pure TypeScript financial functions — zero arithmetic delegation to LLMs.
- 10 core expense categories (`venue`, `catering`, `decor`, `photography`, `entertainment`, `clothing`, `invitations`, `transport`, `permits`, `miscellaneous`) plus an isolated **Contingency Reserve** (10–18%).
- Three-state cost lifecycle: **Estimated** $\to$ **Quoted** $\to$ **Confirmed**.
- Instant overspending detection, budget deficit alerts, and category percentage distribution visualizations.
- Multi-currency support (`USD`, `EUR`, `GBP`, `CAD`, `AUD`, `INR`, `JPY`) with strict single-currency budget isolation.

### 5. Critical-Path Timeline Engine
- Dynamically generates milestone schedules tailored to event category and planning horizon (**7, 30, 90, or 180 days**).
- Intelligent urgency classifications: `Overdue`, `Due Soon (< 14 days)`, `Upcoming`, and `Completed`.
- Supports milestone creation, task reassignment, deadline editing, and status toggles.
- Transparent handling of past or missing dates without false completion claims.

### 6. Vendor Portfolio & Comparison Worksheet
- Structured supplier directory across catering, venue, photography, AV/production, floral, and transport.
- Lifecycle tracking: `Researching` $\to$ `Contacted` $\to$ `Quote Received` $\to$ `Contract Signed` $\to$ `Deposit Paid`.
- Payment milestone ledger with paid/unpaid status tracking and deposit deadlines.
- Side-by-side **Comparison Worksheet** with built-in question templates tailored per vendor category.
- Zero fake vendors: Celebrio never hallucinates artificial vendor names or fake review scores.

### 7. Adaptive What-If Simulator & Ripple Replanning
- Interactive parameter sliders: Total budget, guest count, event date, venue layout (indoor/outdoor/hybrid), and category allocations.
- Real-time side-by-side delta analysis: Budget variance, per-guest cost variance, and contingency health.
- Automated ripple detection highlighting infeasible deadlines, over-budget categories, and supplier date conflicts.
- One-click scenario rollback ("Discard Scenario") and safe, transactional "Apply Changes".

### 8. Inclusive & Accessible User Experience
- High-contrast, WCAG AA-compliant ivory and forest palette with gold accents.
- Accessible keyboard navigation: `<a href="#main-content">Skip to content</a>` landmark link and universal `Escape` key dismissal on all modals and dialogs.
- Screen-reader friendly semantic ARIA attributes (`role="dialog"`, `aria-modal="true"`, descriptive button titles).
- Responsive design tailored for mobile phones, tablets, and wide desktop displays.

---

## 🏛️ Architecture & System Design

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CELEBRIO AI CLIENT                              │
│                                                                        │
│  ┌───────────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │ Budget Guardian View  │  │  Timeline View  │  │   Vendors View   │  │
│  └───────────┬───────────┘  └────────┬────────┘  └────────┬─────────┘  │
│  ┌───────────┴───────────┐  ┌────────┴────────┐  ┌────────┴─────────┐  │
│  │ Theme Concepts View   │  │  Simulator View │  │ Event Management │  │
│  └───────────┬───────────┘  └────────┬────────┘  └──────────────────┘  │
│              ▼                       ▼                                 │
│     PlannerContext & Client AI Planning Service                        │
└──────────────────────────────┬─────────────────────────────────────────┘
                               │ HTTPS / JSON (Sanitized & Bounded)
                               ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    SERVER-SIDE PLANNING SERVICE                        │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ RateLimiter & Request Validator (Bounded lengths & numbers)      │  │
│  │ - 64 KB Max Request Payload                                      │  │
│  │ - 30 req/min sliding-window rate limit with Retry-After          │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     ▼                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Gemini Planning Engine (GoogleGenAI SDK `@google/genai`)          │  │
│  │  - Model: gemini-2.5-flash with structured JSON response schema  │  │
│  │  - 15s AbortSignal timeout & graceful fallback recovery          │  │
│  │  - Deterministic financial calculation enforcement               │  │
│  │  - High-Fidelity Deterministic Demo Mode (when key is absent)    │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     ▼                                  │
│        Google Gemini API (Server-Only `GEMINI_API_KEY`)                │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 💻 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 19.3, TypeScript 7.0 (strict mode) |
| **Build Tool & Bundler** | Vite 8.3 (with embedded dev/preview API middleware) |
| **Styling & Design System** | Tailwind CSS 3.4, PostCSS, Lucide React icons |
| **GenAI Integration** | Google GenAI SDK (`@google/genai`), Gemini 2.5 Flash |
| **Server & Middleware** | Node.js native HTTP, `dotenv` |
| **Testing & Quality** | Vitest 5.0, JSDOM, `@testing-library/react`, Oxlint |
| **Client Persistence** | Browser `localStorage` with corrupted JSON recovery and quota safeguards |

---

## 🔒 Security & Privacy Architecture

1. **Zero Client Secrets**:
   - `GEMINI_API_KEY` is loaded strictly on the server (`process.env.GEMINI_API_KEY`).
   - The key is never prefixed with `VITE_` and is never included in compiled client bundles (`dist/`).
   - `.env.example` provides non-secret placeholders only.
2. **Server-Side Request Validation**:
   - String fields (`title`, `city`, `themePreference`) are bounded to $\le 100$ characters.
   - Numeric fields are validated against strict ranges ($1 \le guests \le 10,000$, $\$100 \le budget \le \$50,000,000$).
   - Request payloads are limited to 64 KB; oversized payloads trigger `HTTP 413 Payload Too Large`.
3. **DoS & Rate Limiting Defense**:
   - In-memory sliding window rate limiter protects endpoints (30 requests/minute per IP with `Retry-After` headers).
4. **Privacy Protection (No PII Transmitted)**:
   - Private host names, guest phone numbers, physical addresses, and banking details are never sent to external AI providers.
   - Only high-level event category, guest count, budget cap, city, and non-sensitive preferences (dietary, accessibility) are transmitted.
5. **Safe Rendering**:
   - Zero occurrences of `dangerouslySetInnerHTML`, `innerHTML`, or `eval`. All model output is structured JSON validated before display.

---

## ⚙️ Environment Variables Documentation

| Variable | Environment | Required? | Default | Description |
| :--- | :---: | :---: | :---: | :--- |
| `GEMINI_API_KEY` | Server | Optional | `""` | Google Gemini API key. If present, activates live Gemini 2.5 Flash generation. If omitted, activates Deterministic Demo Mode. |
| `PORT` | Server | Optional | `3001` | HTTP port for standalone Node server deployment (`server/index.ts`). |
| `NODE_ENV` | Server | Optional | `"development"` | Node runtime environment (`development` / `production` / `test`). |
| `VITE_APP_NAME` | Client | Optional | `"Celebrio AI"` | Application title displayed in header and document title. |
| `VITE_APP_TAGLINE` | Client | Optional | `"Adaptive Celebration & Event Planner"` | Subtitle and brand motto. |
| `VITE_APP_VERSION` | Client | Optional | `"1.0.0"` | Client release version identifier. |

> [!NOTE]
> Never prefix `GEMINI_API_KEY` with `VITE_`. Vite automatically bundles any environment variable starting with `VITE_` into client-side JavaScript. Keeping the key server-side ensures total credential safety.

---

## 🛠️ Local Setup & Development

### Prerequisites
- Node.js 18+ (tested on Node 20 and Node 22)
- npm 9+

### 1. Installation
```bash
# Clone the repository
git clone <repository-url>
cd "Celebrio Ai"

# Install all dependencies
npm install
```

### 2. Environment Configuration
```bash
# Copy the example environment template
cp .env.example .env

# (Optional) Add your Google Gemini API key to .env for live AI planning
# If omitted, Celebrio AI automatically operates in High-Fidelity Demo Mode!
GEMINI_API_KEY="your-gemini-api-key-here"
```

### 3. Running Development Server
```bash
# Starts unified Vite dev server with embedded server API middleware
npm run dev

# Open http://localhost:5173 in your browser
```

### 4. Running Quality Checks & Tests
```bash
# Run Oxlint static analysis (0 errors)
npm run lint

# Run Vitest automated test suite (147 tests across 23 test suites)
npm test

# Run Vitest in interactive watch mode
npm run test:watch
```

### 5. Production Build & Preview
```bash
# Typecheck and compile production bundle into dist/
npm run build

# Preview production build with embedded API server
npm run preview
```

---

## 🚢 Deployment Guide

### Option A: Google Cloud Run (Recommended Container Deployment)

1. Create a `Dockerfile` in the project root:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
EXPOSE 8080
CMD ["node", "--import", "tsx", "server/index.ts"]
```

2. Deploy using Google Cloud Run:
```bash
gcloud run deploy celebrio-ai \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY="your-gemini-api-key"
```

### Option B: Node.js Standalone Server
```bash
# Build the frontend assets
npm run build

# Start the Node server (serves API and handles live Gemini integration)
PORT=3001 node server/index.ts
```

### Option C: Static Hosting + Serverless Functions
Deploy `dist/` to any static host (Firebase Hosting, Vercel, Netlify, Cloudflare Pages) and route `/api/*` endpoints to a serverless function wrapping [`server/apiHandler.ts`](file:///c:/Users/USER/Desktop/Celebrio%20Ai/server/apiHandler.ts).

---

## 🧪 Automated Test Suite Summary

- **23 Test Suites, 147 Tests Passing (100% pass rate)**
- **Deterministic Budget Arithmetic:** [`src/utils/__tests__/budgetGuardian.test.ts`](file:///c:/Users/USER/Desktop/Celebrio%20Ai/src/utils/__tests__/budgetGuardian.test.ts) (18 tests covering multi-currency handling, contingency isolation, and deficit warnings).
- **Critical-Path Scheduling:** [`src/utils/__tests__/timelineEngine.test.ts`](file:///c:/Users/USER/Desktop/Celebrio%20Ai/src/utils/__tests__/timelineEngine.test.ts) (18 tests covering 7, 30, 90, and 180-day dynamic horizon adaptation).
- **Vendor Portfolio & Contracts:** [`src/utils/__tests__/vendorEngine.test.ts`](file:///c:/Users/USER/Desktop/Celebrio%20Ai/src/utils/__tests__/vendorEngine.test.ts) (10 tests covering milestone tracking and category question banks).
- **What-If Simulation Engine:** [`src/utils/__tests__/scenarioEngine.test.ts`](file:///c:/Users/USER/Desktop/Celebrio%20Ai/src/utils/__tests__/scenarioEngine.test.ts) (8 tests covering ripple effects, baseline restoration, and locked decision preservation).
- **Storage & Lifecycle Resilience:** [`src/services/storage/__tests__/storageService.test.ts`](file:///c:/Users/USER/Desktop/Celebrio%20Ai/src/services/storage/__tests__/storageService.test.ts) (9 tests covering event deletion cleanup, corrupted JSON recovery, 30-item rolling log limit, multi-event isolation, and workspace reset).
- **Event Lifecycle & Editing:** [`src/features/events/__tests__/EventDetailsView.test.tsx`](file:///c:/Users/USER/Desktop/Celebrio%20Ai/src/features/events/__tests__/EventDetailsView.test.tsx) (4 tests covering tab switching, inline editing modal, and Escape key dismissal).
- **Gemini Failures & Fallback Recovery:** [`server/__tests__/geminiFailures.test.ts`](file:///c:/Users/USER/Desktop/Celebrio%20Ai/server/__tests__/geminiFailures.test.ts) (4 tests covering 429 quota exhaustion, 500 errors, non-JSON output, and 15s timeouts).
- **Server Request Validation & Security:** [`server/__tests__/validator.test.ts`](file:///c:/Users/USER/Desktop/Celebrio%20Ai/server/__tests__/validator.test.ts) (12 tests) and [`server/__tests__/apiHandler.test.ts`](file:///c:/Users/USER/Desktop/Celebrio%20Ai/server/__tests__/apiHandler.test.ts) (8 tests covering 64 KB payload bounds, 413 responses, and rate limits).

---

## ⚠️ Known Limitations

1. **Exchange Rates**: Currency conversion rates are fixed at event creation time to prevent unpredictable budget fluctuations and maintain 100% deterministic offline calculation consistency.
2. **Local Persistence Scope**: Event data is stored in browser `localStorage`. While robust for single-device operation with rolling limits to prevent quota errors, multi-device cloud synchronization would require a hosted database adapter.
3. **Live AI Availability**: Live Gemini 2.5 Flash features require a valid Google Gemini API key. When unconfigured, the application runs in High-Fidelity Deterministic Demo Mode using comprehensive regional benchmark models.

---

## 📄 License
MIT License. Built for PromptWars Virtual Challenge 5.
