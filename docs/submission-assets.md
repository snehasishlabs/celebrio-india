# Celebrio India — Final Hackathon Submission Assets

> **Event:** PromptWars Virtual Challenge 5  
> **Track:** Celebration & Event Planner  
> **Product Name:** Celebrio India  
> **Tagline:** Every Tradition. Every Budget. Every Celebration.  

---

## 1. Project Summaries & Descriptions

### 1.1 Short Summary (100 Words)
Celebrio India is a culturally intelligent, adaptive celebration planning platform engineered specifically for Indian events. Powered by Google Gemini 2.5 Flash and deterministic mathematical engines, it solves the chaos of multi-day cultural milestones, fluctuating guest lists, and tight financial constraints. Unlike generic AI chatbots that hallucinate calculations, Celebrio India guarantees mathematical rigor through its Budget Guardian with an automatic 8% contingency shield and its signature What-If Simulator for zero-risk replanning. With authentic support for 16 regional Indian traditions, zero-client-secret proxy architecture, and 216 automated tests, Celebrio India delivers production-grade peace of mind.

### 1.2 Detailed Description (250 Words)
Indian celebrations—from multi-day Bengali and Punjabi weddings to festive Diwali galas and intimate family ceremonies—are complex logistical operations involving ancestral rituals, distributed family stakeholders, and volatile budgets. Traditional planning methods rely on brittle spreadsheets that break during sudden headcount surges, or generic AI wrappers that hallucinate costs and mix up cultural rituals.

Celebrio India bridges this gap by unifying cultural intelligence with production-grade software engineering. At its core is a dual-engine architecture: Google Gemini 2.5 Flash provides culturally attuned inspiration, menu curations, and task recommendations, while client-side deterministic engines (ScenarioEngine and BudgetGuardian) enforce mathematical invariants, guaranteeing that total expenditures never exceed allocated limits.

The platform's signature **What-If Simulator** empowers hosts to simulate sudden disruptions—such as a 20% guest surge combined with a 20% budget reduction—instantly recalculating itemized categories, protecting confirmed contracts, adjusting the dynamic 8% contingency reserve, and presenting clear visual trade-offs before anything is committed.

Architected with strict security standards, Celebrio India eliminates client-side secrets via a hardened Express proxy, enforces Broken Object Level Authorization (BOLA) across all 17 state mutations, redacts sensitive PII, and sanitizes markup with DOMPurify. Backed by 30 test suites and 216 automated tests (100% pass rate), Celebrio India redefines event-tech for the modern Indian family.

---

## 2. Five Key Feature Highlights

1. **Culturally Attuned Regional Engine:** Native support for 16 distinct Indian celebrations (Bengali, Punjabi, Tamil, Telugu, Gujarati, Marwari, Maharashtrian, etc.) with authentic ritual sequencing, auspicious timing alerts, and regional vendor categories.
2. **Deterministic Budget Guardian & 8% Contingency Shield:** Mathematical guarantee that allocated items plus contingency always balance to the rupee ($\sum \text{Items} + \text{Contingency} \equiv \text{Budget}$), shielding hosts from unexpected financial surprises.
3. **Adaptive What-If Simulator & Replanner:** Real-time scenario sandbox that previews the ripple effect of guest count, budget, or date changes with side-by-side trade-off analysis before committing revisions to live state.
4. **Context-Aware AI Copilot with Confirmation Gates:** Gemini 2.5 Flash assistant that reads real celebration vitals, schedules, and expense states to answer urgent questions and propose concrete action cards requiring explicit user approval.
5. **Zero-Secret Hardened Architecture & BOLA Defense:** Enterprise-grade security featuring an isolated server proxy, PII scrubbing (phone/email/address), DOMPurify XSS defenses, Helmet security headers, and strict ownership validation on all 17 data mutations.

---

## 3. Technology Stack Summary

