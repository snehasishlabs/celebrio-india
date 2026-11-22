# Celebrio India — Production Verification Report

**Project:** Celebrio India  
**Target URL:** https://celebrio-india.vercel.app/  
**Original Submission Commit:** `2bcee28`  
**Recovery Branch:** `fix/vercel-gemini-production`  
**Latest Recovery Commit:** `6b9eb8c` (HEAD)  
**Report Date:** November 22, 2026  

---

## 1. Classification Methodology

To ensure absolute transparency for the PromptWars technical evaluation committee, all features, endpoints, and security mechanisms are classified into four distinct verification categories:

1. **Verified Locally:** Executed, tested, and validated in the local repository environment using Node.js, Vite, Rolldown, and native HTTP request simulations.
2. **Verified with Mocked Tests:** Tested using simulated responses from the Google GenAI SDK (`@google/genai`) to validate contract handling, error recovery, and data transformations without consuming live API quota.
3. **Verified in Actual Production:** Tested against live Vercel servers communicating with Google's live Gemini 2.5 Flash infrastructure.
4. **Pending Manual Verification:** Operations requiring user authentication, pull request merge, or live Vercel environment variable configuration.

---

## 2. Root Cause Analysis: Vercel 500 Runtime Failure

During live production probing of `https://celebrio-india.vercel.app/api/health`, Vercel returned:
`HTTP 500 Internal Server Error (X-Vercel-Error: FUNCTION_INVOCATION_FAILED)`.

A comprehensive audit pinpointed the exact dual root causes:
1. **TypeScript 7.0 & `@vercel/ncc` Loader Incompatibility:**  
   Vercel's serverless builder uses `@vercel/ncc` with `ts-loader` to compile TypeScript functions located under `/api`. In `typescript@7.0.2`, Microsoft restructured module exports (`lib/version.cjs`), causing `require('typescript').sys` to be undefined in legacy loaders. This caused `@vercel/ncc`'s `ts-loader` to crash with `TypeError: Cannot read properties of undefined (reading 'fileExists')`, failing function deployment at the gateway.
2. **Path Alias & ESM Module Resolution:**  
   `conceptGenerator.ts` contained `@/types/...` path alias imports, while the root `tsconfig.json` lacked path mapping. In native Node.js ESM mode (`"type": "module"`), unbundled relative imports without explicit extensions cause runtime `ERR_MODULE_NOT_FOUND`.

### The Definitive Fix
1. **Self-Contained Serverless Entry Point (`api/index.js`):**  
   The TypeScript serverless entry point source is maintained at `server/apiEntry.ts`. The production build step (`npm run build`) uses `rolldown` to bundle `server/apiEntry.ts` directly into a clean, standalone ES module at `api/index.js`.
2. **Bypassing `ts-loader`:**  
   Because `api/index.js` is pure JavaScript, `@vercel/ncc` bundles it in seconds without invoking `ts-loader`, completely eliminating TypeScript 7 runtime compiler conflicts.
3. **Robust Top-Level Error Handling:**  
   `server/apiEntry.ts` encapsulates all request handling in top-level `try...catch` blocks, ensuring that unexpected errors return structured JSON (`500 INTERNAL_SERVER_ERROR`) instead of triggering unhandled Vercel gateway invocation crashes.
4. **Isolated Typing:**  
   All type imports in `server/geminiService.ts`, `server/validator.ts`, and `conceptGenerator.ts` were converted to `import type` with relative paths, preventing unintended runtime bundle baggage.

---

## 3. Comprehensive Verification Matrix

| Checklist Item | Description | Verification Status | Evidence Reference |
|---|---|---|---|
| **1. Original Master Commit Preservation** | Commit `2bcee28` preserved on `master` and `origin/master`. Zero overwrites or force pushes. | **VERIFIED LOCALLY** | `git rev-parse 2bcee28...` |
| **2. Recovery Branch & Commit** | Branch `fix/vercel-gemini-production` pushed with all repairs. | **VERIFIED LOCALLY** | `origin/fix/vercel-gemini-production` |
| **3. Serverless Entry Point Discovery** | `api/index.js` discovered and bundled cleanly by `@vercel/ncc`. | **VERIFIED LOCALLY & NCC BUILD** | `ncc build api/index.js` (0 errors, code 0) |
| **4. Vercel Rewrite URL Mapping** | `/api/(.*)` rewrites to `/api?endpoint=$1` and maps to `ALLOWED_API_ENDPOINTS`. | **VERIFIED LOCALLY & IN ROUTING** | `apiHandler.test.ts` (39 tests pass) |
| **5. Strict Route Whitelisting** | Only authorized endpoints permitted; traversal (`..`, `%2e%2e`, `%5c`, `\0`) returns 404. | **VERIFIED LOCALLY** | `apiHandler.test.ts` lines 392-484 |
| **6. 64 KB Payload Limit** | Bounded requests enforce 64KB cap on streams, pre-parsed strings, and pre-parsed objects. | **VERIFIED LOCALLY** | Returns 413 `PAYLOAD_TOO_LARGE` |
| **7. Rate Limiter Enforcement** | 30 requests/minute per client IP enforced with `Retry-After: 60`. | **VERIFIED LOCALLY** | `validator.test.ts` (14 tests pass) |
| **8. HTTP Security Headers** | `nosniff`, `DENY`, `strict-origin-when-cross-origin`, and `Permissions-Policy` present on all responses. | **VERIFIED LOCALLY** | `apiHandler.test.ts` & `vercel.json` |
| **9. Zero Client Secret Exposure** | `GEMINI_API_KEY` never prefixed with `VITE_`; completely absent from `dist/` bundle. | **VERIFIED LOCALLY** | `dist/assets/index-*.js` inspection |
| **10. Gemini 2.5 Flash Live Generation** | Model invoked with `gemini-2.5-flash`, 15s timeout, returning `source: "gemini-live"`. | **VERIFIED WITH MOCKED TESTS** | `geminiLive.test.ts` (3 tests pass) |
| **11. Gemini Auth Error Recovery** | HTTP 401/403 API key rejection recovers to `fallback-rule-engine` gracefully. | **VERIFIED WITH MOCKED TESTS** | `geminiFailures.test.ts` (7 tests pass) |
| **12. Gemini Rate Limit (429) Recovery** | Upstream quota exhaustion recovers to `fallback-rule-engine` without throwing. | **VERIFIED WITH MOCKED TESTS** | `geminiFailures.test.ts` |
| **13. Deterministic Financial Authority** | `enforceDeterministicBudgetCalculations` strictly overrides all LLM outputs with math. | **VERIFIED LOCALLY & WITH MOCKS** | `geminiService.test.ts` |
| **14. Full Test Suite Integrity** | All 263 tests passing across 32 test files. 0 errors in `oxlint src server`. Clean `npm run build`. | **VERIFIED LOCALLY** | `docs/evidence/test-suite-results.txt` |
| **15. Verification Script Execution** | `scripts/verify-gemini-live.js` verifies both `/api/health` and `/api/plan/generate-concepts`. | **VERIFIED LOCALLY** | `node scripts/verify-gemini-live.js` (Status 200) |
| **16. Production Vercel Deployment** | Merge and redeploy recovery branch on Vercel. | **PENDING USER DEPLOYMENT** | Awaiting merge to production |
| **17. Production Live Gemini Test** | Live curl check on production with configured `GEMINI_API_KEY`. | **PENDING USER DEPLOYMENT** | Awaiting production redeploy |

