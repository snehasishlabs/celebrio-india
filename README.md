# Celebrio AI - Adaptive Celebration & Event Planner

> *"Plans change. Budgets shift. Deadlines shrink. Celebrio AI keeps your entire celebration plan in sync."*

Built for **PromptWars Virtual Challenge 5**, Celebrio AI is a competition-grade celebration planning platform engineered around adaptive event synchronization, deterministic budget protection, critical-path timeline generation, supplier management, and server-side Google Gemini 2.5 Flash GenAI planning.

---

## 🏛️ Architecture & System Design

Celebrio AI maintains a strict separation between **deterministic business logic** (financial calculations, task dependencies, scenario comparison) and **generative AI intelligence** (theme styling, menu suggestions, entertainment concepts, narrative tradeoff advice).

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
                               │ HTTPS / JSON (Bounded & Sanitized)
                               ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    SERVER-SIDE PLANNING SERVICE                        │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ RateLimiter & Request Validator (Bounded lengths & numbers)      │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     ▼                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Gemini Planning Engine (GoogleGenAI SDK `@google/genai`)          │  │
│  │  - Model: gemini-2.5-flash with JSON schema mode                 │  │
│  │  - 15s AbortSignal timeout & graceful fallback recovery          │  │
│  │  - Deterministic financial calculation enforcement               │  │
│  │  - High-Fidelity Deterministic Demo Mode (when key is absent)    │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     ▼                                  │
│        Google Gemini API (Server-Only `GEMINI_API_KEY`)                │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🔒 Security & Privacy Architecture

1. **Zero Client Secrets**:
   - `GEMINI_API_KEY` is loaded exclusively on the server (`process.env.GEMINI_API_KEY`).
   - It is never prefixed with `VITE_` and never bundled into compiled client JavaScript.
   - `.env.example` contains only non-secret placeholders.
2. **Server-Side Request Validation**:
   - String inputs (`title`, `city`, `themePreference`) are strictly bounded in length ($\le 100$ chars).
   - Numeric inputs (`guestCount`, `budget`) are range-checked and sanitized ($1 \le guests \le 10,000$, $\$100 \le budget \le \$50,000,000$).
   - Request payloads are limited to 64KB max; oversized payloads trigger HTTP 413.
3. **DoS & Rate Limit Protection**:
   - In-memory sliding window rate limiter protects endpoints (30 requests/minute per IP with `Retry-After` headers).
4. **Privacy Protection (No PII Transmitted)**:
   - Private user names, street addresses, phone numbers, and payment details are never sent to external AI providers.
   - Only event category, guest count, spending limit, city, and non-sensitive preferences (dietary, accessibility) are shared.
5. **Safe Rendering**:
   - All AI output is structured JSON validated before display.
   - Raw model responses are never rendered as trusted HTML (`dangerouslySetInnerHTML` is forbidden).

---

## ⚖️ Financial Correctness & Business Logic

Financial calculations are **never delegated to an LLM**:
- **Total Budget**: Spending limit set by user.
- **Planned Costs**: Non-contingency allocations.
- **Contingency**: Separately isolated reserve (e.g. 10–18%).
- **Remaining Balance**: $\text{Budget} - (\text{Planned} + \text{Contingency})$.
- When AI generates concept tiers (`budget-conscious`, `creative-distinctive`, `premium`), the server enforces strict deterministic percentages ($82\%$, $98\%$, and $100\%$ respectively), guaranteeing zero arithmetic drift.

---

## 💡 Honest Labeling: Live Gemini vs. Demo Mode

Celebrio AI guarantees transparent labeling of all generated insights:
- **`✨ Live Gemini 2.5 Flash`**: Displayed when live API calls succeed using server credentials.
- **`💡 Deterministic Demo Mode (Simulated)`**: Displayed whenever `GEMINI_API_KEY` is omitted or unconfigured, utilizing comprehensive regional benchmark rule templates.
- **`Pricing Notice`**: All estimates are clearly tagged as approximations for planning, not formal supplier quotations.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (tested on Node 20 & 22)
- npm 9+

### Installation
```bash
# Clone and enter workspace
git clone <repo-url>
cd "Celebrio Ai"

# Install dependencies
npm install
```

### Environment Configuration
```bash
# Copy example configuration
cp .env.example .env

# Optional: Add your Google Gemini API key to .env for live AI planning
# If left blank, Celebrio AI runs in High-Fidelity Demo Mode automatically.
GEMINI_API_KEY="your-gemini-api-key-here"
```

### Development
```bash
# Start unified dev server (Vite + embedded API server middleware)
npm run dev
# Open http://localhost:5173 in your browser
```

### Automated Testing
```bash
# Run Vitest test suite (145 tests across 23 suites)
npm test
```

### Production Build
```bash
# Typecheck & build production bundle
npm run build

# Standalone backend server (optional container deployment)
node server/index.ts
```

---

## 🧪 Test Coverage Summary

- **23 Test Suites, 145 Tests Passing (100% pass rate)**
- `src/services/storage/__tests__/storageService.test.ts`: LocalStorage isolation, corrupted JSON resilience, 30-item rolling activity log, multi-event budget partitioning, workspace wipe.
- `server/__tests__/geminiFailures.test.ts`: Provider 429 quota exhaustion, 500 errors, malformed non-JSON recovery, schema recovery, and timeout handling.
- `server/__tests__/validator.test.ts`: Bounded inputs, range constraints, rate limiting.
- `server/__tests__/geminiService.test.ts`: Demo mode fallback, deterministic budget calculations, error & timeout recovery.
- `server/__tests__/apiHandler.test.ts`: Health check, 200/400/404/413/429 status codes, security headers, malformed JSON bodies, payload size limits.
- `src/services/ai/__tests__/aiPlanningService.test.ts`: Client fetch, network error recovery, offline fallbacks.
- `src/features/ideas/__tests__/ThemeConceptsView.test.tsx`: Live vs Demo badge rendering, regeneration flow, concept selection.
- `src/features/simulator/__tests__/SimulatorView.test.tsx`: What-if simulation, trade-off advisor, baseline restoration.
- `src/utils/__tests__/budgetGuardian.test.ts`: Multi-currency arithmetic, contingency isolation, deficit detection.
- `src/utils/__tests__/timelineEngine.test.ts`: Critical-path scheduling, horizon adaptation (7, 30, 90, 180 days).
- `src/utils/__tests__/vendorEngine.test.ts`: Supplier contract tracking, milestone sync, category question templates.
