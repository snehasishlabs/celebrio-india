import { useContext } from 'react'
import { PlannerContext, PlannerContextType } from './PlannerContextDef'

export function usePlanner(): PlannerContextType {
  const context = useContext(PlannerContext)
  if (!context) {
    throw new Error('usePlanner must be used within a PlannerProvider')
  }
  return context
}