---

## 4. Production Verification Runbook (Post-Deployment)

Once this recovery branch is deployed to Production:

### Step 1: Health Diagnostic Ping
```bash
curl -s https://celebrio-india.vercel.app/api/health
```
**Expected Production Output:**
```json
{
  "status": "ok",
  "hasGeminiKey": true,
  "model": "gemini-2.5-flash",
  "mode": "live",
  "geminiStatus": "configured",
  "fallbackMode": "ready-as-backup",
  "version": "1.0.0"
}
```

### Step 2: Live Concept Generation Request
```bash
curl -s -X POST https://celebrio-india.vercel.app/api/plan/generate-concepts \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "prod-verify-001",
    "title": "Kolkata Royal Heritage Reception",
    "category": "wedding",
    "city": "Kolkata",
    "targetGuestCount": 150,
    "totalBudget": 500000,
    "currency": "INR",
    "themePreference": "Traditional Rajbari aesthetic with fresh Rajnigandha and brass lamps"
  }'
```
**Expected Production Output:**
- `source`: `"gemini-live"`
- `model`: `"gemini-2.5-flash"`
- `concepts`: 3 complete concepts with validated tiers (`budget-conscious`, `creative-distinctive`, `premium`).
- `costEstimation`: Deterministically calculated to ₹4,10,000 (82%), ₹4,90,000 (98%), and ₹5,00,000 (100%).

---

## 5. Pre-Deployment Preview Deployment Inspection Evidence

### Deployment Metadata
- **Commit SHA:** `6b9eb8c88c08b865d58e4a72085fa4c889a4d789`
- **Vercel Check Run ID:** `137130120414` (Completed Nov 22, 2026, 07:10:27 UTC)
- **Preview Deployment URL:** `https://celebrio-india-git-fix-vercel-gemi-b6f55b-snehasish-s-projects1.vercel.app`
- **Vercel Build Status:** Succeeded (`status: "completed"`, `conclusion: "success"`)

### HTTP Inspection Log
```http
GET /api/health HTTP/1.1
Host: celebrio-india-git-fix-vercel-gemi-b6f55b-snehasish-s-projects1.vercel.app

HTTP/1.1 302 Found
Server: Vercel
Location: https://vercel.com/sso-api?url=https%3A%2F%2Fcelebrio-india-git-fix-vercel-gemi-b6f55b-snehasish-s-projects1.vercel.app%2Fapi%2Fhealth&nonce=...
X-Vercel-Id: bom1::c76k7-1795331858055-eba8551d66ed
Content-Type: text/plain

Protected by Vercel Authentication
To access this deployment with an authenticated Vercel CLI, run: vercel curl <deployment-url>
With an authorized Vercel MCP connection (https://mcp.vercel.com), call web_fetch_vercel_url with url set to the full deployment URL.
```

### Analysis of Current Gate
1. **Deployment Succeeded:** Vercel successfully processed and deployed commit `6b9eb8c`. The build error that previously failed on `api/index.ts` is 100% resolved by the bundled `api/index.js`.
2. **Access Barrier:** Vercel's edge network intercepts requests to this preview deployment because **Vercel Authentication (Deployment Protection)** is active on Preview environments for the `celebrio-india` project.
3. **Distinction of Verification Levels:**
   - **Local Tests:** PASSED (263/263 tests, Rolldown bundle, Oxlint, local HTTP simulation).
   - **Preview Deployment Tests:** DEPLOYED, but currently GATED by Vercel Authentication (HTTP 302).
   - **Actual Gemini API Generation in Cloud:** PENDING either preview gate bypass (`x-vercel-protection-bypass` / disabling Vercel Authentication for Preview in Vercel settings) or approved Production deployment.
   - **Production Deployment:** NOT YET DEPLOYED (awaiting user approval to merge `fix/vercel-gemini-production` commit `6b9eb8c` into `master`).

