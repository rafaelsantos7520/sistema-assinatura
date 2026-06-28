'use client'

import { useEffect } from 'react'
import Modal from '@/components/modal'
import { Subscription } from './types'

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  editingSubscription: Subscription | null
  form: { start_date: string; end_date: string }
  setForm: (form: { start_date: string; end_date: string }) => void
  onSubmit: (e: React.FormEvent) => void
}

export default function SubscriptionModal({
  isOpen,
  onClose,
  editingSubscription,
  form,
  setForm,
  onSubmit,
}: SubscriptionModalProps) {
  useEffect(() => {
    if (!isOpen) {
      setForm({ start_date: '', end_date: '' })
    }
  }, [isOpen, setForm])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingSubscription ? 'Editar Assinatura' : 'Nova Assinatura'}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Data de início *
            </label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              className="w-full px-4 py-2.5 bg-base border border-border-default rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none text-text-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Data de término *
            </label>
            <input
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              className="w-full px-4 py-2.5 bg-base border border-border-default rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none text-text-primary"
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border-default hover:bg-white/[0.04] text-text-secondary font-medium rounded-lg transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-brand-primary hover:bg-brand-primary-hover text-on-primary font-medium rounded-lg transition cursor-pointer"
          >
            {editingSubscription ? 'Salvar' : 'Criar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
