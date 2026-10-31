import React, { useState } from 'react'
import {
  Search,
  ExternalLink,
  Copy,
  Check,
  ShoppingBag,
  Clock,
  Layers
} from 'lucide-react'

export default function DispatchesHistoryView({ dispatches }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [copiedId, setCopiedId] = useState(null)

  const handleCopy = (text, id) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filteredDispatches = dispatches.filter((item) => {
    const matchesSearch =
      (item.product_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.target_group || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.platform || '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesPlatform =
      selectedPlatform === 'all' || (item.platform || '').toLowerCase() === selectedPlatform.toLowerCase()

    return matchesSearch && matchesPlatform
  })

  const platformBadge = (plat) => {
    switch ((plat || '').toLowerCase()) {
      case 'amazon':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Amazon
          </span>
        )
      case 'shopee':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 dark:bg-orange-950/60 px-2.5 py-0.5 text-[10px] font-bold text-orange-700 dark:text-orange-300">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            Shopee
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Mercado Livre
          </span>
        )
    }
  }

  const formatPrice = (val) => {
    if (typeof val === 'number') {
      return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    }
    return val ? `R$ ${val}` : 'Preço na oferta'
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header com Filtros em Pílulas */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Histórico de Ofertas Disparadas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Arquivo completo das ofertas enviadas pela extensão aos seus canais de WhatsApp.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Busca em Pílula */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por produto ou grupo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 pl-9 pr-4 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
            />
          </div>

          {/* Filtro por Plataforma */}
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none shadow-2xs"
          >
            <option value="all">Todas as Lojas</option>
            <option value="mercadolivre">Mercado Livre</option>
            <option value="amazon">Amazon</option>
            <option value="shopee">Shopee</option>
          </select>
        </div>
      </div>

      {/* Tabela de Disparos em Container Bento */}
      <div className="overflow-hidden rounded-[28px] border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#121724] shadow-xs transition-colors">
        {filteredDispatches.length === 0 ? (
          <div className="p-14 text-center">
            <ShoppingBag className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Nenhuma oferta encontrada</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Quando você disparar ofertas na extensão Afiliado Automático, elas aparecerão aqui automaticamente com links, fotos e dados do envio.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Produto</th>
                  <th className="px-5 py-3.5">Plataforma</th>
                  <th className="px-5 py-3.5">Canal de Destino</th>
                  <th className="px-5 py-3.5">Data e Hora</th>
                  <th className="px-5 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredDispatches.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    {/* Produto com Imagem */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3 max-w-md">
                        {item.product_image ? (
                          <img
                            src={item.product_image}
                            alt={item.product_title}
                            className="h-10 w-10 rounded-xl object-contain bg-white border border-slate-100 dark:border-slate-800 flex-shrink-0"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex-shrink-0">
                            <ShoppingBag className="h-4 w-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate" title={item.product_title}>
                            {item.product_title}
                          </p>
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                            {formatPrice(item.product_price)}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Plataforma */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {platformBadge(item.platform)}
                    </td>

                    {/* Grupo de Destino */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-slate-400" />
                        <span>{item.target_group || 'Grupo WhatsApp'}</span>
                      </div>
                    </td>

                    {/* Data/Hora */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 dark:text-slate-400 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{formatDate(item.dispatched_at)}</span>
                      </div>
                    </td>

                    {/* Ações */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {item.affiliate_link && (
                          <button
                            onClick={() => handleCopy(item.affiliate_link, `link-${item.id || idx}`)}
                            title="Copiar Link de Afiliado"
                            className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs"
                          >
                            {copiedId === `link-${item.id || idx}` ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}

                        {item.product_url && (
                          <a
                            href={item.affiliate_link || item.product_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Abrir no site oficial"
                            className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
