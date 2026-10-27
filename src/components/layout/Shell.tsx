import React from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MobileNav } from './MobileNav'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { CreateEventModal } from '@/features/events/CreateEventModal'
import { usePlanner } from '@/context/PlannerContext'

export interface ShellProps {
  children: React.ReactNode
}

export const Shell: React.FC<ShellProps> = ({ children }) => {
  const { isCreateEventOpen, setIsCreateEventOpen } = usePlanner()

  return (
    <div className="min-h-screen bg-ivory-100 flex flex-col md:flex-row antialiased text-charcoal-900">
      {/* Skip to Main Content Link for Screen Readers & Keyboard Navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-forest-900 focus:text-gold-300 focus:rounded-xl focus:shadow-elevated focus:outline-none focus:ring-2 focus:ring-gold-400 font-semibold text-xs"
      >
        Skip to main content
      </a>

      {/* Event Creator Modal */}
      <CreateEventModal
        isOpen={isCreateEventOpen}
        onClose={() => setIsCreateEventOpen(false)}
      />

      {/* Mobile Drawer */}
      <MobileNav />

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main id="main-content" tabIndex={-1} className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto outline-none">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
