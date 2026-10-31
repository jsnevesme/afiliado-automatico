import React, { useState, useEffect } from 'react'
import { Mail, Lock, User, AlertCircle, ArrowRight, X, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { supabase } from '../supabase'

export default function AuthModal({ onAuthSuccess, onClose, initialMode = 'login' }) {
  const [isRegister, setIsRegister] = useState(initialMode === 'register')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  useEffect(() => {
    setIsRegister(initialMode === 'register')
  }, [initialMode])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    setLoading(true)

    const cleanEmail = email.trim().toLowerCase()

    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: fullName.trim() || cleanEmail.split('@')[0]
            }
          }
        })
        if (error) throw error

        // Se sessão ativa já retornada
        if (data?.session?.user) {
          onAuthSuccess(data.session.user)
          return
        }

        // Tenta sign in caso auto_confirm esteja ativo
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        })

        if (!signInErr && signInData?.user) {
          onAuthSuccess(signInData.user)
        } else if (data?.user) {
          onAuthSuccess(data.user)
        } else {
          setSuccessMsg('Cadastro realizado com sucesso! Faça login para continuar.')
          setIsRegister(false)
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        })
        if (error) throw error
        if (data?.user) {
          onAuthSuccess(data.user)
        }
      }
    } catch (err) {
      console.error('[AuthModal] Erro de autenticação:', err)
      let msg = err.message || 'Erro ao realizar login. Verifique seus dados.'
      if (msg.includes('Invalid login credentials')) {
        msg = 'E-mail ou senha incorretos. Verifique suas credenciais.'
      } else if (msg.includes('User already registered')) {
        msg = 'Este e-mail já está cadastrado. Faça login ou recupere a senha.'
      } else if (msg.includes('Password should be at least')) {
        msg = 'A senha deve conter no mínimo 6 caracteres.'
      }
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-6 sm:p-8 shadow-2xl transition-colors relative">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="text-center mb-6">
          <img
            src="/logo.png"
            alt="Afiliado Automático"
            className="h-8 w-auto mx-auto object-contain mb-3 block dark:hidden"
          />
          <img
            src="/logo-dark.png"
            alt="Afiliado Automático"
            className="h-8 w-auto mx-auto object-contain mb-3 hidden dark:block"
          />

          {/* Abas Alternadoras Entrar / Cadastrar */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 mt-2 mb-2">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false)
                setErrorMsg(null)
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                !isRegister
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Entrar na Conta
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true)
                setErrorMsg(null)
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isRegister
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Criar Nova Conta
            </button>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isRegister
              ? 'Cadastre-se para acessar o painel e conectar sua extensão'
              : 'Entre com suas credenciais para gerenciar suas comissões'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 p-3 text-xs font-semibold text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nome Completo
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required={isRegister}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              E-mail
            </label>
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
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-10 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-50 cursor-pointer mt-2"
          >
            <span>{loading ? 'Processando...' : isRegister ? 'Criar Conta e Entrar' : 'Entrar no Dashboard'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
          {isRegister ? (
            <p>
              Já possui uma conta ativa?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false)
                  setErrorMsg(null)
                }}
                className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Fazer Login
              </button>
            </p>
          ) : (
            <p>
              Ainda não possui uma conta?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true)
                  setErrorMsg(null)
                }}
                className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
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
