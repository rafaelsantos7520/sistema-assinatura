export interface Subscription {
  id: string
  start_date: string
  end_date: string
}

export function isSubscriptionActive(subscription?: Subscription): boolean {
  if (!subscription) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const endDate = new Date(subscription.end_date)
  endDate.setHours(0, 0, 0, 0)

  return endDate >= today
}

export function getDaysRemaining(endDateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const endDate = new Date(endDateStr)
  endDate.setHours(0, 0, 0, 0)

  const diffTime = endDate.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}
