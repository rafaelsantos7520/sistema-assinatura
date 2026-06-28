'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSubscriptionActive, getDaysRemaining } from '@/lib/subscription-utils'
import Link from 'next/link'
import { ArrowLeft, AlertCircle, Bell } from 'lucide-react'

interface Alert {
  id: string
  full_name: string
  whatsapp_number: string
  end_date: string
  days_remaining: number
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('subscribers')
        .select(`
          id,
          full_name,
          whatsapp_number,
          subscriptions (
            id,
            end_date
          )
        `)

      if (error) throw error

      const alertsData: Alert[] = []

      data?.forEach((subscriber) => {
        const activeSubscription = subscriber.subscriptions?.find((sub: any) =>
          isSubscriptionActive(sub)
        )

        if (!activeSubscription) return

        const daysRemaining = getDaysRemaining(activeSubscription.end_date)

        if (daysRemaining >= 0 && daysRemaining <= 7) {
          alertsData.push({
            id: subscriber.id,
            full_name: subscriber.full_name,
            whatsapp_number: subscriber.whatsapp_number,
            end_date: activeSubscription.end_date,
            days_remaining: daysRemaining,
          })
        }
      })

      alertsData.sort((a, b) => a.days_remaining - b.days_remaining)
      setAlerts(alertsData)
    } catch (error) {
      console.error('Erro ao carregar alertas:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-muted">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary mb-6 no-underline"
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Voltar</span>
      </Link>

      <h2 className="text-2xl font-bold text-text-primary mb-6">Alertas de Vencimento</h2>

      {alerts.length === 0 ? (
        <div className="bg-surface rounded-xl shadow-sm border border-border-muted py-16 text-center">
          <Bell size={56} className="mx-auto mb-4 text-text-muted" />
          <p className="text-text-secondary font-medium">Nenhuma assinatura vencendo nos próximos 7 dias</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-xl shadow-sm p-6 ${alert.days_remaining <= 3 ? 'bg-danger/10 border border-danger/25' : 'bg-warning/10 border border-warning/25'}`}
            >
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle
                      size={22}
                      className={alert.days_remaining <= 3 ? 'text-danger' : 'text-warning'}
                    />
                    <h3 className="text-lg font-semibold text-text-primary">{alert.full_name}</h3>
                  </div>

                  <div className="space-y-1 ml-9">
                    <p className="text-sm text-text-secondary">WhatsApp: {alert.whatsapp_number}</p>
                    <p className="text-sm text-text-secondary">
                      Vencimento: <span className="font-medium text-text-primary">{new Date(alert.end_date).toLocaleDateString('pt-BR')}</span>
                    </p>
                    <p
                      className={`text-sm font-semibold ${alert.days_remaining <= 3 ? 'text-danger' : 'text-warning'
                        }`}
                    >
                      {alert.days_remaining === 0
                        ? 'Vence hoje!'
                        : alert.days_remaining === 1
                          ? 'Vence amanhã!'
                          : `Vence em ${alert.days_remaining} dias`}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/dashboard/subscribers/${alert.id}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition text-sm no-underline flex-shrink-0"
                >
                  Gerenciar Assinatura
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
