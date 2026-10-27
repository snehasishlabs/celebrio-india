import {
  LayoutDashboard,
  CalendarDays,
  Coins,
  Clock,
  Briefcase,
  SlidersHorizontal,
  Settings,
} from 'lucide-react'
import { NavSection } from '@/types/navigation'

export interface NavItemDef {
  id: NavSection
  label: string
  description: string
  icon: typeof LayoutDashboard
  badge?: string
}

export const NAVIGATION_ITEMS: NavItemDef[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Sync status & celebration vitals',
    icon: LayoutDashboard,
  },
  {
    id: 'events',
    label: 'My Events',
    description: 'Portfolio & celebration setup',
    icon: CalendarDays,
  },
  {
    id: 'budget',
    label: 'Budget Planner',
    description: 'Cashflow, variance & contingency',
    icon: Coins,
  },
  {
    id: 'timeline',
    label: 'Timeline',
    description: 'Milestones & critical path',
    icon: Clock,
  },
  {
    id: 'vendors',
    label: 'Vendors',
    description: 'Contracts, deposits & curation',
    icon: Briefcase,
  },
  {
    id: 'simulator',
    label: 'What-If Simulator',
    description: 'Adaptive contingency stress-testing',
    icon: SlidersHorizontal,
    badge: 'Adaptive',
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Workspace preferences & backup',
    icon: Settings,
  },
]

