export interface Subscription {
  id: string
  subscriber_id: string
  start_date: string
  end_date: string
  created_at: string
}

export interface Receipt {
  id: string
  subscription_id: string
  reference_month: string
  file_url: string
  uploaded_at: string
  signed_url?: string
}

export interface Subscriber {
  id: string
  full_name: string
  contact_email: string
  whatsapp_number: string
  created_at: string
  subscriptions: Subscription[]
}

export type Tab = 'subscriptions' | 'profile'

export interface ConfirmDialogState {
  isOpen: boolean
  type: 'confirm' | 'alert'
  title: string
  message: string
  onConfirm?: () => void
  confirmLabel?: string
  confirmVariant?: 'danger' | 'primary'
}
