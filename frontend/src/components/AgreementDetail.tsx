import { useCallback, useState } from 'react'
import { ExplorerLink } from './ExplorerLink'
import MilestoneActions from './MilestoneActions'
import TruncatedAddress from './TruncatedAddress'
import useToast from '../hooks/useToast'
import type { Agreement } from '../lib/soroban'

interface AgreementDetailProps {
  agreement: Agreement
  onUpdate?: () => void
}

export default function AgreementDetail({ agreement, onUpdate }: AgreementDetailProps) {
  const toast = useToast()
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleCopy = useCallback(
    async (text: string, fieldName: string) => {
      try {
        await navigator.clipboard.writeText(text)
        setCopiedField(fieldName)
        toast.success({ title: `${fieldName} copied` })
        setTimeout(() => setCopiedField(null), 2000)
      } catch {
        toast.error({ title: 'Copy failed', message: 'Clipboard access blocked' })
      }
    },
    [toast],
  )

  return (
    <div className="space-y-6">
      {/* Agreement Header */}
      <div className="rounded-xl border border-navy-700 bg-navy-800/60 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Agreement Details</h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Agreement ID</span>
            <div className="flex items-center gap-2">
              <TruncatedAddress address={agreement.agreement_id} />
              <button
                onClick={() => handleCopy(agreement.agreement_id, 'Agreement ID')}
                className="text-gray-400 hover:text-cyan-400 transition-colors"
                aria-label="Copy agreement ID"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M5 15V6a1 1 0 0 1 1-1h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400">Payer</span>
            <div className="flex items-center gap-2">
              <ExplorerLink type="account" value={agreement.payer} />
              <button
                onClick={() => handleCopy(agreement.payer, 'Payer address')}
                className="text-gray-400 hover:text-cyan-400 transition-colors"
                aria-label="Copy payer address"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M5 15V6a1 1 0 0 1 1-1h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400">Payee</span>
            <div className="flex items-center gap-2">
              <ExplorerLink type="account" value={agreement.payee} />
              <button
                onClick={() => handleCopy(agreement.payee, 'Payee address')}
                className="text-gray-400 hover:text-cyan-400 transition-colors"
                aria-label="Copy payee address"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M5 15V6a1 1 0 0 1 1-1h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400">Resolver</span>
            <div className="flex items-center gap-2">
              <ExplorerLink type="account" value={agreement.dispute_resolver} />
              <button
                onClick={() => handleCopy(agreement.dispute_resolver, 'Resolver address')}
                className="text-gray-400 hover:text-cyan-400 transition-colors"
                aria-label="Copy resolver address"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M5 15V6a1 1 0 0 1 1-1h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400">Token</span>
            <ExplorerLink type="contract" value={agreement.token} />
          </div>
        </div>
      </div>

      {/* Milestones Table */}
      <div className="rounded-xl border border-navy-700 bg-navy-800/60 overflow-hidden">
        <div className="p-6 border-b border-navy-700">
          <h2 className="text-xl font-semibold text-white">Milestones</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy-700/50 text-gray-400 text-xs uppercase">
              <tr>
                <th className="py-3 px-4 text-left">#</th>
                <th className="py-3 px-4 text-left">Amount</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Proof</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {agreement.milestones.map((milestone) => (
                <tr key={milestone.id} className="border-b border-navy-700 hover:bg-navy-700/30">
                  <td className="py-3 px-4 text-white font-mono text-sm">{milestone.id}</td>
                  <td className="py-3 px-4 text-white text-sm">{milestone.amount}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(milestone.status)}`}>
                      {milestone.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {milestone.proof_uri ? (
                      <a
                        href={milestone.proof_uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 text-sm underline"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-gray-500 text-sm">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <MilestoneActions
                      milestone={milestone}
                      agreement={agreement}
                      onSuccess={onUpdate}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    Pending: 'bg-gray-600 text-white',
    Funded: 'bg-blue-600 text-white',
    WorkSubmitted: 'bg-yellow-600 text-white',
    Completed: 'bg-green-600 text-white',
    Disputed: 'bg-red-600 text-white',
    Refunded: 'bg-gray-500 text-white',
  }
  return colors[status] || 'bg-gray-600 text-white'
}
