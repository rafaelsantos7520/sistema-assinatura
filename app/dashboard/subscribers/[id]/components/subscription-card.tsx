'use client'

import { Upload, Download, Calendar, CheckCircle2, XCircle } from 'lucide-react'
import { isSubscriptionActive, getDaysRemaining } from '@/lib/subscription-utils'
import { Subscription, Receipt } from './types'

interface SubscriptionCardProps {
  subscription: Subscription
  receipts: Receipt[]
  onEdit: (subscription: Subscription) => void
  onDelete: (subscriptionId: string) => void
  onUploadClick: (subscriptionId: string) => void
  onPreview: (url: string) => void
  onDeleteReceipt: (receiptId: string, fileUrl: string) => void
}

function formatMonth(month: string) {
  const [, monthNum] = month.split('-')
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${months[parseInt(monthNum) - 1]}`
}

function formatMonthYear(month: string) {
  const [year, monthNum] = month.split('-')
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${months[parseInt(monthNum) - 1]}/${year}`
}

export default function SubscriptionCard({
  subscription,
  receipts,
  onEdit,
  onDelete,
  onUploadClick,
  onPreview,
  onDeleteReceipt,
}: SubscriptionCardProps) {
  const isActive = isSubscriptionActive(subscription)
  const daysRemaining = getDaysRemaining(subscription.end_date)

  return (
    <div
      className={`bg-surface rounded-xl shadow-sm border-2 ${isActive ? 'border-brand-primary/30' : 'border-border-muted'
        }`}
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-text-primary">
                {new Date(subscription.start_date).toLocaleDateString('pt-BR')} -{' '}
                {new Date(subscription.end_date).toLocaleDateString('pt-BR')}
              </span>
              {isActive ? (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-primary/10 text-brand-primary">
                  Ativa
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-danger/10 text-danger">
                  Vencida
                </span>
              )}
            </div>
            <p className="text-sm text-text-secondary">
              {isActive
                ? `Restam ${daysRemaining} dias`
                : `Vencida há ${Math.abs(daysRemaining)} dias`}
            </p>
            {receipts.length > 0 && (
              <p className="text-xs text-brand-primary mt-1">
                {receipts.length} comprovante{receipts.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(subscription)}
              className="px-3 py-1.5 text-sm font-medium bg-white/[0.08] hover:bg-white/[0.12] text-text-primary border border-border-default rounded-lg transition cursor-pointer"
            >
              Editar
            </button>
            <button
              onClick={() => onDelete(subscription.id)}
              className="px-3 py-1.5 text-sm font-medium bg-danger hover:bg-danger-hover text-white rounded-lg transition cursor-pointer"
            >
              Excluir
            </button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border-muted">
          <button
            onClick={() => onUploadClick(subscription.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-brand-primary hover:bg-brand-primary-hover text-on-primary rounded-lg transition cursor-pointer"
          >
            <Upload size={14} />
            Adicionar comprovante
          </button>

          {receipts.length > 0 && (
            <div className="mt-3 space-y-2">
              {receipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 px-3 bg-base rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-primary/10 rounded-lg flex items-center justify-center">
                      <Download size={14} className="text-brand-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {formatMonthYear(receipt.reference_month)}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {new Date(receipt.uploaded_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {receipt.signed_url && (
                      <button
                        onClick={() => onPreview(receipt.signed_url!)}
                        className="px-2.5 py-1 text-xs font-medium bg-brand-secondary hover:bg-brand-secondary-hover text-white rounded-lg transition cursor-pointer"
                      >
                        Visualizar
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteReceipt(receipt.id, receipt.file_url)}
                      className="px-2.5 py-1 text-xs font-medium bg-danger hover:bg-danger-hover text-white rounded-lg transition cursor-pointer"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
