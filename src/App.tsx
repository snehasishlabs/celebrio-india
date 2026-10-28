import React from 'react'
import { PlannerProvider, usePlanner } from '@/context/PlannerContext'
import { Shell } from '@/components/layout/Shell'
import { LandingWelcomeView } from '@/features/landing/LandingWelcomeView'
import { DashboardView } from '@/features/dashboard/DashboardView'
import { EventsView } from '@/features/events/EventsView'
import { BudgetView } from '@/features/budget/BudgetView'
import { TimelineView } from '@/features/timeline/TimelineView'
import { VendorsView } from '@/features/vendors/VendorsView'
import { SimulatorView } from '@/features/simulator/SimulatorView'
import { SettingsView } from '@/features/settings/SettingsView'

const MainContent: React.FC = () => {
  const { currentSection } = usePlanner()

  switch (currentSection) {
    case 'landing':
      return <LandingWelcomeView />
    case 'dashboard':
      return <DashboardView />
    case 'events':
      return <EventsView />
    case 'budget':
      return <BudgetView />
    case 'timeline':
      return <TimelineView />
    case 'vendors':
      return <VendorsView />
    case 'simulator':
      return <SimulatorView />
    case 'settings':
      return <SettingsView />
    default:
      return <DashboardView />
  }
}

export function App() {
  return (
    <PlannerProvider>
      <Shell>
        <MainContent />
      </Shell>
    </PlannerProvider>
  )
}

export default App
