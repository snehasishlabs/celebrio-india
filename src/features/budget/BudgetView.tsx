import React, { useState } from 'react'
import {
  Plus,
  ShieldCheck,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit2,
  TrendingDown,
  Sparkles,
  PieChart,
} from 'lucide-react'
import { usePlanner } from '@/context/PlannerContext'
import { BudgetItem, BudgetCategory, CostStatus, PaymentStatus } from '@/types/budget'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import {
  calculateBudgetSummary,
  formatCurrency,
  generateCostSavingAlternatives,
  getCategoryDisplayName,
  normalizeCategory,
  STANDARD_CATEGORIES,
} from '@/utils/budgetGuardian'

export const BudgetView: React.FC = () => {
  const {
    activeEvent,
    budgetItems,
    addBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,
    applyCostSavingAlternative,
    setCurrentSection,
  } = usePlanner()

  // Modal / Form state for Add or Edit
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<BudgetCategory>('catering')
  const [costStatus, setCostStatus] = useState<CostStatus>('estimated')
  const [allocatedAmount, setAllocatedAmount] = useState('2500')
  const [actualAmount, setActualAmount] = useState('2500')
  const [paidAmount, setPaidAmount] = useState('0')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('planned')
  const [notes, setNotes] = useState('')
  const [isContingency, setIsContingency] = useState(false)
  const [formError, setFormError] = useState('')

  // Filter state for line items
  const [statusFilter, setStatusFilter] = useState<'all' | CostStatus>('all')

  if (!activeEvent) return null

  const currency = activeEvent.currency || 'USD'
  const summary = calculateBudgetSummary(activeEvent.totalBudget, budgetItems)
  const alternatives = generateCostSavingAlternatives(activeEvent.totalBudget, budgetItems)

  const openAddModal = () => {
    setEditingItemId(null)
    setName('')
    setCategory('catering')
    setCostStatus('estimated')
    setAllocatedAmount('2500')
    setActualAmount('2500')
    setPaidAmount('0')
    setPaymentStatus('planned')
    setNotes('')
    setIsContingency(false)
    setFormError('')
    setIsModalOpen(true)
  }

  const openEditModal = (item: BudgetItem) => {
    setEditingItemId(item.id)
    setName(item.name)
    setCategory(normalizeCategory(item.category))
    setCostStatus(item.costStatus || 'estimated')
    setAllocatedAmount(item.allocatedAmount.toString())
    setActualAmount(item.actualAmount.toString())
    setPaidAmount(item.paidAmount.toString())
    setPaymentStatus(item.paymentStatus || 'planned')
    setNotes(item.notes || '')
    setIsContingency(item.isContingency || item.category === 'contingency')
    setFormError('')
    setIsModalOpen(true)
  }

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setFormError('Item name is required.')
      return
    }

    const alloc = parseFloat(allocatedAmount)
    if (isNaN(alloc) || alloc < 0) {
      setFormError('Allocated amount must be a non-negative number.')
      return
    }

    const act = parseFloat(actualAmount) || alloc
    const pd = parseFloat(paidAmount) || 0

    const itemCategory = isContingency ? 'contingency' : category

    if (editingItemId) {
      updateBudgetItem(editingItemId, {
        name: name.trim(),
        category: itemCategory,
        costStatus,
        allocatedAmount: alloc,
        actualAmount: act,
        paidAmount: pd,
        paymentStatus,
        notes: notes.trim() || undefined,
        isContingency,
      })
    } else {
      addBudgetItem({
        name: name.trim(),
        category: itemCategory,
        costStatus,
        estimatedAmount: costStatus === 'estimated' ? alloc : alloc,
        quotedAmount: costStatus === 'quoted' ? alloc : alloc,
        confirmedAmount: costStatus === 'confirmed' ? alloc : 0,
        allocatedAmount: alloc,
        actualAmount: act,
        paidAmount: pd,
        paymentStatus,
        notes: notes.trim() || undefined,
        isContingency,
      })
    }

    setIsModalOpen(false)
  }

  const handleDelete = (id: string, itemName: string) => {
    if (window.confirm(`Are you sure you want to remove "${itemName}" from the budget?`)) {
      deleteBudgetItem(id)
    }
  }

  const handleApplyAlternative = (alt: (typeof alternatives)[0]) => {
    if (
      window.confirm(
        `Apply cost optimization for "${alt.title}"?\n\nThis will adjust allocation from ${formatCurrency(
          alt.currentAmount,
          currency,
        )} to ${formatCurrency(alt.suggestedAmount, currency)}, saving ${formatCurrency(
          alt.estimatedSavings,
          currency,
        )}.`,
      )
    ) {
      applyCostSavingAlternative(alt.itemId, alt.suggestedAmount, alt.title)
    }
  }

  const filteredItems = budgetItems.filter((item) => {
    if (statusFilter === 'all') return true
    return (item.costStatus || 'estimated') === statusFilter
  })

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ivory-300">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs uppercase tracking-wider font-semibold text-forest-800 bg-forest-100 px-2.5 py-0.5 rounded-full border border-forest-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-forest-700" />
              Deterministic Budget Guardian
            </span>
            <span className="text-xs text-charcoal-500 font-mono">
              Currency: {currency}
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight">
            Itemized Celebration Budget
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-600 mt-1 max-w-2xl">
            Deterministic allocation accounting. Total budget limits, planned expenditures, and protected
            contingency reserves are reconciled in real time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCurrentSection('simulator')}
            rightIcon={<ArrowUpRight className="w-4 h-4" />}
          >
            What-If Simulator
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={openAddModal}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Line Item
          </Button>
        </div>
      </div>

      {/* 2. Over-Budget & Critical Infeasibility Warnings Banner */}
      {summary.warnings.length > 0 && (
        <div className="space-y-3">
          {summary.warnings.map((warn) => (
            <div
              key={warn.id}
              className={`p-4 sm:p-5 rounded-2xl border flex items-start gap-3.5 text-xs sm:text-sm ${
                warn.severity === 'critical'
                  ? 'bg-rose-50/90 border-rose-300 text-rose-950'
                  : warn.severity === 'warning'
                  ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                  : 'bg-ivory-50 border-ivory-300 text-charcoal-800'
              }`}
              role="alert"
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  warn.severity === 'critical'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm mb-0.5">{warn.title}</div>
                <p className="leading-relaxed">{warn.description}</p>
                {warn.recommendedAction && (
                  <div className="mt-2 font-semibold text-xs flex items-center gap-1.5 opacity-90">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Action: {warn.recommendedAction}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Core Vitals Grid (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Budget */}
        <Card variant="default" className="p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block mb-1">
              Total Budget Cap
            </span>
            <div className="font-serif text-2xl font-bold text-charcoal-900">
              {formatCurrency(summary.totalBudget, currency)}
            </div>
            <p className="text-xs text-charcoal-500 mt-1">Spending ceiling limit</p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-ivory-200 text-[11px] text-charcoal-500">
            Limit baseline: 100%
          </div>
        </Card>

        {/* Card 2: Planned Expenditure */}
        <Card variant="default" className="p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block mb-1">
              Planned Spending
            </span>
            <div className="font-serif text-2xl font-bold text-charcoal-900">
              {formatCurrency(summary.plannedExpenditure, currency)}
            </div>
            <p className="text-xs text-charcoal-500 mt-1">Non-contingency lines</p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-ivory-200 text-[11px] text-charcoal-500">
            Difference: {formatCurrency(summary.differenceFromLimit, currency)} from limit
          </div>
        </Card>

        {/* Card 3: Contingency Reserve */}
        <Card variant="default" className="p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block mb-1">
              Contingency Reserve
            </span>
            <div className="font-serif text-2xl font-bold text-gold-700">
              {formatCurrency(summary.contingencyReserve, currency)}
            </div>
            <p className="text-xs text-charcoal-500 mt-1">
              {summary.totalBudget > 0
                ? `${((summary.contingencyReserve / summary.totalBudget) * 100).toFixed(1)}% safe buffer`
                : 'Buffer reserve'}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-ivory-200 text-[11px] text-forest-700 font-medium">
            Separately allocated
          </div>
        </Card>

        {/* Card 4: Remaining Balance */}
        <Card variant="default" className="p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block mb-1">
              Remaining Balance
            </span>
            <div
              className={`font-serif text-2xl font-bold ${
                summary.remainingBalance < 0
                  ? 'text-rose-700'
                  : 'text-forest-800'
              }`}
            >
              {formatCurrency(summary.remainingBalance, currency)}
            </div>
            <p className="text-xs text-charcoal-500 mt-1">
              {summary.remainingBalance >= 0 ? 'Unallocated headroom' : 'Deficit overspend'}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-ivory-200 text-[11px] text-charcoal-500">
            Total Req: {formatCurrency(summary.totalCommittedPlanned, currency)}
          </div>
        </Card>

        {/* Card 5: Actual / Committed Spending */}
        <Card variant="default" className="p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block mb-1">
              Committed / Paid
            </span>
            <div className="font-serif text-2xl font-bold text-charcoal-900">
              {formatCurrency(summary.actualSpent, currency)}
            </div>
            <p className="text-xs text-charcoal-500 mt-1">
              {formatCurrency(summary.disbursedPaid, currency)} disbursed
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-ivory-200 text-[11px] text-forest-700 font-medium">
            Verified vendor lines
          </div>
        </Card>
      </div>

      {/* 4. Visual Progress & Category Percentages */}
      <Card variant="default" className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-forest-700" />
            <h3 className="font-serif font-bold text-base text-charcoal-900">
              Category Distribution &amp; Spending Cap Share
            </h3>
          </div>
          <span className="text-xs font-semibold text-charcoal-600">
            Allocated: {summary.allocationPercentage}% of Total Spending Limit
          </span>
        </div>

        {/* Multi-segment allocation bar */}
        <div className="w-full h-3 bg-ivory-200 rounded-full overflow-hidden flex shadow-inner">
          {summary.categories.map((cat, idx) => {
            const colors = [
              'bg-forest-700',
              'bg-terracotta-500',
              'bg-gold-500',
              'bg-emerald-600',
              'bg-amber-600',
              'bg-teal-700',
              'bg-stone-500',
            ]
            const colorClass = colors[idx % colors.length]
            return (
              <div
                key={cat.category}
                style={{ width: `${Math.min(100, cat.percentageOfTotal)}%` }}
                className={`${colorClass} h-full transition-all duration-300`}
                title={`${cat.displayName}: ${formatCurrency(
                  cat.allocatedAmount,
                  currency,
                )} (${cat.percentageOfTotal}%)`}
              />
            )
          })}
        </div>

        {/* Category Percentages Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {summary.categories.map((cat) => (
            <div
              key={cat.category}
              className="p-3 rounded-xl bg-ivory-100/70 border border-ivory-200 text-xs flex flex-col justify-between"
            >
              <div>
                <span className="font-bold text-charcoal-800 block truncate">
                  {cat.displayName}
                </span>
                <span className="text-[11px] text-charcoal-500 block">
                  {cat.itemCount} line {cat.itemCount === 1 ? 'item' : 'items'}
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-ivory-200/80 flex items-baseline justify-between">
                <span className="font-serif font-bold text-charcoal-900">
                  {formatCurrency(cat.allocatedAmount, currency)}
                </span>
                <span className="font-semibold text-[11px] text-forest-800">
                  {cat.percentageOfTotal}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 5. Cost-Saving Alternatives (Never automatically modified) */}
      {alternatives.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-terracotta-500" />
              <h3 className="font-serif font-bold text-base text-charcoal-900">
                Actionable Cost-Saving Alternatives
              </h3>
            </div>
            <span className="text-xs text-charcoal-500">
              Preserves celebration aesthetic without automatic modification
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alternatives.map((alt) => (
              <Card
                key={alt.id}
                variant="default"
                className="p-5 flex flex-col justify-between border-forest-200 hover:border-forest-400 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-forest-100 text-forest-800">
                      {getCategoryDisplayName(alt.category)}
                    </span>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Saves {formatCurrency(alt.estimatedSavings, currency)}
                    </span>
                  </div>

                  <h4 className="font-semibold text-sm text-charcoal-900 mb-1.5">
                    {alt.title}
                  </h4>

                  <p className="text-xs text-charcoal-600 leading-relaxed mb-3">
                    {alt.rationale}
                  </p>

                  <div className="p-2.5 rounded-xl bg-ivory-100/80 border border-ivory-200 text-[11px] text-charcoal-700 mb-4">
                    <strong className="text-charcoal-900">Trade-off Notice: </strong>
                    {alt.tradeoffNotice}
                  </div>
                </div>

                <div className="pt-3 border-t border-ivory-200 flex items-center justify-between gap-3">
                  <div className="text-xs">
                    <span className="text-charcoal-500 block text-[10px]">Adjustment</span>
                    <span className="text-charcoal-800 font-semibold line-through mr-1.5">
                      {formatCurrency(alt.currentAmount, currency)}
                    </span>
                    <span className="font-bold text-forest-800">
                      {formatCurrency(alt.suggestedAmount, currency)}
                    </span>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleApplyAlternative(alt)}
                    leftIcon={<TrendingDown className="w-3.5 h-3.5 text-emerald-600" />}
                  >
                    Review &amp; Apply
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 6. Editable Line-Item Table */}
      <Card variant="default">
        {/* Table Top Controls & Cost Status Tabs */}
        <div className="p-5 border-b border-ivory-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-serif font-bold text-base text-charcoal-900">
              Itemized Line Items ({filteredItems.length})
            </h3>
            <p className="text-xs text-charcoal-500">
              Track estimates, quotes, and confirmed vendor commitments
            </p>
          </div>

          {/* Status Filter Tabs */}
          <div className="inline-flex rounded-xl p-1 bg-ivory-200/80 border border-ivory-300 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                statusFilter === 'all'
                  ? 'bg-ivory-50 text-forest-900 shadow-subtle'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              All ({budgetItems.length})
            </button>
            <button
              onClick={() => setStatusFilter('estimated')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                statusFilter === 'estimated'
                  ? 'bg-ivory-50 text-forest-900 shadow-subtle'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              Estimated ({formatCurrency(summary.statusBreakdown.estimatedTotal, currency)})
            </button>
            <button
              onClick={() => setStatusFilter('quoted')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                statusFilter === 'quoted'
                  ? 'bg-ivory-50 text-forest-900 shadow-subtle'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              Quoted ({formatCurrency(summary.statusBreakdown.quotedTotal, currency)})
            </button>
            <button
              onClick={() => setStatusFilter('confirmed')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                statusFilter === 'confirmed'
                  ? 'bg-ivory-50 text-forest-900 shadow-subtle'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              Confirmed ({formatCurrency(summary.statusBreakdown.confirmedTotal, currency)})
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-ivory-100/70 text-charcoal-600 text-xs uppercase font-semibold border-b border-ivory-300">
              <tr>
                <th className="px-5 py-3.5">Category &amp; Item</th>
                <th className="px-4 py-3.5">Cost Status</th>
                <th className="px-4 py-3.5 text-right">Allocated</th>
                <th className="px-4 py-3.5 text-right">Actual/Contract</th>
                <th className="px-4 py-3.5 text-right">Paid</th>
                <th className="px-4 py-3.5">Payment</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-ivory-100/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-charcoal-900">{item.name}</div>
                    <div className="text-xs text-charcoal-500 capitalize">
                      {getCategoryDisplayName(item.category)}
                      {item.notes && (
                        <span className="ml-2 font-normal italic">· {item.notes}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        item.costStatus === 'confirmed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : item.costStatus === 'quoted'
                          ? 'bg-gold-50 text-gold-900 border-gold-200'
                          : 'bg-ivory-200 text-charcoal-700 border-ivory-300'
                      }`}
                    >
                      {item.costStatus || 'estimated'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold text-charcoal-900">
                    {formatCurrency(item.allocatedAmount, currency)}
                  </td>
                  <td className="px-4 py-3.5 text-right text-charcoal-700">
                    {formatCurrency(item.actualAmount || item.allocatedAmount, currency)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-medium text-forest-700">
                    {formatCurrency(item.paidAmount, currency)}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge
                      variant={
                        item.paymentStatus === 'paid-in-full'
                          ? 'forest'
                          : item.paymentStatus === 'deposit-paid'
                          ? 'gold'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {item.paymentStatus.replace('-', ' ')}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 rounded-lg text-charcoal-500 hover:text-forest-800 hover:bg-ivory-200 transition-colors"
                        aria-label={`Edit ${item.name}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        className="p-1.5 rounded-lg text-charcoal-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 7. Add / Edit Item Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-charcoal-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <Card variant="elevated" className="border-forest-300 p-6 max-w-lg w-full">
            <div className="flex items-center justify-between pb-3 border-b border-ivory-300 mb-4">
              <h3 className="font-serif font-bold text-base text-charcoal-900">
                {editingItemId ? 'Edit Budget Line Item' : 'Add Itemized Budget Line'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-xs text-charcoal-500 hover:text-charcoal-900"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label htmlFor="budget-item-name" className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                  Line Item Name *
                </label>
                <input
                  id="budget-item-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sommelier Selection &amp; Reserve Wines"
                  className="w-full px-3.5 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="budget-item-category" className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                    Category
                  </label>
                  <select
                    id="budget-item-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as BudgetCategory)}
                    disabled={isContingency}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
                  >
                    {STANDARD_CATEGORIES.filter((c) => c.id !== 'contingency').map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="budget-item-cost-status" className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                    Cost Status
                  </label>
                  <select
                    id="budget-item-cost-status"
                    value={costStatus}
                    onChange={(e) => setCostStatus(e.target.value as CostStatus)}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
                  >
                    <option value="estimated">Estimated (Initial projection)</option>
                    <option value="quoted">Quoted (Supplier proposal)</option>
                    <option value="confirmed">Confirmed (Contract locked)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="budget-item-allocated" className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                    Allocated Amount ({currency}) *
                  </label>
                  <input
                    id="budget-item-allocated"
                    type="number"
                    value={allocatedAmount}
                    onChange={(e) => setAllocatedAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-forest-700"
                    min="0"
                    step="50"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="budget-item-actual" className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                    Actual/Quoted ({currency})
                  </label>
                  <input
                    id="budget-item-actual"
                    type="number"
                    value={actualAmount}
                    onChange={(e) => setActualAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
                    min="0"
                    step="50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="budget-item-paid" className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                    Disbursed/Paid ({currency})
                  </label>
                  <input
                    id="budget-item-paid"
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
                    min="0"
                  />
                </div>

                <div>
                  <label htmlFor="budget-item-payment-stage" className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                    Payment Stage
                  </label>
                  <select
                    id="budget-item-payment-stage"
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
                  >
                    <option value="planned">Planned</option>
                    <option value="deposit-paid">Deposit Paid</option>
                    <option value="paid-in-full">Paid in Full</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is-contingency-chk"
                  checked={isContingency}
                  onChange={(e) => setIsContingency(e.target.checked)}
                  className="w-4 h-4 rounded text-forest-700 accent-forest-700"
                />
                <label htmlFor="is-contingency-chk" className="text-xs font-medium text-charcoal-800">
                  Mark as Contingency Reserve Fund (Separately tracked safety buffer)
                </label>
              </div>

              <div>
                <label htmlFor="budget-item-notes" className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                  Contract / Supplier Notes
                </label>
                <input
                  id="budget-item-notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Includes sommelier service and stemware rental"
                  className="w-full px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-xs focus:outline-none focus:ring-1 focus:ring-forest-700"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-ivory-300">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingItemId ? 'Update Line Item' : 'Save Line Item'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
