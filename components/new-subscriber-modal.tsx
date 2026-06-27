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
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Novo Assinante</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome completo *</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 placeholder-gray-400"
              placeholder="João da Silva"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail de contato *</label>
            <input
              type="email"
              value={form.contact_email}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 placeholder-gray-400"
              placeholder="joao@email.com"
            />
          </div>

          <PhoneInput
            value={form.whatsapp_number}
            onChange={(v) => setForm({ ...form, whatsapp_number: v })}
            label="WhatsApp *"
            required
          />

          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer select-none">
            <input
              type="checkbox"
              checked={activeOnCreate}
              onChange={(e) => setActiveOnCreate(e.target.checked)}
              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
            />
            <div>
              <span className="text-sm font-medium text-gray-800">Ativar assinatura por 30 dias</span>
              <p className="text-xs text-gray-500 mt-0.5">Cria automaticamente uma assinatura válida por 30 dias</p>
            </div>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
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
