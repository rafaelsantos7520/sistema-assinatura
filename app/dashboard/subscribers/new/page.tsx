'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import PhoneInput, { isValidPhone } from '@/components/phone-input'

export default function NewSubscriberPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    full_name: '',
    contact_email: '',
    whatsapp_number: '',
    start_date: '',
    end_date: '',
  })

  const validate = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!form.full_name.trim()) return 'Nome completo é obrigatório'
    if (!emailRegex.test(form.contact_email)) return 'E-mail inválido'
    if (!isValidPhone(form.whatsapp_number)) return 'WhatsApp inválido (ex: +55 11 99999-9999)'
    if (!form.start_date) return 'Data de início é obrigatória'
    if (!form.end_date) return 'Data de término é obrigatória'
    if (form.end_date < form.start_date) return 'Data de término não pode ser anterior à data de início'
    return null
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

      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          subscriber_id: subscriber.id,
          start_date: form.start_date,
          end_date: form.end_date,
        })

      if (subscriptionError) throw subscriptionError

      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Erro ao criar assinante')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 no-underline"
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Voltar</span>
      </Link>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">Novo Assinante</h2>

      <form onSubmit={handleSubmit} className="max-w-2xl bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-5">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Data de início *</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Data de término *</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
        >
          <Save size={20} />
          {loading ? 'Salvando...' : 'Cadastrar Assinante'}
        </button>
      </form>
    </div>
  )
}
