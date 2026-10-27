import React, { useState } from 'react'
import { Plus, ShieldCheck, ArrowUpRight } from 'lucide-react'
import { usePlanner } from '@/context/PlannerContext'
import { BudgetItem, BudgetCategory } from '@/types/budget'
import { Card, CardBody } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { StorageService } from '@/services/storage/storageService'

export const BudgetView: React.FC = () => {
  const { activeEvent, budgetItems, setCurrentSection } = usePlanner()
  const [isAdding, setIsAdding] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<BudgetCategory>('catering-beverage')
  const [amount, setAmount] = useState('2500')
  const [notes, setNotes] = useState('')

  if (!activeEvent) return null

  // Financial calculations
  const totalBudget = activeEvent.totalBudget
  const allocatedAmount = budgetItems.reduce((sum, item) => sum + item.allocatedAmount, 0)
  const actualAmount = budgetItems.reduce((sum, item) => sum + item.actualAmount, 0)
  const paidAmount = budgetItems.reduce((sum, item) => sum + item.paidAmount, 0)
  const remainingBudget = totalBudget - allocatedAmount
  const contingencyItem = budgetItems.find((i) => i.isContingency)
  const contingencyAmount = contingencyItem ? contingencyItem.allocatedAmount : 0
  const isOverAllocated = allocatedAmount > totalBudget

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const amt = Number(amount) || 0
    const newItem: BudgetItem = {
      id: `bgt-${Date.now()}`,
      eventId: activeEvent.id,
      category,
      name: name.trim(),
      allocatedAmount: amt,
      actualAmount: amt,
      paidAmount: 0,
      paymentStatus: 'planned',
      notes: notes.trim() || undefined,
    }

    const updated = [...budgetItems, newItem]
    StorageService.saveBudgetItems(updated)
    window.location.reload()
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ivory-300">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="forest" size="sm">
              Financial Architecture
            </Badge>
            <span className="text-xs text-charcoal-500">
              Contingency Target: {((contingencyAmount / totalBudget) * 100).toFixed(1)}%
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight">
            Budget Planner &amp; Variance Engine
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCurrentSection('simulator')}
            rightIcon={<ArrowUpRight className="w-4 h-4" />}
          >
            Simulate Budget Drift
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAdding(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Line Item
          </Button>
        </div>
      </div>

      {/* Summary Vitals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="default">
          <CardBody className="p-5">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block mb-1">
              Total Budget
            </span>
            <div className="font-serif text-2xl font-bold text-charcoal-900">
              ${totalBudget.toLocaleString()}
            </div>
            <p className="text-xs text-charcoal-500 mt-1">Locked Target Cap</p>
          </CardBody>
        </Card>

        <Card variant="default">
          <CardBody className="p-5">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block mb-1">
              Allocated
            </span>
            <div
              className={`font-serif text-2xl font-bold ${
                isOverAllocated ? 'text-terracotta-600' : 'text-charcoal-900'
              }`}
            >
              ${allocatedAmount.toLocaleString()}
            </div>
            <p className="text-xs text-charcoal-500 mt-1">
              {((allocatedAmount / totalBudget) * 100).toFixed(1)}% of total cap
            </p>
          </CardBody>
        </Card>

        <Card variant="default">
          <CardBody className="p-5">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block mb-1">
              Disbursed (Paid)
            </span>
            <div className="font-serif text-2xl font-bold text-forest-800">
              ${paidAmount.toLocaleString()}
            </div>
            <p className="text-xs text-charcoal-500 mt-1">
              ${(actualAmount - paidAmount).toLocaleString()} committed balance
            </p>
          </CardBody>
        </Card>

        <Card variant="default">
          <CardBody className="p-5">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block mb-1">
              Contingency Reserve
            </span>
            <div className="font-serif text-2xl font-bold text-gold-700">
              ${contingencyAmount.toLocaleString()}
            </div>
            <p className="text-xs text-charcoal-500 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-forest-700" />
              Protected buffer
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Allocation Visual Bar */}
      <Card variant="default" className="p-5">
        <div className="flex items-center justify-between text-xs font-semibold text-charcoal-700 mb-2">
          <span>Allocation Distribution</span>
          <span>
            {remainingBudget >= 0
              ? `$${remainingBudget.toLocaleString()} Remaining Unallocated`
              : `-$${Math.abs(remainingBudget).toLocaleString()} Over Allocation`}
          </span>
        </div>
        <div className="w-full h-3 bg-ivory-200 rounded-full overflow-hidden flex">
          <div
            className="bg-forest-700 h-full transition-all"
            style={{
              width: `${Math.min(100, (allocatedAmount / totalBudget) * 100)}%`,
            }}
            title="Allocated"
          />
        </div>
      </Card>

      {/* Modal Add Item */}
      {isAdding && (
        <Card variant="elevated" className="border-forest-300 p-6 max-w-xl mx-auto">
          <div className="flex items-center justify-between pb-3 border-b border-ivory-300 mb-4">
            <h3 className="font-serif font-bold text-base text-charcoal-900">
              Add Budget Line Item
            </h3>
            <button
              onClick={() => setIsAdding(false)}
              className="text-xs text-charcoal-500 hover:text-charcoal-900"
            >
              Cancel
            </button>
          </div>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                Line Item Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sommelier Selection &amp; Vintage Champagne"
                className="w-full px-3.5 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as BudgetCategory)}
                  className="w-full px-3.5 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
                >
                  <option value="venue">Venue</option>
                  <option value="catering-beverage">Catering &amp; Beverage</option>
                  <option value="decor-floral">Decor &amp; Floral</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="photography-media">Photography &amp; Media</option>
                  <option value="production-av">Production &amp; A/V</option>
                  <option value="contingency">Contingency Reserve</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                  Amount (USD)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
                  min="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                Notes &amp; Contract References (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Deposit due 14 days before delivery"
                className="w-full px-3.5 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-ivory-300">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsAdding(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Line Item
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Line Items Table */}
      <Card variant="default">
        <div className="p-4 sm:p-5 border-b border-ivory-300 flex items-center justify-between">
          <h3 className="font-serif font-bold text-base text-charcoal-900">
            Line Items &amp; Commitments ({budgetItems.length})
          </h3>
          <span className="text-xs text-charcoal-500">
            Real-time synchronization with contracts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-ivory-100/70 text-charcoal-500 text-xs uppercase font-semibold border-b border-ivory-300">
              <tr>
                <th className="px-5 py-3">Category &amp; Item</th>
                <th className="px-4 py-3 text-right">Allocated</th>
                <th className="px-4 py-3 text-right">Actual/Contract</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-200">
              {budgetItems.map((item) => (
                <tr key={item.id} className="hover:bg-ivory-100/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-charcoal-900">{item.name}</div>
                    <div className="text-xs text-charcoal-500 capitalize">
                      {item.category.replace('-', ' ')}
                      {item.notes && <span className="ml-2 font-normal italic">· {item.notes}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right font-medium text-charcoal-800">
                    ${item.allocatedAmount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold text-charcoal-900">
                    ${item.actualAmount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 text-right font-medium text-forest-700">
                    ${item.paidAmount.toLocaleString()}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
