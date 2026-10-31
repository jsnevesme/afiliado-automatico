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
  RefreshCw
} from 'lucide-react'
import { supabase } from '../supabase'

export default function SuperAdminView() {
  const [profiles, setProfiles] = useState([])
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionMessage, setActionMessage] = useState(null)

  const loadAdminData = async () => {
    setLoading(true)
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
        .limit(20)

      if (!purchErr) setPurchases(purchs || [])
    } catch (err) {
      console.error('Erro ao carregar dados de admin:', err)
      setActionMessage({ type: 'error', text: 'Erro ao carregar clientes: ' + err.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdminData()
  }, [])

  // Modificar plano do usuário com 1 clique
  const handleUpdateUserPlan = async (userId, newPlan, newPeriod = 'monthly') => {
    try {
      const expiry = new Date()
      expiry.setDate(expiry.getDate() + 30)

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
      loadAdminData()
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Erro ao atualizar plano: ' + err.message })
    }
  }

  // Estender teste grátis
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
      loadAdminData()
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Erro ao prorrogar teste: ' + err.message })
    }
  }

  const filteredUsers = profiles.filter((p) =>
    (p.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.plan || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalUsers = profiles.length
  const activePaid = profiles.filter(p => p.plan !== 'free_trial' && p.plan_status === 'active').length
  const trialUsers = profiles.filter(p => p.plan === 'free_trial' && p.plan_status === 'active').length
  const expiredUsers = profiles.filter(p => p.plan_status === 'expired').length

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Banner de Super Admin */}
      <div className="rounded-[28px] bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl shadow-purple-900/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-purple-800/40">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/20 px-3.5 py-1 text-xs font-bold text-purple-300 border border-purple-500/30 mb-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Painel do Fundador / Super Admin</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Gestão Global do SaaS</h1>
          <p className="text-xs sm:text-sm text-purple-200/80 mt-1">
            Controle de clientes, assinaturas Cakto, prorrogação de testes e receita recorrente.
          </p>
        </div>

        <button
          onClick={loadAdminData}
          className="flex items-center gap-2 rounded-full bg-purple-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-purple-700 transition-all shadow-md"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Atualizar Clientes</span>
        </button>
      </div>

      {actionMessage && (
        <div className={`rounded-[20px] p-4 text-xs font-semibold ${
          actionMessage.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          {actionMessage.text}
        </div>
      )}

      {/* KPIs do Negócio Bento Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-[24px] border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#121724] p-5 shadow-xs transition-colors">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total de Usuários</span>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white tabular-nums">{totalUsers}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Cadastrados no sistema</span>
        </div>

        <div className="rounded-[24px] border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#121724] p-5 shadow-xs transition-colors">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Assinantes Pagantes</span>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{activePaid}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Planos Starter, Pro e Ultra</span>
        </div>

        <div className="rounded-[24px] border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#121724] p-5 shadow-xs transition-colors">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Leads no Teste Grátis</span>
          <div className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400 tabular-nums">{trialUsers}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Usuários em avaliação</span>
        </div>

        <div className="rounded-[24px] border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#121724] p-5 shadow-xs transition-colors">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Testes Expirados</span>
          <div className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">{expiredUsers}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Leads para remarketing</span>
        </div>
      </div>

      {/* Tabela de Gestão de Clientes */}
      <div className="rounded-[28px] border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#121724] shadow-xs overflow-hidden transition-colors">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Todos os Clientes Cadastrados</h2>
            <p className="text-xs text-slate-400">Lista em tempo real dos perfis conectados ao seu SaaS</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por e-mail ou plano..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 pl-9 pr-4 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-2xs"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Carregando base de clientes...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Cliente</th>
                  <th className="px-5 py-3.5">Plano Atual</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Disparos Hoje</th>
                  <th className="px-5 py-3.5">Data de Cadastro</th>
                  <th className="px-5 py-3.5 text-right">Ações de Gestão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredUsers.map((client) => {
                  const isSA = client.role === 'superadmin' || client.email === 'jsnevesme@gmail.com'
                  return (
                    <tr key={client.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-xs">
                            {client.email?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{client.email}</div>
                            {isSA && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-950/60 px-2 py-0.5 text-[9px] font-bold text-purple-700 dark:text-purple-300">
                                Fundador (Superadmin)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 uppercase font-extrabold text-slate-700 dark:text-slate-300">
                        {isSA ? 'Super Admin' : client.plan}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          client.plan_status === 'active'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                        }`}>
                          {client.plan_status === 'active' ? 'Ativo' : 'Expirado'}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 font-semibold text-slate-700 dark:text-slate-300">
                        {isSA ? '∞' : `${client.daily_dispatches_count || 0}`}
                      </td>

                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                        {client.created_at ? new Date(client.created_at).toLocaleDateString('pt-BR') : '-'}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        {!isSA ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleUpdateUserPlan(client.id, 'pro')}
                              title="Promover para Plano Pro"
                              className="rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 hover:opacity-90"
                            >
                              +Pro
                            </button>
                            <button
                              onClick={() => handleUpdateUserPlan(client.id, 'ultra')}
                              title="Promover para Plano Ultra"
                              className="rounded-full border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-1 text-[10px] font-bold text-purple-700 dark:text-purple-300 hover:opacity-90"
                            >
                              +Ultra
                            </button>
                            <button
                              onClick={() => handleExtendTrial(client.id, 7)}
                              title="Adicionar +7 dias de teste"
                              className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                              +7d Teste
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold">Conta Mestre</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
