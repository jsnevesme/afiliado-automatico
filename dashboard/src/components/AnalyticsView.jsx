import React, { useState } from 'react'
import {
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
  DollarSign,
  Radio,
  Share2,
  Check,
  ShoppingBag,
  Send,
  Zap,
  Clock,
  Sparkles,
  Users
} from 'lucide-react'

export default function AnalyticsView({ profile, user, dispatches = [], sales = [], isSuperAdmin, onGoToSales }) {
  const [selectedFilter, setSelectedFilter] = useState('all')

  const dispatchesToday = profile?.daily_dispatches_count || 0
  const limit = isSuperAdmin || profile?.plan === 'ultra' ? 'Ilimitado' : (profile?.plan === 'pro' ? 50 : 20)
  const isUnlimited = limit === 'Ilimitado'

  const totalDispatches = dispatches.length
  const firstName = (profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Afiliado').split(' ')[0]

  // Métricas financeiras 100% REAIS
  const totalCommission = sales.reduce((acc, s) => acc + (parseFloat(s.commission_amount) || 0), 0)
  const totalGross = sales.reduce((acc, s) => acc + (parseFloat(s.gross_amount) || 0), 0)
  const avgTicket = sales.length > 0 ? (totalGross / sales.length) : 0
  const realMargin = totalGross > 0 ? ((totalCommission / totalGross) * 100).toFixed(1) : 0

  // Distribuição 100% REAL por loja
  const platformCounts = dispatches.reduce((acc, curr) => {
    const plat = (curr.platform || 'mercadolivre').toLowerCase()
    acc[plat] = (acc[plat] || 0) + 1
    return acc
  }, { mercadolivre: 0, amazon: 0, shopee: 0 })

  const mlPct = totalDispatches > 0 ? Math.round((platformCounts.mercadolivre / totalDispatches) * 100) : 0
  const amzPct = totalDispatches > 0 ? Math.round((platformCounts.amazon / totalDispatches) * 100) : 0
  const shpPct = totalDispatches > 0 ? Math.round((platformCounts.shopee / totalDispatches) * 100) : 0

  // Atividade dos últimos 7 dias 100% REAL baseada em dispatches_log
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toISOString().split('T')[0]
    const dayLabel = d.toLocaleDateString('pt-BR', { weekday: 'short' })
    const dayNum = d.getDate()
    const count = dispatches.filter(disp => disp.dispatched_at && disp.dispatched_at.startsWith(dateStr)).length
    return { dateStr, dayLabel, dayNum, count }
  })

  // Encontrar o dia de pico real
  let maxDayIndex = -1
  let maxCount = 0
  last7Days.forEach((item, idx) => {
    if (item.count > maxCount) {
      maxCount = item.count
      maxDayIndex = idx
    }
  })
  const chartMax = Math.max(maxCount, 5)

  // Canais 100% REAIS extraídos dos disparos
  const groupCounts = dispatches.reduce((acc, d) => {
    if (d.target_group && d.target_group.trim()) {
      acc[d.target_group] = (acc[d.target_group] || 0) + 1
    }
    return acc
  }, {})

  const displayGroups = Object.entries(groupCounts).map(([name, count]) => ({
    name,
    count,
    active: true
  }))

  // Filtragem da tabela recente
  const filteredSales = sales.filter(s => {
    if (selectedFilter === 'all') return true
    return (s.platform || '').toLowerCase() === selectedFilter.toLowerCase()
  })

  // Resolve imagem do produto se existir
  const resolveSaleImage = (sale) => {
    if (sale.notes) {
      try {
        const parsed = JSON.parse(sale.notes)
        if (parsed.image) return parsed.image
      } catch (e) {}
    }
    const match = dispatches.find(d => (d.product_title || '').toLowerCase() === (sale.product_name || '').toLowerCase())
    if (match && match.product_image) return match.product_image
    return null
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome Header (Estilo SETO / Healthy) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome, {firstName}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Aqui está a visão unificada de receita, comissões e atividade real dos seus canais de vendas.
          </p>
        </div>

        <button
          onClick={onGoToSales}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-sm"
        >
          <span>Lançar Venda</span>
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      {/* Grid de 3 Cards Bento Pastel com Dados 100% REAIS */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Card 1: Warm Peach / Rose Pastel (Comissões Líquidas) */}
        <div className="rounded-[28px] bg-gradient-to-br from-[#FFEBEF] to-[#FFE5DF] dark:from-[#2B151D] dark:to-[#221316] p-6 border border-rose-200/50 dark:border-rose-900/30 shadow-xs flex flex-col justify-between h-48 transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-rose-200/70 dark:bg-rose-900/50 flex items-center justify-center text-rose-700 dark:text-rose-300">
                <DollarSign className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-rose-950 dark:text-rose-200">
                Comissões Líquidas
              </span>
            </div>
            <span className="rounded-full bg-white/80 dark:bg-rose-950/60 px-2.5 py-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 shadow-2xs">
              {realMargin}% margem
            </span>
          </div>

          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums">
              {totalCommission.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-rose-900/70 dark:text-rose-300/70 font-medium mt-1">
              {sales.length} {sales.length === 1 ? 'venda registrada' : 'vendas registradas'}
            </p>
          </div>

          <div className="w-full bg-white/50 dark:bg-rose-950/40 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-rose-500 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.max(5, (sales.length * 10)))}%` }}
            />
          </div>
        </div>

        {/* Card 2: Lavender / Purple Pastel (Volume GMV) */}
        <div className="rounded-[28px] bg-gradient-to-br from-[#F1EDFF] to-[#E9E3FF] dark:from-[#1D172E] dark:to-[#161226] p-6 border border-purple-200/50 dark:border-purple-900/30 shadow-xs flex flex-col justify-between h-48 transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-purple-200/70 dark:bg-purple-900/50 flex items-center justify-center text-purple-700 dark:text-purple-300">
                <TrendingUp className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-purple-950 dark:text-purple-200">
                Volume de Vendas (GMV)
              </span>
            </div>
            <span className="rounded-full bg-white/80 dark:bg-purple-950/60 px-2.5 py-1 text-[11px] font-bold text-purple-700 dark:text-purple-300 shadow-2xs">
              {sales.length} conv.
            </span>
          </div>

          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums">
              {totalGross.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-purple-900/70 dark:text-purple-300/70 font-medium mt-1">
              Ticket Médio: {avgTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>

          <div className="w-full bg-white/50 dark:bg-purple-950/40 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-purple-600 h-1.5 rounded-full transition-all"
              style={{ width: `${totalGross > 0 ? Math.min(100, Math.max(10, (totalGross / 5000) * 100)) : 5}%` }}
            />
          </div>
        </div>

        {/* Card 3: Mint / Emerald / Teal Pastel (Disparos Hoje) */}
        <div className="rounded-[28px] bg-gradient-to-br from-[#E6F7F3] to-[#DAF3ED] dark:from-[#0E2521] dark:to-[#0A1D1A] p-6 border border-emerald-200/50 dark:border-emerald-900/30 shadow-xs flex flex-col justify-between h-48 transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-emerald-200/70 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                <Radio className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                Disparos Hoje
              </span>
            </div>
            <span className="rounded-full bg-white/80 dark:bg-emerald-950/60 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 shadow-2xs">
              {isUnlimited ? 'Ilimitado' : `${limit}/dia`}
            </span>
          </div>

          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums">
              {dispatchesToday}
              <span className="text-base text-emerald-900/60 dark:text-emerald-400 font-semibold ml-1.5">
                / {isUnlimited ? '∞' : limit}
              </span>
            </div>
            <p className="text-xs text-emerald-900/70 dark:text-emerald-300/70 font-medium mt-1">
              {totalDispatches} {totalDispatches === 1 ? 'oferta enviada' : 'ofertas enviadas'} no histórico
            </p>
          </div>

          <div className="w-full bg-white/50 dark:bg-emerald-950/40 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all"
              style={{ width: `${isUnlimited ? 100 : Math.min(100, Math.max(5, (dispatchesToday / limit) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid Médio: Gráfico de Barras em Cápsulas + Canais Conectados */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 items-stretch">
        {/* Atividade de Disparos nos Últimos 7 Dias (100% REAL) */}
        <div className="rounded-[28px] bg-white dark:bg-[#121724] border border-slate-200/70 dark:border-slate-800 p-6 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Atividade Semanal de Disparos
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Histórico real de ofertas disparadas aos seus canais nesta semana
              </p>
            </div>

            <div className="rounded-full bg-slate-100 dark:bg-slate-800/80 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
              Últimos 7 Dias
            </div>
          </div>

          <div className="relative pt-10 pb-2">
            <div className="absolute top-1/2 left-0 right-0 border-b border-dashed border-slate-200 dark:border-slate-800/80 pointer-events-none" />

            <div className="flex items-end justify-between gap-3 sm:gap-6 h-48 px-2">
              {last7Days.map((item, idx) => {
                const isPeak = maxCount > 0 && idx === maxDayIndex
                const heightPct = item.count > 0 ? Math.max(16, (item.count / chartMax) * 100) : 8

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full relative group">
                    {/* Tooltip flutuante apenas se houver disparos reais */}
                    {isPeak && (
                      <div className="absolute -top-7 flex flex-col items-center animate-bounce">
                        <div className="rounded-full bg-purple-600 text-white text-[10px] font-bold px-2.5 py-0.5 shadow-sm whitespace-nowrap">
                          {item.count} {item.count === 1 ? 'disparo' : 'disparos'}
                        </div>
                        <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-purple-600" />
                      </div>
                    )}

                    <div className="w-full max-w-[42px] bg-slate-100 dark:bg-slate-800/60 rounded-full h-full flex items-end p-1 overflow-hidden">
                      <div
                        className={`w-full rounded-full transition-all duration-300 ${
                          isPeak
                            ? 'bg-gradient-to-t from-purple-700 to-purple-500 shadow-xs'
                            : item.count > 0
                            ? 'bg-purple-600/70 hover:bg-purple-600'
                            : 'bg-slate-200/60 dark:bg-slate-800/40'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>

                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-3 capitalize">
                      {item.dayLabel}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Canais Conectados (100% REAIS extraídos dos envios da extensão) */}
        <div className="rounded-[28px] bg-white dark:bg-[#121724] border border-slate-200/70 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Canais Conectados
              </h2>
              <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 text-[11px] font-bold">
                {displayGroups.length} {displayGroups.length === 1 ? 'Ativo' : 'Ativos'}
              </span>
            </div>

            {displayGroups.length === 0 ? (
              <div className="py-8 text-center">
                <Users className="h-8 w-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Nenhum grupo registrado ainda
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-1">
                  Ao disparar sua primeira oferta pelo WhatsApp na extensão, o grupo aparecerá aqui com métricas automáticas.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {displayGroups.map((grp, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-2xs">
                        WA
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {grp.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {grp.count} {grp.count === 1 ? 'oferta disparada' : 'ofertas disparadas'}
                        </p>
                      </div>
                    </div>

                    <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-400/30" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mix Real por Marketplaces */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
              Mix Real de Ofertas
            </span>
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" /> ML ({mlPct}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-600" /> Amz ({amzPct}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-orange-500" /> Shp ({shpPct}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela Inferior: Histórico Recente de Conversões Reais */}
      <div className="rounded-[28px] bg-white dark:bg-[#121724] border border-slate-200/70 dark:border-slate-800 p-6 shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Histórico Recente de Conversões
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Transações confirmadas originadas dos links de afiliados
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-full">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'mercadolivre', label: 'Mercado Livre' },
              { id: 'amazon', label: 'Amazon' },
              { id: 'shopee', label: 'Shopee' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  selectedFilter === f.id
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredSales.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Nenhuma venda registrada ainda. Clique em "Lançar Venda" para adicionar suas conversões reais!
          </div>
        ) : (
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-3">Produto & Loja</th>
                  <th className="py-3 px-3">Canal de Origem</th>
                  <th className="py-3 px-3">Valor Bruto</th>
                  <th className="py-3 px-3">Comissão</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredSales.slice(0, 5).map((sale) => {
                  const sImg = resolveSaleImage(sale)
                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          {sImg ? (
                            <img
                              src={sImg}
                              alt=""
                              className="h-8 w-8 rounded-xl object-contain bg-white border border-slate-100 dark:border-slate-800 flex-shrink-0"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300">
                              <ShoppingBag className="h-4 w-4" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white truncate max-w-xs">
                              {sale.product_name}
                            </p>
                            <span className="text-[10px] text-slate-400 capitalize">
                              {sale.platform} • {sale.category || 'Geral'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">
                        {sale.target_group || 'WhatsApp'}
                      </td>

                      <td className="py-3.5 px-3 font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                        {sale.gross_amount ? parseFloat(sale.gross_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                      </td>

                      <td className="py-3.5 px-3 font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {parseFloat(sale.commission_amount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-3 py-1 text-[11px] font-bold">
                          <Check className="h-3 w-3 stroke-[3]" />
                          Confirmado
                        </span>
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
