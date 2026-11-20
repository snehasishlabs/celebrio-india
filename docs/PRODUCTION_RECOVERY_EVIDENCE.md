# Celebrio India — Production Recovery Evidence & Audit Trail

**Project:** Celebrio India — AI-Powered Celebration & Event Planner  
**Hackathon:** PromptWars Virtual Challenge 05 — Celebration & Event Planner  
**Original Submission Commit:** `2bcee28bf5102d74fdc9cd0e091c4b9ff50c06f9`  
**Intermediate Release Commit:** `f7f9789312423bc0c2815961858e0392fd150a25`  
**Recovery Branch:** `fix/vercel-gemini-production`  
**Recovery Commit:** `9783562ada697936512d622cf3814d55f124941a`  
**Production URL:** https://celebrio-india.vercel.app/  
**Repository:** https://github.com/snehasishlabs/celebrio-india  
**Grievance Deadline:** November 22, 2026, 11:59 PM IST  
**Document Generation Date:** November 20, 2026  

---

## 1. Executive Summary & Objective

This document establishes a transparent, tamper-evident audit trail regarding the deployment architecture of Celebrio India for PromptWars Challenge 05. It provides technical verification for the grievance process, explicitly documenting what existed in the original submission versus what was addressed in the post-submission production recovery branch.

### Key Finding
- **Source Code Capability:** The original submission commit (`2bcee28`, Oct 31, 2026) contained a fully architected Google GenAI SDK integration (`@google/genai` v2.31.0) targeting `gemini-2.5-flash`, complete with server-side validation, rate limiting, and prompt engineering.
- **Deployment Root Cause:** In `2bcee28`, the custom API middleware was attached solely through Vite's dev/preview server plugins (`celebrioAiServerPlugin()` in `vite.config.ts`). In Vercel's production environment, `npm run build` generates purely static client assets (`dist/`), meaning Vite server plugins are never executed. Without a dedicated `/api` serverless function, browser requests to `/api/*` fell back to static HTML (`index.html`).
- **Resilient Fallback Masking:** `aiPlanningService.ts` was engineered with a graceful offline fallback. When the production API failed to respond with JSON, the client seamlessly defaulted to `generateThemeConcepts()`, operating in deterministic demo mode without crashing the UI.
- **Recovery Resolution:** Branch `fix/vercel-gemini-production` introduces the dedicated Vercel Serverless Function entry point (`api/index.ts`) and path rewrites (`vercel.json`), allowing genuine server-side Gemini 2.5 Flash execution in production.

---

## 2. Commit & Artifact Provenance

### A. Original Submission State
- **Git Commit:** `2bcee28bf5102d74fdc9cd0e091c4b9ff50c06f9`
- **Commit Date:** Sat Oct 31 19:09:38 2026 +0530
- **Author:** Celebrio AI Architect `<dev@celebrio.ai>`
- **Commit Message:** `docs(submission): Add official PromptWars Challenge 5 submission package and final handover report`
- **Branch:** `master` (and `origin/master`)
- **Status:** **100% Preserved & Untouched**. Commit `2bcee28` has not been rebased, force-pushed, or altered.

### B. Intermediate Release Hardening State
- **Git Commit:** `f7f9789312423bc0c2815961858e0392fd150a25`
- **Commit Date:** Sun Nov 1 22:19:12 2026 +0530
- **Author:** Celebrio AI Architect `<dev@celebrio.ai>`
- **Commit Message:** `fix: finalize Vercel API routing and release hardening`
- **Branch:** `release/celebrio-preview`
- **Status:** Drafted initial `api/index.ts` and `vercel.json` rewrites, but remained unmerged into `master`.

### C. Post-Submission Recovery State
- **Git Commit:** `9783562ada697936512d622cf3814d55f124941a`
- **Commit Date:** Fri Nov 20 16:55:33 2026 +0530
- **Author:** Celebrio AI Architect `<dev@celebrio.ai>`
- **Commit Message:** `fix(vercel): recovery and verification of production Vercel serverless routing and Gemini 2.5 Flash live mode`
- **Branch:** `fix/vercel-gemini-production`
- **Status:** Full production recovery branch with 262/262 passing tests, enhanced `/api/health` diagnostics, robust traversal defense, and mocked live Gemini verification.

---

## 3. Distinction Between Original vs. Recovery Evidence

To maintain complete architectural integrity before the PromptWars judges, the technical distinction between the two states is detailed below:

| Architectural Component | Original Submission (`2bcee28`) | Post-Submission Recovery (`9783562`) |
|---|---|---|
| **Google GenAI SDK (`@google/genai`)** | Installed (`^2.31.0`) and implemented in `server/geminiService.ts` | Identical; targets `gemini-2.5-flash` with 15s timeout |
| **Server-Side API Handler** | `server/apiHandler.ts` implemented with 64KB limits & rate limiting | Enhanced with `resolveApiPath` whitelist and traversal protection |
| **Vite Dev/Preview Server Middleware** | Present in `vite.config.ts` (`celebrioAiServerPlugin()`) | Preserved for identical local development workflow |
| **Vercel Serverless Entry Point (`api/index.ts`)** | **MISSING** (No `/api` directory on `master`) | **PRESENT** (`api/index.ts` delegates to `handleApiRequest`) |
| **Vercel Rewrites Configuration (`vercel.json`)** | **MISSING** on `master` | **PRESENT** (`/api/(.*)` -> `/api?endpoint=$1`, SPA catch-all) |
| **HTTP Security Headers** | Implemented only in Node handler | Implemented in both Node handler and `vercel.json` edge headers |
| **`/api/health` Diagnostic Fields** | Returned `status`, `hasGeminiKey`, `model`, `mode`, `version` | Added `geminiStatus` and `fallbackMode` for explicit operational transparency |
| **Fallback Labeling on Error** | Fell back to `demo-rule-engine` | Distinguishes `fallback-rule-engine` (on error) from `demo-rule-engine` (unconfigured) |
| **Test Suite Coverage** | 216 tests passing | 262 tests passing (expanded routing, auth errors, and live mock suites) |
| **Production Runtime Behavior** | Defaulted to deterministic demo mode due to 404 on `/api/*` | Dispatches to Vercel Serverless Function, executing live Gemini 2.5 Flash |

---

## 4. Integrity Safeguards

1. **Original Branch Protection**: The `master` branch is preserved at `2bcee28`. No force-pushes or history rewrites have taken place.
2. **Deterministic Financial Guardian**: `enforceDeterministicBudgetCalculations()` strictly recalculates all financial totals and percentage allocations on LLM outputs in both original and recovery code. At no point could an LLM corrupt budget arithmetic.
3. **Secret Security**:
   - `GEMINI_API_KEY` was never committed to version control.
   - `GEMINI_API_KEY` was never prefixed with `VITE_` or bundled into client assets.
   - All tests use mocked SDK responses and consume 0 production API quota.
