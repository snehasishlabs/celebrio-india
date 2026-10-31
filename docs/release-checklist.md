# Celebrio India — Production Release Candidate Checklist

> **Product:** Celebrio India  
> **Tagline:** Every Tradition. Every Budget. Every Celebration.  
> **Release Candidate:** v1.0.0-rc1  
> **Target Track:** PromptWars Virtual Challenge 5 (Celebration & Event Planner)  
> **Build Status:** Verified (TypeScript 5.8 + Vite 6.2, 0 Type Errors)  
> **Test Status:** 30 Suites Passed, 216 Tests Passed (100% Pass Rate)  

---

## 1. Release Prerequisites

Ensure the deployment or evaluation machine meets the following baseline environment requirements:

| Component | Minimum Version | Verified Runtime | Notes |
| :--- | :--- | :--- | :--- |
| **Node.js** | `>= 18.0.0` | `v20.x` / `v22.x` | ESM support required |
| **npm** | `>= 9.0.0` | `10.x` | Native lockfile resolution via `package-lock.json` |
| **OS** | Windows, macOS, or Linux | Windows 11 / Ubuntu 22.04 | Cross-platform Node runtime |
| **Modern Browser** | Chrome 110+, Firefox 115+, Safari 16+, Edge 110+ | Chrome 130+ | ES2022 JavaScript, CSS Flex/Grid support |

---

## 2. Clean Installation Verification

To deploy or evaluate Celebrio India from a pristine clone:

```powershell
# 1. Clone repository
git clone https://github.com/your-org/celebrio-india.git
cd celebrio-india

# 2. Clean dependency install using locked package tree
npm ci
```

*Verification Check:* Ensure `npm ci` finishes with 0 errors and creates `./node_modules`.

---

## 3. Environment Variable Configuration

Celebrio India strictly distinguishes between **frontend-safe** variables and **server-side confidential** credentials.

### 3.1 Variable Specification

| Variable Name | Exposure | Required? | Default / Example | Purpose & Notes |
| :--- | :--- | :---: | :--- | :--- |
| `VITE_APP_NAME` | Client | No | `"Celebrio India"` | Application title rendered in browser header |
| `VITE_APP_TAGLINE` | Client | No | `"Every Tradition. Every Budget. Every Celebration."` | Brand tagline |
| `VITE_APP_VERSION` | Client | No | `"1.0.0"` | Client semver string |
| `PORT` | Server | No | `3001` | Standalone server HTTP port (when run via `node server/index.ts`) |
| `NODE_ENV` | Server | No | `"development"` | Node execution environment |
| `GEMINI_API_KEY` | **Server ONLY** | **Optional** | `""` | Google Gemini 2.5 Flash API key. **When omitted, Celebrio India automatically operates in High-Fidelity Deterministic Demo Mode.** |

### 3.2 Configuration Instructions
1. Copy `.env.example` to `.env`:
   ```powershell
   cp .env.example .env
   ```
2. (Optional) Provide your Google Gemini API key:
   ```env
   GEMINI_API_KEY=AIzaSyYourActualKeyHere
   ```
> **Security Invariant:** Never prefix `GEMINI_API_KEY` with `VITE_`. Vite will bundle any `VITE_` variable directly into public browser JavaScript bundles.

---

## 4. Database Setup & Migrations

- **Database Engine:** Offline-First Tenant-Isolated LocalStorage Partitioning.
- **Migrations Required:** **None.**
- **Initial State:** On first launch (or after triggering `StorageService.resetAllData()`), Celebrio India automatically seeds the authenticated session with the **Ananya & Debashis Bengali Wedding in Kolkata** showcase dataset (150 guests, ₹3,00,000 budget, 8% contingency shield).
- **Multi-Tenant Keys:** Event storage keys are partitioned by `eventId` (e.g. `celebrio_budget_items_{eventId}`), preventing data bleeding between celebrations.

---

## 5. Local Development Commands

To run the unified full-stack application locally (Vite dev server + integrated AI planning middleware):

```powershell
npm run dev
```
- **Local Application URL:** `http://localhost:5173`
- **Integrated API Gateway:** `http://localhost:5173/api/health`
- **HMR:** Hot Module Replacement enabled for sub-second UI updates.

---

## 6. Testing & Quality Assurance Verification

Before building for release, execute all automated quality gates:

### 6.1 Static Code Analysis & Linter
```powershell
npm run lint
```
*Expected Result:* `Found 0 warnings and 0 errors across 93 files.`

### 6.2 Full Automated Test Suite (30 Files / 216 Tests)
```powershell
npm test
```
*Expected Result:* `Test Files: 30 passed (30)`, `Tests: 216 passed (216)`, `Duration: ~130–160s`.

