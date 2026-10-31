# Celebrio India — AI Planning Architecture & GenAI Integration

> **Core Promise:** Culturally Attuned, Context-Aware, Safe Celebration Intelligence  
> **Primary Model:** Google Gemini 2.5 Flash via `@google/genai` (Proxy-Isolated)  
> **Architecture Pattern:** Server-Side Proxy + Structured JSON Output + User Confirmation Gates  

---

## 1. AI System Overview

Generic AI chatbots fail at real-world celebration planning because they suffer from:
1. **Arithmetic Drift:** Hallucinating cost sums that do not balance.
2. **Context Blindness:** Forgetting confirmed bookings and signed supplier advances.
3. **Cultural Inaccuracy:** Mixing rituals across distinct regional traditions.
4. **Dangerous Automation:** Mutating user plans without explicit approval.

Celebrio India's AI Copilot and Concept Studio solve this by combining **Generative AI creativity** with **deterministic mathematical guardians**:

```mermaid
flowchart TD
    UserQuery["User Input / Prompt Query<br/>(e.g., 'Plan celebration within ₹2 Lakh')"] --> Modal["AICopilotModal (Client)"]
    ContextBuilder["Active Celebration Context Builder<br/>(City, Budget, Guests, Rituals, Urgent Tasks, Ledger)"] --> Modal
    Modal -->|HTTPS POST (Sanitized)| Proxy["/api/copilot/explain-urgent-tasks (Server Gateway)"]
    Proxy --> GeminiEngine["Gemini 2.5 Flash Planning Engine"]
    GeminiEngine -->|Output Verification| Parser["JSON Cleaner & Schema Validator"]
    Parser --> ActionValidator["AI Action Proposal Validator<br/>(Budget Invariants & Non-Negative Clamping)"]
    ActionValidator --> ResponseModal["Copilot Response + Proposed Action Card"]
    ResponseModal -->|User Reviews & Clicks 'Confirm & Apply'| ExecutionGate["PlannerContext.applyAIProposal()"]
    ExecutionGate --> LiveState["Live Event State & Storage Commit"]
```

---

## 2. Server-Side Proxy & Zero Client Secrets

To ensure strict production security:
- **Zero Client-Side Keys:** No `VITE_GEMINI_API_KEY` exists in frontend bundles. The client communicates strictly with the backend proxy (`/api/plan/generate-concepts`, `/api/copilot/explain-urgent-tasks`, `/api/plan/explain-tradeoffs`).
- **Server Environment:** The server loads `GEMINI_API_KEY` securely from server environment variables via `dotenv`.
- **Telemetry & Timeout Shield:** All live model invocations are wrapped in a 12,000ms race condition with automatic abort controllers:
  ```typescript
  const response = await Promise.race([
    ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json', temperature: 0.5 },
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI_TIMEOUT')), 12000),
    ),
  ])
  ```

---

## 3. Context Construction

Whenever a user opens the AI Copilot or submits a query, Celebrio India constructs a compact, high-density context payload:

```typescript
const payload: AICopilotTaskAdviceRequest = {
  eventId: activeEvent.id,
  eventTitle: activeEvent.title,
  category: activeEvent.category,
  city: activeEvent.location?.city,
  eventDate: activeEvent.date,
  targetGuestCount: activeEvent.targetGuestCount,
  totalBudget: activeEvent.totalBudget,
  currency: activeEvent.currency,
  traditions: activeEvent.culturalPreferences?.selectedCeremonies,
  urgentTasks: topUrgentTasks.map(t => ({
    id: t.id,
    title: t.title,
    deadline: t.deadline,
    isCriticalPath: t.isCriticalPath,
    priority: t.priority,
    status: t.status,
  })),
  budgetItems: budgetItems.map(b => ({
    category: b.category,
    allocatedAmount: b.allocatedAmount,
    costStatus: b.costStatus,
  })),
  query: userQuery,
}
```

### Context Privacy Redaction
To prevent accidental data exposure:
- Attendee contact details (phone numbers, emails) are **never** included in AI prompts.
- Only aggregated headcount, dietary category totals, and supplier services are shared with the model.

