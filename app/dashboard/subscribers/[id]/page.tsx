'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import {
  isSubscriptionActive,
  getDaysRemaining,
  addDays,
  formatDate,
} from '@/lib/subscription-utils'
import {
  ArrowLeft,
  Calendar,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  MessageCircle,
} from 'lucide-react'
import Link from 'next/link'
import Modal from '@/components/modal'
import ConfirmDialog from '@/components/confirm-dialog'
import { getWhatsAppLink } from '@/components/phone-input'
import { Subscriber, Subscription, Receipt, Tab, ConfirmDialogState } from './components/types'
import SubscriptionModal from './components/subscription-modal'
import ReceiptUploadModal from './components/receipt-upload-modal'
import SubscriptionCard from './components/subscription-card'
import ProfileForm from './components/profile-form'

const tabs: { key: Tab; label: string; icon: typeof User }[] = [
  { key: 'subscriptions', label: 'Assinaturas', icon: Calendar },
  { key: 'profile', label: 'Perfil', icon: User },
]

export default function SubscriberProfilePage() {
  const [subscriber, setSubscriber] = useState<Subscriber | null>(null)
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('subscriptions')

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null)

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
  })

  const [profileForm, setProfileForm] = useState({
    full_name: '',
    contact_email: '',
    whatsapp_number: '',
  })

  const [subscriptionForm, setSubscriptionForm] = useState({
    start_date: '',
    end_date: '',
  })

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

      const { data: recData, error: recError } = await supabase
        .from('payment_receipts')
        .select('*')
        .eq('subscriber_id', id)
        .order('uploaded_at', { ascending: false })

      if (recError) throw recError

      const receiptsWithUrls = await Promise.all(
        (recData || []).map(async (receipt: Receipt) => {
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
    if (subscriptionForm.end_date < subscriptionForm.start_date)
      return 'Término não pode ser anterior ao início'
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
        const { error } = await supabase.from('subscriptions').insert({
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
      message: 'Ativar/renovar usuário com assinatura de 30 dias?',
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

      handleCloseUploadModal()
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Carregando...</div>
      </div>
    )
  }

  if (!subscriber) {
    return (
      <div className="text-center py-16">
        <p className="text-text-secondary">Assinante não encontrado</p>
        <Link
          href="/dashboard"
          className="text-brand-primary hover:underline mt-2 inline-block"
        >
          Voltar
        </Link>
      </div>
    )
  }

  const activeSubscription = subscriber.subscriptions.find((s) =>
    isSubscriptionActive(s)
  )
  const latestSubscription = subscriber.subscriptions[0]

  return (
    <div className="max-w-7xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-4 no-underline"
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Voltar</span>
      </Link>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 bg-brand-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-brand-primary font-bold text-lg">
            {subscriber.full_name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary truncate">
            {subscriber.full_name}
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm text-text-secondary truncate">
              {subscriber.contact_email}
            </span>
            {activeSubscription ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-brand-primary/10 text-brand-primary border-brand-primary/20 flex-shrink-0">
                <CheckCircle2 size={12} />
                Ativo
              </span>
            ) : latestSubscription ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-danger/10 text-danger border-danger/25 flex-shrink-0">
                <XCircle size={12} />
                Vencido
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white/[0.04] text-text-secondary border border-border-muted flex-shrink-0">
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
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-secondary hover:bg-brand-secondary-hover text-white font-medium rounded-lg transition no-underline flex-shrink-0"
          title="Enviar mensagem no WhatsApp"
        >
          <MessageCircle size={20} />
          <span className="hidden sm:inline text-sm">Contato</span>
        </a>
      </div>

      {activeSubscription && (
        <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-lg p-4 mb-6">
          <p className="text-brand-primary font-medium">
            Assinatura atual até{' '}
            <strong>{new Date(activeSubscription.end_date).toLocaleDateString('pt-BR')}</strong>
          </p>
          <p className="text-text-secondary text-sm mt-0.5">
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
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-white/30'
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
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-on-primary font-medium rounded-lg transition cursor-pointer"
                >
                  <Plus size={18} />
                  Nova Assinatura
                </button>
                <button
                  onClick={handleRenewSubscription}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-secondary hover:bg-brand-secondary-hover text-white font-medium rounded-lg transition cursor-pointer"
                >
                  <CheckCircle2 size={18} />
                  Ativar/Renovar usuário
                </button>
              </div>
            </div>
          </div>

          {/* Subscription list */}
          {subscriber.subscriptions.length === 0 ? (
            <div className="bg-surface rounded-xl shadow-sm border border-border-muted py-12 text-center">
              <Calendar size={48} className="mx-auto mb-3 text-text-secondary" />
              <p className="text-text-secondary font-medium">
                Nenhuma assinatura cadastrada
              </p>
              <p className="text-text-secondary text-sm mt-1">
                Clique em &quot;Nova Assinatura&quot; para começar
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriber.subscriptions.map((subscription) => (
                <SubscriptionCard
                  key={subscription.id}
                  subscription={subscription}
                  receipts={getReceiptsForSubscription(subscription.id)}
                  onEdit={startEditSubscription}
                  onDelete={handleDeleteSubscription}
                  onUploadClick={(subscriptionId) => {
                    setUploadReceiptSubscriptionId(subscriptionId)
                    setReceiptFile(null)
                    setReceiptFilePreviewUrl(null)
                    setShowReceiptUploadModal(true)
                  }}
                  onPreview={setPreviewReceiptUrl}
                  onDeleteReceipt={handleDeleteReceipt}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Profile */}
      {activeTab === 'profile' && (
        <ProfileForm
          subscriber={subscriber}
          form={profileForm}
          setForm={setProfileForm}
          saving={savingProfile}
          onSubmit={handleSaveProfile}
        />
      )}

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={resetSubscriptionForm}
        editingSubscription={editingSubscription}
        form={subscriptionForm}
        setForm={setSubscriptionForm}
        onSubmit={handleSaveSubscription}
      />

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

      <ReceiptUploadModal
        isOpen={showReceiptUploadModal}
        onClose={handleCloseUploadModal}
        subscriptionId={uploadReceiptSubscriptionId}
        subscriptions={subscriber.subscriptions}
        receiptFile={receiptFile}
        previewUrl={receiptFilePreviewUrl}
        uploading={uploading}
        onFileSelect={handleFileSelect}
        onUpload={handleUploadReceipt}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
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
