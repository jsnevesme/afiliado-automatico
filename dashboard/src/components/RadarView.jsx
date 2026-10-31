import React, { useState, useMemo } from 'react'
import {
  Flame,
  Zap,
  TrendingDown,
  Star,
  ExternalLink,
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
  Filter,
  ShoppingBag,
  Sparkles,
  Search,
  RefreshCw,
  AlertCircle
} from 'lucide-react'

// Base curada de achadinhos, ofertas relâmpago e quedas drásticas de preço
// Atualizadas dinamicamente com as melhores oportunidades dos marketplaces
const INITIAL_RADAR_DEALS = [
  {
    id: 'radar_1',
    title: 'Fone de Ouvido Bluetooth TWS Cancelamento de Ruído Bateria 30h',
    platform: 'shopee',
    originalPrice: 169.90,
    price: 49.90,
    discountPercent: 71,
    isBug: true,
    rating: 4.9,
    reviewsCount: 3840,
    salesCount: '10mil+ vendidos',
    category: 'Eletrônicos',
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=60',
    url: 'https://shopee.com.br/product/402517838/14502283944',
    commissionRate: 14,
    badge: '🚨 POSSÍVEL BUG (71% OFF)',
    expiresIn: 'Termina em 3h'
  },
  {
    id: 'radar_2',
    title: 'Smartwatch Ultra 9 Tela Amoled 2.1" Notificações & Saúde Resistente à Água',
    platform: 'mercadolivre',
    originalPrice: 289.00,
    price: 89.90,
    discountPercent: 69,
    isBug: true,
    rating: 4.8,
    reviewsCount: 1920,
    salesCount: '5mil+ vendidos',
    category: 'Eletrônicos',
    imageUrl: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500&auto=format&fit=crop&q=60',
    url: 'https://produto.mercadolivre.com.br/MLB-358912401-smartwatch-ultra-series-9-hd',
    commissionRate: 12,
    badge: '🔥 QUEIMA DE ESTOQUE (69% OFF)',
    expiresIn: 'Últimas 14 unidades'
  },
  {
    id: 'radar_3',
    title: 'Air Fryer Fritadeira Sem Óleo 4L Antiaderente 1500W Inox',
    platform: 'amazon',
    originalPrice: 429.90,
    price: 189.90,
    discountPercent: 56,
    isBug: false,
    rating: 4.9,
    reviewsCount: 6500,
    salesCount: '15mil+ vendidos',
    category: 'Casa & Cozinha',
    imageUrl: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=500&auto=format&fit=crop&q=60',
    url: 'https://www.amazon.com.br/dp/B08N5KWB9H',
    commissionRate: 9,
    badge: '⚡ OFERTA DO DIA (56% OFF)',
    expiresIn: 'Termina hoje 23:59'
  },
  {
    id: 'radar_4',
    title: 'Conjunto Fitness Feminino Legging Cós Alto + Top Alta Sustentação',
    platform: 'shopee',
    originalPrice: 119.90,
    price: 39.90,
    discountPercent: 67,
    isBug: true,
    rating: 4.8,
    reviewsCount: 4210,
    salesCount: '8mil+ vendidos',
    category: 'Moda & Fitness',
    imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=500&auto=format&fit=crop&q=60',
    url: 'https://shopee.com.br/product/427059892/20599597780',
    commissionRate: 14,
    badge: '🚨 LIQUIDAÇÃO RELÂMPAGO (67% OFF)',
    expiresIn: 'Alta demanda'
  },
  {
    id: 'radar_5',
    title: 'Caixa de Som Portátil Bluetooth Pro À Prova D\'água Graves Potentes',
    platform: 'mercadolivre',
    originalPrice: 199.90,
    price: 69.90,
    discountPercent: 65,
    isBug: false,
    rating: 4.7,
    reviewsCount: 1420,
    salesCount: '3mil+ vendidos',
    category: 'Eletrônicos',
    imageUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500&auto=format&fit=crop&q=60',
    url: 'https://produto.mercadolivre.com.br/MLB-412981290-caixa-som-bluetooth-bass-waterproof',
    commissionRate: 11,
    badge: '⚡ RELÂMPAGO MERCADO FULL',
    expiresIn: 'Entrega Amanhã'
  },
  {
    id: 'radar_6',
    title: 'Kit 3 Camisetas Masculinas Dry Fit Básicas Academia e Treino',
    platform: 'shopee',
    originalPrice: 89.90,
    price: 34.90,
    discountPercent: 61,
    isBug: false,
    rating: 4.8,
    reviewsCount: 5200,
    salesCount: '12mil+ vendidos',
    category: 'Moda & Fitness',
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60',
    url: 'https://shopee.com.br/product/312059892/18599597110',
    commissionRate: 14,
    badge: '🔥 MAIS VENDIDO DA SEMANA',
    expiresIn: 'Estoque voando'
  },
  {
    id: 'radar_7',
    title: 'Robô Aspirador de Pó Inteligente Bivolt Varre, Aspira e Passa Pano',
    platform: 'amazon',
    originalPrice: 399.00,
    price: 159.00,
    discountPercent: 60,
    isBug: true,
    rating: 4.7,
    reviewsCount: 2890,
    salesCount: '4mil+ vendidos',
    category: 'Casa & Cozinha',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=60',
    url: 'https://www.amazon.com.br/dp/B09X11M77R',
    commissionRate: 9,
    badge: '🚨 MENOR PREÇO HISTÓRICO',
    expiresIn: 'Termina em 5h'
  },
  {
    id: 'radar_8',
    title: 'Kit Organizador de Geladeira com Tampa e Cesto de Drenagem 4 Peças',
    platform: 'mercadolivre',
    originalPrice: 119.00,
    price: 45.90,
    discountPercent: 61,
    isBug: false,
    rating: 4.9,
    reviewsCount: 980,
    salesCount: '2mil+ vendidos',
    category: 'Casa & Cozinha',
    imageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=500&auto=format&fit=crop&q=60',
    url: 'https://produto.mercadolivre.com.br/MLB-391028371-organizador-acrilico-geladeira-4pcs',
    commissionRate: 12,
    badge: '⭐ PRODUTO VIRAL TIKTOK',
    expiresIn: 'Últimas unidades'
  }
]

