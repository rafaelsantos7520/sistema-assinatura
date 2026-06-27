'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LogIn } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Pequeno delay para melhor experiência visual
    await new Promise((resolve) => setTimeout(resolve, 1500))

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      setError(error.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black px-4">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-950/40 via-black to-emerald-950/30" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-400/5 via-transparent to-transparent" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="mx-auto w-56 h-56 sm:w-64 sm:h-64 mb-6">
            <img
              src="/logo.png"
              alt="Seconds Delay Esportivo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Seconds Delay Esportivo
          </h1>
          <p className="text-gray-500">Sistema de gerenciamento de assinaturas</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition text-gray-900 placeholder-gray-400"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition text-gray-900 placeholder-gray-400"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn size={20} />
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
