import React, { useState, useEffect, useRef } from 'react'
import {
  DollarSign,
  PlusCircle,
  ShoppingBag,
  Trash2,
  Calendar,
  Layers,
  TrendingUp,
  Tag,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowUpRight,
  Sparkles,
  Search,
  ExternalLink,
  Check,
  X
} from 'lucide-react'
import { supabase } from '../supabase'

export default function DailySalesView({
  sales = [],
  dispatches = [],
  favorites = [],
  onSalesUpdate,
  user,
  prefilledProduct = null
}) {
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0])
  const [platform, setPlatform] = useState('mercadolivre')
  const [productName, setProductName] = useState('')
  const [category, setCategory] = useState('Moda & Calçados')
  const [quantity, setQuantity] = useState(1)
  const [grossAmount, setGrossAmount] = useState('')
  const [commissionAmount, setCommissionAmount] = useState('')
  const [targetGroup, setTargetGroup] = useState('')
  const [productImage, setProductImage] = useState('')
  const [productUrl, setProductUrl] = useState('')
  const [selectedDispatchId, setSelectedDispatchId] = useState(null)

  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const dropdownRef = useRef(null)

  const DEFAULT_NICHES = [
    'Moda & Calçados',
    'Beleza & Cuidados',
    'Casa & Cozinha',
    'Tech & Celulares',
    'Brinquedos & Bebês',
    'Esportes & Fitness',
    'Alimentos & Bebidas',
    'Ferramentas & Auto',
    'Livros & Papelaria',
    'Games & Informática',
    'Pets & Animais',
    'Saúde & Bem-Estar',
    'Geral & Achadinhos'
  ]

  // Gerenciamento Dinâmico de Nichos (Usuário pode adicionar, editar ou excluir nichos)
  const [availableNiches, setAvailableNiches] = useState(() => {
    try {
      const saved = localStorage.getItem(`custom_niches_${user?.id || 'default'}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (_) {}
    return DEFAULT_NICHES
  })
  const [showAddNiche, setShowAddNiche] = useState(false)
  const [newNicheInput, setNewNicheInput] = useState('')
  const [managingNiches, setManagingNiches] = useState(false)

  const handleAddNiche = (e) => {
    if (e) e.preventDefault()
    const trimmed = newNicheInput.trim()
    if (!trimmed) return
    if (!availableNiches.includes(trimmed)) {
      const updated = [trimmed, ...availableNiches]
      setAvailableNiches(updated)
      try {
        localStorage.setItem(`custom_niches_${user?.id || 'default'}`, JSON.stringify(updated))
      } catch (_) {}
    }
    setCategory(trimmed)
    setNewNicheInput('')
    setShowAddNiche(false)
  }

  const handleDeleteNiche = (nicheToDelete, e) => {
    if (e) e.stopPropagation()
    const updated = availableNiches.filter(n => n !== nicheToDelete)
    setAvailableNiches(updated)
    try {
      localStorage.setItem(`custom_niches_${user?.id || 'default'}`, JSON.stringify(updated))
    } catch (_) {}
    if (category === nicheToDelete) {
      setCategory(updated[0] || 'Geral & Achadinhos')
    }
  }

  // Se vier produto pré-selecionado (ex: da aba de Favoritos)
  useEffect(() => {
    if (prefilledProduct) {
      applySelectedProduct(prefilledProduct)
    }
  }, [prefilledProduct])

  // Fecha dropdown de sugestões ao clicar fora
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Função utilitária robusta para converter qualquer formato monetário (ex: "R$ 1.250,90", "33", "R$ 33,00")
  const parseBrlPrice = (val) => {
    if (typeof val === 'number') return val
    if (!val) return 0
    const str = String(val).trim().replace(/[^\d.,]/g, '')
    if (str.includes(',')) {
      const withoutDots = str.replace(/\./g, '')
      const withDotDecimal = withoutDots.replace(',', '.')
      return parseFloat(withDotDecimal) || 0
    }
    return parseFloat(str) || 0
  }

  // Detector automático de nicho baseado no título do produto
  const detectNicheFromTitle = (text = '') => {
    const t = text.toLowerCase()
    if (/baby doll|lingerie|suti[aã]|calcinha|cueca|pijama|vestido|shorts|bermuda|cal[çc]a|camisa|camiseta|t[eê]nis|sapato|sand[aá]lia|bota|bolsa|mochila|moda|roupa|vestu[aá]rio/i.test(t)) {
      return 'Moda & Calçados'
    }
    if (/perfume|maquiagem|batom|base|rimel|skincare|creme|shampoo|cabelo|beleza|hidratante/i.test(t)) {
      return 'Beleza & Cuidados'
    }
    if (/beb[eê]|baby|maternidade|fralda|chupeta|mamadeira|carrinho|chocalho|brinquedo/i.test(t)) {
      return 'Brinquedos & Bebês'
    }
    if (/whey|creatina|suplemento|academia|fitness|esporte|bicicleta|patinete/i.test(t)) {
      return 'Esportes & Fitness'
    }
    if (/celular|smartphone|notebook|computador|fone|headset|alexa|kindle|tv|tablet/i.test(t)) {
      return 'Tech & Celulares'
    }
    if (/panela|air fryer|cafeteira|liquidificador|fog[aã]o|geladeira|mesa|cadeira|cama|sof[aá]|casa|cozinha/i.test(t)) {
      return 'Casa & Cozinha'
    }
    if (/furadeira|parafusadeira|ferramenta|pneu|automotivo|carro|moto/i.test(t)) {
      return 'Ferramentas & Auto'
    }
    if (/cafe|café|vinho|cerveja|whisky|azeite|chocolate|alimento|supermercado/i.test(t)) {
      return 'Alimentos & Bebidas'
    }
    if (/livro|hq|manga|mangá|didatico|caneta|caderno/i.test(t)) {
      return 'Livros & Papelaria'
    }
    if (/game|ps5|xbox|nintendo|gamer|mouse gamer|teclado gamer/i.test(t)) {
      return 'Games & Informática'
    }
    if (/ra[çc][aã]o|pet|cachorro|gato|coleira|aquario/i.test(t)) {
      return 'Pets & Animais'
    }
    return null
  }

  // Auto-cálculo de comissão estimada baseado na loja, categoria e título
  const calculateCommissionRate = (plat, cat = '', title = '') => {
    const p = (plat || 'mercadolivre').toLowerCase()
    const text = `${cat} ${title}`.toLowerCase()

    if (p === 'amazon') {
      if (/kindle|echo|alexa|fire/i.test(text)) return 0.10 // 10%
      if (/livro|ebook|roupa|vestido|cal[çc]ado|t[eê]nis|sapato|camisa|bolsa|rel[oó]gio|moda/i.test(text)) return 0.09 // 9%
      if (/cozinha|panela|air fryer|cafeteira|casa|decora[çc][ãa]o|cama|banho|beleza|maquiagem|perfume|pet/i.test(text)) return 0.08 // 8%
      if (/eletr[oô]nico|inform[aá]tica|celular|smartphone|tv|gamer|notebook|computador|tech/i.test(text)) return 0.05 // 5%
      return 0.08 // 8% Amazon geral
    }

    if (p === 'shopee') {
      if (/oficial|mall|indicado/i.test(text)) return 0.10 // 10%
      return 0.09 // 9% Shopee
    }

    // Mercado Livre:
    if (/beleza|cuidado pessoal|perfume|maquiagem|skincare|cosm[eé]tico/i.test(text)) return 0.16 // 16%
    if (/moda|roupa|vestu[aá]rio|cal[çc]ado|t[eê]nis|lingerie|baby doll|shorts|pijama|vestido|bolsa/i.test(text)) return 0.14 // 14%
    if (/beb[eê]|maternidade|fralda|carrinho|chupeta|mamadeira|brinquedo/i.test(text)) return 0.14 // 14%
    if (/esporte|fitness|suplemento|whey|creatina|academia/i.test(text)) return 0.14 // 14%
    if (/supermercado|bebida|alimento|caf[eé]|vinho/i.test(text)) return 0.14 // 14%
    if (/livro|revista|hq|manga/i.test(text)) return 0.11 // 11%
    if (/eletr[oô]nico|celular|smartphone|inform[aá]tica|computador|notebook|tv|tech/i.test(text)) return 0.08 // 8%

    return 0.11 // 11% Padrão oficial ML
  }

  // Preenche dados automaticamente ao clicar em um produto disparado ou favorito
  const applySelectedProduct = (prod) => {
    const title = prod.product_title || prod.title || ''
    const plat = (prod.platform || 'mercadolivre').toLowerCase()
    const img = prod.product_image || prod.image || prod.imageUrl || ''
    const url = prod.product_url || prod.url || prod.affiliate_link || ''
    const group = prod.target_group || ''
    let cat = prod.category || prod.categoryName || ''

    let numPrice = 0
    if (typeof prod.product_price === 'number') numPrice = prod.product_price
    else if (typeof prod.price === 'number') numPrice = prod.price
    else if (typeof prod.rawPrice === 'number') numPrice = prod.rawPrice
    else if (prod.product_price || prod.price) {
      numPrice = parseBrlPrice(prod.product_price || prod.price)
    }

    // Se a categoria veio vazia ou genérica, detecta o nicho exato pelo título
    if (!cat || cat.toLowerCase() === 'geral' || cat.toLowerCase() === 'casa & cozinha') {
      const detected = detectNicheFromTitle(title)
      if (detected) cat = detected
    }

    setProductName(title)
    setPlatform(plat)
    if (cat) {
      setCategory(cat)
      if (!availableNiches.includes(cat)) {
        setAvailableNiches(prev => [cat, ...prev])
      }
    }
    if (group) setTargetGroup(group)
    if (img) setProductImage(img)
    if (url) setProductUrl(url)

    if (numPrice > 0) {
      setGrossAmount(numPrice.toFixed(2))

      // 1. Prioridade absoluta para comissão exata já armazenada no produto (ex: 26% / R$ 8,58 da barra oficial)
      let commVal = null
      if (typeof prod.commissionValue === 'number' && prod.commissionValue > 0) {
        commVal = prod.commissionValue
      } else if (typeof prod.commission_amount === 'number' && prod.commission_amount > 0) {
        commVal = prod.commission_amount
      } else if (prod.commissionPrice) {
        const parsed = parseBrlPrice(prod.commissionPrice)
        if (parsed > 0) commVal = parsed
      } else if (typeof prod.commissionRate === 'number' && prod.commissionRate > 0) {
        commVal = numPrice * (prod.commissionRate / 100)
      } else if (prod.commissionPercent) {
        const r = parseFloat(String(prod.commissionPercent).replace(/[^0-9.,]/g, '').replace(',', '.'))
        if (!isNaN(r) && r > 0) commVal = numPrice * (r / 100)
      }

      // 2. Se não houver valor salvo, calcula taxa inteligente pelo nicho e título
      if (commVal === null || commVal <= 0) {
        const rate = calculateCommissionRate(plat, cat, title)
        commVal = numPrice * rate
      }

      setCommissionAmount(commVal.toFixed(2))
    }

    setSelectedDispatchId(prod.id || title)
    setShowSuggestions(false)
  }

  // Candidatos para autocompletar: une os favoritos (com taxas reais da extensão) e os disparos
  const candidateMap = new Map()

  // 1. Favoritos têm máxima prioridade (possuem comissão real extraída da barra oficial do Mercado Livre)
  favorites.forEach((f) => {
    const key = (f.url || f.title || f.product_title || '').trim().toLowerCase()
    if (key) {
      candidateMap.set(key, {
        id: f.id,
        product_title: f.title || f.product_title || 'Favorito',
        product_price: f.price || f.rawPrice || 0,
        platform: f.platform || (f.url && f.url.includes('amazon') ? 'amazon' : (f.url && f.url.includes('shopee') ? 'shopee' : 'mercadolivre')),
        product_image: f.image || f.imageUrl || '',
        product_url: f.url || '',
        target_group: f.target_group || '',
        category: f.category || f.categoryName || '',
        commissionValue: f.commissionValue,
        commissionPrice: f.commissionPrice,
        commissionRate: f.commissionRate,
        commissionPercent: f.commissionPercent,
        candidateType: 'favorite'
      })
    }
  })

  // 2. Mescla com os disparos do histórico
  dispatches.forEach((d) => {
    const key = (d.product_url || d.product_title || '').trim().toLowerCase()
    if (key) {
      let metaRate = 0
      let metaValue = 0
      let metaCat = ''
      if (d.copy_text && d.copy_text.includes('<!--META:')) {
        try {
          const jsonStr = d.copy_text.split('<!--META:')[1].split('-->')[0]
          const parsed = JSON.parse(jsonStr)
          metaRate = parsed.rate || 0
          metaValue = parsed.value || 0
          metaCat = parsed.cat || ''
        } catch (_) {}
      }

      const existing = candidateMap.get(key)
      if (existing) {
        candidateMap.set(key, {
          ...existing,
          target_group: d.target_group || existing.target_group,
          affiliate_link: d.affiliate_link || existing.product_url,
          commissionRate: existing.commissionRate || metaRate || undefined,
          commissionValue: existing.commissionValue || metaValue || undefined,
          category: existing.category || metaCat || undefined,
          candidateType: 'dispatched'
        })
      } else {
        candidateMap.set(key, {
          ...d,
          commissionRate: metaRate || undefined,
          commissionValue: metaValue || undefined,
          category: metaCat || undefined,
          candidateType: 'dispatched'
        })
      }
    }
  })

  const uniqueCandidates = Array.from(candidateMap.values())

  // Lista de sugestões pesquisadas
  const matchingDispatches = uniqueCandidates.filter((d) => {
    if (!productName.trim()) return true
    const term = productName.toLowerCase()
    return (
      (d.product_title || '').toLowerCase().includes(term) ||
      (d.target_group || '').toLowerCase().includes(term) ||
      (d.platform || '').toLowerCase().includes(term)
    )
  })

  // Ao alterar o valor bruto manualmente, calcula o valor exato da comissão
  const handleGrossChange = (val) => {
    setGrossAmount(val)
    const num = parseBrlPrice(val)
    if (!isNaN(num) && num > 0) {
      const rate = calculateCommissionRate(platform, category, productName)
      setCommissionAmount((num * rate).toFixed(2))
    }
  }

  const handleClearSelection = () => {
    setSelectedDispatchId(null)
    setProductName('')
    setGrossAmount('')
    setCommissionAmount('')
    setProductImage('')
    setProductUrl('')
    setTargetGroup('')
  }

  const handleAddSale = async (e) => {
    e.preventDefault()
    if (!productName.trim() || !commissionAmount) {
      setStatusMessage({ type: 'error', text: 'Preencha o nome do produto e o valor da comissão.' })
      return
    }

    setSaving(true)
    setStatusMessage(null)

    const numGross = parseFloat(String(grossAmount).replace(',', '.')) || 0
    const numCommission = parseFloat(String(commissionAmount).replace(',', '.')) || 0

    try {
      const salePayload = {
        user_id: user.id,
        sale_date: saleDate,
        platform,
        product_name: productName.trim(),
        category,
        quantity: parseInt(quantity, 10) || 1,
        gross_amount: numGross,
        commission_amount: numCommission,
        target_group: targetGroup.trim(),
        notes: productImage ? JSON.stringify({ image: productImage, url: productUrl }) : ''
      }

      const { data, error } = await supabase
        .from('affiliate_sales')
        .insert(salePayload)
        .select()
        .single()

      if (error) throw error

      setStatusMessage({ type: 'success', text: 'Venda registrada com sucesso! Seus lucros foram atualizados.' })
      setProductName('')
      setGrossAmount('')
      setCommissionAmount('')
      setTargetGroup('')
      setProductImage('')
      setProductUrl('')
      setSelectedDispatchId(null)

      if (onSalesUpdate && data) {
        onSalesUpdate([data, ...sales])
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Erro ao registrar venda: ' + err.message })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSale = async (saleId) => {
    if (!confirm('Deseja realmente excluir este registro de venda?')) return
    try {
      const { error } = await supabase
        .from('affiliate_sales')
        .delete()
        .eq('id', saleId)

      if (error) throw error
      if (onSalesUpdate) {
        onSalesUpdate(sales.filter(s => s.id !== saleId))
      }
    } catch (err) {
      alert('Erro ao excluir: ' + err.message)
    }
  }

  // Métricas 100% REAIS calculadas dos dados do usuário
  const totalCommission = sales.reduce((acc, s) => acc + (parseFloat(s.commission_amount) || 0), 0)
  const totalGross = sales.reduce((acc, s) => acc + (parseFloat(s.gross_amount) || 0), 0)
  const totalItemsSold = sales.reduce((acc, s) => acc + (parseInt(s.quantity, 10) || 1), 0)
  const avgCommission = sales.length ? (totalCommission / sales.length) : 0

  const platformBadge = (plat) => {
    switch ((plat || '').toLowerCase()) {
      case 'amazon':
        return <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">Amazon</span>
      case 'shopee':
        return <span className="inline-flex items-center rounded-full bg-orange-50 dark:bg-orange-950/60 px-2.5 py-0.5 text-[10px] font-bold text-orange-700 dark:text-orange-300">Shopee</span>
      default:
        return <span className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">Mercado Livre</span>
    }
  }

  // Tenta extrair a foto salva nas notas ou encontra pelo nome nos disparos
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
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Registro de Vendas & Comissões
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cadastre suas vendas reais. Ao começar a digitar, o sistema preenche automaticamente os produtos disparados pela extensão.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className={`flex items-center gap-2.5 rounded-[20px] p-4 text-xs font-semibold ${
          statusMessage.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Grid de Métricas Financeiras Reais Bento Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-[24px] bg-white dark:bg-[#121724] border border-slate-200/70 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Comissões Reais</span>
          <div className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {totalCommission.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Lucro líquido registrado</span>
        </div>

        <div className="rounded-[24px] bg-white dark:bg-[#121724] border border-slate-200/70 dark:border-slate-800 p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Volume Bruto (GMV)</span>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
            {totalGross.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Total comercializado</span>
        </div>

        <div className="rounded-[24px] bg-white dark:bg-[#121724] border border-slate-200/70 dark:border-slate-800 p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Conversões Confirmadas</span>
          <div className="mt-2 text-2xl font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">{totalItemsSold}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Itens faturados</span>
        </div>

        <div className="rounded-[24px] bg-white dark:bg-[#121724] border border-slate-200/70 dark:border-slate-800 p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Média por Item</span>
          <div className="mt-2 text-2xl font-extrabold text-slate-800 dark:text-slate-200 tabular-nums">
            {avgCommission.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Comissão média</span>
        </div>
      </div>

      {/* Formulário de Novo Lançamento com Autocompletar Inteligente dos Disparos */}
      <div className="rounded-[28px] bg-white dark:bg-[#121724] border border-slate-200/70 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold text-xs">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Lançar Venda do Dia
              </h2>
              <span className="text-[10px] text-slate-400">
                Puxa automaticamente dados e fotos dos {dispatches.length} links já disparados
              </span>
            </div>
          </div>

          {selectedDispatchId && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-red-500 transition-colors"
            >
              <X className="h-3 w-3" />
              <span>Limpar seleção</span>
            </button>
          )}
        </div>

        {/* Card de Produto Selecionado com Foto em Destaque */}
        {productImage && (
          <div className="mb-5 flex items-center gap-3.5 p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/40">
            <img
              src={productImage}
              alt="Preview do produto"
              className="h-12 w-12 rounded-xl object-contain bg-white border border-blue-100 dark:border-blue-800 flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase">
                <Check className="h-3 w-3 stroke-[3]" />
                Produto Vinculado ao Histórico de Disparos
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {productName}
              </p>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Foto e loja sincronizadas automaticamente com a venda
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleAddSale} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Data da Venda</label>
              <input
                type="date"
                required
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Plataforma</label>
              <select
                value={platform}
                onChange={(e) => {
                  const newPlat = e.target.value
                  setPlatform(newPlat)
                  if (grossAmount) {
                    const num = parseBrlPrice(grossAmount)
                    if (!isNaN(num) && num > 0) {
                      setCommissionAmount((num * calculateCommissionRate(newPlat, category, productName)).toFixed(2))
                    }
                  }
                }}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="mercadolivre">Mercado Livre</option>
                <option value="amazon">Amazon</option>
                <option value="shopee">Shopee</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Categoria / Nicho
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setShowAddNiche(!showAddNiche); setManagingNiches(false); }}
                    className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                    title="Adicionar novo nicho personalizado"
                  >
                    <span>+ Nicho</span>
                  </button>
                  <span className="text-slate-300 dark:text-slate-600 text-[10px]">•</span>
                  <button
                    type="button"
                    onClick={() => { setManagingNiches(!managingNiches); setShowAddNiche(false); }}
                    className="text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    title="Excluir ou gerenciar nichos"
                  >
                    <span>{managingNiches ? 'Concluir' : 'Gerenciar'}</span>
                  </button>
                </div>
              </div>

              {/* Formulário inline para adicionar novo nicho */}
              {showAddNiche && (
                <div className="mb-2 p-2 rounded-xl bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newNicheInput}
                    onChange={(e) => setNewNicheInput(e.target.value)}
                    placeholder="Nome do novo nicho..."
                    className="flex-1 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddNiche(e); }}
                  />
                  <button
                    type="button"
                    onClick={handleAddNiche}
                    className="rounded-lg bg-blue-600 text-white px-2.5 py-1 text-xs font-bold hover:bg-blue-700"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddNiche(false)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Modo de exclusão/gerenciamento rápido de nichos */}
              {managingNiches && (
                <div className="mb-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 max-h-36 overflow-y-auto space-y-1">
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Clique no ✕ para remover:</div>
                  <div className="flex flex-wrap gap-1">
                    {availableNiches.map(n => (
                      <span key={n} className="inline-flex items-center gap-1 text-[11px] bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-2 py-0.5 rounded-full text-slate-700 dark:text-slate-200">
                        {n}
                        {availableNiches.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteNiche(n, e)}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <select
                value={category}
                onChange={(e) => {
                  const newCat = e.target.value
                  setCategory(newCat)
                  if (grossAmount) {
                    const num = parseBrlPrice(grossAmount)
                    if (!isNaN(num) && num > 0) {
                      setCommissionAmount((num * calculateCommissionRate(platform, newCat, productName)).toFixed(2))
                    }
                  }
                }}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {availableNiches.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Quantidade</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Campo de Produto com Autocompletar dos Disparos */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="relative" ref={dropdownRef}>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Nome do Produto Vendido
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Digite para buscar nos disparos da extensão..."
                  value={productName}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => {
                    setProductName(e.target.value)
                    setShowSuggestions(true)
                  }}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <Search className="absolute right-3.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* Dropdown de Sugestões dos Disparos */}
              {showSuggestions && matchingDispatches.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-30 max-h-60 overflow-y-auto rounded-2xl bg-white dark:bg-[#151c2c] border border-slate-200 dark:border-slate-700 shadow-2xl p-1.5 space-y-1">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Ofertas Disparadas Pela Extensão ({matchingDispatches.length})
                  </div>
                  {matchingDispatches.slice(0, 10).map((disp, idx) => (
                    <div
                      key={disp.id || idx}
                      onClick={() => applySelectedProduct(disp)}
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors"
                    >
                      {disp.product_image ? (
                        <img
                          src={disp.product_image}
                          alt=""
                          className="h-8 w-8 rounded-lg object-contain bg-white border border-slate-100 dark:border-slate-800 flex-shrink-0"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                          <ShoppingBag className="h-3.5 w-3.5 text-slate-400" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {disp.product_title}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span className="capitalize">{disp.platform}</span>
                          {disp.target_group && <span>• {disp.target_group}</span>}
                          {disp.product_price && (
                            <span className="font-bold text-emerald-600">
                              R$ {parseFloat(disp.product_price).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Valor do Produto (R$)
              </label>
              <input
                type="text"
                placeholder="Ex: 119.90"
                value={grossAmount}
                onChange={(e) => handleGrossChange(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Comissão Recebida (R$)
              </label>
              <input
                type="text"
                required
                placeholder="Ex: 15.50"
                value={commissionAmount}
                onChange={(e) => setCommissionAmount(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 px-3.5 py-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="w-full sm:w-1/2">
              <input
                type="text"
                placeholder="Canal / Grupo de Origem (Ex: Grupo VIP 01 - opcional)"
                value={targetGroup}
                onChange={(e) => setTargetGroup(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-xs disabled:opacity-50"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>{saving ? 'Gravando...' : 'Salvar Venda'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Tabela de Vendas Reais com Fotos dos Produtos */}
      <div className="rounded-[28px] bg-white dark:bg-[#121724] border border-slate-200/70 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Histórico de Vendas Registradas ({sales.length})
            </h2>
            <span className="text-[11px] text-slate-400">
              Registros reais sincronizados na nuvem
            </span>
          </div>

          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            Total Líquido: {totalCommission.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>

        {sales.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Nenhuma venda registrada ainda. Use o formulário acima para lançar suas vendas diárias!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Plataforma</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Origem</th>
                  <th className="px-4 py-3">Qtd</th>
                  <th className="px-4 py-3">Valor Bruto</th>
                  <th className="px-4 py-3">Comissão</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {sales.map((sale) => {
                  const saleImg = resolveSaleImage(sale)
                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 max-w-xs">
                        <div className="flex items-center gap-2.5">
                          {saleImg ? (
                            <img
                              src={saleImg}
                              alt=""
                              className="h-9 w-9 rounded-xl object-contain bg-white border border-slate-100 dark:border-slate-800 flex-shrink-0"
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                              <ShoppingBag className="h-4 w-4 text-slate-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate" title={sale.product_name}>
                              {sale.product_name}
                            </p>
                            <span className="text-[10px] text-slate-400">
                              {sale.category || 'Geral'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {platformBadge(sale.platform)}
                      </td>

                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap font-medium">
                        {sale.sale_date ? new Date(sale.sale_date + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                      </td>

                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {sale.target_group || 'WhatsApp'}
                      </td>

                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap">
                        {sale.quantity || 1}
                      </td>

                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap font-medium">
                        {sale.gross_amount ? parseFloat(sale.gross_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                      </td>

                      <td className="px-4 py-3 font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {parseFloat(sale.commission_amount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteSale(sale.id)}
                          title="Excluir lançamento"
                          className="rounded-full p-1.5 text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
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
