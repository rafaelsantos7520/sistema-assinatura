'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSubscriptionActive } from '@/lib/subscription-utils'
import Link from 'next/link'
import { Plus, Search, UserCircle, Users, UserCheck, UserX, MessageCircle } from 'lucide-react'
import ConfirmDialog from '@/components/confirm-dialog'
import { getWhatsAppLink } from '@/components/phone-input'
import NewSubscriberModal from '@/components/new-subscriber-modal'

interface Subscriber {
  id: string
  full_name: string
  contact_email: string
  whatsapp_number: string
  created_at: string
  subscriptions: {
    id: string
    start_date: string
    end_date: string
  }[]
}

export default function DashboardPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [filtered, setFiltered] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const supabase = createClient()

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    type: 'confirm' | 'alert'
    title: string
    message: string
    onConfirm?: () => void
    confirmLabel?: string
    confirmVariant?: 'danger' | 'primary'
  }>({ isOpen: false, type: 'confirm', title: '', message: '' })

  const [showNewSubscriberModal, setShowNewSubscriberModal] = useState(false)

  useEffect(() => {
    loadSubscribers()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [subscribers, searchTerm, filterStatus])

  const loadSubscribers = async () => {
    try {
      const { data, error } = await supabase
        .from('subscribers')
        .select(`
          *,
          subscriptions (*)
        `)
        .order('full_name', { ascending: true })

      if (error) throw error
      setSubscribers(data || [])
    } catch (error) {
      console.error('Erro ao carregar assinantes:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let result = subscribers

    if (searchTerm) {
      result = result.filter(
        (s) =>
          s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.whatsapp_number.includes(searchTerm)
      )
    }

    if (filterStatus === 'active') {
      result = result.filter((s) =>
        s.subscriptions?.some((sub) => isSubscriptionActive(sub))
      )
    } else if (filterStatus === 'inactive') {
      result = result.filter(
        (s) => !s.subscriptions?.some((sub) => isSubscriptionActive(sub))
      )
    }

    setFiltered(result)
  }

  const handleDelete = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      type: 'confirm',
      title: 'Excluir assinante',
      message: 'Tem certeza que deseja excluir este assinante?',
      confirmLabel: 'Excluir',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('subscribers').delete().eq('id', id)
          if (error) throw error
          setSubscribers(subscribers.filter((s) => s.id !== id))
        } catch (error) {
          setConfirmDialog({
            isOpen: true,
            type: 'alert',
            title: 'Erro ao excluir',
            message: 'Erro ao excluir assinante',
          })
        }
      },
    })
  }

  const stats = {
    total: subscribers.length,
    active: subscribers.filter((s) =>
      s.subscriptions?.some((sub) => isSubscriptionActive(sub))
    ).length,
    inactive: subscribers.filter(
      (s) => !s.subscriptions?.some((sub) => isSubscriptionActive(sub))
    ).length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-muted">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Assinantes</h2>
          <p className="text-sm text-text-muted mt-1">
            Gerencie os assinantes e suas assinaturas
          </p>
        </div>
        <button
          onClick={() => setShowNewSubscriberModal(true)}
          className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold px-4 py-2.5 rounded-lg transition cursor-pointer"
        >
          <Plus size={20} />
          Novo Assinante
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl shadow-sm border border-border-muted p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
            <Users size={24} className="text-accent" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
            <p className="text-sm text-text-muted">Total de assinantes</p>
          </div>
        </div>

        <div className="bg-surface rounded-xl shadow-sm border border-border-muted p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
            <UserCheck size={24} className="text-accent" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{stats.active}</p>
            <p className="text-sm text-text-muted">Assinantes ativos</p>
          </div>
        </div>

        <div className="bg-surface rounded-xl shadow-sm border border-border-muted p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-danger/10 rounded-xl flex items-center justify-center">
            <UserX size={24} className="text-danger" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{stats.inactive}</p>
            <p className="text-sm text-text-muted">Assinantes inativos</p>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-border-muted">
        <div className="p-4 sm:p-6 border-b border-border-muted">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Buscar por nome ou WhatsApp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-base border border-border-default rounded-lg focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none transition text-text-primary placeholder-text-muted"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2.5 bg-base border border-border-default rounded-lg focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none text-text-primary cursor-pointer"
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <UserCircle size={56} className="mx-auto mb-4 text-text-muted" />
            <p className="text-text-secondary font-medium">Nenhum assinante encontrado</p>
            <p className="text-text-muted text-sm mt-1">
              {searchTerm || filterStatus !== 'all' ? 'Tente ajustar os filtros' : 'Clique em "Novo Assinante" para começar'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile: Card layout */}
            <div className="divide-y divide-border-muted md:hidden">
              {filtered.map((subscriber) => {
                const activeSub = subscriber.subscriptions?.find((s) => isSubscriptionActive(s))
                const latestSub = subscriber.subscriptions?.sort(
                  (a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime()
                )[0]

                return (
                  <div key={subscriber.id} className="px-4 py-4 sm:px-6 hover:bg-white/[0.02] transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-accent font-semibold text-sm">
                            {subscriber.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/dashboard/subscribers/${subscriber.id}`}
                            className="font-medium text-text-primary hover:text-accent transition no-underline block truncate"
                          >
                            {subscriber.full_name}
                          </Link>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                            <span className="text-xs text-text-muted truncate">{subscriber.whatsapp_number}</span>
                            <span className="text-xs text-text-muted truncate">{subscriber.contact_email}</span>
                          </div>
                          {latestSub && (
                            <p className="text-xs text-text-muted mt-0.5">
                              {new Date(latestSub.start_date).toLocaleDateString('pt-BR')} - {new Date(latestSub.end_date).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {activeSub ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20">
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white/[0.06] text-text-muted border border-border-muted">
                            Inativo
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <a
                        href={getWhatsAppLink(
                          subscriber.whatsapp_number,
                          `Olá ${subscriber.full_name.split(' ')[0]}, gostaria de falar sobre sua assinatura.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-accent hover:bg-accent-hover text-white rounded-lg transition"
                        title="Enviar WhatsApp"
                      >
                        <MessageCircle size={16} />
                      </a>
                      <Link
                        href={`/dashboard/subscribers/${subscriber.id}`}
                        className="px-3 py-1.5 text-sm font-medium bg-accent hover:bg-accent-hover text-white rounded-lg transition no-underline"
                      >
                        Ver
                      </Link>
                      <button
                        onClick={() => handleDelete(subscriber.id)}
                        className="px-3 py-1.5 text-sm font-medium bg-danger hover:bg-danger-hover text-white rounded-lg transition cursor-pointer"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop: Table layout */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-muted">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">E-mail</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">WhatsApp</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider hidden lg:table-cell">Vigência</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-muted">
                  {filtered.map((subscriber) => {
                    const activeSub = subscriber.subscriptions?.find((s) => isSubscriptionActive(s))
                    const latestSub = subscriber.subscriptions?.sort(
                      (a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime()
                    )[0]

                    return (
                      <tr key={subscriber.id} className="hover:bg-white/[0.02] transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-accent font-semibold text-sm">
                                {subscriber.full_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <Link
                              href={`/dashboard/subscribers/${subscriber.id}`}
                              className="font-medium text-text-primary hover:text-accent transition no-underline"
                            >
                              {subscriber.full_name}
                            </Link>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-muted">{subscriber.contact_email}</td>
                        <td className="px-6 py-4 text-sm text-text-muted">{subscriber.whatsapp_number}</td>
                        <td className="px-6 py-4 text-sm text-text-muted hidden lg:table-cell">
                          {latestSub ? (
                            <>
                              {new Date(latestSub.start_date).toLocaleDateString('pt-BR')}
                              <span className="text-text-muted mx-1">-</span>
                              {new Date(latestSub.end_date).toLocaleDateString('pt-BR')}
                            </>
                          ) : (
                            <span className="text-text-muted">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {activeSub ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20">
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/[0.06] text-text-muted border border-border-muted">
                              Inativo
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <a
                              href={getWhatsAppLink(
                                subscriber.whatsapp_number,
                                `Olá ${subscriber.full_name.split(' ')[0]}, gostaria de falar sobre sua assinatura.`
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 bg-accent hover:bg-accent-hover text-white rounded-lg transition"
                              title="Enviar WhatsApp"
                            >
                              <MessageCircle size={16} />
                            </a>
                            <Link
                              href={`/dashboard/subscribers/${subscriber.id}`}
                              className="px-3 py-1.5 text-sm font-medium bg-accent hover:bg-accent-hover text-white rounded-lg transition no-underline"
                            >
                              Ver
                            </Link>
                            <button
                              onClick={() => handleDelete(subscriber.id)}
                              className="px-3 py-1.5 text-sm font-medium bg-danger hover:bg-danger-hover text-white rounded-lg transition cursor-pointer"
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {filtered.length > 0 && (
          <div className="px-4 sm:px-6 py-3 border-t border-border-muted bg-white/[0.02] rounded-b-xl">
            <p className="text-sm text-text-muted">
              Exibindo {filtered.length} de {subscribers.length} assinante{subscribers.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      <NewSubscriberModal
        isOpen={showNewSubscriberModal}
        onClose={() => setShowNewSubscriberModal(false)}
        onSuccess={loadSubscribers}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmLabel={confirmDialog.confirmLabel}
        confirmVariant={confirmDialog.confirmVariant}
      />
    </div>
  )
}
