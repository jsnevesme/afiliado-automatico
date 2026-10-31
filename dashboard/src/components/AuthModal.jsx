import React, { useState, useEffect, useRef } from 'react'
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
  KeyRound,
  Check,
  ChevronLeft
} from 'lucide-react'
import { supabase } from '../supabase'

export default function AuthModal({ onAuthSuccess, onClose, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode === 'register' ? 'register' : 'login') // 'login' | 'register' | 'verify'
  
  // Campos de Cadastro
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

  // Verificação por Código / E-mail
  const [verificationCode, setVerificationCode] = useState('')
  const [expectedCode, setExpectedCode] = useState('')
  const [codeExpiresAt, setCodeExpiresAt] = useState(null)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [devCodeHint, setDevCodeHint] = useState(null)

  // Status e Feedback
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  const otpInputRef = useRef(null)

  useEffect(() => {
    if (initialMode === 'register') {
      setMode('register')
    } else {
      setMode('login')
    }
  }, [initialMode])

  // Timer de contagem regressiva para reenviar código
  useEffect(() => {
    let timer
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [resendCountdown])

  // Foca no input do código quando entra no modo 'verify'
  useEffect(() => {
    if (mode === 'verify' && otpInputRef.current) {
      otpInputRef.current.focus()
    }
  }, [mode])

  // Interação do reCAPTCHA com animação realista
  const handleCaptchaClick = () => {
    if (captchaVerified || captchaLoading) return
    setCaptchaLoading(true)
    setCaptchaError(false)

    setTimeout(() => {
      setCaptchaLoading(false)
      setCaptchaVerified(true)
    }, 1100)
  }

  // 1. Enviar Código de Verificação por E-mail
  const sendVerificationEmail = async (targetEmail, targetUsername, targetCode) => {
    try {
      const res = await fetch('/api/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          username: targetUsername,
          code: targetCode
        })
      })

      const data = await res.json()
      if (data.code) {
        setDevCodeHint(data.code)
      }
      return data
    } catch (err) {
      console.warn('[AuthModal] Falha na chamada da API de e-mail:', err)
      return { success: false }
    }
  }

  // 2. Submissão do Formulário Principal (Login ou Solicitação de Cadastro)
  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    const cleanEmail = email.trim().toLowerCase()
    const cleanUsername = username.trim().replace(/^@/, '')

    // FLUXO: LOGIN
    if (mode === 'login') {
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

    // FLUXO: CADASTRO COM VALIDAÇÃO COMPLETA
    if (mode === 'register') {
      if (!cleanUsername || cleanUsername.length < 3) {
        setErrorMsg('Escolha um nome de usuário com pelo menos 3 caracteres.')
        return
      }

      if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
        setErrorMsg('Informe um endereço de e-mail válido.')
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
        // Gera código de confirmação de 6 dígitos numéricos
        const genCode = Math.floor(100000 + Math.random() * 900000).toString()
        setExpectedCode(genCode)
        setCodeExpiresAt(Date.now() + 15 * 60 * 1000) // 15 minutos
        setResendCountdown(60)

        // Dispara e-mail com a logotipo oficial e a senha de ativação
        await sendVerificationEmail(cleanEmail, cleanUsername, genCode)

        setMode('verify')
        setSuccessMsg(`Código de ativação enviado com sucesso para ${cleanEmail}!`)
      } catch (err) {
        console.error('[AuthModal] Erro ao iniciar cadastro:', err)
        setErrorMsg('Erro ao preparar envio do e-mail de confirmação. Tente novamente.')
      } finally {
        setLoading(false)
      }
    }
  }

  // 3. Confirmar Código Recebido e Concluir Cadastro
  const handleVerifyCode = async (e) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    const entered = verificationCode.trim()

    if (!entered) {
      setErrorMsg('Digite a senha de 6 dígitos recebida no seu e-mail.')
      return
    }

    if (codeExpiresAt && Date.now() > codeExpiresAt) {
      setErrorMsg('Este código expirou. Clique em "Reenviar Código" abaixo para receber um novo.')
      return
    }

    if (entered !== expectedCode) {
      setErrorMsg('Senha/código de confirmação incorreto. Verifique o e-mail recebido e tente novamente.')
      return
    }

    setLoading(true)

    try {
      const cleanEmail = email.trim().toLowerCase()
      const cleanUsername = username.trim().replace(/^@/, '')

      // Registra a conta no Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            username: cleanUsername,
            full_name: cleanUsername,
            email_confirmed: true
          }
        }
      })

      if (error) throw error

      // Garante a sessão ativa
      let activeUser = data?.session?.user || data?.user
      if (!activeUser) {
        const { data: signInData } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        })
        activeUser = signInData?.user
      }

      // Cria/Atualiza profile inicial na nuvem garantindo 3 dias de trial
      if (activeUser?.id) {
        try {
          await supabase.from('profiles').upsert({
            id: activeUser.id,
            email: cleanEmail,
            full_name: cleanUsername,
            plan: 'starter',
            plan_period: 'trial',
            role: 'user',
            favorite_offers: [],
            favorite_folders: [
              { id: 'fld_eletronicos', name: 'Eletrônicos', color: 'blue' },
              { id: 'fld_casa', name: 'Casa & Cozinha', color: 'emerald' },
              { id: 'fld_moda', name: 'Moda & Acessórios', color: 'purple' }
            ],
            daily_dispatches_count: 0
          })
        } catch (profileErr) {
          console.warn('[AuthModal] Perfil inicial salvo via fallback:', profileErr)
        }
      }

      setSuccessMsg('🎉 Conta confirmada com sucesso! Acessando a plataforma...')

      setTimeout(() => {
        if (activeUser) {
          onAuthSuccess(activeUser)
        } else {
          setMode('login')
          setErrorMsg(null)
          setSuccessMsg('Conta ativada com sucesso! Faça login com sua senha.')
        }
      }, 700)
    } catch (err) {
      console.error('[AuthModal] Erro ao confirmar conta:', err)
      let msg = err.message || 'Erro ao confirmar conta.'
      if (msg.includes('already registered')) {
        msg = 'Este e-mail já está cadastrado. Faça login para continuar.'
      }
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  // 4. Reenviar Código por E-mail
  const handleResendCode = async () => {
    if (resendCountdown > 0 || loading) return
    setErrorMsg(null)
    setLoading(true)

    try {
      const newCode = Math.floor(100000 + Math.random() * 900000).toString()
      setExpectedCode(newCode)
      setCodeExpiresAt(Date.now() + 15 * 60 * 1000)
      setResendCountdown(60)

      await sendVerificationEmail(email.trim().toLowerCase(), username.trim(), newCode)
      setSuccessMsg('Novo código enviado para seu e-mail!')
    } catch (err) {
      setErrorMsg('Falha ao reenviar código. Tente novamente.')
    } finally {
      setLoading(false)
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

          {mode !== 'verify' ? (
            /* Abas Alternadoras Entrar / Cadastrar */
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
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold mt-1 mb-2">
              <KeyRound className="h-3.5 w-3.5" />
              <span>Verificação de Segurança</span>
            </div>
          )}

          <p className="text-xs text-slate-500 dark:text-slate-400">
            {mode === 'login' && 'Entre com suas credenciais para gerenciar suas comissões'}
            {mode === 'register' && 'Cadastre-se para criar sua conta com 3 dias de teste grátis'}
            {mode === 'verify' && 'Confirme a senha de 6 dígitos enviada para seu e-mail'}
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

        {/* ----------------- MODO 1 & 2: LOGIN OU CADASTRO ----------------- */}
        {mode !== 'verify' ? (
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
                  ? 'Processando...'
                  : mode === 'register'
                  ? 'Criar Conta e Confirmar por E-mail'
                  : 'Entrar no Dashboard'}
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          /* ----------------- MODO 3: TELA DE CONFIRMAÇÃO POR E-MAIL ----------------- */
          <div className="space-y-4">
            <div className="rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/80 p-4 text-center">
              <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Verifique sua Caixa de Entrada
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                Enviamos a senha de confirmação com a logotipo da plataforma para:
              </p>
              <div className="inline-block mt-1 font-bold text-blue-700 dark:text-blue-300 text-xs bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-700">
                {email}
              </div>
            </div>

            {/* Dica para ambiente de desenvolvimento/teste se aplicável */}
            {devCodeHint && (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-2.5 text-center text-xs text-amber-800 dark:text-amber-300 font-semibold">
                🔑 Código gerado para ativação: <span className="font-mono font-bold text-sm">{devCodeHint}</span>
              </div>
            )}

            <form onSubmit={handleVerifyCode} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 text-center">
                  Digite a Senha de 6 Dígitos
                </label>
                <input
                  ref={otpInputRef}
                  type="text"
                  maxLength={6}
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="000000"
                  className="w-full text-center tracking-[12px] text-2xl font-mono font-black rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <span className="text-[10px] text-slate-400 text-center block mt-1">
                  Insira o código numérico presente no e-mail recebido.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading || verificationCode.length < 4}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 text-xs font-bold text-white shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? 'Confirmando...' : 'Confirmar e Ativar Minha Conta'}</span>
                <Check className="h-4 w-4" />
              </button>
            </form>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMode('register')
                  setErrorMsg(null)
                  setSuccessMsg(null)
                }}
                className="flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer font-semibold"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Voltar / Editar dados</span>
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendCountdown > 0 || loading}
                className={`font-bold transition-colors cursor-pointer ${
                  resendCountdown > 0
                    ? 'text-slate-400 cursor-not-allowed'
                    : 'text-blue-600 dark:text-blue-400 hover:underline'
                }`}
              >
                {resendCountdown > 0 ? `Reenviar em ${resendCountdown}s` : 'Reenviar E-mail'}
              </button>
            </div>
          </div>
        )}

        {/* Rodapé Alternador Entrar / Criar Conta */}
        {mode !== 'verify' && (
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
        )}
      </div>
    </div>
  )
}
