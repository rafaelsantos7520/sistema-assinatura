'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, addDays } from '@/lib/subscription-utils'
import { Save } from 'lucide-react'
import PhoneInput, { isValidPhone } from '@/components/phone-input'

interface NewSubscriberModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function NewSubscriberModal({ isOpen, onClose, onSuccess }: NewSubscriberModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const [form, setForm] = useState({
    full_name: '',
    contact_email: '',
    whatsapp_number: '',
  })
  const [activeOnCreate, setActiveOnCreate] = useState(true)

  if (!isOpen) return null

  const validate = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!form.full_name.trim()) return 'Nome completo é obrigatório'
    if (!emailRegex.test(form.contact_email)) return 'E-mail inválido'
    if (!isValidPhone(form.whatsapp_number)) return 'WhatsApp inválido'
    return null
  }

  const resetForm = () => {
    setForm({ full_name: '', contact_email: '', whatsapp_number: '' })
    setActiveOnCreate(true)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const { data: subscriber, error: subError } = await supabase
        .from('subscribers')
        .insert({
          full_name: form.full_name.trim(),
          contact_email: form.contact_email.trim(),
          whatsapp_number: form.whatsapp_number.trim(),
        })
        .select()
        .single()

      if (subError) throw subError

      if (activeOnCreate) {
        const today = new Date()
        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .insert({
            subscriber_id: subscriber.id,
            start_date: formatDate(today),
            end_date: formatDate(addDays(today, 30)),
          })

        if (subscriptionError) throw subscriptionError
      }

      resetForm()
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Erro ao criar assinante')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-overlay rounded-xl shadow-xl max-w-lg w-full mx-4 p-6 border border-border-muted">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Novo Assinante</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-white/[0.06] rounded-lg transition cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-danger/10 border border-danger/25 text-danger px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Nome completo *</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full px-4 py-2.5 bg-base border border-border-default rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition text-text-primary placeholder-text-secondary"
              placeholder="João da Silva"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">E-mail de contato *</label>
            <input
              type="email"
              value={form.contact_email}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              className="w-full px-4 py-2.5 bg-base border border-border-default rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition text-text-primary placeholder-text-secondary"
              placeholder="joao@email.com"
            />
          </div>

          <PhoneInput
            value={form.whatsapp_number}
            onChange={(v) => setForm({ ...form, whatsapp_number: v })}
            label="WhatsApp *"
            required
          />

          <label className="flex items-center gap-3 p-3 bg-base rounded-lg cursor-pointer select-none">
            <input
              type="checkbox"
              checked={activeOnCreate}
              onChange={(e) => setActiveOnCreate(e.target.checked)}
              className="w-4 h-4 accent-brand-primary border-border-default rounded cursor-pointer"
            />
            <div>
              <span className="text-sm font-medium text-text-primary">Ativar assinatura por 30 dias</span>
              <p className="text-xs text-text-secondary mt-0.5">Cria automaticamente uma assinatura válida por 30 dias</p>
            </div>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border-default hover:bg-white/[0.06] text-text-secondary font-medium rounded-lg transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-brand-primary hover:bg-brand-primary-hover text-on-primary font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              <Save size={16} />
              {loading ? 'Salvando...' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
