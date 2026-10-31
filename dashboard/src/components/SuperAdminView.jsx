import React, { useState, useEffect } from 'react'
import {
  ShieldCheck,
  Users,
  CreditCard,
  DollarSign,
  Search,
  PlusCircle,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Tag,
  Edit3,
  Save,
  X,
  ExternalLink,
  Check,
  Copy,
  Send,
  Zap,
  Calendar,
  Activity,
  Layers,
  ShoppingBag,
  Sliders
} from 'lucide-react'
import { supabase } from '../supabase'

export default function SuperAdminView() {
  const [profiles, setProfiles] = useState([])
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all | paid | trial | expired
  const [activeTab, setActiveTab] = useState('users') // users | webhook | purchases
  const [actionMessage, setActionMessage] = useState(null)
  const [realtimeActive, setRealtimeActive] = useState(false)

  // Estado do Modal de Edição de Usuário & Tags
  const [editingUser, setEditingUser] = useState(null)
  const [editMlTag, setEditMlTag] = useState('')
  const [editAmzTag, setEditAmzTag] = useState('')
  const [editShpTag, setEditShpTag] = useState('')
  const [editPlan, setEditPlan] = useState('starter')
  const [editPeriod, setEditPeriod] = useState('monthly')
  const [editStatus, setEditStatus] = useState('active')
  const [editExpiresAt, setEditExpiresAt] = useState('')
  const [editTrialEndsAt, setEditTrialEndsAt] = useState('')
  const [editPlatform, setEditPlatform] = useState('all')
  const [editDailyDispatches, setEditDailyDispatches] = useState(0)
  const [savingEdit, setSavingEdit] = useState(false)

  // Estado de Teste do Webhook Cakto
  const [webhookTestLoading, setWebhookTestLoading] = useState(false)
  const [webhookTestResult, setWebhookTestResult] = useState(null)
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false)

  const officialWebhookUrl = 'https://afiliado-automatico.vercel.app/api/cakto-webhook'

  const loadAdminData = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      // 1. Carrega todos os perfis de usuários
      const { data: profs, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (pErr) throw pErr
      setProfiles(profs || [])

      // 2. Carrega histórico de compras da Cakto
      const { data: purchs, error: purchErr } = await supabase
        .from('cakto_purchases')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (!purchErr) setPurchases(purchs || [])
    } catch (err) {
      console.error('Erro ao carregar dados de admin:', err)
      setActionMessage({ type: 'error', text: 'Erro ao carregar clientes: ' + err.message })
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  // Sincronização em Tempo Real via Supabase Realtime Channels
  useEffect(() => {
    loadAdminData(true)

    const channel = supabase
      .channel('superadmin-live-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        loadAdminData(false)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cakto_purchases' }, () => {
        loadAdminData(false)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeActive(true)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Abre Modal de Edição preenchendo todos os dados do cliente
  const handleOpenEditModal = (client) => {
    setEditingUser(client)
    setEditMlTag(client.ml_affiliate_tag || '')
    setEditAmzTag(client.amazon_affiliate_tag || '')
    setEditShpTag(client.shopee_affiliate_tag || '')
    setEditPlan(client.plan || 'free_trial')
    setEditPeriod(client.plan_period || 'monthly')
    setEditStatus(client.plan_status || 'active')
    setEditPlatform(client.allowed_platform || 'all')
    setEditDailyDispatches(client.daily_dispatches_count || 0)

    if (client.plan_expires_at) {
      setEditExpiresAt(new Date(client.plan_expires_at).toISOString().split('T')[0])
    } else {
      setEditExpiresAt('')
    }

    if (client.trial_ends_at) {
      setEditTrialEndsAt(new Date(client.trial_ends_at).toISOString().split('T')[0])
    } else {
      setEditTrialEndsAt('')
    }
  }

  // Atalho para adicionar dias na data de expiração
  const handleSetQuickExpiry = (days) => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    setEditExpiresAt(d.toISOString().split('T')[0])
  }

  // Salvar Edição Completa do Usuário (Tags, Plano, Status)
  const handleSaveUserEdit = async (e) => {
    if (e) e.preventDefault()
    if (!editingUser) return

    setSavingEdit(true)
    try {
      const updates = {
        ml_affiliate_tag: editMlTag.trim(),
        amazon_affiliate_tag: editAmzTag.trim(),
        shopee_affiliate_tag: editShpTag.trim(),
        plan: editPlan,
        plan_period: editPeriod,
        plan_status: editStatus,
        allowed_platform: editPlatform,
        daily_dispatches_count: Number(editDailyDispatches) || 0
      }

      if (editExpiresAt) {
        updates.plan_expires_at = new Date(editExpiresAt + 'T23:59:59').toISOString()
      } else {
        updates.plan_expires_at = null
      }

      if (editTrialEndsAt) {
        updates.trial_ends_at = new Date(editTrialEndsAt + 'T23:59:59').toISOString()
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', editingUser.id)

      if (error) throw error

      setActionMessage({
        type: 'success',
        text: `Perfil de ${editingUser.email} atualizado com sucesso! Tags e plano salvos.`
      })
      setEditingUser(null)
      loadAdminData(false)
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Erro ao salvar alterações: ' + err.message })
    } finally {
      setSavingEdit(false)
    }
  }

  // Modificar plano do usuário com 1 clique direto na tabela
  const handleUpdateUserPlan = async (userId, newPlan, newPeriod = 'monthly') => {
    try {
      const expiry = new Date()
      expiry.setDate(expiry.getDate() + (newPeriod === 'yearly' ? 365 : 30))

      const { error } = await supabase
        .from('profiles')
        .update({
          plan: newPlan,
          plan_period: newPeriod,
          plan_status: 'active',
          plan_expires_at: expiry.toISOString(),
          allowed_platform: newPlan === 'starter' ? 'mercadolivre' : 'all'
        })
        .eq('id', userId)

      if (error) throw error

      setActionMessage({ type: 'success', text: `Plano atualizado para ${newPlan.toUpperCase()} com sucesso!` })
      loadAdminData(false)
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Erro ao atualizar plano: ' + err.message })
    }
  }

  // Estender teste grátis com 1 clique
  const handleExtendTrial = async (userId, days) => {
    try {
      const newTrial = new Date()
      newTrial.setDate(newTrial.getDate() + days)

      const { error } = await supabase
        .from('profiles')
        .update({
          trial_ends_at: newTrial.toISOString(),
          plan_status: 'active'
        })
        .eq('id', userId)

      if (error) throw error

      setActionMessage({ type: 'success', text: `Teste prorrogado em +${days} dias com sucesso!` })
      loadAdminData(false)
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Erro ao prorrogar teste: ' + err.message })
    }
  }

  // Testar Webhook da Cakto diretamente pelo navegador
  const handleTestWebhookLive = async () => {
    setWebhookTestLoading(true)
    setWebhookTestResult(null)
    const startTime = performance.now()
    try {
      const resp = await fetch('/api/cakto-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'event_test',
          data: {
            id: 'TEST-' + Math.floor(Math.random() * 90000 + 10000),
            status: 'paid',
            customer: {
              email: 'teste-webhook@cakto.com.br',
              name: 'Simulação Teste Webhook'
            }
          }
        })
      })

      const elapsed = Math.round(performance.now() - startTime)
      const data = await resp.json()

      setWebhookTestResult({
        success: resp.ok,
        status: resp.status,
        elapsed,
        data
      })
    } catch (err) {
      const elapsed = Math.round(performance.now() - startTime)
      setWebhookTestResult({
        success: false,
        status: 'Erro de Rede',
        elapsed,
        data: { error: err.message }
      })
    } finally {
      setWebhookTestLoading(false)
    }
  }

  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText(officialWebhookUrl)
    setCopiedWebhookUrl(true)
    setTimeout(() => setCopiedWebhookUrl(false), 2500)
  }

  // Métricas de clientes
  const totalUsers = profiles.length
  const activePaid = profiles.filter(p => p.plan !== 'free_trial' && p.plan_status === 'active' && p.role !== 'superadmin').length
  const trialUsers = profiles.filter(p => p.plan === 'free_trial' && p.plan_status === 'active').length
  const expiredUsers = profiles.filter(p => p.plan_status === 'expired' || (p.plan === 'free_trial' && p.trial_ends_at && new Date() > new Date(p.trial_ends_at))).length

  // Filtros de busca e status
  const filteredUsers = profiles.filter((p) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      (p.email || '').toLowerCase().includes(term) ||
      (p.ml_affiliate_tag || '').toLowerCase().includes(term) ||
      (p.plan || '').toLowerCase().includes(term)

    if (!matchesSearch) return false

    if (statusFilter === 'paid') return p.plan !== 'free_trial' && p.plan_status === 'active' && p.role !== 'superadmin'
    if (statusFilter === 'trial') return p.plan === 'free_trial' && p.plan_status === 'active'
    if (statusFilter === 'expired') return p.plan_status === 'expired' || (p.plan === 'free_trial' && p.trial_ends_at && new Date() > new Date(p.trial_ends_at))
    return true
  })

  // Formata visualmente o plano
  const renderPlanBadge = (client) => {
    const isSA = client.role === 'superadmin' || client.email === 'jsnevesme@gmail.com'
    if (isSA) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-2xs">
          Super Admin
        </span>
      )
    }

    const plan = (client.plan || 'free_trial').toLowerCase()
    switch (plan) {
      case 'ultra':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
            Ultra
          </span>
        )
      case 'pro':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
            Pro
          </span>
        )
      case 'starter':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
            Starter
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
            Free Trial
          </span>
        )
    }
  }

  // Formata o detalhe do ciclo / expiração
  const renderPlanDetail = (client) => {
    const isSA = client.role === 'superadmin' || client.email === 'jsnevesme@gmail.com'
    if (isSA) return <span className="text-[10px] text-purple-400 font-medium">Acesso Vitalício Mestre</span>

    if (client.plan === 'free_trial') {
      if (client.trial_ends_at) {
        const diffDays = Math.ceil((new Date(client.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24))
        if (diffDays > 0) {
          return <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{diffDays} {diffDays === 1 ? 'dia restante' : 'dias restantes'}</span>
        }
        return <span className="text-[10px] text-red-500 font-bold">Teste Expirado</span>
      }
      return <span className="text-[10px] text-slate-400">3 Dias Grátis</span>
    }

    const periodLabel = client.plan_period === 'yearly' ? 'Anual' : 'Mensal'
    if (client.plan_expires_at) {
      const expDate = new Date(client.plan_expires_at).toLocaleDateString('pt-BR')
      return <span className="text-[10px] text-slate-500 dark:text-slate-400">{periodLabel} • Expira: {expDate}</span>
    }

    return <span className="text-[10px] text-slate-500 dark:text-slate-400">{periodLabel} • Ativo</span>
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header do Painel Super Admin com Indicador Realtime */}
      <div className="rounded-[28px] bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl shadow-purple-900/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-purple-800/40">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/20 px-3.5 py-1 text-xs font-bold text-purple-300 border border-purple-500/30">
              <ShieldCheck className="h-3.5 w-3.5 text-purple-300" />
              <span>Painel do Fundador / Super Admin</span>
            </div>

            {realtimeActive && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Tempo Real Ativo</span>
              </div>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Gestão Global & Webhooks</h1>
          <p className="text-xs sm:text-sm text-purple-200/80 mt-1 max-w-2xl">
            Acompanhe planos e assinaturas em tempo real, edite tags de afiliados e monitore a integração Cakto.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadAdminData(true)}
            disabled={loading}
            className="flex items-center gap-2 rounded-full bg-purple-600 hover:bg-purple-700 px-4 py-2 text-xs font-bold text-white transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className={`flex items-center justify-between rounded-[20px] p-4 text-xs font-semibold ${
          actionMessage.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-center gap-2.5">
            {actionMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> : <AlertTriangle className="h-4 w-4 flex-shrink-0" />}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 2. KPIs do Negócio Bento Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div
          onClick={() => setStatusFilter('all')}
          className={`cursor-pointer rounded-[24px] border p-4 sm:p-5 shadow-xs transition-all ${
            statusFilter === 'all'
              ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 ring-2 ring-purple-400/20'
              : 'border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#121724] hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total de Usuários</span>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white tabular-nums">{totalUsers}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Cadastrados no sistema</span>
        </div>

        <div
          onClick={() => setStatusFilter('paid')}
          className={`cursor-pointer rounded-[24px] border p-4 sm:p-5 shadow-xs transition-all ${
            statusFilter === 'paid'
              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-400/20'
              : 'border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#121724] hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assinantes Pagantes</span>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{activePaid}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Planos Starter, Pro e Ultra</span>
        </div>

        <div
          onClick={() => setStatusFilter('trial')}
          className={`cursor-pointer rounded-[24px] border p-4 sm:p-5 shadow-xs transition-all ${
            statusFilter === 'trial'
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-400/20'
              : 'border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#121724] hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Leads no Teste Grátis</span>
          <div className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400 tabular-nums">{trialUsers}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Usuários em avaliação</span>
        </div>

        <div
          onClick={() => setStatusFilter('expired')}
          className={`cursor-pointer rounded-[24px] border p-4 sm:p-5 shadow-xs transition-all ${
            statusFilter === 'expired'
              ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 ring-2 ring-amber-400/20'
              : 'border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#121724] hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Testes Expirados</span>
          <div className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">{expiredUsers}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Oportunidades de upgrade</span>
        </div>
      </div>

      {/* 3. Seletor de Abas Superadmin: Usuários vs Diagnóstico Webhook vs Compras */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Gerenciar Usuários & Tags ({profiles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('webhook')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'webhook'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Zap className="h-4 w-4 text-amber-400" />
            <span>Webhook da Cakto & Diagnóstico</span>
          </button>

          <button
            onClick={() => setActiveTab('purchases')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'purchases'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>Compras Cakto Recebidas ({purchases.length})</span>
          </button>
        </div>

        {activeTab === 'users' && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por e-mail, tag ou plano..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 pl-9 pr-4 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-2xs"
            />
          </div>
        )}
      </div>

      {/* ABA 1: GERENCIAMENTO DE USUÁRIOS & TAGS */}
      {activeTab === 'users' && (
        <div className="rounded-[28px] border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#121724] shadow-xs overflow-hidden transition-colors">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Clientes & Tags de Afiliados</h2>
              <p className="text-xs text-slate-400">Clique em qualquer cliente para editar sua tag oficial ou plano em tempo real</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Filtrando:</span>
              <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                {statusFilter === 'all' && `Todos (${filteredUsers.length})`}
                {statusFilter === 'paid' && `Pagantes (${filteredUsers.length})`}
                {statusFilter === 'trial' && `Teste Grátis (${filteredUsers.length})`}
                {statusFilter === 'expired' && `Expirados (${filteredUsers.length})`}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-purple-500" />
              <span>Carregando clientes em tempo real...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Cliente</th>
                    <th className="px-5 py-3.5">Tags de Afiliado</th>
                    <th className="px-5 py-3.5">Plano Atual & Ciclo</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Disparos Hoje</th>
                    <th className="px-5 py-3.5">Cadastro</th>
                    <th className="px-5 py-3.5 text-right">Ações de Gestão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredUsers.map((client) => {
                    const isSA = client.role === 'superadmin' || client.email === 'jsnevesme@gmail.com'
                    return (
                      <tr key={client.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                        {/* 1. Cliente */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-xs flex-shrink-0 shadow-2xs">
                              {client.email?.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 dark:text-white truncate max-w-xs">{client.email}</div>
                              {client.full_name && (
                                <span className="text-[11px] text-slate-400 block truncate">{client.full_name}</span>
                              )}
                              {isSA && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-950/60 px-2 py-0.2 text-[9px] font-bold text-purple-700 dark:text-purple-300 mt-0.5">
                                  Fundador (Superadmin)
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 2. Tags de Afiliado (Exibe em destaque e permite editar!) */}
                        <td className="px-5 py-3.5">
                          <div className="space-y-1">
                            {client.ml_affiliate_tag ? (
                              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/50 text-[11px] font-bold text-amber-900 dark:text-amber-200">
                                <span className="text-[9px] uppercase px-1 rounded bg-amber-200/80 dark:bg-amber-800/60 text-amber-950 dark:text-amber-100 font-black">ML</span>
                                <span className="font-mono">{client.ml_affiliate_tag}</span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Sem tag ML</span>
                            )}

                            {(client.amazon_affiliate_tag || client.shopee_affiliate_tag) && (
                              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                                {client.amazon_affiliate_tag && <span>Amz: {client.amazon_affiliate_tag}</span>}
                                {client.shopee_affiliate_tag && <span>Shp: {client.shopee_affiliate_tag}</span>}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 3. Plano Atual & Ciclo */}
                        <td className="px-5 py-3.5">
                          <div className="space-y-0.5">
                            <div>{renderPlanBadge(client)}</div>
                            <div>{renderPlanDetail(client)}</div>
                          </div>
                        </td>

                        {/* 4. Status */}
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            client.plan_status === 'active'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : client.plan_status === 'canceled'
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              : 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${client.plan_status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            {client.plan_status === 'active' ? 'Ativo' : client.plan_status === 'canceled' ? 'Cancelado' : 'Expirado'}
                          </span>
                        </td>

                        {/* 5. Disparos Hoje */}
                        <td className="px-5 py-3.5 font-semibold text-slate-700 dark:text-slate-300">
                          {isSA ? '∞' : `${client.daily_dispatches_count || 0}`}
                        </td>

                        {/* 6. Cadastro */}
                        <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {client.created_at ? new Date(client.created_at).toLocaleDateString('pt-BR') : '-'}
                        </td>

                        {/* 7. Ações de Gestão */}
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Botão Principal de Edição Completa */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(client)}
                              title="Editar Tags, Plano e Acesso"
                              className="inline-flex items-center gap-1 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 text-[11px] font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-xs cursor-pointer"
                            >
                              <Edit3 className="h-3 w-3" />
                              <span>Editar</span>
                            </button>

                            {/* Atalhos Rápidos se não for Superadmin */}
                            {!isSA && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateUserPlan(client.id, 'starter')}
                                  title="Definir como Plano Starter"
                                  className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 hover:opacity-90 cursor-pointer"
                                >
                                  Starter
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateUserPlan(client.id, 'pro')}
                                  title="Definir como Plano Pro"
                                  className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 px-2 py-1 text-[10px] font-bold text-blue-700 dark:text-blue-300 hover:opacity-90 cursor-pointer"
                                >
                                  Pro
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateUserPlan(client.id, 'ultra')}
                                  title="Definir como Plano Ultra"
                                  className="rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/60 px-2 py-1 text-[10px] font-bold text-purple-700 dark:text-purple-300 hover:opacity-90 cursor-pointer"
                                >
                                  Ultra
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleExtendTrial(client.id, 7)}
                                  title="Adicionar +7 dias de teste"
                                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                                >
                                  +7d
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ABA 2: DIAGNÓSTICO DO WEBHOOK DA CAKTO */}
      {activeTab === 'webhook' && (
        <div className="space-y-6">
          <div className="rounded-[28px] border border-purple-200 dark:border-purple-900/60 bg-white dark:bg-[#121724] p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    URL Oficial do Webhook da Cakto
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Cadastre esta URL exata no painel da Cakto em <strong>Configurações → Webhooks</strong> para ativação automática instantânea.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestWebhookLive}
                  disabled={webhookTestLoading}
                  className="flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Activity className={`h-3.5 w-3.5 ${webhookTestLoading ? 'animate-spin' : ''}`} />
                  <span>{webhookTestLoading ? 'Testando Conexão...' : 'Testar Conexão do Webhook'}</span>
                </button>
              </div>
            </div>

            {/* Caixa com a URL e Botão de Copiar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0 w-full sm:w-auto">
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">POST</span>
                <span className="font-mono text-xs text-slate-800 dark:text-slate-200 truncate select-all">
                  {officialWebhookUrl}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyWebhookUrl}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-2xs"
              >
                {copiedWebhookUrl ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span>URL Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copiar URL</span>
                  </>
                )}
              </button>
            </div>

            {/* Resultado do Teste ao Vivo */}
            {webhookTestResult && (
              <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
                webhookTestResult.success
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-red-50/80 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    {webhookTestResult.success ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-red-600" />}
                    <span>Status HTTP {webhookTestResult.status} • Resposta em {webhookTestResult.elapsed}ms</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase font-bold">Diagnóstico Concluído</span>
                </div>
                <pre className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/70 text-[11px] font-mono overflow-x-auto border border-black/5 dark:border-white/5">
                  {JSON.stringify(webhookTestResult.data, null, 2)}
                </pre>
              </div>
            )}

            {/* Instruções para a Cakto */}
            <div className="space-y-2 pt-2 text-xs text-slate-600 dark:text-slate-400">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                Como configurar no Painel da Cakto:
              </h4>
              <ol className="list-decimal list-inside space-y-1 leading-relaxed pl-1">
                <li>Acesse o painel da Cakto e clique em <strong>Apps / Integrações → Webhooks</strong>.</li>
                <li>Clique em <strong>Criar Webhook</strong>.</li>
                <li>Cole a URL acima no campo <strong>URL do Webhook</strong>.</li>
                <li>Selecione os eventos: <strong>Compra Aprovada (purchase_approved)</strong>, <strong>Assinatura Criada</strong> e <strong>Assinatura Renovada</strong>.</li>
                <li>Clique em <strong>Salvar</strong> e depois no botão <strong>Testar</strong> da Cakto.</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: HISTÓRICO DE COMPRAS DA CAKTO */}
      {activeTab === 'purchases' && (
        <div className="rounded-[28px] border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#121724] shadow-xs overflow-hidden transition-colors">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Últimas Compras Recebidas da Cakto</h2>
              <p className="text-xs text-slate-400">Registro em tempo real das compras confirmadas via webhook</p>
            </div>
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
              Total: {purchases.length} compras gravadas
            </span>
          </div>

          {purchases.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              Nenhuma compra registrada ainda. Ao testar ou receber compras na Cakto, os eventos aparecerão aqui.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Cliente & E-mail</th>
                    <th className="px-5 py-3.5">Plano Identificado</th>
                    <th className="px-5 py-3.5">Ciclo</th>
                    <th className="px-5 py-3.5">Valor (R$)</th>
                    <th className="px-5 py-3.5">Método</th>
                    <th className="px-5 py-3.5">Data & Hora</th>
                    <th className="px-5 py-3.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {purchases.map((pur) => (
                    <tr key={pur.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">{pur.customer_email}</div>
                        {pur.customer_name && <span className="text-[10px] text-slate-400">{pur.customer_name}</span>}
                      </td>
                      <td className="px-5 py-3.5 uppercase font-bold text-purple-600 dark:text-purple-400">
                        {pur.plan_identified}
                      </td>
                      <td className="px-5 py-3.5 capitalize text-slate-600 dark:text-slate-400">
                        {pur.plan_period === 'yearly' ? 'Anual' : 'Mensal'}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {pur.amount ? Number(pur.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                      </td>
                      <td className="px-5 py-3.5 uppercase text-slate-500 text-[11px]">
                        {pur.payment_method || 'Pix/Cartão'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {pur.created_at ? new Date(pur.created_at).toLocaleString('pt-BR') : '-'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 text-[10px] font-bold">
                          <Check className="h-3 w-3" /> Pago
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4. MODAL DE EDIÇÃO COMPLETA DE USUÁRIO & TAGS */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header do Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Editar Cliente & Tags de Afiliado
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">{editingUser.email}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUserEdit} className="space-y-6">
              {/* SEÇÃO 1: TAGS DE AFILIADO (Destaque Principal) */}
              <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-xs uppercase tracking-wider">
                  <Tag className="h-4 w-4 text-amber-500" />
                  <span>Tags de Comissionamento do Afiliado</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Qualquer tag alterada aqui será sincronizada na nuvem e aplicada automaticamente nos links encurtados disparados pela extensão deste usuário.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tag Mercado Livre (meli.la)
                    </label>
                    <input
                      type="text"
                      value={editMlTag}
                      onChange={(e) => setEditMlTag(e.target.value)}
                      placeholder="Ex: jonathansneves"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tag Shopee (s.shopee)
                    </label>
                    <input
                      type="text"
                      value={editShpTag}
                      onChange={(e) => setEditShpTag(e.target.value)}
                      placeholder="Ex: sua_tag_shopee"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tag Amazon (amzn.to)
                    </label>
                    <input
                      type="text"
                      value={editAmzTag}
                      onChange={(e) => setEditAmzTag(e.target.value)}
                      placeholder="Ex: tag-20"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO 2: PLANO, STATUS E EXPIRAÇÃO */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <CreditCard className="h-4 w-4" />
                  <span>Assinatura & Limites de Operação</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Plano Ativo
                    </label>
                    <select
                      value={editPlan}
                      onChange={(e) => setEditPlan(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="free_trial">Free Trial (3 Dias Grátis)</option>
                      <option value="starter">Starter (1 Grupo, 1 Plataforma)</option>
                      <option value="pro">Pro (5 Grupos, IA)</option>
                      <option value="ultra">Ultra (10 Grupos, VIP)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Ciclo de Cobrança
                    </label>
                    <select
                      value={editPeriod}
                      onChange={(e) => setEditPeriod(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="trial">Período de Teste</option>
                      <option value="monthly">Mensal</option>
                      <option value="yearly">Anual</option>
                      <option value="lifetime">Vitalício (Perpétuo)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Status da Conta
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="active">Ativo</option>
                      <option value="expired">Expirado</option>
                      <option value="canceled">Cancelado</option>
                    </select>
                  </div>
                </div>

                {/* Data de Expiração do Plano & Atalhos Rápidos */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Data de Expiração do Plano
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-semibold">Atalhos rápidos:</span>
                      <button
                        type="button"
                        onClick={() => handleSetQuickExpiry(3)}
                        className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-700 border text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer"
                      >
                        +3 dias
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetQuickExpiry(7)}
                        className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-700 border text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer"
                      >
                        +7 dias
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetQuickExpiry(30)}
                        className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-700 border text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer"
                      >
                        +30 dias
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetQuickExpiry(365)}
                        className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-700 border text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer"
                      >
                        +1 ano
                      </button>
                    </div>
                  </div>

                  <input
                    type="date"
                    value={editExpiresAt}
                    onChange={(e) => setEditExpiresAt(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                {/* Plataforma Permitida & Disparos do Dia */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Plataforma Permitida (Starter)
                    </label>
                    <select
                      value={editPlatform}
                      onChange={(e) => setEditPlatform(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="all">Todas as Plataformas (Pro / Ultra)</option>
                      <option value="mercadolivre">Apenas Mercado Livre</option>
                      <option value="shopee">Apenas Shopee</option>
                      <option value="amazon">Apenas Amazon</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Disparos Realizados Hoje
                      </label>
                      <button
                        type="button"
                        onClick={() => setEditDailyDispatches(0)}
                        className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                      >
                        Zerar Contador
                      </button>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={editDailyDispatches}
                      onChange={(e) => setEditDailyDispatches(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Ações do Rodapé do Modal */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{savingEdit ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