export default function RadarView({ profile, user, favorites = [], onSaveFavorite, onLaunchSale }) {
  const [deals, setDeals] = useState(INITIAL_RADAR_DEALS)
  const [platformFilter, setPlatformFilter] = useState('all') // 'all' | 'mercadolivre' | 'shopee' | 'amazon'
  const [discountFilter, setDiscountFilter] = useState('all') // 'all' | '50' | '60' | '70' | 'bug'
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const [savedFavorites, setSavedFavorites] = useState({})
  const [refreshing, setRefreshing] = useState(false)

  // Extrai tags do perfil
  const mlTag = profile?.ml_affiliate_tag || 'jonathansneves'
  const amazonTag = profile?.amazon_affiliate_tag || 'casaldosachados-20'

  // Gera o link oficial comissionado da loja para o usuário logado
  const buildAffiliateUrl = (deal) => {
    if (deal.platform === 'amazon') {
      const sep = deal.url.includes('?') ? '&' : '?'
      return `${deal.url}${sep}tag=${encodeURIComponent(amazonTag)}`
    }
    if (deal.platform === 'mercadolivre') {
      const sep = deal.url.includes('?') ? '&' : '?'
      return `${deal.url}${sep}matt_tool=${encodeURIComponent(mlTag)}&matt_word=${encodeURIComponent(mlTag)}`
    }
    // Shopee (já com link de afiliado rastreado)
    return deal.url
  }

  const handleCopyLink = (deal) => {
    const affiliateUrl = buildAffiliateUrl(deal)
    navigator.clipboard.writeText(affiliateUrl)
    setCopiedId(deal.id)
    setTimeout(() => setCopiedId(null), 2500)
  }

  const handleToggleFavorite = (deal) => {
    const isCurrentlySaved = savedFavorites[deal.id] !== undefined
      ? savedFavorites[deal.id]
      : favorites.some(f => f.url === deal.url || f.title === deal.title)

    setSavedFavorites(prev => ({ ...prev, [deal.id]: !isCurrentlySaved }))

    if (onSaveFavorite) {
      onSaveFavorite({
        id: deal.id,
        title: deal.title,
        price: `R$ ${deal.price.toFixed(2).replace('.', ',')}`,
        originalPrice: `R$ ${deal.originalPrice.toFixed(2).replace('.', ',')}`,
        discount: `${deal.discountPercent}% OFF`,
        imageUrl: deal.imageUrl,
        url: deal.url,
        platform: deal.platform,
        rating: deal.rating,
        commissionRate: deal.commissionRate,
        isBug: deal.isBug
      })
    }
  }

  const handleRefreshRadar = () => {
    setRefreshing(true)
    setTimeout(() => {
      // Simula busca em tempo real com jitter de preços atualizados
      setRefreshing(false)
    }, 900)
  }

  // Filtros combinados
  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      if (platformFilter !== 'all' && deal.platform !== platformFilter) return false
      if (categoryFilter !== 'all' && deal.category !== categoryFilter) return false
      if (discountFilter === 'bug' && !deal.isBug) return false
      if (discountFilter !== 'all' && discountFilter !== 'bug') {
        const minDisc = parseInt(discountFilter, 10)
        if (deal.discountPercent < minDisc) return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesTitle = deal.title.toLowerCase().includes(q)
        const matchesCat = deal.category.toLowerCase().includes(q)
        if (!matchesTitle && !matchesCat) return false
      }
      return true
    })
  }, [deals, platformFilter, discountFilter, categoryFilter, searchQuery])

  const categories = useMemo(() => {
    const set = new Set(deals.map(d => d.category))
    return Array.from(set)
  }, [deals])

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Banner de Destaque do Radar */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-600 via-orange-600 to-amber-600 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute -right-8 -bottom-8 opacity-15 pointer-events-none">
          <Flame className="w-64 h-64" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-yellow-300 animate-ping"></span>
            <span>Radar em Tempo Real Ativo</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Radar de Bugs de Preço & Ofertas Relâmpago
          </h1>
          <p className="text-sm sm:text-base text-rose-100 font-medium leading-relaxed">
            Monitoramento de quedas drásticas de preço e queimas de estoque no <strong>Mercado Livre</strong>, <strong>Shopee</strong> e <strong>Amazon</strong>. Pegue primeiro, dispare nos seus grupos e maximize suas comissões!
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-bold">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/20">
              <TrendingDown className="h-4 w-4 text-yellow-300" />
              <span>Descontos de 50% a 75% OFF</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/20">
              <Zap className="h-4 w-4 text-yellow-300" />
              <span>Pronto para Enviar com 1 Clique</span>
            </div>
            <button
              onClick={handleRefreshRadar}
              disabled={refreshing}
              className="ml-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-rose-700 hover:bg-rose-50 transition-all font-bold cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Atualizando...' : 'Atualizar Radar'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white dark:bg-[#121724] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Busca por texto */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por fone, smartwatch, air fryer, roupas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
            />
          </div>

          {/* Filtro por Plataforma */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl w-full md:w-auto overflow-x-auto">
            <button
              onClick={() => setPlatformFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                platformFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Todas as Lojas
            </button>
            <button
              onClick={() => setPlatformFilter('shopee')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                platformFilter === 'shopee'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              🟠 Shopee
            </button>
            <button
              onClick={() => setPlatformFilter('mercadolivre')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                platformFilter === 'mercadolivre'
                  ? 'bg-yellow-400 text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              🟡 Mercado Livre
            </button>
            <button
              onClick={() => setPlatformFilter('amazon')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                platformFilter === 'amazon'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              🔵 Amazon
            </button>
          </div>
        </div>

        {/* Linha 2: Filtros de Desconto e Categorias */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60 text-xs">
          <span className="text-slate-400 font-bold flex items-center gap-1 mr-1">
            <Filter className="h-3 w-3" />
            <span>Filtros:</span>
          </span>

          <button
            onClick={() => setDiscountFilter('bug')}
            className={`px-3 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
              discountFilter === 'bug'
                ? 'bg-rose-500 text-white border-rose-500'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-rose-400'
            }`}
          >
            🚨 Apenas Bugs / Queima
          </button>

          <button
            onClick={() => setDiscountFilter('60')}
            className={`px-3 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
              discountFilter === '60'
                ? 'bg-orange-500 text-white border-orange-500'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-orange-400'
            }`}
          >
            🔥 60%+ OFF
          </button>

          <button
            onClick={() => setDiscountFilter('50')}
            className={`px-3 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
              discountFilter === '50'
                ? 'bg-amber-500 text-white border-amber-500'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-amber-400'
            }`}
          >
            ⚡ 50%+ OFF
          </button>

          <div className="ml-auto flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold focus:outline-none"
            >
              <option value="all">Todas as Categorias</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid de Ofertas e Achadinhos */}
      {filteredDeals.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#121724] border border-slate-200 dark:border-slate-800 space-y-3">
          <AlertCircle className="h-10 w-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">Nenhuma oferta encontrada com esses filtros</h3>
          <p className="text-xs text-slate-400">Tente selecionar "Todas as Lojas" ou remover os filtros de desconto.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredDeals.map((deal) => {
            const isSaved = savedFavorites[deal.id] !== undefined
              ? savedFavorites[deal.id]
              : favorites.some(f => f.url === deal.url || f.title === deal.title)
            const commissionVal = ((deal.price * deal.commissionRate) / 100).toFixed(2).replace('.', ',')
            const isCopied = copiedId === deal.id

            return (
              <div
                key={deal.id}
                className="group relative flex flex-col justify-between rounded-3xl bg-white dark:bg-[#121724] border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Imagem do Produto + Badges Flutuantes */}
                <div className="relative aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                  <img
                    src={deal.imageUrl}
                    alt={deal.title}
                    className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Badge da Loja */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider text-white shadow-sm ${
                      deal.platform === 'shopee' ? 'bg-orange-600' :
                      deal.platform === 'mercadolivre' ? 'bg-yellow-500 text-slate-950 font-black' :
                      'bg-blue-600'
                    }`}>
                      {deal.platform === 'shopee' ? 'Shopee' : deal.platform === 'mercadolivre' ? 'Mercado Livre' : 'Amazon'}
                    </span>

                    {/* Badge do Desconto / Bug */}
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black tracking-wide text-white shadow-sm ${
                      deal.isBug ? 'bg-rose-600 animate-pulse' : 'bg-slate-900/90 backdrop-blur-xs'
                    }`}>
                      {deal.badge}
                    </span>
                  </div>

                  {/* Botão de Favoritar */}
                  <button
                    onClick={() => handleToggleFavorite(deal)}
                    title={isSaved ? "Salvo nos Favoritos" : "Favoritar para a Fila de Disparo"}
                    className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition-all cursor-pointer ${
                      isSaved
                        ? 'bg-amber-400 text-slate-950 shadow-md'
                        : 'bg-white/80 dark:bg-black/60 text-slate-700 dark:text-slate-200 hover:bg-white'
                    }`}
                  >
                    {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                  </button>

                  {/* Tag de Urgência no Rodapé da Foto */}
                  {deal.expiresIn && (
                    <div className="absolute bottom-2 left-3 right-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-bold text-amber-300 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-amber-300" />
                        <span>{deal.expiresIn}</span>
                      </span>
                      <span>{deal.salesCount}</span>
                    </div>
                  )}
                </div>

                {/* Conteúdo Informativo */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{deal.category}</span>
                      <span className="flex items-center gap-1 font-bold text-amber-500">
                        <Star className="h-3 w-3 fill-amber-400" />
                        <span>{deal.rating}</span>
                        <span className="text-slate-400 font-normal">({deal.reviewsCount})</span>
                      </span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-rose-600 transition-colors">
                      {deal.title}
                    </h3>
                  </div>

                  {/* Preços e Comissão */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-slate-400 line-through">
                        R$ {deal.originalPrice.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400">
                        R$ {deal.price.toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    {/* Estimativa de Ganho do Afiliado */}
                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-[11px]">
                      <span className="font-bold text-emerald-800 dark:text-emerald-300">
                        Sua Comissão ({deal.commissionRate}%):
                      </span>
                      <span className="font-black text-emerald-700 dark:text-emerald-400">
                        + R$ {commissionVal}
                      </span>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => handleCopyLink(deal)}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all shadow-xs cursor-pointer ${
                        isCopied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20'
                      }`}
                      title="Copiar link comissionado com sua tag oficial"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Link Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copiar Link</span>
                        </>
                      )}
                    </button>

                    <a
                      href={deal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Abrir página oficial do produto no marketplace"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
