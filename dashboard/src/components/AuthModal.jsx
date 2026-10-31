import React, { useState } from 'react'
import { Mail, Lock, AlertCircle, ArrowRight, X } from 'lucide-react'
import { supabase } from '../supabase'

export default function AuthModal({ onAuthSuccess, onClose }) {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg(null)
    setLoading(true)

    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password
        })
        if (error) throw error
        onAuthSuccess(data.user)
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        })
        if (error) throw error
        onAuthSuccess(data.user)
      }
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao realizar login. Verifique seus dados.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-6 shadow-2xl sm:p-8 transition-colors relative">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <div className="text-center mb-6">
          <img
            src="/logo.png"
            alt="Afiliado Automático"
            className="h-9 w-auto mx-auto object-contain mb-3 block dark:hidden"
          />
          <img
            src="/logo-dark.png"
            alt="Afiliado Automático"
            className="h-9 w-auto mx-auto object-contain mb-3 hidden dark:block"
          />
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {isRegister ? 'Criar Conta no Portal Oficial' : 'Acesse seu Dashboard'}
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {isRegister
              ? 'Cadastre-se e ganhe 3 dias de acesso grátis liberado'
              : 'Entre com o mesmo e-mail e senha da sua extensão no Chrome'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 p-3 text-xs font-semibold text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            <span>{loading ? 'Entrando...' : isRegister ? 'Criar Conta e Começar' : 'Entrar no Dashboard'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          {isRegister ? (
            <p>
              Já tem uma conta?{' '}
              <button
                onClick={() => setIsRegister(false)}
                className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Fazer Login
              </button>
            </p>
          ) : (
            <p>
              Não tem conta?{' '}
              <button
                onClick={() => setIsRegister(true)}
                className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Cadastre-se grátis
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
