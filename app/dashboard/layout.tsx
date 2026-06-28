import Link from 'next/link'
import LogoutButton from '@/components/logout-button'
import AlertCounter from '@/components/alert-counter'
import { Bell } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-base">
      <header className="bg-surface border-b border-border-muted sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center gap-3 no-underline">
              <div className="w-10 h-10 flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="Seconds Delay Esportivo"
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-lg font-bold text-white">
                Seconds Delay
              </h1>
            </Link>

            <div className="flex items-center gap-1">
              <Link
                href="/dashboard/alerts"
                className="flex items-center gap-2 px-3 py-2 bg-white/[0.06] hover:bg-white/[0.10] text-text-secondary hover:text-text-primary rounded-lg transition relative no-underline"
              >
                <Bell size={20} />
                <span className="hidden sm:inline text-sm font-medium">Alertas</span>
                <AlertCounter />
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
    </div>
  )
}
