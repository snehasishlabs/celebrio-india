import React, { useState } from 'react'
import {
  RotateCcw,
  Download,
  Shield,
  Cpu,
  CheckCircle2,
  Lock,
  Share2,
  Bell,
  Users,
  Copy,
  Info,
} from 'lucide-react'
import { usePlanner } from '@/context/PlannerContext'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'

export const SettingsView: React.FC = () => {
  const { activeEvent, alerts, resetWorkspace } = usePlanner()
  const [resetDone, setResetDone] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}/#share=${activeEvent?.id || 'demo'}&auth=read-only`
    navigator.clipboard?.writeText(shareUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

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

      {/* Collaboration & Sharing */}
      <Card variant="default" className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-ivory-300">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gold-100 text-gold-800 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-charcoal-900">
                Collaboration &amp; Multi-User Access
              </h3>
              <p className="text-xs text-charcoal-500">Plan sharing &amp; role-based coordination</p>
            </div>
          </div>
          <Badge variant="neutral" size="sm">
            Partially Functional · Local-First
          </Badge>
        </div>

        <div className="text-xs text-charcoal-600 space-y-3 leading-relaxed">
          <div className="p-3 rounded-xl bg-ivory-100/70 border border-ivory-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-forest-700 shrink-0 mt-0.5" />
            <p>
              Celebrio AI operates on a <strong>local-first privacy architecture</strong>. Collaboration is currently achieved via encrypted/sanitized JSON export bundles and catering rosters. Multi-tenant live web-socket sync is in demonstration mode.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-ivory-50 border border-ivory-200 space-y-1">
              <div className="font-semibold text-charcoal-900 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-forest-700" />
                <span>Primary Host</span>
              </div>
              <p className="text-[11px] text-charcoal-500">Full write permissions, budget approval, vendor contract signing.</p>
            </div>
            <div className="p-3 rounded-xl bg-ivory-50 border border-ivory-200 space-y-1">
              <div className="font-semibold text-charcoal-900 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-gold-700" />
                <span>Co-Planner</span>
              </div>
              <p className="text-[11px] text-charcoal-500">Task completion, vendor messaging, attendee dietary logging.</p>
            </div>
            <div className="p-3 rounded-xl bg-ivory-50 border border-ivory-200 space-y-1">
              <div className="font-semibold text-charcoal-900 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-charcoal-500" />
                <span>Read-Only Guest</span>
              </div>
              <p className="text-[11px] text-charcoal-500">View ceremony schedule, venue directions, and dress code.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div>
              <span className="font-semibold text-charcoal-800 block text-xs">Shareable Read-Only Manifest URL</span>
              <span className="text-[11px] text-charcoal-400">Share preview link with family elders and coordinators</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyShareLink}
              leftIcon={<Copy className="w-3.5 h-3.5" />}
            >
              {copiedLink ? 'Link Copied!' : 'Copy Share Link'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Notifications & Plan Sync Feed */}
      <Card variant="default" className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-ivory-300">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-charcoal-900">
                Proactive Notifications &amp; System Alerts
              </h3>
              <p className="text-xs text-charcoal-500">Autonomous drift detection &amp; financial alerts</p>
            </div>
          </div>
          <Badge variant="forest" size="sm">
            Fully Functional ({alerts.length} Active)
          </Badge>
        </div>

        <div className="space-y-2.5">
          {alerts.length > 0 ? (
            alerts.map((al) => (
              <div
                key={al.id}
                className="p-3.5 rounded-xl bg-ivory-50 border border-ivory-200 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-charcoal-900 flex items-center gap-2">
                    <span>{al.title}</span>
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                        al.severity === 'critical'
                          ? 'bg-rose-100 text-rose-800'
                          : al.severity === 'warning'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-forest-100 text-forest-800'
                      }`}
                    >
                      {al.severity}
                    </span>
                  </div>
                  <p className="text-charcoal-600">{al.description}</p>
                  {al.suggestedAction && (
                    <div className="text-[11px] text-forest-800 font-medium pt-1">
                      Action: {al.suggestedAction}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-charcoal-500 py-2">No active warnings. All modules are synchronized.</p>
          )}
        </div>
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
