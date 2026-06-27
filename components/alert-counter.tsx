'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { isSubscriptionActive, getDaysRemaining } from '@/lib/subscription-utils'

export default function AlertCounter() {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadAlertCount()
  }, [])

  const loadAlertCount = async () => {
    try {
      const { data, error } = await supabase
        .from('subscribers')
        .select(`
          id,
          subscriptions (
            end_date
          )
        `)

      if (error) throw error

      let alertCount = 0

      data?.forEach((subscriber) => {
        const activeSubscription = (subscriber.subscriptions as any[])?.find((sub) =>
          isSubscriptionActive(sub)
        )

        if (!activeSubscription) return

        const daysRemaining = getDaysRemaining(activeSubscription.end_date)
        if (daysRemaining >= 0 && daysRemaining <= 7) {
          alertCount++
        }
      })

      setCount(alertCount)
    } catch (error) {
      console.error('Erro ao carregar contagem de alertas:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || count === 0) return null

  return (
    <span className="absolute top-0.5 right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] text-[11px] font-bold text-white bg-red-500 rounded-full px-1">
      {count}
    </span>
  )
}
