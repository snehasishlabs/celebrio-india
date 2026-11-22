# Celebrio India — Production Verification Report

**Project:** Celebrio India  
**Target URL (Production):** https://celebrio-india.vercel.app/  
**Preview Deployment URL:** https://celebrio-india-mscg33ymv-snehasish-s-projects1.vercel.app  
**Branch Alias URL:** https://celebrio-india-git-fix-vercel-gemi-b6f55b-snehasish-s-projects1.vercel.app  
**Original Submission Commit:** `2bcee28`  
**Recovery Branch:** `fix/vercel-gemini-production`  
**Latest Recovery Commit:** `1903ac8`  
**Report Date:** November 22, 2026  
**Status:** **LIVE GEMINI AI VERIFIED ON DEPLOYED SERVERLESS ENVIRONMENT**

---

## 1. Executive Summary

This report documents the end-to-end audit, architectural recovery, test suite validation, and live cloud AI verification of **Celebrio India** on Vercel serverless infrastructure.

### Verification Classification

To provide complete integrity and transparency:
1. **Verified Locally (Clean Builds & Automated Tests):**
   - 263 / 263 tests passed across 32 test files (`vitest run`).
   - 0 errors, 0 warnings across 93 files (`oxlint src server`).
   - TypeScript compiler (`tsc -b`), Vite frontend production build, and Rolldown standalone serverless bundler completed in ~7s with 0 errors.
2. **Verified in Deployed Cloud Serverless Preview (`celebrio-india-mscg33ymv`):**
   - `GET /api/health` returned HTTP 200 with `hasGeminiKey: true`, `mode: "live"`, `geminiStatus: "configured"`.
   - `GET /api/health?models=1` returned HTTP 200 with Google's live list of available models for the configured `GEMINI_API_KEY`.
   - `POST /api/plan/generate-concepts` returned HTTP 200 with **`source: "gemini-live"`**, **`model: "gemini-3.5-flash-lite"`**, generating 3 culturally rich Bengali wedding concepts.
   - `POST /api/plan/explain-tradeoffs` returned HTTP 200 with **`source: "gemini-live"`**, **`model: "gemini-3.5-flash-lite"`**, generating detailed strategic tradeoff analysis.
   - `POST /api/copilot/explain-urgent-tasks` returned HTTP 200 with **`source: "gemini-live"`**, **`model: "gemini-3.5-flash-lite"`**, generating sprint tasks and cultural advisories.
3. **Pending User Approval for Production Merge:**
   - Production URL (`https://celebrio-india.vercel.app/`) remains untouched on `master` (commit `2bcee28`).
   - Merging Pull Request #2 (`fix/vercel-gemini-production` -> `master`) requires explicit user confirmation.

---

## 2. Root Cause Analysis & Architecture Fixes

### A. Vercel 500 FUNCTION_INVOCATION_FAILED (Original Failure)
- **Cause:** Vercel's legacy `@vercel/ncc` builder attempted to compile `api/index.ts` using `ts-loader` against `typescript@7.0.2`. Because TypeScript 7 restructured its module exports (`lib/version.cjs`), `require('typescript').sys` returned undefined in `ts-loader`, throwing `TypeError: Cannot read properties of undefined (reading 'fileExists')` at function initialization.
- **Fix:** Restructured the serverless entry point to `server/apiEntry.ts` and introduced a compile-time bundling step with `rolldown` into standalone `api/index.js`. Vercel now serves pure compiled JavaScript with zero TypeScript compiler dependencies at the runtime gateway.

### B. Google Upstream Model Deprecation for New API Keys
- **Upstream Reality:** In late 2026, Google Generative AI API deprecated direct allocation of `gemini-2.5-flash` for newly generated API keys, returning:
  ```json
  {"error":{"code":404,"message":"This model models/gemini-2.5-flash is no longer available to new users. Please update your code to use models/gemini-3.8-flash for the latest features and improvements...","status":"NOT_FOUND"}}
  ```
  Furthermore, Google's designated modern replacement `gemini-3.8-flash` frequently experiences upstream demand spikes, returning `503 UNAVAILABLE`.
- **Architectural Solution:** Implemented an intelligent multi-candidate fallback pipeline in `server/geminiService.ts`:
  `CANDIDATE_MODELS = ['gemini-2.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest']`.
  If an API key is rejected for `gemini-2.5-flash` or encounters rate limits/503 spikes, the service immediately attempts `gemini-3.5-flash-lite`. This ensures **zero downtime and genuine live AI generation** on both legacy and newly generated Google AI keys.