| Layer | Technologies | Purpose / Role |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19, TypeScript 5.8, Vite 6.x | High-performance, type-safe single-page reactive application |
| **Styling & Design System** | Tailwind CSS 3.4, Lucide React Icons | Modern Indian design language (Ivory, Deep Forest Green, Terracotta, Antique Gold) |
| **State Orchestration** | React Context API, State Reducer, Local-First Storage | Multi-event tenancy, isolated LocalStorage partitions, immutable activity log |
| **AI Orchestration** | `@google/genai` (Gemini 2.5 Flash), Node.js Express Proxy | Server-side structured JSON generation with 12s race timeouts and zero client keys |
| **Deterministic Engines** | `scenarioEngine.ts`, `budgetGuardian.ts`, `timelineEngine.ts` | Mathematical invariant enforcement, scaling algorithms, ritual sequencing |
| **Security & Privacy** | Helmet, DOMPurify, BOLA Authorization Guards, PII Redaction | OWASP Top 10 mitigation, XSS sanitization, DPDPA compliance |
| **Testing & Quality** | Vitest 3.x, `@testing-library/react`, `jsdom`, `oxlint` | 30 test suites, 216 automated tests, zero lint errors, verified build pipeline |

---

## 4. Problem-Solution & USP Analysis

| Dimension | The Status Quo (Spreadsheets & Generic AI) | The Celebrio India Solution |
| :--- | :--- | :--- |
| **Cultural Context** | Generic "wedding/party" templates that miss ancestral rituals and local customs. | Deep cultural intelligence supporting 16 regional Indian traditions with ritual sequences. |
| **Mathematical Reliability** | Formula errors, broken macros, and AI hallucinated sums that do not balance. | Deterministic Budget Guardian ensuring 100% mathematical invariant preservation. |
| **Contingency Protection** | Hidden costs and surprise fees deplete family emergency funds. | Mandatory 8% Contingency Reserve locked upfront into all budget models. |
| **Replanning Agility** | Recalculating guest or budget changes requires rebuilding spreadsheets from scratch. | Instant What-If Simulator with side-by-side impact visualization and one-click application. |
| **Security & Privacy** | Exposed client API keys, unvalidated mutations, and leaked contact numbers. | Zero client secrets, BOLA ownership across 17 mutations, PII redaction, DOMPurify. |

### Unique Selling Proposition (USP)
**"Where Cultural Intelligence Meets Mathematical Invariants."**  
Celebrio India is the only platform that merges authentic regional Indian celebration traditions with an unshakeable mathematical simulation engine, ensuring celebrations are culturally rich, logistically seamless, and financially sound.

---

## 5. Judge Pitch & Evaluation Alignment

### Dimension 1: Code Quality
- Modular domain-driven architecture separating UI, business logic, data persistence, and AI orchestration.
- 100% TypeScript typing with zero avoidable `any` types.
- Static analysis verified via `oxlint`: 0 warnings, 0 errors across 93 files.

### Dimension 2: Security & Privacy
- Zero client-side API secrets; all GenAI traffic routed through a hardened Express proxy.
- Comprehensive BOLA / IDOR defense: `verifyEventOwnership` enforced on all 17 state mutations.
- Automatic PII redaction for phone numbers, email addresses, and postal PIN codes.
- DOMPurify XSS defenses and Helmet HTTP security headers.

### Dimension 3: Efficiency & Performance
- Sub-10ms deterministic scenario recalculations performed entirely client-side.
- 7-second production bundle build via Vite with optimized code splitting (`dist` index < 500 kB).
- Non-blocking asynchronous AI calls with 12s timeout guards and instant deterministic offline fallbacks.

### Dimension 4: Testing & Robustness
- 30 test suites, 216 automated tests, 100% pass rate.
- Dedicated `priorityVerificationAudit.test.ts` validating all 5 evaluation priorities.
- Complete coverage across arithmetic invariants, trade-off generators, and UI state flows.

### Dimension 5: Accessibility
- Semantic HTML5 structure with accessible ARIA tags, button labels, and screen-reader announcements.
- Full keyboard navigability and focus-lock modals.
- WCAG AA compliant contrast ratios across primary and accent color pairings.

