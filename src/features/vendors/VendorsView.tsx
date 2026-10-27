import React from 'react'
import { Mail, Phone } from 'lucide-react'
import { usePlanner } from '@/context/PlannerContext'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'

export const VendorsView: React.FC = () => {
  const { activeEvent, vendors } = usePlanner()

  if (!activeEvent) return null

  const totalContracted = vendors.reduce(
    (sum, v) => sum + (v.finalCost || v.quotedCost),
    0,
  )
  const totalDepositsPaid = vendors
    .filter((v) => v.depositPaid)
    .reduce((sum, v) => sum + v.depositAmount, 0)

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ivory-300">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="forest" size="sm">
              Vendor Collective
            </Badge>
            <span className="text-xs text-charcoal-500">
              ${totalContracted.toLocaleString()} Total Commitments · ${totalDepositsPaid.toLocaleString()} Deposits Paid
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight">
            Curated Vendor Portfolio
          </h2>
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {vendors.map((vendor) => (
          <Card key={vendor.id} variant="default" className="p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Badge variant="neutral" size="sm" className="mb-1.5 capitalize">
                  {vendor.service.replace('-', ' ')}
                </Badge>
                <h3 className="font-serif font-bold text-lg text-charcoal-900">
                  {vendor.name}
                </h3>
                <p className="text-xs text-charcoal-600">
                  Primary Contact: <span className="font-semibold text-charcoal-800">{vendor.contactName}</span>
                </p>
              </div>

              <Badge
                variant={
                  vendor.contractStatus === 'deposit-paid' ||
                  vendor.contractStatus === 'contract-signed'
                    ? 'forest'
                    : 'gold'
                }
                size="sm"
              >
                {vendor.contractStatus.replace('-', ' ')}
              </Badge>
            </div>

            {vendor.notes && (
              <p className="text-xs text-charcoal-600 bg-ivory-100/70 p-3 rounded-xl border border-ivory-200">
                {vendor.notes}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div>
                <span className="text-charcoal-500 block">Agreed / Quoted Cost</span>
                <span className="font-serif font-bold text-base text-charcoal-900">
                  ${(vendor.finalCost || vendor.quotedCost).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-charcoal-500 block">Security Deposit</span>
                <span className="font-semibold text-forest-700">
                  ${vendor.depositAmount.toLocaleString()}{' '}
                  {vendor.depositPaid ? '(Paid)' : '(Due)'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-ivory-200/80 text-xs text-charcoal-600">
              <a
                href={`mailto:${vendor.email}`}
                className="flex items-center gap-1.5 hover:text-forest-800 transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-charcoal-400" />
                {vendor.email}
              </a>
              {vendor.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-charcoal-400" />
                  {vendor.phone}
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