### C. Serverless Execution Window & Payload Protection
- Configured Vercel function maximum execution duration to `maxDuration: 60` seconds.
- Enforced strict 64 KB maximum payload bounds and 30 requests/minute rate limiting per IP with `Retry-After: 60`.
- Implemented strict route whitelisting rejecting directory traversal, double URL encoding, backslashes, and null bytes.

---

## 3. Cloud Preview Live Verification Evidence

Authenticated verification was conducted using authenticated Vercel CLI against deployment `https://celebrio-india-mscg33ymv-snehasish-s-projects1.vercel.app` (Deployment ID: `dpl_4JCm6zHgsiZezJS9PPkjPaaFNjwm`).

### Evidence 1: Live Health & Key Verification (`GET /api/health`)
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
X-Content-Type-Options: nosniff
X-Frame-Options: DENY

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

### Evidence 2: Live Google Model Registry Check (`GET /api/health?models=1`)
```json
{
  "status": "ok",
  "hasGeminiKey": true,
  "model": "gemini-2.5-flash",
  "mode": "live",
  "geminiStatus": "configured",
  "fallbackMode": "ready-as-backup",
  "version": "1.0.0",
  "availableGeminiModels": [
    "models/gemini-2.5-flash",
    "models/gemini-2.5-pro",
    "models/gemini-flash-latest",
    "models/gemini-flash-lite-latest",
    "models/gemini-pro-latest",
    "models/gemini-2.5-flash-lite",
    "models/gemini-3.5-flash",
    "models/gemini-3.5-flash-lite",
    "models/gemini-3.8-flash",
    "models/gemini-3.8-flash-lite",
    "models/gemini-3.8-pro"
  ]
}
```

### Evidence 3: Live Concept Generation (`POST /api/plan/generate-concepts`)
**Request Input:**
```json
{
  "eventId": "evt-preview-bengali-live",
  "title": "Debabrata & Ananya Royal Bengali Wedding",
  "category": "wedding",
  "city": "Kolkata",
  "targetGuestCount": 150,
  "totalBudget": 500000,
  "currency": "INR",
  "themePreference": "Historic Kolkata Rajbari with fragrant Rajnigandha and vintage Shehnai",
  "priorities": ["Authentic Bengali Feast", "Shantiniketan Terracotta Decor", "Elder Accessibility"],
  "dietaryRequirements": ["Vegetarian Bou Bhaat Counter", "Golda Chingri Live Station"],
  "accessibilityRequirements": ["Ground floor dining", "Wheelchair accessible mandap"]
}
```

