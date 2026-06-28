'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import { isSubscriptionActive, getDaysRemaining, addDays, formatDate } from '@/lib/subscription-utils'
import {
  ArrowLeft,
  Calendar,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Mail,
  Phone,
  Save,
  Upload,
  Download,
  X,
  MessageCircle,
} from 'lucide-react'
import Link from 'next/link'
import Modal from '@/components/modal'
import ConfirmDialog from '@/components/confirm-dialog'
import PhoneInput, { isValidPhone, getWhatsAppLink } from '@/components/phone-input'

interface Subscription {
  id: string
  subscriber_id: string
  start_date: string
  end_date: string
  created_at: string
}

interface Receipt {
  id: string
  subscription_id: string
  reference_month: string
  file_url: string
  uploaded_at: string
  signed_url?: string
}

interface Subscriber {
  id: string
  full_name: string
  contact_email: string
  whatsapp_number: string
  created_at: string
  subscriptions: Subscription[]
}

type Tab = 'subscriptions' | 'profile'

export default function SubscriberProfilePage() {
  const [subscriber, setSubscriber] = useState<Subscriber | null>(null)
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('subscriptions')

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null)

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    type: 'confirm' | 'alert'
    title: string
    message: string
    onConfirm?: () => void
    confirmLabel?: string
    confirmVariant?: 'danger' | 'primary'
  }>({ isOpen: false, type: 'confirm', title: '', message: '' })

  const [profileForm, setProfileForm] = useState({
    full_name: '',
    contact_email: '',
    whatsapp_number: '',
  })

  const [subscriptionForm, setSubscriptionForm] = useState({
    start_date: '',
    end_date: '',
  })

  // Receipt upload state
  const [showReceiptUploadModal, setShowReceiptUploadModal] = useState(false)
  const [uploadReceiptSubscriptionId, setUploadReceiptSubscriptionId] = useState<string | null>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptFilePreviewUrl, setReceiptFilePreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null)

  const id = (useParams() as { id: string }).id
  const supabase = createClient()

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    try {
      // Load subscriber + subscriptions
      const { data: subData, error: subError } = await supabase
        .from('subscribers')
        .select('*, subscriptions(*)')
        .eq('id', id)
        .single()

      if (subError) throw subError

      const sortedSubscriptions = (subData.subscriptions || []).sort(
        (a: Subscription, b: Subscription) =>
          new Date(b.end_date).getTime() - new Date(a.end_date).getTime()
      )

      setSubscriber({ ...subData, subscriptions: sortedSubscriptions })
      setProfileForm({
        full_name: subData.full_name,
        contact_email: subData.contact_email,
        whatsapp_number: subData.whatsapp_number,
      })

      // Load all receipts for this subscriber
      const { data: recData, error: recError } = await supabase
        .from('payment_receipts')
        .select('*')
        .eq('subscriber_id', id)
        .order('uploaded_at', { ascending: false })

      if (recError) throw recError

      // Generate signed URLs for receipts
      const receiptsWithUrls = await Promise.all(
        (recData || []).map(async (receipt: any) => {
          try {
            const filePath = receipt.file_url
            if (filePath.startsWith('http')) {
              return { ...receipt, signed_url: filePath }
            }
            const { data } = await supabase.storage
              .from('receipts')
              .createSignedUrl(filePath, 3600)
            return { ...receipt, signed_url: data?.signedUrl || '' }
          } catch {
            return { ...receipt, signed_url: '' }
          }
        })
      )

      setReceipts(receiptsWithUrls)
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err)
    } finally {
      setLoading(false)
    }
  }

  // --- Subscription CRUD ---

  const resetSubscriptionForm = () => {
    setSubscriptionForm({ start_date: '', end_date: '' })
    setEditingSubscription(null)
    setShowSubscriptionModal(false)
  }

  const validateSubscription = () => {
    if (!subscriptionForm.start_date || !subscriptionForm.end_date) return 'Preencha as datas'
    if (subscriptionForm.end_date < subscriptionForm.start_date) return 'Termino nao pode ser anterior ao inicio'
    return null
  }

  const handleSaveSubscription = async (e: React.FormEvent) => {
    e.preventDefault()

    const error = validateSubscription()
    if (error) {
      setConfirmDialog({
        isOpen: true,
        type: 'alert',
        title: 'Erro de validação',
        message: error,
      })
      return
    }

    try {
      if (editingSubscription) {
        const { error } = await supabase
          .from('subscriptions')
          .update({
            start_date: subscriptionForm.start_date,
            end_date: subscriptionForm.end_date,
          })
          .eq('id', editingSubscription.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('subscriptions')
          .insert({
            subscriber_id: id,
            start_date: subscriptionForm.start_date,
            end_date: subscriptionForm.end_date,
          })
        if (error) throw error
      }

      resetSubscriptionForm()
      loadAll()
    } catch (err: any) {
      setConfirmDialog({
        isOpen: true,
        type: 'alert',
        title: 'Erro ao salvar',
        message: err.message || 'Erro ao salvar assinatura',
      })
    }
  }

  const startEditSubscription = (subscription: Subscription) => {
    setEditingSubscription(subscription)
    setSubscriptionForm({
      start_date: subscription.start_date,
      end_date: subscription.end_date,
    })
    setShowSubscriptionModal(true)
  }

  const handleRenewSubscription = async () => {
    setConfirmDialog({
      isOpen: true,
      type: 'confirm',
      title: 'Renovar assinatura',
      message: 'Ativar/renovar usuario com assinatura de 30 dias?',
      confirmLabel: 'Renovar',
      confirmVariant: 'primary',
      onConfirm: async () => {
        const today = new Date()
        const startDate = formatDate(today)
        const endDate = formatDate(addDays(today, 30))

        try {
          const { error } = await supabase.from('subscriptions').insert({
            subscriber_id: id,
            start_date: startDate,
            end_date: endDate,
          })
          if (error) throw error

          loadAll()
        } catch (err: any) {
          setConfirmDialog({
            isOpen: true,
            type: 'alert',
            title: 'Erro ao renovar',
            message: err.message || 'Erro ao renovar assinatura',
          })
        }
      },
    })
  }

  const handleDeleteSubscription = (subscriptionId: string) => {
    setConfirmDialog({
      isOpen: true,
      type: 'confirm',
      title: 'Excluir assinatura',
      message: 'Tem certeza que deseja excluir esta assinatura?',
      confirmLabel: 'Excluir',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await supabase.from('subscriptions').delete().eq('id', subscriptionId)
          loadAll()
        } catch (err: any) {
          setConfirmDialog({
            isOpen: true,
            type: 'alert',
            title: 'Erro ao excluir',
            message: err.message || 'Erro ao excluir assinatura',
          })
        }
      },
    })
  }

  // --- Profile CRUD ---

  const validateProfile = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!profileForm.full_name.trim()) return 'Nome completo é obrigatório'
    if (!emailRegex.test(profileForm.contact_email)) return 'E-mail inválido'
    if (!isValidPhone(profileForm.whatsapp_number)) return 'WhatsApp inválido'
    return null
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    const error = validateProfile()
    if (error) {
      setConfirmDialog({
        isOpen: true,
        type: 'alert',
        title: 'Erro de validação',
        message: error,
      })
      return
    }

    setSavingProfile(true)

    try {
      await supabase
        .from('subscribers')
        .update({
          full_name: profileForm.full_name.trim(),
          contact_email: profileForm.contact_email.trim(),
          whatsapp_number: profileForm.whatsapp_number.trim(),
        })
        .eq('id', id)

      setConfirmDialog({
        isOpen: true,
        type: 'alert',
        title: 'Perfil atualizado',
        message: 'Perfil atualizado com sucesso',
        confirmVariant: 'primary',
      })
      loadAll()
    } catch (err: any) {
      setConfirmDialog({
        isOpen: true,
        type: 'alert',
        title: 'Erro ao atualizar',
        message: err.message || 'Erro ao atualizar perfil',
      })
    } finally {
      setSavingProfile(false)
    }
  }

  // --- Receipt CRUD ---

  const getReferenceMonth = (dateStr: string) => {
    const d = new Date(dateStr)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  }

  const handleUploadReceipt = async (subscriptionId: string, referenceMonth: string) => {
    if (!receiptFile) {
      setConfirmDialog({
        isOpen: true,
        type: 'alert',
        title: 'Arquivo não selecionado',
        message: 'Selecione o arquivo para upload',
      })
      return
    }

    setUploading(true)

    try {
      const fileExt = receiptFile.name.split('.').pop()
      const fileName = `${id}/${subscriptionId}/${referenceMonth}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, receiptFile)

      if (uploadError) throw uploadError

      await supabase.from('payment_receipts').insert({
        subscriber_id: id,
        subscription_id: subscriptionId,
        reference_month: referenceMonth,
        file_url: fileName,
      })

      setReceiptFile(null)
      setReceiptFilePreviewUrl(null)
      setShowReceiptUploadModal(false)
      setUploadReceiptSubscriptionId(null)
      loadAll()
    } catch (err: any) {
      setConfirmDialog({
        isOpen: true,
        type: 'alert',
        title: 'Erro ao enviar',
        message: err.message || 'Erro ao fazer upload',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (file: File | null) => {
    // Limpa preview anterior
    if (receiptFilePreviewUrl) {
      URL.revokeObjectURL(receiptFilePreviewUrl)
    }
    setReceiptFile(file)
    if (file) {
      setReceiptFilePreviewUrl(URL.createObjectURL(file))
    } else {
      setReceiptFilePreviewUrl(null)
    }
  }

  const handleCloseUploadModal = () => {
    if (receiptFilePreviewUrl) {
      URL.revokeObjectURL(receiptFilePreviewUrl)
    }
    setReceiptFile(null)
    setReceiptFilePreviewUrl(null)
    setShowReceiptUploadModal(false)
    setUploadReceiptSubscriptionId(null)
  }

  const handleDeleteReceipt = (receiptId: string, fileUrl: string) => {
    setConfirmDialog({
      isOpen: true,
      type: 'confirm',
      title: 'Excluir comprovante',
      message: 'Tem certeza que deseja excluir este comprovante?',
      confirmLabel: 'Excluir',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          if (!fileUrl.startsWith('http')) {
            await supabase.storage.from('receipts').remove([fileUrl])
          }

          await supabase.from('payment_receipts').delete().eq('id', receiptId)
          loadAll()
        } catch (err: any) {
          setConfirmDialog({
            isOpen: true,
            type: 'alert',
            title: 'Erro ao excluir',
            message: err.message || 'Erro ao excluir comprovante',
          })
        }
      },
    })
  }

  const getReceiptsForSubscription = (subscriptionId: string): Receipt[] => {
    return receipts.filter((r) => r.subscription_id === subscriptionId)
  }

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-')
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    return `${months[parseInt(monthNum) - 1]}/${year}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-muted">Carregando...</div>
      </div>
    )
  }

  if (!subscriber) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted">Assinante nao encontrado</p>
        <Link href="/dashboard" className="text-accent hover:underline mt-2 inline-block">
          Voltar
        </Link>
      </div>
    )
  }

  const activeSubscription = subscriber.subscriptions.find((s) => isSubscriptionActive(s))
  const latestSubscription = subscriber.subscriptions[0]

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'subscriptions', label: 'Assinaturas', icon: Calendar },
    { key: 'profile', label: 'Perfil', icon: User },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary mb-4 no-underline"
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Voltar</span>
      </Link>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-accent font-bold text-lg">
            {subscriber.full_name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary truncate">
            {subscriber.full_name}
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm text-text-muted truncate">{subscriber.contact_email}</span>
            {activeSubscription ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent border-accent/20 flex-shrink-0">
                <CheckCircle2 size={12} />
                Ativo
              </span>
            ) : latestSubscription ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-danger/10 text-danger border-danger/25 flex-shrink-0">
                <XCircle size={12} />
                Vencido
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white/[0.04] text-text-muted border border-border-muted flex-shrink-0">
                <Clock size={12} />
                Inativo
              </span>
            )}
          </div>
        </div>
        <a
          href={getWhatsAppLink(
            subscriber.whatsapp_number,
            `Olá ${subscriber.full_name.split(' ')[0]}, vi que seu plano está chegando ao fim. Gostaria de renová-lo?`
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition no-underline flex-shrink-0"
          title="Enviar mensagem no WhatsApp"
        >
          <MessageCircle size={20} />
          <span className="hidden sm:inline text-sm">Contato</span>
        </a>
      </div>

      {activeSubscription && (
        <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 mb-6">
          <p className="text-accent font-medium">
            Assinatura atual até{' '}
            <strong>{new Date(activeSubscription.end_date).toLocaleDateString('pt-BR')}</strong>
          </p>
          <p className="text-accent/70 text-sm mt-0.5">
            {getDaysRemaining(activeSubscription.end_date) === 0
              ? 'Vence hoje'
              : `Restam ${getDaysRemaining(activeSubscription.end_date)} dias`}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border-default mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition cursor-pointer ${isActive
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-muted hover:text-text-primary hover:border-white/30'
                }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab: Subscriptions */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          {/* Create subscription buttons */}
          <div className="bg-surface rounded-xl shadow-sm border border-border-muted">
            <div className="p-4 sm:p-6">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowSubscriptionModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition cursor-pointer"
                >
                  <Plus size={18} />
                  Nova Assinatura
                </button>
                <button
                  onClick={handleRenewSubscription}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition cursor-pointer"
                >
                  <CheckCircle2 size={18} />
                  Ativar/Renovar usuario
                </button>
              </div>
            </div>
          </div>

          {/* Subscription list */}
          {subscriber.subscriptions.length === 0 ? (
            <div className="bg-surface rounded-xl shadow-sm border border-border-muted py-12 text-center">
              <Calendar size={48} className="mx-auto mb-3 text-text-secondary" />
              <p className="text-text-muted font-medium">Nenhuma assinatura cadastrada</p>
              <p className="text-text-muted text-sm mt-1">Clique em "Nova Assinatura" para começar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriber.subscriptions.map((subscription) => {
                const isActive = isSubscriptionActive(subscription)
                const subReceipts = getReceiptsForSubscription(subscription.id)

                return (
                  <div
                    key={subscription.id}
                    className={`bg-surface rounded-xl shadow-sm border-2 ${isActive ? 'border-accent/30' : 'border-border-muted'
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
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
                                Ativa
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-danger/10 text-danger">
                                Vencida
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-text-muted">
                            {isActive
                              ? `Restam ${getDaysRemaining(subscription.end_date)} dias`
                              : `Vencida há ${Math.abs(getDaysRemaining(subscription.end_date))} dias`}
                          </p>
                          {subReceipts.length > 0 && (
                            <p className="text-xs text-accent mt-1">
                              {subReceipts.length} comprovante{subReceipts.length > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEditSubscription(subscription)}
                            className="px-3 py-1.5 text-sm font-medium bg-accent hover:bg-accent-hover text-white rounded-lg transition cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteSubscription(subscription.id)}
                            className="px-3 py-1.5 text-sm font-medium bg-danger hover:bg-danger-hover text-white rounded-lg transition cursor-pointer"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>

                      {/* Receipts section */}
                      <div className="mt-4 pt-4 border-t border-border-muted">
                        {/* Upload receipt button */}
                        <button
                          onClick={() => {
                            setUploadReceiptSubscriptionId(subscription.id)
                            setReceiptFile(null)
                            setReceiptFilePreviewUrl(null)
                            setShowReceiptUploadModal(true)
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-accent hover:bg-accent-hover text-white rounded-lg transition cursor-pointer"
                        >
                          <Upload size={14} />
                          Adicionar comprovante
                        </button>

                        {/* Receipts list */}
                        {subReceipts.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {subReceipts.map((receipt) => (
                              <div
                                key={receipt.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 px-3 bg-base rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                                    <Download size={14} className="text-accent" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-text-primary">
                                      {formatMonth(receipt.reference_month)}
                                    </p>
                                    <p className="text-xs text-text-muted">
                                      {new Date(receipt.uploaded_at).toLocaleDateString('pt-BR')}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {receipt.signed_url ? (
                                    <button
                                      onClick={() => setPreviewReceiptUrl(receipt.signed_url!)}
                                      className="px-2.5 py-1 text-xs font-medium bg-accent hover:bg-accent-hover text-white rounded-lg transition cursor-pointer"
                                    >
                                      Visualizar
                                    </button>
                                  ) : null}
                                  <button
                                    onClick={() => handleDeleteReceipt(receipt.id, receipt.file_url)}
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
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Profile */}
      {activeTab === 'profile' && (
        <div className="bg-surface rounded-xl shadow-sm border border-border-muted p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
              <span className="text-accent font-bold text-lg">
                {subscriber.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                {subscriber.full_name}
              </h3>
              <p className="text-sm text-text-muted">Dados pessoais do assinante</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="max-w-lg space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Nome completo *</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-base border border-border-default rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none text-text-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">E-mail *</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="email"
                  value={profileForm.contact_email}
                  onChange={(e) => setProfileForm({ ...profileForm, contact_email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-base border border-border-default rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none text-text-primary"
                />
              </div>
            </div>

            <PhoneInput
              value={profileForm.whatsapp_number}
              onChange={(v) => setProfileForm({ ...profileForm, whatsapp_number: v })}
              label="WhatsApp *"
              withIcon
              required
            />

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full bg-accent hover:bg-accent-hover text-white font-medium py-2.5 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save size={18} />
              {savingProfile ? 'Salvando...' : 'Salvar Perfil'}
            </button>
          </form>
        </div>
      )}

      {/* Subscription Modal */}
      <Modal
        isOpen={showSubscriptionModal}
        onClose={resetSubscriptionForm}
        title={editingSubscription ? 'Editar Assinatura' : 'Nova Assinatura'}
      >
        <form onSubmit={handleSaveSubscription} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Data de inicio *</label>
              <input
                type="date"
                value={subscriptionForm.start_date}
                onChange={(e) => setSubscriptionForm({ ...subscriptionForm, start_date: e.target.value })}
                className="w-full px-4 py-2.5 bg-base border border-border-default rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none text-text-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Data de termino *</label>
              <input
                type="date"
                value={subscriptionForm.end_date}
                onChange={(e) => setSubscriptionForm({ ...subscriptionForm, end_date: e.target.value })}
                className="w-full px-4 py-2.5 bg-base border border-border-default rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none text-text-primary"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={resetSubscriptionForm}
              className="px-4 py-2 border border-border-default hover:bg-white/[0.04] text-text-secondary font-medium rounded-lg transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition cursor-pointer"
            >
              {editingSubscription ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Receipt Preview Modal */}
      <Modal
        isOpen={!!previewReceiptUrl}
        onClose={() => setPreviewReceiptUrl(null)}
        title="Comprovante"
      >
        {previewReceiptUrl && (
          <div className="flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewReceiptUrl}
              alt="Comprovante"
              className="max-w-full max-h-[70vh] rounded-lg object-contain"
            />
          </div>
        )}
      </Modal>

      {/* Receipt Upload Modal */}
      <Modal
        isOpen={showReceiptUploadModal}
        onClose={handleCloseUploadModal}
        title="Adicionar Comprovante"
      >
        {uploadReceiptSubscriptionId && (() => {
          const uploadSub = subscriber?.subscriptions.find(s => s.id === uploadReceiptSubscriptionId)
          return (
            <div className="space-y-5">
              {uploadSub && (
                <div className="bg-accent/5 border border-accent/20 rounded-lg px-4 py-3">
                  <p className="text-sm text-accent">
                    <span className="font-medium">Assinatura:</span>{' '}
                    {new Date(uploadSub.start_date).toLocaleDateString('pt-BR')} —{' '}
                    {new Date(uploadSub.end_date).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-xs text-accent/70 mt-0.5">
                    Mês de referência: {getReferenceMonth(uploadSub.start_date)}
                  </p>
                </div>
              )}

              {/* File input */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Selecione o arquivo do comprovante *
                </label>
                <input
                  type="file"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                  accept="image/*,.pdf"
                  className="w-full text-sm text-text-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-accent/10 file:text-accent hover:file:bg-accent/20 cursor-pointer file:cursor-pointer bg-base border border-border-default rounded-lg px-3 py-2 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition"
                />
              </div>

              {/* Image preview */}
              {receiptFilePreviewUrl && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Prévia do comprovante
                  </label>
                  <div className="border border-border-default rounded-lg overflow-hidden bg-base flex items-center justify-center p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={receiptFilePreviewUrl}
                      alt="Prévia do comprovante"
                      className="max-h-48 max-w-full object-contain rounded"
                    />
                  </div>
                  {receiptFile && (
                    <p className="text-xs text-text-muted mt-1.5">
                      {receiptFile.name} ({(receiptFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              )}

              {/* PDF fallback message */}
              {receiptFile && receiptFile.type === 'application/pdf' && (
                <div className="bg-warning/10 border border-warning/25 rounded-lg px-4 py-3">
                  <p className="text-sm text-warning">
                    <span className="font-medium">Arquivo PDF selecionado.</span>{' '}
                    A prévia não está disponível para PDF, mas o arquivo será enviado normalmente.
                  </p>
                </div>
              )}

              {/* No file selected message */}
              {!receiptFile && (
                <div className="bg-base border border-border-muted rounded-lg px-4 py-8 text-center">
                  <Upload size={32} className="mx-auto mb-2 text-text-muted" />
                  <p className="text-sm text-text-muted">
                    Nenhum arquivo selecionado
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Selecione uma imagem ou PDF do comprovante
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-border-default">
                <button
                  onClick={handleCloseUploadModal}
                  disabled={uploading}
                  className="px-4 py-2 border border-border-default hover:bg-white/[0.04] text-text-secondary font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (uploadReceiptSubscriptionId && uploadSub) {
                      handleUploadReceipt(uploadReceiptSubscriptionId, getReferenceMonth(uploadSub.start_date))
                    }
                  }}
                  disabled={uploading || !receiptFile}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Upload size={16} />
                  {uploading ? 'Enviando...' : 'Enviar Comprovante'}
                </button>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* Confirm / Alert Dialog */}
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
