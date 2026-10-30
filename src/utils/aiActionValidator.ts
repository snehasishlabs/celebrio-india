import { AIActionProposal } from '@/types/ai'
import { CelebrationEvent } from '@/types/event'
import { sanitizeAmount } from './budgetGuardian'
import { parseSafeDate } from './timelineEngine'

export interface ActionValidationResult {
  isValid: boolean
  errors: string[]
  sanitizedProposal: AIActionProposal
}

/**
 * Validates schema and enforces business rules on an AI-proposed action.
 * PURE FUNCTION: Never mutates state or database.
 * Blocks invalid actions and provides clear diagnostic reasons.
 */
export function validateAIAction(
  proposal: AIActionProposal,
  activeEvent?: CelebrationEvent | null,
): ActionValidationResult {
  const errors: string[] = []
  const p = proposal.payload || {}

  switch (proposal.actionType) {
    case 'CREATE_EVENT': {
      if (!p.title || typeof p.title !== 'string' || !p.title.trim()) {
        errors.push('Event title is required.')
      }
      const budget = sanitizeAmount(p.totalBudget)
      if (budget <= 0) {
        errors.push('Total budget must be a positive number in INR.')
      }
      const guests = Number(p.targetGuestCount)
      if (!Number.isFinite(guests) || guests <= 0 || guests > 50000) {
        errors.push('Target guest count must be between 1 and 50,000.')
      }
      if (p.date && !parseSafeDate(p.date)) {
        errors.push('Event date must be a valid YYYY-MM-DD date string.')
      }
      break
    }

    case 'UPDATE_BUDGET': {
      const newBudget = sanitizeAmount(p.totalBudget ?? p.newBudget)
      if (newBudget <= 0) {
        errors.push('Proposed budget must be greater than zero.')
      }
      if (activeEvent && activeEvent.totalBudget > 0) {
        // Business rule: Check if reduction is more than 80% without explanation
        if (newBudget < activeEvent.totalBudget * 0.15) {
          errors.push('Extreme budget reduction (>85%) requires manual line-item reconciliation.')
        }
      }
      // Business rule: Enforce contingency reserve minimum 8%
      const contingency = sanitizeAmount(p.contingencyAmount ?? newBudget * 0.08)
      if (newBudget > 0 && contingency < newBudget * 0.05) {
        errors.push('Contingency reserve cannot be lower than 5% of the total budget.')
      }
      break
    }

    case 'UPDATE_GUEST_COUNT': {
      const guests = Number(p.newGuestCount ?? p.targetGuestCount ?? p.guestCount)
      if (!Number.isFinite(guests) || guests <= 0 || guests > 50000) {
        errors.push('Guest count must be between 1 and 50,000.')
      }
      break
    }

    case 'ADD_TASK': {
      if (!p.title || typeof p.title !== 'string' || !p.title.trim()) {
        errors.push('Task title is required.')
      }
      if (p.targetDate && !parseSafeDate(p.targetDate)) {
        errors.push('Target deadline must be a valid YYYY-MM-DD date string.')
      }
      const validPriorities = ['critical', 'high', 'medium', 'low']
      if (p.priority && !validPriorities.includes(p.priority)) {
        errors.push(`Priority must be one of: ${validPriorities.join(', ')}`)
      }
      break
    }

    case 'UPDATE_TIMELINE': {
      if (!p.eventDate || !parseSafeDate(p.eventDate)) {
        errors.push('Updated celebration date must be a valid YYYY-MM-DD date.')
      }
      break
    }

    case 'ADD_VENDOR': {
      if (!p.name || typeof p.name !== 'string' || !p.name.trim()) {
        errors.push('Vendor name is required.')
      }
      if (!p.service || typeof p.service !== 'string') {
        errors.push('Vendor service category is required.')
      }
      const cost = sanitizeAmount(p.quotedCost ?? p.estimatedCost ?? 0)
      if (cost < 0) {
        errors.push('Vendor cost cannot be negative.')
      }
      break
    }

    case 'CREATE_WHAT_IF_SCENARIO': {
      const simBudget = sanitizeAmount(p.totalBudget)
      const simGuests = Number(p.guestCount)
      if (simBudget <= 0) {
        errors.push('Scenario simulation budget must be positive.')
      }
      if (!Number.isFinite(simGuests) || simGuests <= 0) {
        errors.push('Scenario simulation guest count must be greater than zero.')
      }
      if (p.eventDate && !parseSafeDate(p.eventDate)) {
        errors.push('Scenario event date must be valid.')
      }
      break
    }

    default:
      errors.push(`Unknown AI action type: ${(proposal as any).actionType}`)
  }

  const isValid = errors.length === 0

  return {
    isValid,
    errors,
    sanitizedProposal: {
      ...proposal,
      validationStatus: isValid ? 'valid' : 'invalid',
      validationErrors: isValid ? undefined : errors,
    },
  }
}

