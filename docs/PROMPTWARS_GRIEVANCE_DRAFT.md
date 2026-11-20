# Formal Grievance & Technical Reconsideration Request

**To:** PromptWars Technical Evaluation Committee & Organizing Team  
**From:** Snehasish Labs / Celebrio India Team  
**Challenge:** PromptWars Virtual Challenge 05 — Celebration & Event Planner  
**Project:** Celebrio India  
**Repository:** https://github.com/snehasishlabs/celebrio-india  
**Production Deployment:** https://celebrio-india.vercel.app/  
**Original Submission Commit:** `2bcee28bf5102d74fdc9cd0e091c4b9ff50c06f9` (Sat Oct 31 19:09:38 2026 +0530)  
**Post-Submission Recovery Branch:** `fix/vercel-gemini-production` (`24a0332`)  
**Submission Date:** November 20, 2026  
**Grievance Deadline:** November 22, 2026, 11:59 PM IST  

---

### Respectful Greeting & Purpose of Communication

Dear PromptWars Evaluation Committee,

We are submitting this formal grievance and request for technical reconsideration regarding the evaluation and disqualification of our project, **Celebrio India**, for PromptWars Challenge 05.

We approach this matter with complete candor, transparency, and deep respect for the evaluation committee's time. We have conducted a rigorous, objective root-cause audit of our deployment infrastructure to understand why the evaluators observed deterministic fallback behavior rather than live Google Gemini 2.5 Flash generation.

This letter explains the exact technical root cause, provides verifiable Git evidence from our original submission, and formally requests an opportunity to demonstrate live Gemini functionality on our corrected deployment.

---

### 1. Transparent Technical Root Cause: The Vite vs. Vercel Middleware Mismatch

In our original submission (`2bcee28`, submitted October 31, 2026), our engineering team implemented a comprehensive, secure server-side integration with Google Gemini 2.5 Flash (`@google/genai` SDK v2.31.0) inside `server/geminiService.ts` and `server/apiHandler.ts`.

However, an infrastructure routing mismatch occurred during production deployment on Vercel:

1. **Vite Plugin vs. Vercel Serverless Functions**:
   - In the submitted codebase, our custom API middleware was attached via Vite's development and preview plugins (`celebrioAiServerPlugin()` in `vite.config.ts`).
   - In local development (`npm run dev`) and preview testing (`npm run preview`), Vite's middleware successfully intercepted `/api/*` requests and routed them to `server/apiHandler.ts`.
   - However, when Vercel builds a standard Vite single-page application in production, it runs `npm run build` (`tsc -b && vite build`), generating purely static assets in `dist/`. Vite server plugins are **not executed** in Vercel's production serverless runtime.
   - Because the repository on `master` lacked a dedicated `/api/index.ts` serverless function and `vercel.json` rewrites, all HTTP requests to `/api/health` and `/api/plan/*` on the live production URL (`https://celebrio-india.vercel.app/`) returned HTTP 404 or were caught by client-side SPA routing (`index.html`).

2. **How Resilient Fallback Masked the Issue in the UI**:
   - To prevent application crashes during network drops, our frontend planning service (`src/services/ai/aiPlanningService.ts`) included a resilient deterministic fallback engine (`generateThemeConcepts()`).
   - When the browser received non-JSON or 404 responses from the broken `/api` routes, it gracefully defaulted to local deterministic generation and rendered realistic theme concepts with the label `deterministic-demo`.
   - To an end-user or evaluator testing the live deployment, the application appeared fully functional, but it operated entirely within the offline fallback engine. The live Gemini 2.5 Flash API was never reached in production.

---

### 2. Evidence from the Original Submission (`2bcee28`)

We emphasize that this was an infrastructure deployment routing issue, **not an absence of Gemini implementation**. 

The original submission commit (`2bcee28`), which remains preserved, untouched, and verifiable in our Git history, contains:
- **`server/geminiService.ts`**: Complete `@google/genai` integration with `GoogleGenAI`, targeting `gemini-2.5-flash`, 15-second timeout races, structured JSON prompt engineering, and deterministic budget calculations.
- **`server/apiHandler.ts`**: Complete server-side validation, rate limiting (30 req/min), 64 KB payload bounding, and security headers.
- **`package.json`**: Explicit dependency on `@google/genai` (`^2.31.0`).
- **`src/services/ai/aiPlanningService.ts`**: Complete frontend client dispatching requests to `/api/plan/generate-concepts`, `/api/plan/explain-tradeoffs`, and `/api/copilot/explain-urgent-tasks`.

The original codebase had all necessary AI logic in place, but lacked the single file (`api/index.ts`) required for Vercel to discover it as a serverless function.

---

### 3. Post-Submission Recovery & Verification

In branch **`fix/vercel-gemini-production`** (commit `24a0332`), we have implemented the minimal, targeted infrastructure correction:
1. **Created `api/index.ts`**: A dedicated Vercel Serverless Function entry point delegating to the existing `server/apiHandler.ts`.
2. **Configured `vercel.json`**: Explicit path rewrite (`/api/(.*)` -> `/api?endpoint=$1`) and edge security headers (`nosniff`, `DENY`, `strict-origin-when-cross-origin`).
3. **Enhanced Diagnostics**: `/api/health` now explicitly reports `geminiStatus: "configured"` and `fallbackMode: "ready-as-backup"` without exposing keys.
4. **Comprehensive Test Suite**: All **263 tests pass across 32 test files**, including mocked live Gemini generation, auth error recovery, rate limiting, and route whitelisting.

We explicitly disclose that this recovery commit is a **post-submission repair**. We do not claim that the original deployed production site was executing live Gemini calls during initial evaluation.

---

### 4. Specific Reconsideration Requests

We respectfully request that the PromptWars Evaluation Committee consider the following:

1. **Review of Original Source Capability**: We request an audit of commit `2bcee28` to verify that our project genuinely contained original, high-quality Gemini 2.5 Flash code, complete prompt engineering, and architectural design prior to the deadline.
2. **Clarification on Evaluation Scope**: We respectfully seek clarification on whether the challenge evaluation strictly evaluated live production deployment runtime behavior or whether submitted source code implementation is considered.
3. **Live Demonstration Opportunity**: We offer to demonstrate the corrected production deployment in a brief live screen session or video call, proving genuine, live Google Gemini 2.5 Flash theme generation, scenario trade-offs, and Copilot advice running on Vercel with authenticated `source: "gemini-live"`.
4. **Technical Reconsideration of Disqualification**: If the committee determines that our original source code demonstrated the requisite hackathon requirements and that the failure was strictly a serverless deployment routing defect now fully resolved, we humbly request reconsideration of our disqualification.

Thank you for your dedication to fair, rigorous judging and for your consideration of this grievance.

Sincerely,  
**Snehasish Labs / Celebrio India Team**  
Repository: https://github.com/snehasishlabs/celebrio-india  
Production URL: https://celebrio-india.vercel.app/  
Branch: `fix/vercel-gemini-production`