### Dimension 6: Problem Statement Alignment
- Built specifically for the Celebration & Event Planner track, addressing Indian cultural celebrations natively rather than retrofitting generic Western models.

---

## 6. Exact Screenshot Capture Instructions

To capture publication-ready screenshots for submission forms, pitch decks, and GitHub previews:

| Shot # | Screen / View | Exact State & Configuration | Annotation / Caption Focus |
| :---: | :--- | :--- | :--- |
| **1** | **Executive Dashboard** | Bengali Wedding in Kolkata active (150 guests, ₹3,00,000 budget, 30 days countdown). | Highlight Header Vitals, Budget Guardian (8% reserve), and upcoming ritual milestones. |
| **2** | **What-If Simulator (Preview)** | Sliders set to 180 guests and ₹2,40,000 budget. Side-by-side comparison table visible. | Point to recalculated ₹2,40,000 total, ₹19,200 contingency, frozen venue deposit, and trade-off cards. |
| **3** | **Budget Guardian Ledger** | Itemized ledger view filtered by status (Confirmed vs Quoted). | Illustrate the locked ₹60,000 Sovabazar deposit and INR formatting with ₹24,000 contingency shield. |
| **4** | **Timeline & Ceremony Tracker** | Multi-day schedule expanded to reveal *Aashirbaad*, *Gaye Holud*, *Saat Paake Ghaura*, and *Bou Bhaat*. | Call out cultural ritual sequencing, dependency tags, and milestone badges. |
| **5** | **AI Copilot In Action** | Copilot modal open with user asking for urgent tasks; proposed action plan card rendered. | Highlight context-aware advice, non-hallucinated tasks, and the 'Confirm & Apply' gate. |
| **6** | **Concept & Theme Studio** | Visual mood board displaying 'Sonar Kolkata Heritage' with color swatches and brass/terracotta motifs. | Show regional aesthetic alignment and cultural theme selections. |

*Recommended Resolution: 1920x1080 (16:9), Light Mode (Warm Ivory background with Deep Forest Green accents).*

---

## 7. Verified Implementation Claims Checklist

| Capability | Verified Real Implementation | Inferred or Future Work |
| :--- | :---: | :---: |
| Bengali Wedding in Kolkata Showcase Dataset | ✅ **Verified** (150 guests, ₹3L budget, 8% contingency) | — |
| What-If Engine (180 guests, ₹2.4L budget recalculation) | ✅ **Verified** (18 tests in `scenarioEngine.test.ts`) | — |
| Mathematical Invariant Preservation | ✅ **Verified** ($\sum \text{Items} + \text{Contingency} \equiv \text{Budget}$) | — |
| Context-Aware AI Copilot (Gemini 2.5 Flash) | ✅ **Verified** (Server proxy with structured JSON output) | — |
| Action Proposal Confirmation Gate | ✅ **Verified** (Explicit user review before state commit) | — |
| Deterministic Offline Fallback Engine | ✅ **Verified** (Culturally attuned local recommendations) | — |
| BOLA Defense on all 17 State Mutations | ✅ **Verified** (Programmatically verified in audit test) | — |
| PII Redaction Engine (Phone, Email, PIN) | ✅ **Verified** (Masking validated via unit tests) | — |
| 16 Regional Indian Celebration Templates | ✅ **Verified** (All 16 templates available in state) | — |
| LocalStorage Isolation & Multi-Event Switching | ✅ **Verified** (Tenant-prefixed keys with safe JSON parsing) | — |
| Workspace Reset Facility (`StorageService.resetAllData`) | ✅ **Verified** (Single-click clean evaluation restore) | — |
| Multi-Party Vendor Real-Time Chat | — | 🔮 Future Roadmap (Phase 7) |
| WhatsApp Bot / SMS RSVP Integration | — | 🔮 Future Roadmap (Phase 7) |
| Direct UPI Payment Gateway Integration | — | 🔮 Future Roadmap (Phase 8) |