**Live Cloud AI Response (Excerpt):**
```json
{
  "source": "gemini-live",
  "model": "gemini-3.5-flash-lite",
  "concepts": [
    {
      "id": "concept-evt-preview-bengali-live-budget-conscious",
      "eventId": "evt-preview-bengali-live",
      "tier": "budget-conscious",
      "title": "Rajbari Heritage Charm",
      "tagline": "Traditional elegance meets prudent planning in a historic courtyard setting.",
      "description": "An authentic celebration honoring Bengali roots while strictly preserving an 18% financial buffer. Features clever styling using local Shantiniketan terracotta crafts and abundant fragrant blossoms.",
      "colorPalette": [
        { "name": "Terracotta", "hex": "#E05A47" },
        { "name": "Rajnigandha Ivory", "hex": "#F4F1EA" },
        { "name": "Marigold Gold", "hex": "#F4A261" },
        { "name": "Deep Indigo", "hex": "#2B4C7E" }
      ],
      "decor": {
        "focalPoint": "A raised ground-floor mandap framed with intricate Shantiniketan terracotta panels and smooth ramp access.",
        "lighting": "Warm brass lanterns and string fairy lights illuminating the vintage brickwork of the Rajbari.",
        "tableSettings": "Traditional Kansa (bell metal) plates and bowls laid over crisp cotton gamcha-accented runners.",
        "botanicals": "Massive strings and centerpieces of fragrant Rajnigandha (tuberose) paired with marigolds."
      },
      "foodAndBeverage": {
        "serviceStyle": "Buffet setup with dedicated live stations and seated service for elderly guests.",
        "highlights": [
          "Authentic Bengali feast with shukto and kosha mangsho",
          "Exclusive Golda Chingri (jumbo prawn) live station",
          "Dedicated vegetarian Bou Bhaat counter with traditional chhanar dalna"
        ],
        "signatureDrink": "Aam Panna sherbet served in earthen clay hars."
      },
      "entertainment": {
        "mainAct": "Live vintage Shehnai ensemble welcoming guests at the arched entrance.",
        "interactiveElements": [
          "Traditional Dhunuchi nach performance invite for guests",
          "Live clay-modelling corner showcasing local artisans"
        ]
      },
      "guestExperience": {
        "arrivalMoment": "A traditional shankh sound and floral tikka welcome by family elders.",
        "takeawayFavor": "Hand-painted terracotta kulhars filled with Shantiniketan sweets.",
        "comfortFeatures": [
          "Seamless ground-floor ramp access to all dining and rituals",
          "Reserved shaded seating zones with padded chairs for seniors"
        ]
      },
      "costEstimation": {
        "estimatedTotal": 410000,
        "varianceFromBudget": -90000,
        "percentOfBudget": 82,
        "disclaimer": "Estimated approximation based on regional vendor averages. Not a verified commercial quotation. Currency: INR"
      },
      "tradeoffs": {
        "advantages": [
          "Leaves an 18% financial contingency buffer untouched",
          "Deeply authentic cultural ambiance using local materials",
          "Prioritizes complete accessibility for elderly attendees"
        ],
        "compromises": [
          "Uses semi-custom decor elements instead of bespoke floral installations",
          "Slightly simplified beverage and dessert menu selections"
        ]
      }
    },
    {
      "id": "concept-evt-preview-bengali-live-creative-distinctive",
      "eventId": "evt-preview-bengali-live",
      "tier": "creative-distinctive",
      "title": "Terracotta & Tuberose Symphony",
      "costEstimation": {
        "estimatedTotal": 490000,
        "varianceFromBudget": -10000,
        "percentOfBudget": 98,
        "disclaimer": "Estimated approximation based on regional vendor averages. Not a verified commercial quotation. Currency: INR"
      }
    },
    {
      "id": "concept-evt-preview-bengali-live-premium",
      "eventId": "evt-preview-bengali-live",
      "tier": "premium",
      "title": "Royal Rajbari Grandeur",
      "costEstimation": {
        "estimatedTotal": 500000,
        "varianceFromBudget": 0,
        "percentOfBudget": 100,
        "disclaimer": "Estimated approximation based on regional vendor averages. Not a verified commercial quotation. Currency: INR"
      }
    }
  ],
  "generatedAt": "2026-11-22T11:32:09.981Z"
}
```

### Evidence 4: Live Tradeoff Explanation (`POST /api/plan/explain-tradeoffs`)
**Live Response:**
```json
{
  "source": "gemini-live",
  "model": "gemini-3.5-flash-lite",
  "strategicSummary": "Expanding the guest count by 50 while adding ₹100,000 to the budget results in a lower per-guest spend, requiring a strategic reallocation of funds toward high-impact areas like venue capacity and catering scale while leveraging the net budget increase to elevate overall guest comfort.",
  "culinaryRecommendations": [
    "Transition from a rigid plated multi-course dinner to interactive, high-end food stations that efficiently serve 200 guests without inflating labor costs.",
    "Streamline the bar menu by featuring two signature cocktails and a curated wine selection to offset increased per-capita beverage consumption."
  ],
  "budgetSavingTips": [
    "Maximize floral versatility by repurposing ceremony arrangements into reception centerpieces to absorb decor inflation.",
    "Opt for digital or semi-custom stationery suites to redirect funds into guest-facing hospitality elements.",
    "Negotiate volume-based tiered pricing with your primary venue and caterer for the 200-guest threshold."
  ],
  "generatedAt": "2026-11-22T11:39:44.964Z"
}
```

