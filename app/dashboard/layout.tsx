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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center gap-3 no-underline">
              <div className="w-14 h-14 flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="Seconds Delay Esportivo"
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                Seconds Delay
              </h1>
            </Link>

            <div className="flex items-center gap-1">
              <Link
                href="/dashboard/alerts"
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition relative no-underline"
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