---

## 4. Structured Output Schemas & Action Proposals

The model is strictly constrained to return valid JSON matching the `AICopilotTaskAdviceResponse` schema:

```json
{
  "headline": "Strategic Optimization for Ananya & Debashis Bengali Wedding",
  "strategicSummary": "Recalculated plan preserving all sacred rituals while safeguarding the 8% contingency reserve...",
  "urgentTaskAnalyses": [
    {
      "taskId": "task-venue-retainer",
      "taskTitle": "Disburse Sovabazar Rajbari Advance Retainer",
      "urgencyLevel": "critical",
      "daysUntilDeadline": 4,
      "whyItMatters": "Historic venues book up rapidly in Kolkata winter muhurat windows...",
      "recommendedAction": "Disburse retainer to lock physical access...",
      "culturalContext": "Courtyard provides authentic open-air thakur-dalan ambiance for Gaye Holud."
    }
  ],
  "traditionAdvisories": [
    "Confirm sweet halwai has mobile steaming karahis for warm Rosogollas.",
    "Schedule Gaye Holud morning turmeric staging with natural sunlight."
  ],
  "budgetGuidance": "Maintain ₹24,000 (8%) contingency buffer against guest surge.",
  "suggestedNextSteps": [
    "Review the proposed budget adjustment below.",
    "Confirm live buffet layout with catering supervisor."
  ],
  "clarifyingQuestion": "Would you prefer synchronized sit-down banana-leaf service or a live buffet format?",
  "proposedAction": {
    "actionType": "UPDATE_BUDGET",
    "title": "Set ₹2,00,000 Budget Cap",
    "explanation": "Synchronize event budget to ₹2,00,000 with ₹16,000 protected contingency.",
    "impactSummary": "Adjusts category allocations proportionally while guaranteeing 8% reserve.",
    "requiresConfirmation": true,
    "payload": {
      "totalBudget": 200000,
      "contingencyReserve": 16000
    }
  }
}
```

---

## 5. User Confirmation Gates

Celebrio India enforces a strict policy: **The AI is an advisor, never an unchecked actor.**

1. **Card Presentation:** If the AI suggests an actionable change (rescheduling dates, cutting budget, simulating guest surge, adding milestones), it emits a structured `proposedAction`.
2. **Review Dialog:** The UI presents the user with an explicit action card displaying:
   - Action Type and Title
   - Concrete Impact Summary
   - Pre-filled parameters
3. **Explicit Execution:** The user must explicitly click `"Apply AI Proposal"`. If dismissed or cancelled, the celebration state remains 100% unaltered.

---

## 6. Deterministic Offline Fallback Engine

To guarantee 100% reliability during offline hackathon demonstrations, poor network connectivity, or missing API keys, `server/geminiService.ts` and `src/services/ai/aiPlanningService.ts` include deterministic evaluation handlers:

- **Query:** *"Plan my celebration within ₹2 lakh"* → Generates itemized 2 Lakh allocation (32% catering, 28% venue, 13% decor, 8% photo, 11% sundries, 8% contingency ₹16,000) and `UPDATE_BUDGET` proposal.
- **Query:** *"What are my 5 most urgent pending tasks?"* → Evaluates critical path deadlines and returns prioritized roadmap with cultural notes.
- **Query:** *"Suggest affordable Bengali food options"* → Recommends traditional high-reputation cost-saving dishes (Aam Pora Shorbot, Postor Bora, Lucchi, Rui Machher Kalia, Rosogolla handis) reducing catering spend by 30%.
- **Query:** *"Reduce decoration costs without compromising theme"* → Suggests seasonal marigold, brass urlis, and earthen diyas.
- **Query:** *"What happens if 50 more guests attend?"* → Dynamically parses guest surge (150 → 200), calculates per-plate scaling, and warns of venue hall limits.
- **Query:** *"Explain why my budget is exceeding the limit"* → Delivers line-item overspend diagnostics without touching the protected 8% contingency buffer.