### Evidence 5: Live Copilot Urgent Task Advice (`POST /api/copilot/explain-urgent-tasks`)
**Live Response:**
```json
{
  "source": "gemini-live",
  "model": "gemini-3.5-flash-lite",
  "headline": "30-Day Sprint Strategy for Debabrata & Ananya's Royal Bengali Wedding",
  "strategicSummary": "With a tight 30-day timeline, 150 guests, and a ₹500,000 budget in a metropolitan city, immediate vendor locking and strict cost discipline are paramount to pull off an authentic traditional Bengali celebration.",
  "urgentTaskAnalyses": [
    {
      "taskId": "task-caterer-01",
      "taskTitle": "Finalize Bengali Caterer for Bou Bhaat",
      "urgencyLevel": "high",
      "daysUntilDeadline": 5,
      "whyItMatters": "Authentic Bengali menus require specialized preparation (e.g., Kosha Mangsho, Chholar Dal, and fresh Mishti). Delaying this risks unavailability of top-tier traditional cooks and severe menu compromise.",
      "recommendedAction": "Shortlist top 2 metropolitan caterers specializing in authentic Bengali weddings, schedule a tasting session within 48 hours, and lock the contract.",
      "culturalContext": "The Bou Bhaat feast—highlighted by 'Rui Machher Jhol' and authentic sweets like 'Nolen Gurer Sandesh' (season permitting) or 'Rosogolla'—is the culinary centerpiece of the bride's integration into the family."
    }
  ],
  "traditionAdvisories": [
    "Ensure your venue can accommodate the 'Saat Paake Ghaura' (circling the bride 7 times) and 'Subho Drishti' rituals with adequate mandap space.",
    "Source fresh turmeric paste and 'Tatta' (gift trays) early for the Gaye Holud ceremony to maintain traditional vibrancy."
  ],
  "budgetGuidance": "Your ₹500,000 budget requires strict allocation. Exactly 8% (₹40,000) must be locked away as a contingency reserve, leaving ₹460,000 for venue, catering, attire, and decor.",
  "suggestedNextSteps": [
    "Finalize and deposit the advance for the Bou Bhaat caterer.",
    "Secure the wedding venue with explicit permission for traditional fire rituals (Hovan).",
    "Procure essential wedding ritual items including 'Gaach Kouto' and 'Kulo'."
  ],
  "clarifyingQuestion": "Have you already secured a venue that permits traditional Bengali rituals like 'Saat Paake Ghaura' and the 'Hovan' fire?",
  "generatedAt": "2026-11-22T11:42:39.820Z"
}
```

---

## 4. Comprehensive Verification Matrix

| Verification Dimension | Criterion | Evidence / Result | Status |
|---|---|---|---|
| **Preservation of Master** | Commit `2bcee28` untouched; zero force pushes | `master` points to `2bcee28` | **PASS / PRESERVED** |
| **Recovery Branch Integrity** | All changes isolated to branch `fix/vercel-gemini-production` | PR #2 open on GitHub | **PASS** |
| **Zero Secret Leakage** | `GEMINI_API_KEY` never printed, client-bundled, or committed | Redacted logging and zero `VITE_` prefix | **PASS** |
| **Automated Testing** | 263 unit, integration, and contract tests pass | `vitest run` (100% pass) | **PASS** |
| **Static Code Quality** | Oxlint rules on 93 files; zero TypeScript build errors | `oxlint src server && npm run build` (0 err) | **PASS** |
| **Vercel Serverless Function** | Standalone `api/index.js` bundled cleanly without ts-loader | Vercel Deployment `● Ready` | **PASS** |
| **Health Diagnostic Check** | Returns 200, `hasGeminiKey: true`, `mode: "live"` | `npx vercel curl /api/health` | **PASS (LIVE)** |
| **Gemini Concept Generation** | Returns genuine `source: "gemini-live"` and 3 concepts | `npx vercel curl /api/plan/generate-concepts` | **PASS (LIVE)** |
| **Gemini Tradeoff Explanations**| Returns genuine `source: "gemini-live"` and strategies | `npx vercel curl /api/plan/explain-tradeoffs` | **PASS (LIVE)** |
| **Gemini Copilot Urgent Advice**| Returns genuine `source: "gemini-live"` and advisories | `npx vercel curl /api/copilot/explain-urgent-tasks`| **PASS (LIVE)** |
| **Model Fallback Resilience** | Recovers from 404/503 by selecting next active model | Handled 404 -> `gemini-3.5-flash-lite` | **PASS (LIVE)** |
| **Deterministic Math Override** | Hard financial calculations enforce 82%, 98%, 100% caps | Evaluated on all generated concepts | **PASS (LIVE)** |
| **Production Merge to Master** | Production promotion of recovery commit `1903ac8` | Pending User Approval | **READY FOR MERGE** |

---

## 5. Next Action: Production Merge Protocol

The recovery branch `fix/vercel-gemini-production` (commit `1903ac8`) is fully verified and ready to be merged into `master` whenever you authorize:

```bash
git checkout master
git merge fix/vercel-gemini-production
git push origin master
```

Once pushed, Vercel will trigger a production deployment to `https://celebrio-india.vercel.app/`. Because `GEMINI_API_KEY` is already present in your Vercel Production environment variables, the production application will immediately serve live Gemini 2.5/3.5 generations without further configuration.
