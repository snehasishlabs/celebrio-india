import React from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MobileNav } from './MobileNav'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

export interface ShellProps {
  children: React.ReactNode
}

export const Shell: React.FC<ShellProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-ivory-100 flex flex-col md:flex-row antialiased text-charcoal-900">
      {/* Mobile Drawer */}
      <MobileNav />

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
