import React, { useState } from 'react'
import {
  Mail,
  Phone,
  Globe,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Circle,
  DollarSign,
  ShieldAlert,
  Info,
  Scale,
} from 'lucide-react'
import { usePlanner } from '@/context/PlannerContext'
import { Vendor, VendorService, ContractStatus } from '@/types/vendor'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { formatCurrency, sanitizeAmount } from '@/utils/budgetGuardian'
import {
  VENDOR_CATEGORY_METAS,
  getVendorCategoryQuestions,
  createDefaultComparisonWorksheet,
} from '@/utils/vendorEngine'

export const VendorsView: React.FC = () => {
  const {
    activeEvent,
    vendors,
    budgetItems,
    timelineTasks,
    addVendor,
    updateVendor,
    deleteVendor,
    toggleMilestonePaid,
  } = usePlanner()

  const [activeTab, setActiveTab] = useState<'portfolio' | 'comparison'>('portfolio')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null)

  // Comparison Worksheet State
  const [worksheetCategory, setWorksheetCategory] = useState<VendorService>('catering')
  const [worksheet, setWorksheet] = useState(() => createDefaultComparisonWorksheet('catering'))

  // Modal Form State
  const [name, setName] = useState('')
  const [service, setService] = useState<VendorService>('catering')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [contractStatus, setContractStatus] = useState<ContractStatus>('researching')
  const [estimatedCost, setEstimatedCost] = useState('')
  const [quotedCost, setQuotedCost] = useState('')
  const [finalCost, setFinalCost] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [depositPaid, setDepositPaid] = useState(false)
  const [notes, setNotes] = useState('')
  const [comparisonNotes, setComparisonNotes] = useState('')
  const [contractReminders, setContractReminders] = useState('')
  const [cancellationPolicy, setCancellationPolicy] = useState('')
  const [cancellationDeadline, setCancellationDeadline] = useState('')
  const [backupName, setBackupName] = useState('')
  const [backupNotes, setBackupNotes] = useState('')
  const [linkedTaskId, setLinkedTaskId] = useState('')
  const [linkedBudgetItemId, setLinkedBudgetItemId] = useState('')
  const [formError, setFormError] = useState('')

  if (!activeEvent) {
    return (
      <div className="p-8 text-center text-charcoal-600">
        No active celebration found. Select or create an event to manage vendor portfolios.
      </div>
    )
  }

  const currency = activeEvent.currency || 'USD'

  // Summary Metrics
  const totalQuoted = vendors.reduce((sum, v) => sum + v.quotedCost, 0)
  const totalContracted = vendors.reduce(
    (sum, v) => sum + (v.finalCost || v.quotedCost),
    0,
  )
  const totalDepositsPaid = vendors.reduce((sum, v) => {
    if (v.paymentMilestones && v.paymentMilestones.length > 0) {
      return sum + v.paymentMilestones.filter((m) => m.isPaid).reduce((s, m) => s + m.amount, 0)
    }
    return sum + (v.depositPaid ? v.depositAmount : 0)
  }, 0)

  const confirmedVendorCount = vendors.filter(
    (v) => v.contractStatus === 'contract-signed' || v.contractStatus === 'deposit-paid',
  ).length

  // Filtered Vendors
  const filteredVendors =
    selectedCategoryFilter === 'all'
      ? vendors
      : vendors.filter((v) => v.service === selectedCategoryFilter)

  const handleOpenAddModal = () => {
    setEditingVendorId(null)
    setName('')
    setService('catering')
    setContactName('')
    setEmail('')
    setPhone('')
    setWebsite('')
    setContractStatus('researching')
    setEstimatedCost('')
    setQuotedCost('')
    setFinalCost('')
    setDepositAmount('')
    setDepositPaid(false)
    setNotes('')
    setComparisonNotes('')
    setContractReminders('')
    setCancellationPolicy('')
    setCancellationDeadline('')
    setBackupName('')
    setBackupNotes('')
    setLinkedTaskId('')
    setLinkedBudgetItemId('')
    setFormError('')
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (vendor: Vendor) => {
    setEditingVendorId(vendor.id)
    setName(vendor.name || '')
    setService(vendor.service)
    setContactName(vendor.contactName || '')
    setEmail(vendor.email || '')
    setPhone(vendor.phone || '')
    setWebsite(vendor.website || '')
    setContractStatus(vendor.contractStatus)
    setEstimatedCost(vendor.estimatedCost ? String(vendor.estimatedCost) : '')
    setQuotedCost(String(vendor.quotedCost || 0))
    setFinalCost(vendor.finalCost ? String(vendor.finalCost) : '')
    setDepositAmount(String(vendor.depositAmount || 0))
    setDepositPaid(vendor.depositPaid)
    setNotes(vendor.notes || '')
    setComparisonNotes(vendor.comparisonNotes || '')
    setContractReminders(vendor.contractReminders || '')
    setCancellationPolicy(vendor.cancellationPolicy || '')
    setCancellationDeadline(vendor.cancellationDeadline || '')
    setBackupName(vendor.backupOption?.name || '')
    setBackupNotes(vendor.backupOption?.notes || '')
    setLinkedTaskId(vendor.linkedTaskId || '')
    setLinkedBudgetItemId(vendor.linkedBudgetItemId || '')
    setFormError('')
    setIsModalOpen(true)
  }

  const handleSaveVendor = (e: React.FormEvent) => {
    e.preventDefault()

    const numericQuoted = sanitizeAmount(quotedCost)
    const numericFinal = finalCost ? sanitizeAmount(finalCost) : undefined
    const numericDeposit = sanitizeAmount(depositAmount)
    const numericEstimated = estimatedCost ? sanitizeAmount(estimatedCost) : undefined

    if (editingVendorId) {
      updateVendor(editingVendorId, {
        name: name.trim() || undefined,
        service,
        contactName: contactName.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        contractStatus,
        estimatedCost: numericEstimated,
        quotedCost: numericQuoted,
        finalCost: numericFinal,
        depositAmount: numericDeposit,
        depositPaid,
        notes: notes.trim() || undefined,
        comparisonNotes: comparisonNotes.trim() || undefined,
        contractReminders: contractReminders.trim() || undefined,
        cancellationPolicy: cancellationPolicy.trim() || undefined,
        cancellationDeadline: cancellationDeadline || undefined,
        backupOption: backupName.trim()
          ? { name: backupName.trim(), notes: backupNotes.trim() || undefined }
          : undefined,
        linkedTaskId: linkedTaskId || undefined,
        linkedBudgetItemId: linkedBudgetItemId || undefined,
      })
    } else {
      addVendor({
        name: name.trim() || undefined,
        service,
        contactName: contactName.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        contractStatus,
        estimatedCost: numericEstimated,
        quotedCost: numericQuoted,
        finalCost: numericFinal,
        depositAmount: numericDeposit,
        depositPaid,
        notes: notes.trim() || undefined,
        comparisonNotes: comparisonNotes.trim() || undefined,
        contractReminders: contractReminders.trim() || undefined,
        cancellationPolicy: cancellationPolicy.trim() || undefined,
        cancellationDeadline: cancellationDeadline || undefined,
        backupOption: backupName.trim()
          ? { name: backupName.trim(), notes: backupNotes.trim() || undefined }
          : undefined,
        linkedTaskId: linkedTaskId || undefined,
        linkedBudgetItemId: linkedBudgetItemId || undefined,
      })
    }

    setIsModalOpen(false)
  }

  const handleWorksheetCategoryChange = (cat: VendorService) => {
    setWorksheetCategory(cat)
    setWorksheet(createDefaultComparisonWorksheet(cat))
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* 1. Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ivory-300">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="forest" size="sm">
              Vendor Management &amp; Procurement
            </Badge>
            <span className="text-xs font-semibold text-charcoal-700 bg-ivory-200/80 px-2.5 py-0.5 rounded-full">
              {confirmedVendorCount} of {vendors.length} Contracts Locked
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight">
            Curated Vendor Portfolio &amp; Contracts
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-600 mt-1 max-w-3xl">
            Track vendor candidates, contracts, payment milestones, and questions. All verified costs
            synchronize directly to the Budget Guardian.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant={activeTab === 'portfolio' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('portfolio')}
          >
            Vendor Portfolio
          </Button>
          <Button
            type="button"
            variant={activeTab === 'comparison' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('comparison')}
          >
            <Scale className="w-3.5 h-3.5 mr-1" />
            Comparison Worksheet
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleOpenAddModal}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Supplier
          </Button>
        </div>
      </div>

      {/* 2. Honest Data Policy & Disclaimer */}
      <div className="p-3.5 rounded-xl bg-ivory-50 border border-ivory-300 flex items-start gap-2.5 text-xs text-charcoal-700">
        <Info className="w-4 h-4 text-forest-700 shrink-0 mt-0.5" />
        <div>
          <strong>Transparent Vendor Policy:</strong> Celebrio AI provides structured contract
          worksheets and negotiation guidance. We never invent commercial ratings, pretend real-time
          availability, or fabricate fake local business identities.
        </div>
      </div>

      {/* 3. Portfolio Summary Cards (4 Metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="default" className="p-4">
          <span className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider block mb-1">
            Total Quoted Pipeline
          </span>
          <div className="font-serif text-2xl font-bold text-charcoal-900">
            {formatCurrency(totalQuoted, currency)}
          </div>
          <p className="text-xs text-charcoal-500 mt-1">Across {vendors.length} supplier lines</p>
        </Card>

        <Card variant="default" className="p-4">
          <span className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider block mb-1">
            Contracted Commitments
          </span>
          <div className="font-serif text-2xl font-bold text-forest-800">
            {formatCurrency(totalContracted, currency)}
          </div>
          <p className="text-xs text-charcoal-500 mt-1">Legally binding or signed</p>
        </Card>

        <Card variant="default" className="p-4">
          <span className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider block mb-1">
            Deposits &amp; Paid Milestones
          </span>
          <div className="font-serif text-2xl font-bold text-charcoal-900">
            {formatCurrency(totalDepositsPaid, currency)}
          </div>
          <p className="text-xs text-charcoal-500 mt-1">Disbursed escrow payments</p>
        </Card>

        <Card variant="default" className="p-4">
          <span className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider block mb-1">
            Remaining Retainage Due
          </span>
          <div className="font-serif text-2xl font-bold text-gold-700">
            {formatCurrency(Math.max(0, totalContracted - totalDepositsPaid), currency)}
          </div>
          <p className="text-xs text-charcoal-500 mt-1">Due before final execution</p>
        </Card>
      </div>

      {/* 4. Active Tab Content */}
      {activeTab === 'portfolio' ? (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 border-b border-ivory-200 pb-2">
            <button
              onClick={() => setSelectedCategoryFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedCategoryFilter === 'all'
                  ? 'bg-forest-800 text-ivory-50'
                  : 'text-charcoal-600 hover:bg-ivory-200'
              }`}
            >
              All Categories ({vendors.length})
            </button>
            {VENDOR_CATEGORY_METAS.map((cat) => {
              const count = vendors.filter((v) => v.service === cat.id).length
              if (count === 0) return null
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryFilter(cat.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    selectedCategoryFilter === cat.id
                      ? 'bg-forest-800 text-ivory-50'
                      : 'text-charcoal-600 hover:bg-ivory-200'
                  }`}
                >
                  {cat.label} ({count})
                </button>
              )
            })}
          </div>

          {/* Vendors Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredVendors.length === 0 ? (
              <Card variant="default" className="col-span-full p-8 text-center text-charcoal-600">
                <DollarSign className="w-8 h-8 text-charcoal-400 mx-auto mb-2" />
                <p className="font-semibold text-sm">No suppliers logged in this category.</p>
                <p className="text-xs text-charcoal-500 mt-1">
                  Click &quot;Add Supplier&quot; to log a contractor quote or candidate worksheet.
                </p>
              </Card>
            ) : (
              filteredVendors.map((vendor) => {
                const categoryMeta = VENDOR_CATEGORY_METAS.find((m) => m.id === vendor.service)
                const isContracted =
                  vendor.contractStatus === 'contract-signed' ||
                  vendor.contractStatus === 'deposit-paid' ||
                  vendor.contractStatus === 'completed'

                const questions = vendor.questionsToAsk || getVendorCategoryQuestions(vendor.service)

                return (
                  <Card
                    key={vendor.id}
                    variant="default"
                    className="p-5 sm:p-6 space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Bar: Service & Status Badge */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <Badge variant="neutral" size="sm" className="capitalize">
                              {categoryMeta?.label || vendor.service.replace('-', ' ')}
                            </Badge>
                            {vendor.linkedBudgetItemId && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-forest-100 text-forest-800">
                                Budget Synced
                              </span>
                            )}
                          </div>
                          <h3 className="font-serif font-bold text-xl text-charcoal-900">
                            {vendor.name || 'Candidate Supplier (Name Pending)'}
                          </h3>
                        </div>

                        <Badge
                          variant={
                            isContracted
                              ? 'forest'
                              : vendor.contractStatus === 'negotiating' ||
                                vendor.contractStatus === 'quote-received'
                              ? 'gold'
                              : 'neutral'
                          }
                          size="sm"
                          className="capitalize"
                        >
                          {vendor.contractStatus.replace('-', ' ')}
                        </Badge>
                      </div>

                      {/* Optional Contact Details */}
                      {(vendor.contactName || vendor.email || vendor.phone || vendor.website) ? (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-charcoal-600 pb-2">
                          {vendor.contactName && (
                            <span className="font-medium text-charcoal-800">
                              Contact: {vendor.contactName}
                            </span>
                          )}
                          {vendor.email && (
                            <a
                              href={`mailto:${vendor.email}`}
                              className="flex items-center gap-1 hover:text-forest-800"
                            >
                              <Mail className="w-3 h-3 text-charcoal-400" />
                              {vendor.email}
                            </a>
                          )}
                          {vendor.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-charcoal-400" />
                              {vendor.phone}
                            </span>
                          )}
                          {vendor.website && (
                            <a
                              href={vendor.website}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 hover:text-forest-800"
                            >
                              <Globe className="w-3 h-3 text-charcoal-400" />
                              Website
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="text-[11px] text-charcoal-400 italic pb-2">
                          No private contact information stored (optional by user choice).
                        </div>
                      )}

                      {/* Pricing Summary Box */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-ivory-100/70 rounded-xl border border-ivory-200 text-xs my-2">
                        <div>
                          <span className="text-charcoal-500 block text-[11px]">Quoted Amount</span>
                          <span className="font-serif font-bold text-sm text-charcoal-900">
                            {formatCurrency(vendor.quotedCost, currency)}
                          </span>
                        </div>
                        <div>
                          <span className="text-charcoal-500 block text-[11px]">Final Contract</span>
                          <span className="font-serif font-bold text-sm text-forest-800">
                            {vendor.finalCost ? formatCurrency(vendor.finalCost, currency) : 'In Review'}
                          </span>
                        </div>
                        <div>
                          <span className="text-charcoal-500 block text-[11px]">Deposit Required</span>
                          <span className="font-semibold text-xs text-charcoal-800">
                            {formatCurrency(vendor.depositAmount, currency)}{' '}
                            <span className={vendor.depositPaid ? 'text-forest-700' : 'text-amber-700'}>
                              ({vendor.depositPaid ? 'Paid' : 'Due'})
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Payment Milestones (Interactive Checklist) */}
                      {vendor.paymentMilestones && vendor.paymentMilestones.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-ivory-200">
                          <span className="text-[11px] font-bold text-charcoal-700 uppercase tracking-wider block mb-1.5">
                            Payment Schedule &amp; Milestones
                          </span>
                          <div className="space-y-1.5">
                            {vendor.paymentMilestones.map((ms) => (
                              <div
                                key={ms.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-ivory-50 border border-ivory-200 text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => toggleMilestonePaid(vendor.id, ms.id)}
                                    className="focus:outline-none focus-visible:ring-1 focus-visible:ring-forest-700 rounded-full"
                                    aria-label={`Toggle payment for ${ms.name}`}
                                  >
                                    {ms.isPaid ? (
                                      <CheckCircle2 className="w-4 h-4 text-forest-700 fill-forest-100" />
                                    ) : (
                                      <Circle className="w-4 h-4 text-charcoal-400 hover:text-forest-700" />
                                    )}
                                  </button>
                                  <span
                                    className={`font-medium ${
                                      ms.isPaid ? 'line-through text-charcoal-500' : 'text-charcoal-800'
                                    }`}
                                  >
                                    {ms.name}
                                  </span>
                                  {ms.dueDate && (
                                    <span className="text-[11px] text-charcoal-500">
                                      (Due: {ms.dueDate})
                                    </span>
                                  )}
                                </div>
                                <span className="font-semibold text-charcoal-900">
                                  {formatCurrency(ms.amount, currency)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Contract & Cancellation Reminders */}
                      {(vendor.cancellationPolicy || vendor.cancellationDeadline || vendor.contractReminders) && (
                        <div className="mt-3 p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-[11px] text-amber-900">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                            Contract &amp; Cancellation Reminders
                          </div>
                          {vendor.cancellationDeadline && (
                            <p>
                              <strong>Cancellation Penalty Deadline:</strong> {vendor.cancellationDeadline}
                            </p>
                          )}
                          {vendor.cancellationPolicy && (
                            <p className="text-charcoal-700">{vendor.cancellationPolicy}</p>
                          )}
                          {vendor.contractReminders && (
                            <p className="text-charcoal-700">{vendor.contractReminders}</p>
                          )}
                        </div>
                      )}

                      {/* Backup Option */}
                      {vendor.backupOption?.name && (
                        <div className="mt-2.5 p-2 rounded-lg bg-ivory-100 text-xs text-charcoal-700 flex items-start gap-1.5">
                          <span className="font-semibold text-charcoal-900 shrink-0">Backup Option:</span>
                          <span>
                            {vendor.backupOption.name}
                            {vendor.backupOption.notes ? ` — ${vendor.backupOption.notes}` : ''}
                          </span>
                        </div>
                      )}

                      {/* Questions to Ask Expandable/List */}
                      {questions.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-ivory-200">
                          <span className="text-[11px] font-bold text-charcoal-700 uppercase tracking-wider block mb-1">
                            Essential Vetting Questions ({categoryMeta?.label || 'Category'})
                          </span>
                          <ul className="list-disc pl-4 space-y-0.5 text-xs text-charcoal-600">
                            {questions.slice(0, 2).map((q, idx) => (
                              <li key={idx}>{q}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-ivory-200 text-xs">
                      <span className="text-charcoal-500">
                        {vendor.linkedTaskId ? 'Linked to preparation timeline' : 'No task link'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenEditModal(vendor)}
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          Edit Supplier
                        </Button>
                        <button
                          type="button"
                          onClick={() => deleteVendor(vendor.id)}
                          className="p-1.5 text-charcoal-400 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Remove supplier from portfolio"
                          aria-label={`Delete ${vendor.name || 'supplier'}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      ) : (
        /* 5. Vendor Comparison Worksheet Tab */
        <div className="space-y-6">
          <Card variant="default" className="p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-ivory-200">
              <div>
                <h3 className="font-serif font-bold text-lg text-charcoal-900">
                  Side-by-Side Proposal Comparison Worksheet
                </h3>
                <p className="text-xs text-charcoal-600 mt-0.5">
                  Evaluate competitive proposals objectively on pricing, deliverables, and flexibility.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="worksheet-cat-select" className="text-xs font-semibold text-charcoal-700">
                  Category:
                </label>
                <select
                  id="worksheet-cat-select"
                  value={worksheetCategory}
                  onChange={(e) => handleWorksheetCategoryChange(e.target.value as VendorService)}
                  className="px-3 py-1.5 rounded-lg bg-ivory-50 border border-ivory-300 text-xs font-medium focus:ring-1 focus:ring-forest-700"
                >
                  {VENDOR_CATEGORY_METAS.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {worksheet.candidates.map((cand, idx) => (
                <div
                  key={cand.id}
                  className="p-4 rounded-xl bg-ivory-50 border border-ivory-300 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-forest-800 uppercase tracking-wider">
                      Candidate {idx + 1}
                    </span>
                    <Badge variant="gold" size="sm">
                      Score: {cand.score}/10
                    </Badge>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-charcoal-600 uppercase mb-0.5">
                      Vendor / Proposal Name
                    </label>
                    <input
                      type="text"
                      defaultValue={cand.name}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-ivory-100 border border-ivory-200 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-charcoal-600 uppercase mb-0.5">
                      Quoted Proposal Cost ({currency})
                    </label>
                    <input
                      type="number"
                      defaultValue={cand.quotedCost || ''}
                      placeholder="e.g. 5200"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-ivory-100 border border-ivory-200 text-xs font-bold text-forest-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-charcoal-600 uppercase mb-0.5">
                      Included Deliverables &amp; Staffing
                    </label>
                    <textarea
                      rows={2}
                      defaultValue={cand.inclusions}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-ivory-100 border border-ivory-200 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="font-semibold text-forest-800 block text-[11px]">Pros</span>
                      <textarea
                        rows={2}
                        defaultValue={cand.pros}
                        className="w-full px-2 py-1 rounded bg-ivory-100 border border-ivory-200 text-xs"
                      />
                    </div>
                    <div>
                      <span className="font-semibold text-rose-800 block text-[11px]">Cons / Risks</span>
                      <textarea
                        rows={2}
                        defaultValue={cand.cons}
                        className="w-full px-2 py-1 rounded bg-ivory-100 border border-ivory-200 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-charcoal-600 uppercase mb-0.5">
                      Cancellation &amp; Refund Terms
                    </label>
                    <input
                      type="text"
                      defaultValue={cand.cancellationTerms}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-ivory-100 border border-ivory-200 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* 6. Add / Edit Vendor Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-charcoal-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <Card
            variant="default"
            className="w-full max-w-2xl p-6 bg-ivory-50 max-h-[92vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-ivory-300">
              <div>
                <h3 className="font-serif font-bold text-lg text-charcoal-900">
                  {editingVendorId ? 'Edit Supplier Profile' : 'Add New Supplier Candidate'}
                </h3>
                <p className="text-xs text-charcoal-500">
                  Financial quotes automatically synchronize to the Budget Guardian.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-xs text-charcoal-500 hover:text-charcoal-900"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveVendor} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
                  {formError}
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="vendor-service"
                    className="block text-xs font-semibold text-charcoal-700 uppercase mb-1"
                  >
                    Service Category *
                  </label>
                  <select
                    id="vendor-service"
                    value={service}
                    onChange={(e) => setService(e.target.value as VendorService)}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-sm focus:ring-2 focus:ring-forest-700"
                    required
                  >
                    {VENDOR_CATEGORY_METAS.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="vendor-name"
                    className="block text-xs font-semibold text-charcoal-700 uppercase mb-1"
                  >
                    Supplier / Company Name
                  </label>
                  <input
                    id="vendor-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Heirloom Table Gastronomy (or TBD)"
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-sm focus:ring-2 focus:ring-forest-700"
                  />
                </div>
              </div>

              {/* Status & Costs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="vendor-contract-status"
                    className="block text-xs font-semibold text-charcoal-700 uppercase mb-1"
                  >
                    Contract Status
                  </label>
                  <select
                    id="vendor-contract-status"
                    value={contractStatus}
                    onChange={(e) => setContractStatus(e.target.value as ContractStatus)}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-sm focus:ring-2 focus:ring-forest-700"
                  >
                    <option value="researching">Researching / Prospecting</option>
                    <option value="outreach">Outreach Initiated</option>
                    <option value="quote-received">Quote Received</option>
                    <option value="negotiating">Negotiating Terms</option>
                    <option value="contract-signed">Contract Signed</option>
                    <option value="deposit-paid">Deposit Paid</option>
                    <option value="completed">Service Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="vendor-quoted-cost"
                    className="block text-xs font-semibold text-charcoal-700 uppercase mb-1"
                  >
                    Quoted Cost ({currency}) *
                  </label>
                  <input
                    id="vendor-quoted-cost"
                    type="number"
                    value={quotedCost}
                    onChange={(e) => setQuotedCost(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-sm font-semibold focus:ring-2 focus:ring-forest-700"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="vendor-final-cost"
                    className="block text-xs font-semibold text-charcoal-700 uppercase mb-1"
                  >
                    Final Agreed Cost ({currency})
                  </label>
                  <input
                    id="vendor-final-cost"
                    type="number"
                    value={finalCost}
                    onChange={(e) => setFinalCost(e.target.value)}
                    placeholder="If signed"
                    min="0"
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-sm focus:ring-2 focus:ring-forest-700"
                  />
                </div>
              </div>

              {/* Deposit Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="vendor-deposit-amount"
                    className="block text-xs font-semibold text-charcoal-700 uppercase mb-1"
                  >
                    Required Deposit ({currency})
                  </label>
                  <input
                    id="vendor-deposit-amount"
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-sm focus:ring-2 focus:ring-forest-700"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="vendor-deposit-paid"
                    checked={depositPaid}
                    onChange={(e) => setDepositPaid(e.target.checked)}
                    className="w-4 h-4 rounded text-forest-700 accent-forest-700"
                  />
                  <label htmlFor="vendor-deposit-paid" className="text-xs font-medium text-charcoal-800">
                    Deposit has been disbursed &amp; confirmed paid
                  </label>
                </div>
              </div>

              {/* Optional Contact Details (User Choice) */}
              <div className="p-3.5 rounded-xl bg-ivory-100/60 border border-ivory-200 space-y-3">
                <span className="text-xs font-bold text-charcoal-800 uppercase tracking-wider block">
                  Private Contact Information (Optional)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="vendor-contact-name" className="block text-[11px] font-semibold text-charcoal-600 mb-1">
                      Lead Contact Person
                    </label>
                    <input
                      id="vendor-contact-name"
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g. Elena Rostova"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-ivory-50 border border-ivory-300 text-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="vendor-email" className="block text-[11px] font-semibold text-charcoal-600 mb-1">
                      Email Address
                    </label>
                    <input
                      id="vendor-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. contact@supplier.com"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-ivory-50 border border-ivory-300 text-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="vendor-phone" className="block text-[11px] font-semibold text-charcoal-600 mb-1">
                      Phone Number
                    </label>
                    <input
                      id="vendor-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-ivory-50 border border-ivory-300 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Contract & Cancellation Policies */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="vendor-cancellation-policy"
                    className="block text-xs font-semibold text-charcoal-700 uppercase mb-1"
                  >
                    Cancellation &amp; Refund Terms
                  </label>
                  <input
                    id="vendor-cancellation-policy"
                    type="text"
                    value={cancellationPolicy}
                    onChange={(e) => setCancellationPolicy(e.target.value)}
                    placeholder="e.g. 50% refund up to 30 days prior"
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-xs"
                  />
                </div>

                <div>
                  <label
                    htmlFor="vendor-cancellation-deadline"
                    className="block text-xs font-semibold text-charcoal-700 uppercase mb-1"
                  >
                    Cancellation Penalty Cutoff Date
                  </label>
                  <input
                    id="vendor-cancellation-deadline"
                    type="date"
                    value={cancellationDeadline}
                    onChange={(e) => setCancellationDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-sm"
                  />
                </div>
              </div>

              {/* Backup Option */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="vendor-backup-name"
                    className="block text-xs font-semibold text-charcoal-700 uppercase mb-1"
                  >
                    Backup Option / Secondary Candidate
                  </label>
                  <input
                    id="vendor-backup-name"
                    type="text"
                    value={backupName}
                    onChange={(e) => setBackupName(e.target.value)}
                    placeholder="e.g. Reserve Caterer B"
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-xs"
                  />
                </div>

                <div>
                  <label
                    htmlFor="vendor-backup-notes"
                    className="block text-xs font-semibold text-charcoal-700 uppercase mb-1"
                  >
                    Backup Notes &amp; Pricing
                  </label>
                  <input
                    id="vendor-backup-notes"
                    type="text"
                    value={backupNotes}
                    onChange={(e) => setBackupNotes(e.target.value)}
                    placeholder="e.g. Available on 14-day notice, $4,800 estimate"
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-xs"
                  />
                </div>
              </div>

              {/* Linkage to Budget & Timeline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-ivory-200">
                <div>
                  <label
                    htmlFor="vendor-link-budget"
                    className="block text-xs font-semibold text-charcoal-700 uppercase mb-1"
                  >
                    Link to Budget Line Item
                  </label>
                  <select
                    id="vendor-link-budget"
                    value={linkedBudgetItemId}
                    onChange={(e) => setLinkedBudgetItemId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-xs"
                  >
                    <option value="">None (Auto-match by Category)</option>
                    {budgetItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} (${item.allocatedAmount})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="vendor-link-task"
                    className="block text-xs font-semibold text-charcoal-700 uppercase mb-1"
                  >
                    Link to Preparation Milestone
                  </label>
                  <select
                    id="vendor-link-task"
                    value={linkedTaskId}
                    onChange={(e) => setLinkedTaskId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-xs"
                  >
                    <option value="">None (Independent supplier)</option>
                    {timelineTasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title} ({task.targetDate || 'TBD'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-ivory-300">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingVendorId ? 'Update Supplier' : 'Save Supplier'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
