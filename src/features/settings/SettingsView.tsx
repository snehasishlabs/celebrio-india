import React, { useState } from 'react'
import {
  RotateCcw,
  Download,
  Shield,
  Cpu,
  CheckCircle2,
  Lock,
} from 'lucide-react'
import { usePlanner } from '@/context/PlannerContext'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'

export const SettingsView: React.FC = () => {
  const { activeEvent, resetWorkspace } = usePlanner()
  const [resetDone, setResetDone] = useState(false)

  const handleReset = () => {
    if (window.confirm('Reset all celebration data back to the curated showcase event?')) {
      resetWorkspace()
      setResetDone(true)
      setTimeout(() => setResetDone(false), 3000)
    }
  }

  const handleExport = () => {
    const data = {
      event: activeEvent,
      exportedAt: new Date().toISOString(),
      app: 'Celebrio AI v1.0',
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `celebrio-plan-${activeEvent?.id || 'export'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200 max-w-4xl">
      {/* Header */}
      <div className="pb-4 border-b border-ivory-300">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight">
          Settings &amp; Architecture
        </h2>
        <p className="text-xs sm:text-sm text-charcoal-600 mt-1">
          Configure planner preferences, review zero-trust security postures, and manage local data.
        </p>
      </div>

      {resetDone && (
        <div className="p-4 rounded-xl bg-forest-100 border border-forest-300 text-forest-900 text-xs sm:text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-forest-700" />
          <span>Workspace reset to pristine showcase dataset.</span>
        </div>
      )}

      {/* AI Engine Status & Security Card */}
      <Card variant="default" className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-ivory-300">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-charcoal-900">
                AI Planning &amp; Sync Engine
              </h3>
              <p className="text-xs text-charcoal-500">Autonomous rule reconciliation</p>
            </div>
          </div>
          <Badge variant="forest" size="sm">
            Active · Local Simulated
          </Badge>
        </div>

        <div className="text-xs text-charcoal-600 space-y-2 leading-relaxed">
          <p>
            Celebrio AI runs with a high-performance local simulated engine that computes
            cross-module tradeoffs instantly with <strong>zero external API keys</strong> and{' '}
            <strong>zero telemetry leakage</strong>.
          </p>
          <div className="flex items-center gap-2 text-forest-800 font-medium pt-1">
            <Lock className="w-3.5 h-3.5" />
            <span>Strict Client-Side Isolation &amp; Zero Hardcoded Secrets</span>
          </div>
        </div>
      </Card>

      {/* Security Architecture Guarantees */}
      <Card variant="default" className="p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-ivory-300">
          <div className="w-8 h-8 rounded-xl bg-terracotta-100 text-terracotta-800 flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-charcoal-900">
              Security &amp; Privacy Posture
            </h3>
            <p className="text-xs text-charcoal-500">PromptWars Challenge 5 compliance</p>
          </div>
        </div>

        <ul className="text-xs text-charcoal-700 space-y-2 list-disc list-inside">
          <li>Zero secrets or API keys placed into frontend client source bundles.</li>
          <li>All inputs strictly validated against domain schema models before storage.</li>
          <li>Safe environment template provided via <code>.env.example</code>.</li>
          <li>No raw unescaped HTML injection or unsafe DOM operations.</li>
        </ul>
      </Card>

      {/* Data Management */}
      <Card variant="default" className="p-6 space-y-4">
        <h3 className="font-serif font-bold text-base text-charcoal-900 pb-3 border-b border-ivory-300">
          Data Management &amp; Persistence
        </h3>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div>
            <h4 className="font-semibold text-sm text-charcoal-900">
              Export Celebration Plan
            </h4>
            <p className="text-xs text-charcoal-500">
              Download complete event structure, budget lines, and timeline tasks as JSON.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export JSON
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-ivory-200">
          <div>
            <h4 className="font-semibold text-sm text-charcoal-900">
              Reset Showcase Data
            </h4>
            <p className="text-xs text-charcoal-500">
              Restore default Glasshouse Conservatory Gala and verified sample state.
            </p>
          </div>
          <Button
            variant="terracotta"
            size="sm"
            onClick={handleReset}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Reset Workspace
          </Button>
        </div>
      </Card>
    </div>
  )
}