---

## 7. Production Build & Bundling

To generate the optimized production release bundle:

```powershell
npm run build
```
This script executes:
1. `tsc -b`: Strict TypeScript compiler check across all app and server types.
2. `vite build`: Tree-shakes, minifies CSS, compresses SVGs, and splits vendor chunks.

*Expected Distribution Artifacts in `./dist`:*
- `dist/index.html` (~1.57 kB)
- `dist/assets/index-*.css` (~46.6 kB)
- `dist/assets/vendor-*.js` (~210.9 kB)
- `dist/assets/icons-*.js` (~30.9 kB)
- `dist/assets/index-*.js` (~497.5 kB)

---

## 8. Deployment Options & Server Start Commands

Celebrio India supports two production deployment topologies:

### Topology A: Unified Node / Vite Preview Deployment (Recommended for Hackathons)
Run the production build using Vite's integrated preview server with built-in API routing middleware:
```powershell
npm run build
npm run preview
```
- **Preview Port:** `http://localhost:4173`
- **Features:** Serves production-minified assets and routes all `/api/*` requests to `server/apiHandler.ts`.

### Topology B: Static Host + Serverless / Node Container
1. **Frontend (Vercel, Netlify, Cloudflare Pages, S3/CloudFront):**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Single Page Application Rewrite: `/*` $\to$ `/index.html` (HTTP 200).
2. **Backend API Proxy (Google Cloud Run, Railway, Render, Node Container):**
   - Start Command: `npx tsx server/index.ts` or compile via `tsc`
   - Environment Variable: `GEMINI_API_KEY=...`, `PORT=3001`
   - Configure Frontend Proxy: Set `API_BASE` in frontend or configure reverse proxy rewrite (`/api/*` $\to$ backend container).

---

## 9. Post-Deployment Smoke Test Checklist

Once the application is running, perform these 12 manual smoke checks:

| # | Check Description | Verification Procedure | Expected Outcome |
| :-: | :--- | :--- | :--- |
| **1** | **Landing / Home Loads** | Navigate to `http://localhost:5173` (or `4173`) | Page loads with warm ivory & forest green palette; Header Vitals display Kolkata wedding |
| **2** | **Event Switcher** | Click event dropdown in top navigation | Allows switching between events or opening "New Celebration" modal |
| **3** | **Event Creation** | Click "New Celebration", select "Wedding", fill 150 guests, ₹3,00,000, Kolkata | Modal creates new celebration event and switches active context |
| **4** | **Cultural Preferences** | In event creation, select Bengali traditions (*Gaye Holud*, *Saat Paake Ghaura*) | Preferences persist in event profile and reflect in timeline |
| **5** | **Dashboard Vitals** | Inspect Dashboard cards | Displays ₹3,00,000 cap, ₹24,000 contingency (8%), 30 days countdown |
| **6** | **Budget Calculations** | Navigate to "Budget" tab | Itemized ledger balances to ₹3,00,000; status filter tabs function |
| **7** | **Timeline Milestones** | Navigate to "Timeline" tab | Shows multi-day sequence (*Aashirbaad*, *Gaye Holud*, *Saat Paake Ghaura*, *Bou Bhaat*) |
| **8** | **AI Copilot Inquiry** | Click "AI Copilot", ask *"What are my most urgent tasks?"* | Copilot returns context-aware advice with proposed action plan card |
| **9** | **What-If Simulation** | Open "What-If Simulator", set 180 guests, ₹2,40,000 budget | Recalculates total to ₹2,40,000, adjusts contingency to ₹19,200, locks venue deposit |
| **10** | **Apply Revised Plan** | Click "Apply Revised Plan" in simulator | Live budget updates to ₹2,40,000; timeline tasks adjust; audit log records entry |
| **11** | **Error Validation** | Input negative numbers or malformed text in budget item | Inline schema rejects input with clear error message |
| **12** | **BOLA Protection** | Verify non-owner state mutations | Throws `UNAUTHORIZED` and aborts mutation if `userId` does not match |

---

## 10. Rollback Considerations & Emergency Recovery

- **Instant Workspace Reset:** If sample state or local test inputs become corrupted, click **"Reset Workspace"** in the sidebar (or execute `StorageService.resetAllData()` in console). This flushes all local celebration keys and cleanly restores the verified Bengali Wedding showcase dataset.
- **Git Rollback:** The last verified stable release commit is `c0af6b8` on branch `master`. To roll back any uncommitted experimental state:
  ```powershell
  git checkout master
  git clean -fd
  ```

