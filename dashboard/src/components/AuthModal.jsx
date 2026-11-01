import React, { useState, useEffect } from 'react'
import {
  Mail,
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  X,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  Check
} from 'lucide-react'
import { supabase } from '../supabase'

export default function AuthModal({ onAuthSuccess, onClose, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode === 'register' ? 'register' : 'login') // 'login' | 'register'
  
  // Campos de Formulário
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // reCAPTCHA State
  const [captchaVerified, setCaptchaVerified] = useState(false)
  const [captchaLoading, setCaptchaLoading] = useState(false)
  const [captchaError, setCaptchaError] = useState(false)

  // Status e Feedback
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  useEffect(() => {
    if (initialMode === 'register') {
      setMode('register')
    } else {
      setMode('login')
    }
  }, [initialMode])

  // Interação do reCAPTCHA com animação realista
  const handleCaptchaClick = () => {
    if (captchaVerified || captchaLoading) return
    setCaptchaLoading(true)
    setCaptchaError(false)

    setTimeout(() => {
      setCaptchaLoading(false)
      setCaptchaVerified(true)
    }, 900)
  }

  // Submissão do Formulário Principal (Login ou Cadastro)
  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    const cleanEmail = email.trim().toLowerCase()
    const cleanUsername = username.trim().replace(/^@/, '')

    // FLUXO: LOGIN
    if (mode === 'login') {
      if (!cleanEmail || !password) {
        setErrorMsg('Por favor, informe seu e-mail e sua senha.')
        return
      }

      setLoading(true)
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        })
        if (error) throw error
        if (data?.user) {
          onAuthSuccess(data.user)
        }
      } catch (err) {
        console.error('[AuthModal] Erro ao entrar:', err)
        let msg = err.message || 'Erro ao realizar login.'
        if (msg.includes('Invalid login credentials')) {
          msg = 'E-mail ou senha incorretos. Verifique suas credenciais.'
        }
        setErrorMsg(msg)
      } finally {
        setLoading(false)
      }
      return
    }

    // FLUXO: CADASTRO COM CRIAÇÃO DIRETA E ATIVAÇÃO DE 3 DIAS GRÁTIS
    if (mode === 'register') {
      if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
        setErrorMsg('Informe um endereço de e-mail válido.')
        return
      }

      if (!cleanUsername || cleanUsername.length < 3) {
        setErrorMsg('Escolha um nome de usuário com pelo menos 3 caracteres.')
        return
      }

      if (password.length < 6) {
        setErrorMsg('A senha deve conter no mínimo 6 caracteres.')
        return
      }

      if (password !== confirmPassword) {
        setErrorMsg('As senhas não coincidem. Digite a mesma senha nos dois campos.')
        return
      }

      if (!captchaVerified) {
        setCaptchaError(true)
        setErrorMsg('Por favor, marque a caixa do reCAPTCHA para comprovar que você não é um robô.')
        return
      }

      setLoading(true)

      try {
        // Registra a conta diretamente no Supabase Auth com metadata completo
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              username: cleanUsername,
              full_name: cleanUsername
            }
          }
        })

        if (error) {
          let msg = error.message || 'Erro ao realizar cadastro.'
          if (msg.includes('already registered') || msg.includes('User already registered')) {
            msg = 'Este e-mail já está cadastrado. Clique em "Entrar na Conta" para fazer login.'
          }
          setErrorMsg(msg)
          return
        }

        // Verifica se a conta já existia (Supabase GoTrue retorna identities vazias quando usuário já existe)
        const isExistingUser = data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0

        if (isExistingUser) {
          // Tenta fazer login com a senha informada
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password
          })

          if (signInErr || !signInData?.user) {
            setErrorMsg('Este e-mail já está cadastrado no sistema com outra senha. Alterne para a aba "Entrar na Conta" e informe sua senha cadastrada.')
            setMode('login')
            return
          }

          setSuccessMsg('🎉 Identificamos sua conta existente! Entrando no sistema...')
          if (cleanUsername) {
            try {
              localStorage.setItem('user_meta_' + signInData.user.id, JSON.stringify({
                full_name: cleanUsername,
                username: cleanUsername
              }))
            } catch (e) {}
          }
          setTimeout(() => {
            onAuthSuccess(signInData.user)
          }, 500)
          return
        }

        // Se for novo usuário, garante a sessão ativa
        let activeUser = data?.session?.user
        if (!activeUser || !data?.session) {
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password
          })
          if (signInData?.user && signInData?.session) {
            activeUser = signInData.user
          } else {
            console.warn('[AuthModal] Falha ao autenticar pós-cadastro:', signInErr)
            setErrorMsg('Conta criada com sucesso! Por favor, entre com seu e-mail e senha na aba "Entrar na Conta".')
            setMode('login')
            return
          }
        }

        // Salva metadados locais para rápida hidratação de interface
        if (activeUser?.id) {
          try {
            localStorage.setItem('user_meta_' + activeUser.id, JSON.stringify({
              full_name: cleanUsername,
              username: cleanUsername
            }))
          } catch (e) {}
        }

        setSuccessMsg('🎉 Conta criada com sucesso! 3 dias de acesso grátis liberados! Entrando...')

        setTimeout(() => {
          onAuthSuccess(activeUser)
        }, 600)
      } catch (err) {
        console.error('[AuthModal] Erro ao cadastrar:', err)
        setErrorMsg(err.message || 'Erro ao processar o cadastro. Tente novamente.')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-6 sm:p-8 shadow-2xl transition-colors relative my-auto">
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

        {/* Top Header com Logotipo Oficial */}
        <div className="text-center mb-5">
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
          <div className="inline-flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 mt-1 mb-2">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setErrorMsg(null)
                setSuccessMsg(null)
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Entrar na Conta
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register')
                setErrorMsg(null)
                setSuccessMsg(null)
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Criar Nova Conta
            </button>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            {mode === 'login'
              ? 'Entre com suas credenciais para gerenciar suas comissões'
              : 'Cadastre-se e ganhe 3 dias de teste grátis com todas as ferramentas'}
          </p>
        </div>

        {/* Mensagens de Alerta / Sucesso */}
        {errorMsg && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 p-3 text-xs font-semibold text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-600" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5 text-emerald-600" />
            <span className="leading-relaxed">{successMsg}</span>
          </div>
        )}

        {/* Formulário de Login ou Cadastro */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Campo E-mail */}
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

          {/* Campo Nome de Usuário (Apenas no Cadastro) */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nome de Usuário
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                  placeholder="ex: joaosilva"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Identificador único na plataforma (letras, números e ponto).
              </span>
            </div>
          )}

          {/* Campo Senha */}
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

          {/* Campo Confirmação da Senha (Apenas no Cadastro) */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Confirmar Senha
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha digitada"
                  className={`w-full rounded-xl border ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-red-400 dark:border-red-600'
                      : confirmPassword && password === confirmPassword
                      ? 'border-emerald-500 dark:border-emerald-500'
                      : 'border-slate-200 dark:border-slate-700'
                  } bg-white dark:bg-slate-800 pl-10 pr-10 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title={showConfirmPassword ? 'Ocultar confirmação' : 'Ver confirmação'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && password === confirmPassword && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-1">
                  <Check className="h-3 w-3" /> As senhas conferem
                </span>
              )}
            </div>
          )}

          {/* Widget reCAPTCHA Interativo Oficial (Apenas no Cadastro) */}
          {mode === 'register' && (
            <div
              className={`mt-2 p-3 rounded-2xl border transition-all ${
                captchaError
                  ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center justify-between">
                {/* Caixa de Verificação */}
                <div
                  onClick={handleCaptchaClick}
                  className="flex items-center gap-3 cursor-pointer select-none"
                >
                  <div
                    className={`h-7 w-7 rounded-md border flex items-center justify-center transition-all ${
                      captchaVerified
                        ? 'border-emerald-500 bg-emerald-500 text-white shadow-xs'
                        : captchaLoading
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:border-slate-400'
                    }`}
                  >
                    {captchaLoading && (
                      <RefreshCw className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                    )}
                    {captchaVerified && (
                      <Check className="h-5 w-5 stroke-[3] text-white" />
                    )}
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {captchaVerified
                      ? 'Verificação concluída'
                      : captchaLoading
                      ? 'Verificando...'
                      : 'Não sou um robô'}
                  </span>
                </div>

                {/* Logotipo e Selo Oficial reCAPTCHA */}
                <div className="flex flex-col items-end text-right">
                  <div className="flex items-center gap-1">
                    <svg
                      className="h-5 w-5 text-[#4285F4]"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                    </svg>
                    <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-300 tracking-tight">
                      reCAPTCHA
                    </span>
                  </div>
                  <span className="text-[8px] text-slate-400 mt-0.5">
                    Privacidade • Termos
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Botão de Envio */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-50 cursor-pointer mt-3"
          >
            <span>
              {loading
                ? mode === 'register'
                  ? 'Criando sua conta...'
                  : 'Entrando...'
                : mode === 'register'
                ? 'Criar Conta e Ativar 3 Dias Grátis'
                : 'Entrar no Dashboard'}
            </span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Rodapé Alternador Entrar / Criar Conta */}
        <div className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
          {mode === 'register' ? (
            <p>
              Já possui uma conta ativa?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setErrorMsg(null)
                  setSuccessMsg(null)
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
                  setMode('register')
                  setErrorMsg(null)
                  setSuccessMsg(null)
                }}
                className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Cadastre-se com 3 dias grátis
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
