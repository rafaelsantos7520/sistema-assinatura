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
        <div className="text-gray-400">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assinantes</h2>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie os assinantes e suas assinaturas
          </p>
        </div>
        <button
          onClick={() => setShowNewSubscriberModal(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg transition cursor-pointer"
        >
          <Plus size={20} />
          Novo Assinante
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
            <Users size={24} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500">Total de assinantes</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
            <UserCheck size={24} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            <p className="text-sm text-gray-500">Assinantes ativos</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
            <UserX size={24} className="text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
            <p className="text-sm text-gray-500">Assinantes inativos</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou WhatsApp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 placeholder-gray-400"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700 bg-white cursor-pointer"
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <UserCircle size={56} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-medium">Nenhum assinante encontrado</p>
            <p className="text-gray-400 text-sm mt-1">
              {searchTerm || filterStatus !== 'all' ? 'Tente ajustar os filtros' : 'Clique em "Novo Assinante" para começar'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">E-mail</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">WhatsApp</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Vigência</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((subscriber) => {
                  const activeSub = subscriber.subscriptions?.find((s) => isSubscriptionActive(s))
                  const latestSub = subscriber.subscriptions?.sort(
                    (a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime()
                  )[0]

                  const status = activeSub
                    ? { label: 'Ativo', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
                    : { label: 'Inativo', classes: 'bg-gray-100 text-gray-600 border-gray-200' }

                  return (
                    <tr key={subscriber.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-700 font-semibold text-sm">
                              {subscriber.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <Link
                              href={`/dashboard/subscribers/${subscriber.id}`}
                              className="font-medium text-gray-900 block hover:text-blue-600 transition no-underline"
                            >
                              {subscriber.full_name}
                            </Link>
                            <span className="text-xs text-gray-400 md:hidden">{subscriber.contact_email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-500 hidden md:table-cell">{subscriber.contact_email}</td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">{subscriber.whatsapp_number}</td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-500 hidden lg:table-cell">
                        {latestSub ? (
                          <>
                            {new Date(latestSub.start_date).toLocaleDateString('pt-BR')}
                            <span className="text-gray-400 mx-1">-</span>
                            {new Date(latestSub.end_date).toLocaleDateString('pt-BR')}
                          </>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${status.classes}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <a
                            href={getWhatsAppLink(
                              subscriber.whatsapp_number,
                              `Olá ${subscriber.full_name.split(' ')[0]}, gostaria de falar sobre sua assinatura.`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
                            title="Enviar WhatsApp"
                          >
                            <MessageCircle size={16} />
                          </a>
                          <Link
                            href={`/dashboard/subscribers/${subscriber.id}`}
                            className="px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition no-underline"
                          >
                            Ver
                          </Link>
                          <button
                            onClick={() => handleDelete(subscriber.id)}
                            className="px-3 py-1.5 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition cursor-pointer"
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
        )}

        {filtered.length > 0 && (
          <div className="px-4 sm:px-6 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
            <p className="text-sm text-gray-500">
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
