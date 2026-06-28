'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LogIn, Eye, EyeOff, Mail, Lock } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

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
    <div className="min-h-screen flex relative overflow-hidden bg-base">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-surface items-center justify-center p-12">
        <div className="absolute top-10 left-10 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-brand-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-primary/[0.03] rounded-full blur-2xl" />

        <div className="relative text-center">
          <div className="mx-auto w-40 h-40 mb-6 flex items-center justify-center rounded-2xl p-4">
            <img
              src="/logo.png"
              width={100}
              height={100}
              alt="Seconds Delay Esportivo"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-3xl font-bold text-text-primary mb-3">
            Seconds Delay Esportivo
          </h2>
          <p className="text-text-secondary text-lg max-w-md mx-auto leading-relaxed">
            Gerencie assinaturas, acompanhe pagamentos e mantenha seus clientes sempre ativos.
          </p>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="mx-auto w-24 h-24 mb-4">
              <img
                src="/logo.png"
                alt="Seconds Delay Esportivo"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-xl font-bold text-text-primary">
              Seconds Delay Esportivo
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Sistema de gerenciamento de assinaturas
            </p>
          </div>

          {/* Desktop title */}
          <div className="hidden lg:block mb-8">
            <h1 className="text-2xl font-bold text-text-primary">Entrar</h1>
            <p className="text-sm text-text-secondary mt-1">
              Acesse sua conta para continuar
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-danger/10 border border-danger/25 text-danger px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                <span className="text-danger font-bold mt-0.5">!</span>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 bg-base border border-border-default rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition text-text-primary placeholder-text-secondary"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 bg-base border border-border-default rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition text-text-primary placeholder-text-secondary"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-secondary cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary hover:bg-brand-primary-hover text-on-primary font-semibold py-2.5 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  Entrar
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-text-secondary text-center mt-8">
            &copy; {new Date().getFullYear()} Seconds Delay Esportivo. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}
