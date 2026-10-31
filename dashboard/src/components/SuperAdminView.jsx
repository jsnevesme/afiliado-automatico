import React, { useState, useEffect } from 'react'
import {
  ShieldCheck,
  Users,
  CreditCard,
  DollarSign,
  Search,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Copy,
  Send,
  Calendar,
  Activity,
  Layers,
  ShoppingBag,
  Lock,
  Eye,
  Check
} from 'lucide-react'
import { supabase } from '../supabase'

export default function SuperAdminView() {
  const [profiles, setProfiles] = useState([])
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all | paid | trial | expired
  const [activeTab, setActiveTab] = useState('users') // users | purchases | webhook
  const [actionMessage, setActionMessage] = useState(null)
  const [realtimeActive, setRealtimeActive] = useState(false)

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
      console.error('Erro ao carregar dados informativos do superadmin:', err)
      setActionMessage({ type: 'error', text: 'Erro ao carregar dados: ' + err.message })
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

  // Disparo de teste para diagnosticar o Webhook da Cakto
  const handleTestWebhookEndpoint = async () => {
    setWebhookTestLoading(true)
    setWebhookTestResult(null)
    try {
      const response = await fetch(officialWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'event_test',
          test: true,
          timestamp: new Date().toISOString()
        })
      })

      const status = response.status
      let data = null
      try {
        data = await response.json()
      } catch (e) {
        data = { text: await response.text() }
      }

      setWebhookTestResult({
        success: response.ok,
        status,
        data
      })
    } catch (err) {
      setWebhookTestResult({
        success: false,
        status: 'Falha de Conexão',
        error: err.message
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

  // Filtros de busca e status
  const filteredProfiles = profiles.filter((client) => {
    const searchLower = searchTerm.toLowerCase().trim()
    const matchesSearch =
      !searchLower ||
      (client.email && client.email.toLowerCase().includes(searchLower)) ||
      (client.full_name && client.full_name.toLowerCase().includes(searchLower)) ||
      (client.id && client.id.toLowerCase().includes(searchLower))

    if (!matchesSearch) return false

    if (statusFilter === 'all') return true

    const isSuperAdminUser = client.role === 'superadmin' || client.email?.toLowerCase() === 'jsnevesme@gmail.com'
    if (statusFilter === 'superadmin') return isSuperAdminUser

    const isTrial = (client.plan === 'free_trial' || !client.plan) && !isSuperAdminUser
    const isPaid = (client.plan === 'starter' || client.plan === 'pro' || client.plan === 'ultra') && !isSuperAdminUser

    if (statusFilter === 'paid') return isPaid && client.plan_status === 'active'
    if (statusFilter === 'trial') return isTrial
    if (statusFilter === 'expired') return client.plan_status === 'expired'

    return true
  })

  // KPIs em tempo real
  const totalUsersCount = profiles.length
  const paidSubscribersCount = profiles.filter(
    (p) => (p.plan === 'starter' || p.plan === 'pro' || p.plan === 'ultra') && p.plan_status === 'active' && p.role !== 'superadmin'
  ).length
  const trialUsersCount = profiles.filter(
    (p) => (p.plan === 'free_trial' || !p.plan) && p.role !== 'superadmin'
  ).length
  const totalDispatchesToday = profiles.reduce(
    (acc, cur) => acc + (Number(cur.daily_dispatches_count) || 0),
    0
  )
  const totalCaktoPurchases = purchases.length

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Informativo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Painel do Super Administrador
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              👑 Modo Informativo
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Acompanhe usuários ativos, planos e compras da Cakto em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Indicador Realtime */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
              realtimeActive
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                realtimeActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span className="text-[11px]">
              {realtimeActive ? 'Sincronização Ativa' : 'Conectando Realtime'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => loadAdminData(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer disabled:opacity-50"
            title="Atualizar dados manualmente"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-purple-600' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>
      </div>

      {/* Alerta de Ação */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-950/70 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm ml-2 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* 5 Cards de Métricas Informativas */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="rounded-2xl p-4 bg-white dark:bg-[#121724] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total de Usuários</span>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {totalUsersCount}
          </div>
          <p className="text-[10px] text-slate-400">Cadastros na plataforma</p>
        </div>

        <div className="rounded-2xl p-4 bg-white dark:bg-[#121724] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Assinantes Ativos</span>
            <CreditCard className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {paidSubscribersCount}
          </div>
          <p className="text-[10px] text-slate-400">Starter, Pro e Ultra pagos</p>
        </div>

        <div className="rounded-2xl p-4 bg-white dark:bg-[#121724] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Teste Grátis (3D)</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {trialUsersCount}
          </div>
          <p className="text-[10px] text-slate-400">Período de avaliação de 3 dias</p>
        </div>

        <div className="rounded-2xl p-4 bg-white dark:bg-[#121724] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Disparos Hoje</span>
            <Send className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
            {totalDispatchesToday}
          </div>
          <p className="text-[10px] text-slate-400">Ofertas enviadas no WhatsApp</p>
        </div>

        <div className="rounded-2xl p-4 bg-white dark:bg-[#121724] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Compras Cakto</span>
            <Activity className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {totalCaktoPurchases}
          </div>
          <p className="text-[10px] text-slate-400">Transações recebidas via webhook</p>
        </div>
      </div>

      {/* Abas SuperAdmin */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Usuários & Planos Ativos ({profiles.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('purchases')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'purchases'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CreditCard className="h-3.5 w-3.5" />
          <span>Compras Cakto ({purchases.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('webhook')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'webhook'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          <span>Status do Webhook Cakto</span>
        </button>
      </div>

      {/* ABA 1: USUÁRIOS & PLANOS (Puramente Informativo / Acompanhamento) */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Barra de Busca & Filtros Rápidos */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#121724] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar usuário por e-mail ou nome..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Todos ({profiles.length})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('paid')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'paid'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Pagantes ({paidSubscribersCount})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('trial')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'trial'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Teste Grátis 3D ({trialUsersCount})
              </button>
            </div>
          </div>

          {/* Tabela Informativa de Usuários */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#121724] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="px-5 py-3.5">Cliente</th>
                    <th className="px-4 py-3.5">Plano Atual & Ciclo</th>
                    <th className="px-4 py-3.5">Plataforma</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-center">Disparos Hoje</th>
                    <th className="px-5 py-3.5 text-right">Data de Cadastro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {filteredProfiles.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-10 text-slate-400">
                        Nenhum usuário encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredProfiles.map((client) => {
                      const isSuperAdminUser = client.role === 'superadmin' || client.email?.toLowerCase() === 'jsnevesme@gmail.com'
                      const isTrial = (client.plan === 'free_trial' || !client.plan) && !isSuperAdminUser
                      const isPaid = (client.plan === 'starter' || client.plan === 'pro' || client.plan === 'ultra') && !isSuperAdminUser

                      let planBadgeClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      let planLabel = 'Starter'

                      if (isSuperAdminUser) {
                        planBadgeClass = 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                        planLabel = '👑 Super Admin'
                      } else if (client.plan === 'ultra') {
                        planBadgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        planLabel = 'Plano Ultra'
                      } else if (client.plan === 'pro') {
                        planBadgeClass = 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                        planLabel = 'Plano Pro'
                      } else if (client.plan === 'starter' && !isTrial) {
                        planBadgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        planLabel = 'Plano Starter'
                      } else if (isTrial) {
                        planBadgeClass = 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                        planLabel = 'Teste Grátis (3 Dias)'
                      }

                      const periodLabel = client.plan_period === 'yearly' ? 'Anual' : 'Mensal'

                      const platformLabels = {
                        all: 'Todas (ML + Shopee + AMZ)',
                        mercadolivre: 'Mercado Livre (Fixo)',
                        shopee: 'Shopee (Fixo)',
                        amazon: 'Amazon (Fixo)'
                      }
                      const platformDisplay = platformLabels[client.allowed_platform] || (client.plan === 'starter' || isTrial ? 'Mercado Livre (Fixo)' : 'Todas')

                      return (
                        <tr
                          key={client.id}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* Cliente */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              {client.avatar_url ? (
                                <img
                                  src={client.avatar_url}
                                  alt={client.full_name || client.email}
                                  className="h-8 w-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs">
                                  {(client.full_name || client.email || 'A').charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 dark:text-white truncate">
                                  {client.full_name || 'Afiliado'}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                                  {client.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Plano & Ciclo */}
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${planBadgeClass}`}
                              >
                                {planLabel}
                              </span>
                              {!isSuperAdminUser && isPaid && (
                                <div className="text-[10px] text-slate-400 font-medium">
                                  Cobrança {periodLabel}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Plataforma */}
                          <td className="px-4 py-4">
                            <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                              {platformDisplay}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4">
                            {isSuperAdminUser ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                                Vitalício
                              </span>
                            ) : client.plan_status === 'active' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Ativo
                              </span>
                            ) : client.plan_status === 'expired' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                Expirado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                Em Teste
                              </span>
                            )}
                          </td>

                          {/* Disparos Hoje */}
                          <td className="px-4 py-4 text-center">
                            <span className="inline-flex items-center justify-center font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs">
                              {client.daily_dispatches_count || 0}
                            </span>
                          </td>

                          {/* Data de Cadastro */}
                          <td className="px-5 py-4 text-right text-xs text-slate-500 dark:text-slate-400">
                            <div>
                              {client.created_at
                                ? new Date(client.created_at).toLocaleDateString('pt-BR')
                                : '—'}
                            </div>
                            {client.plan_expires_at && !isSuperAdminUser && (
                              <div className="text-[10px] text-slate-400">
                                Expira: {new Date(client.plan_expires_at).toLocaleDateString('pt-BR')}
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: COMPRAS CAKTO (Histórico Oficial) */}
      {activeTab === 'purchases' && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#121724] overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Histórico de Vendas Registradas pela Cakto
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registros recebidos diretamente pelo webhook oficial da Cakto Pagamentos.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              {purchases.length} compras gravadas
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="px-5 py-3">ID Pedido</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Plano Identificado</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-slate-400">
                      Nenhuma compra da Cakto registrada ainda. Assim que uma transação for aprovada na Cakto, ela aparecerá aqui em tempo real.
                    </td>
                  </tr>
                ) : (
                  purchases.map((pur) => (
                    <tr key={pur.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {pur.order_id || pur.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {pur.customer_name || 'Cliente Cakto'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {pur.customer_email}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
                          {pur.plan_identified || 'Starter'} ({pur.plan_period === 'yearly' ? 'Anual' : 'Mensal'})
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                        {pur.amount ? `R$ ${Number(pur.amount).toFixed(2).replace('.', ',')}` : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {pur.status === 'paid' ? 'Aprovado' : pur.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-slate-500 dark:text-slate-400">
                        {new Date(pur.created_at).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 3: DIAGNÓSTICO DO WEBHOOK CAKTO */}
      {activeTab === 'webhook' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#121724] p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Integração de Webhook com a Cakto Pagamentos
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  URL oficial para cadastrar no painel da Cakto em "Configurações &gt; Webhooks".
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Endpoint Ativo
              </span>
            </div>

            {/* URL para cópia */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                URL do Webhook (Copie e cole na Cakto):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={officialWebhookUrl}
                  className="flex-1 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3.5 py-2 font-mono text-xs text-slate-800 dark:text-slate-200 select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyWebhookUrl}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex-shrink-0"
                >
                  {copiedWebhookUrl ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copiar URL</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Orientações Importantes sobre o Erro 401 do Radar */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 text-xs text-amber-900 dark:text-amber-200 space-y-2">
              <div className="font-bold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <span>Atenção sobre o teste na Cakto:</span>
              </div>
              <p className="leading-relaxed">
                Se você testar na Cakto e receber o erro <code>&#123;"error": "Faça login para acessar o radar."&#125;</code>, isso ocorre porque o domínio <code>afiliado-automatico.vercel.app</code> na sua conta Vercel está atualmente apontado para o seu projeto anterior (Radar de Ofertas).
              </p>
              <p className="leading-relaxed">
                Para resolver, acesse o painel da <strong>Vercel</strong>, vá nas configurações de Domínios do projeto <code>afiliado-automatico</code> e certifique-se de vincular o domínio ou utilizar a URL gerada pela Vercel para este projeto.
              </p>
            </div>

            {/* Teste de Disparo do Webhook */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleTestWebhookEndpoint}
                disabled={webhookTestLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
              >
                <Activity className={`h-4 w-4 ${webhookTestLoading ? 'animate-spin' : ''}`} />
                <span>{webhookTestLoading ? 'Testando Conexão...' : 'Testar Resposta do Endpoint'}</span>
              </button>
            </div>

            {/* Resultado do Teste */}
            {webhookTestResult && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>Resultado do Teste:</span>
                  <span
                    className={
                      webhookTestResult.success ? 'text-emerald-500' : 'text-red-500'
                    }
                  >
                    Status: {webhookTestResult.status}
                  </span>
                </div>
                <pre className="text-[11px] font-mono text-slate-700 dark:text-slate-300 overflow-x-auto p-2 bg-white dark:bg-slate-950 rounded-lg">
                  {JSON.stringify(webhookTestResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
