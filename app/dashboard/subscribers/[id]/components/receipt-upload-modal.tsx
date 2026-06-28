'use client'

import { Upload } from 'lucide-react'
import Modal from '@/components/modal'
import { Subscription } from './types'

interface ReceiptUploadModalProps {
  isOpen: boolean
  onClose: () => void
  subscriptionId: string | null
  subscriptions: Subscription[]
  receiptFile: File | null
  previewUrl: string | null
  uploading: boolean
  onFileSelect: (file: File | null) => void
  onUpload: (subscriptionId: string, referenceMonth: string) => void
}

function getReferenceMonth(dateStr: string) {
  const d = new Date(dateStr)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export default function ReceiptUploadModal({
  isOpen,
  onClose,
  subscriptionId,
  subscriptions,
  receiptFile,
  previewUrl,
  uploading,
  onFileSelect,
  onUpload,
}: ReceiptUploadModalProps) {
  const uploadSub = subscriptions.find((s) => s.id === subscriptionId)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Comprovante">
      <div className="space-y-5">
        {uploadSub && (
          <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-lg px-4 py-3">
            <p className="text-sm text-brand-primary">
              <span className="font-medium">Assinatura:</span>{' '}
              {new Date(uploadSub.start_date).toLocaleDateString('pt-BR')} —{' '}
              {new Date(uploadSub.end_date).toLocaleDateString('pt-BR')}
            </p>
            <p className="text-xs text-brand-primary/80 mt-0.5">
              Mês de referência: {getReferenceMonth(uploadSub.start_date)}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Selecione o arquivo do comprovante *
          </label>
          <input
            type="file"
            onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
            accept="image/*,.pdf"
            className="w-full text-sm text-text-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20 cursor-pointer file:cursor-pointer bg-base border border-border-default rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition"
          />
        </div>

        {previewUrl && (
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Prévia do comprovante
            </label>
            <div className="border border-border-default rounded-lg overflow-hidden bg-base flex items-center justify-center p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Prévia do comprovante"
                className="max-h-48 max-w-full object-contain rounded"
              />
            </div>
            {receiptFile && (
              <p className="text-xs text-text-secondary mt-1.5">
                {receiptFile.name} ({(receiptFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
        )}

        {receiptFile && receiptFile.type === 'application/pdf' && (
          <div className="bg-warning/10 border border-warning/25 rounded-lg px-4 py-3">
            <p className="text-sm text-warning">
              <span className="font-medium">Arquivo PDF selecionado.</span>{' '}
              A prévia não está disponível para PDF, mas o arquivo será enviado normalmente.
            </p>
          </div>
        )}

        {!receiptFile && (
          <div className="bg-base border border-border-muted rounded-lg px-4 py-8 text-center">
            <Upload size={32} className="mx-auto mb-2 text-text-secondary" />
            <p className="text-sm text-text-secondary">
              Nenhum arquivo selecionado
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              Selecione uma imagem ou PDF do comprovante
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border-default">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 border border-border-default hover:bg-white/[0.04] text-text-secondary font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              if (subscriptionId && uploadSub) {
                onUpload(subscriptionId, getReferenceMonth(uploadSub.start_date))
              }
            }}
            disabled={uploading || !receiptFile}
            className="inline-flex items-center gap-2 px-5 py-2 bg-brand-primary hover:bg-brand-primary-hover text-on-primary font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Upload size={16} />
            {uploading ? 'Enviando...' : 'Enviar Comprovante'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
