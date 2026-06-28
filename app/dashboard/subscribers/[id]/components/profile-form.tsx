'use client'

import { User, Mail, Save } from 'lucide-react'
import PhoneInput from '@/components/phone-input'
import { Subscriber } from './types'

interface ProfileFormProps {
  subscriber: Subscriber
  form: {
    full_name: string
    contact_email: string
    whatsapp_number: string
  }
  setForm: (form: { full_name: string; contact_email: string; whatsapp_number: string }) => void
  saving: boolean
  onSubmit: (e: React.FormEvent) => void
}

export default function ProfileForm({
  subscriber,
  form,
  setForm,
  saving,
  onSubmit,
}: ProfileFormProps) {
  return (
    <div className="bg-surface rounded-xl shadow-sm border border-border-muted p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center">
          <span className="text-brand-primary font-bold text-lg">
            {subscriber.full_name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text-primary">
            {subscriber.full_name}
          </h3>
          <p className="text-sm text-text-secondary">Dados pessoais do assinante</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="max-w-lg space-y-5">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Nome completo *
          </label>
          <div className="relative">
            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 bg-base border border-border-default rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none text-text-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            E-mail *
          </label>
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="email"
              value={form.contact_email}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 bg-base border border-border-default rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none text-text-primary"
            />
          </div>
        </div>

        <PhoneInput
          value={form.whatsapp_number}
          onChange={(v) => setForm({ ...form, whatsapp_number: v })}
          label="WhatsApp *"
          withIcon
          required
        />

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-brand-secondary hover:bg-brand-secondary-hover text-white font-medium py-2.5 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
        >
          <Save size={18} />
          {saving ? 'Salvando...' : 'Salvar Perfil'}
        </button>
      </form>
    </div>
  )
}
