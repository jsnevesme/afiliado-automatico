import React, { useState, useEffect } from 'react'
import {
  Send,
  Sparkles,
  DollarSign,
  Users,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Clock,
  ArrowRight,
  TrendingUp,
  Flame,
  Tag,
  ShoppingBag,
  Zap,
  Play,
  RotateCcw,
  CheckCircle2,
  Sliders,
  Smartphone,
  Search,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  Star,
  Lock
} from 'lucide-react'
import { ChromeLogo, MercadoLivreLogo, ShopeeLogo, WhatsAppLogo } from './BrandLogos'

export default function InteractiveDemo() {
  const [activeTab, setActiveTab] = useState('extension')
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCopyIndex, setCopiedCopyIndex] = useState(null)
  const [isSimulatingDispatch, setIsSimulatingDispatch] = useState(false)
  const [dispatchStep, setDispatchStep] = useState(1)
  const [selectedGroups, setSelectedGroups] = useState(['Achadinhos VIP #1', 'Ofertas Mercado Livre'])
  const [copyTone, setCopyTone] = useState('urgency') // 'urgency' | 'price' | 'coupon'
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)

  const tabs = [
    { id: 'extension', label: '1. Extensão no Chrome', icon: ChromeLogo, badge: 'Captura Instantânea' },
    { id: 'whatsapp', label: '2. Disparos WhatsApp Web', icon: Send, badge: 'Anti-Bloqueio' },
    { id: 'copystudio', label: '3. Estúdio de Copys (IA)', icon: Sparkles, badge: 'Persuasão Alta' },
    { id: 'dailysales', label: '4. Vendas & Comissões', icon: DollarSign, badge: 'Tempo Real' },
    { id: 'groups', label: '5. Gestão de Grupos', icon: Users, badge: 'Limites por Plano' }
  ]

  // Simulação de Disparo com Countdown e Feedback
  const handleStartDispatchSimulation = () => {
    setIsSimulatingDispatch(true)
    setDispatchStep(1)
    setTimeout(() => setDispatchStep(2), 1200)
    setTimeout(() => setDispatchStep(3), 2600)
    setTimeout(() => {
      setIsSimulatingDispatch(false)
      setDispatchStep(1)
    }, 4200)
  }

  const handleCopyLink = () => {
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleCopyCopy = (idx) => {
    setCopiedCopyIndex(idx)
    setTimeout(() => setCopiedCopyIndex(null), 2000)
  }

  const handleGenerateAiCopy = (tone) => {
    setCopyTone(tone)
    setIsGeneratingAi(true)
    setTimeout(() => setIsGeneratingAi(false), 600)
  }

  return (
    <div className="w-full">
      {/* 1. SELETOR DE ABAS INTERATIVAS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 p-1.5 rounded-2xl bg-stone-200/60 dark:bg-slate-900/80 border border-stone-300/80 dark:border-slate-800/90 backdrop-blur-md mb-6 max-w-5xl mx-auto shadow-inner">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer select-none ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md ring-1 ring-black/5 dark:ring-white/10'
                  : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/40'
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* 2. JANELA DE DEMONSTRAÇÃO FIDEDIGNA À FERRAMENTA */}
      <div className="relative overflow-hidden rounded-3xl border border-stone-300/90 dark:border-slate-800/90 bg-white dark:bg-[#0c111c] shadow-2xl transition-all">
        {/* Barra superior de janela estilo Google Chrome / Mac */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-200 dark:border-slate-800/80 bg-stone-100/80 dark:bg-slate-900/70">
          <div className="flex items-center gap-2.5">
            <span className="h-3 w-3 rounded-full bg-red-400/80" />
            <span className="h-3 w-3 rounded-full bg-amber-400/80" />
            <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
            <div className="ml-3 hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-white dark:bg-slate-800 border border-stone-200/60 dark:border-slate-700/60 text-[11px] font-mono text-stone-600 dark:text-slate-300 w-80 truncate shadow-2xs">
              <Lock className="h-3 w-3 text-emerald-500 flex-shrink-0" />
              <span className="truncate">
                {activeTab === 'extension' && 'https://www.mercadolivre.com.br/p/MLB23847291'}
                {activeTab === 'whatsapp' && 'https://web.whatsapp.com'}
                {activeTab === 'copystudio' && 'https://app.afiliadoautomatico.com.br/copystudio'}
                {activeTab === 'dailysales' && 'https://app.afiliadoautomatico.com.br/dailysales'}
                {activeTab === 'groups' && 'https://app.afiliadoautomatico.com.br/settings/groups'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 text-[10px] font-extrabold text-blue-700 dark:text-blue-300">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              DEMONSTRAÇÃO AO VIVO
            </span>
          </div>
        </div>

        {/* 3. CONTEÚDO DINÂMICO POR ABA */}
        <div className="p-4 sm:p-6 lg:p-8 min-h-[480px] flex flex-col justify-center">

          {/* ABA 1: EXTENSÃO NO CHROME (Simulação Fidedigna de Produto + Popup Flutuante) */}
          {activeTab === 'extension' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Lado Esquerdo: Página Realística do Mercado Livre */}
              <div className="lg:col-span-7 rounded-2xl border border-stone-200 dark:border-slate-800 bg-stone-50/70 dark:bg-slate-900/50 p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <MercadoLivreLogo className="h-6 w-auto" />
                  </div>
                  <span className="text-[10px] bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full font-bold">
                    Loja Oficial JBL
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="h-28 w-28 rounded-2xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 p-2 flex items-center justify-center flex-shrink-0 shadow-xs relative">
                    <img
                      src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&auto=format&fit=crop&q=80"
                      alt="Headphone"
                      className="h-24 w-24 object-contain rounded-xl"
                    />
                    <span className="absolute top-1 left-1 bg-amber-400 text-stone-900 text-[8px] font-black px-1.5 py-0.2 rounded">
                      FULL
                    </span>
                  </div>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <span className="text-[10px] font-extrabold uppercase text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                      MAIS VENDIDO • 1º EM FONES BLUETOOTH
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white leading-tight">
                      Fone De Ouvido Sem Fio JBL Tune 520BT Pure Bass 57h Bateria
                    </h3>

                    <div className="flex items-center gap-1 text-xs text-amber-500 pt-0.5">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-stone-800 dark:text-slate-200">4.8</span>
                      <span className="text-stone-400 text-[11px]">(1.420 avaliações)</span>
                    </div>

                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-2xl font-black text-stone-900 dark:text-white">R$ 199,00</span>
                      <span className="text-xs text-stone-400 line-through">R$ 299,00</span>
                      <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                        -33% OFF
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-stone-600 dark:text-slate-400 gap-2">
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Chegará grátis amanhã pelo Envio FULL
                  </span>
                  <span className="text-[11px] font-mono text-stone-400">ID: MLB-34901928</span>
                </div>
              </div>

              {/* Lado Direito: Popup Flutuante da Extensão (Fidedigno ao popup.html real) */}
              <div className="lg:col-span-5 rounded-2xl border-2 border-blue-500 bg-white dark:bg-slate-900 p-5 shadow-2xl space-y-3 relative">
                {/* Header do Popup */}
                <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <img src="/extension-icon.png" alt="Afiliado Automático" className="h-5 w-5 rounded-md" />
                    <span className="text-xs font-black text-stone-900 dark:text-white">Afiliado Automático</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[9px] font-black uppercase">
                      ● Ativo
                    </span>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
                      Plano Pro
                    </span>
                  </div>
                </div>

                {/* Card de Comissão Calculada Automaticamente */}
                <div className="rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/30 p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-stone-600 dark:text-slate-300">
                      Sua Comissão Estimada:
                    </span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                      R$ 25,87 (13%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-slate-400 pt-1 border-t border-emerald-500/20">
                    <span>Link Curto Oficial:</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      meli.la/3xK7a
                    </span>
                  </div>
                </div>

                {/* Seletor de Grupos Cadastrados */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-stone-500 dark:text-slate-400 block">
                    Disparar para Grupos Autorizados (Plano Pro: 2/5):
                  </label>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2 p-1.5 rounded-lg bg-stone-50 dark:bg-slate-800/80 border border-stone-200/60 dark:border-slate-700/60">
                      <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                      <span className="font-bold text-stone-800 dark:text-slate-200 truncate">🔥 Achadinhos VIP #1</span>
                    </div>
                    <div className="flex items-center gap-2 p-1.5 rounded-lg bg-stone-50 dark:bg-slate-800/80 border border-stone-200/60 dark:border-slate-700/60">
                      <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                      <span className="font-bold text-stone-800 dark:text-slate-200 truncate">⚡ Ofertas Mercado Livre</span>
                    </div>
                  </div>
                </div>

                {/* Botões de Ação do Popup */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-3 text-xs font-bold transition-all shadow-md shadow-blue-500/25 cursor-pointer"
                  >
                    {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span>{copiedLink ? 'Link meli.la Copiado!' : 'Copiar Link de Afiliado Meli'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('whatsapp')}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-emerald-500/60 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 py-2 px-3 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Disparar no WhatsApp Web →</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: DISPAROS WHATSAPP (Simulação Fidedigna do WhatsApp Web com Lista de Conversas e Balão Real) */}
          {activeTab === 'whatsapp' && (
            <div className="max-w-4xl mx-auto w-full rounded-2xl border border-stone-300 dark:border-slate-800 overflow-hidden shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-12 bg-white dark:bg-[#111b21]">
                {/* Coluna Esquerda: Lista de Conversas do WhatsApp Web */}
                <div className="hidden md:block md:col-span-4 border-r border-stone-200 dark:border-slate-800 bg-[#F0F2F5] dark:bg-[#111b21] p-3 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-stone-800 dark:text-slate-200">Conversas</span>
                    <WhatsAppLogo className="h-5 w-auto" />
                  </div>

                  <div className="space-y-1">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-[#202c33] shadow-2xs border border-blue-500/40 space-y-0.5 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-900 dark:text-white truncate">
                          🔥 Achadinhos VIP #1
                        </span>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">14:23</span>
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate">
                        Você: 🚨 JBL TUNE 520BT COM 33% DE DESCONTO...
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-[#202c33]/50 space-y-0.5 cursor-pointer opacity-80">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-800 dark:text-slate-200 truncate">
                          ⚡ Ofertas Mercado Livre
                        </span>
                        <span className="text-[10px] text-stone-400">14:20</span>
                      </div>
                      <p className="text-[11px] text-stone-400 truncate">
                        Você: Fritadeira Airfryer com cupom de R$ 50...
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-[#202c33]/50 space-y-0.5 cursor-pointer opacity-60">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-800 dark:text-slate-200 truncate">
                          📦 Shopee Achados Diários
                        </span>
                        <span className="text-[10px] text-stone-400">13:45</span>
                      </div>
                      <p className="text-[11px] text-stone-400 truncate">
                        Você: Organizador Acrílico com frete grátis...
                      </p>
                    </div>
                  </div>
                </div>

                {/* Coluna Direita: Chat Ativo com Balão Oficial de Mensagem */}
                <div className="md:col-span-8 bg-[#EFEAE2] dark:bg-[#0b141a] p-4 sm:p-5 flex flex-col justify-between min-h-[380px]">
                  {/* Topo do Chat */}
                  <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#202c33]/70 p-2.5 rounded-xl backdrop-blur-xs mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                        🔥
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-stone-900 dark:text-white">Achadinhos VIP #1</h4>
                        <span className="text-[10px] text-stone-500 dark:text-slate-400">256 membros • Mensagens apenas administradores</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-stone-500">
                      <Search className="h-4 w-4" />
                      <MoreVertical className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Balão de Oferta Enviado */}
                  <div className="max-w-md bg-white dark:bg-[#202c33] rounded-2xl rounded-tl-xs p-3.5 shadow-md space-y-2.5 border border-black/5 dark:border-white/5 my-auto">
                    <div className="rounded-xl overflow-hidden border border-stone-200/60 dark:border-slate-700/60 relative">
                      <img
                        src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=80"
                        alt="JBL Fone"
                        className="w-full h-36 object-cover"
                      />
                      <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs">
                        JBL Tune 520BT
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="font-extrabold text-blue-600 dark:text-blue-400">
                        🚨 MENOR PREÇO DO ANO NO MERCADO LIVRE!
                      </p>
                      <p className="text-stone-800 dark:text-slate-200 leading-relaxed">
                        Fone Bluetooth JBL Tune 520BT com bateria insana de 57 horas e graves Pure Bass originais!
                      </p>
                      <div className="p-2 rounded-lg bg-stone-50 dark:bg-slate-800/80 border border-stone-200/50 dark:border-slate-700/50">
                        <div>❌ De: <span className="line-through text-stone-400">R$ 299,00</span></div>
                        <div className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                          ⚡ Por apenas: R$ 199,00 à vista (33% OFF)
                        </div>
                        <div className="text-[11px] text-stone-500">📦 Frete Grátis com Envio FULL para todo Brasil</div>
                      </div>
                      <div className="pt-1">
                        <span className="text-stone-500 dark:text-slate-400">👉 Resgate a oferta oficial aqui: </span>
                        <span className="font-bold text-blue-600 dark:text-blue-400 underline">https://meli.la/3xK7a</span>
                      </div>
                    </div>

                    <div className="flex justify-end items-center gap-1 text-[9px] text-stone-400 pt-0.5">
                      <span>14:23</span>
                      <span className="text-blue-500 font-bold">✓✓</span>
                    </div>
                  </div>

                  {/* Fila Anti-Bloqueio Interativa */}
                  <div className="mt-3 p-3 rounded-xl bg-white dark:bg-[#202c33] border border-stone-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2 text-xs">
                      <ShieldCheck className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-stone-700 dark:text-slate-300">
                        {isSimulatingDispatch ? (
                          dispatchStep === 1 ? 'Simulando digitação humana...' :
                          dispatchStep === 2 ? 'Delay seguro de 15s ativado (Anti-bloqueio)...' :
                          'Disparado com sucesso para todos os grupos!'
                        ) : (
                          'Fila inteligente: delay seguro de 12s a 25s entre grupos para proteger seu chip'
                        )}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleStartDispatchSimulation}
                      disabled={isSimulatingDispatch}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-60"
                    >
                      {isSimulatingDispatch ? <RotateCcw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                      <span>{isSimulatingDispatch ? 'Simulando...' : 'Testar Simulação de Disparo'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA 3: ESTÚDIO DE COPYS (IA) - Fidedigno ao CopyStudioView */}
          {activeTab === 'copystudio' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-bold text-stone-900 dark:text-white">
                    Geração de Copys com Gatilhos Validados
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleGenerateAiCopy('urgency')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      copyTone === 'urgency'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-400'
                    }`}
                  >
                    ⚡ Urgência
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenerateAiCopy('price')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      copyTone === 'price'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-400'
                    }`}
                  >
                    🏷️ Menor Preço
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenerateAiCopy('coupon')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      copyTone === 'coupon'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-400'
                    }`}
                  >
                    🎁 Cupom Secreto
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Copy 1 */}
                <div className="rounded-2xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 flex flex-col justify-between shadow-xs">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/50">
                      GATILHO DE ESCASSEZ
                    </span>
                    <h4 className="text-xs font-bold text-stone-900 dark:text-white">Últimas 5 Unidades em Estoque</h4>
                    <p className="text-xs text-stone-600 dark:text-slate-300 font-mono bg-stone-50 dark:bg-slate-800/60 p-3 rounded-xl border border-stone-200/50 dark:border-slate-700/50 leading-relaxed">
                      "🚨 ALERTA DE PREÇO HISTÓRICO! O Fone JBL Tune 520BT acabou de entrar em liquidação relâmpago no Meli por apenas R$ 199 com estoque acabando rápido! Frete FULL grátis: https://meli.la/3xK7a"
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCopy(1)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-slate-900 py-2 text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                  >
                    {copiedCopyIndex === 1 ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedCopyIndex === 1 ? 'Copiada para WhatsApp!' : 'Copiar Esta Copy'}</span>
                  </button>
                </div>

                {/* Copy 2 */}
                <div className="rounded-2xl border-2 border-blue-500/60 bg-blue-50/20 dark:bg-blue-950/20 p-4 space-y-3 flex flex-col justify-between shadow-md">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 bg-blue-100/70 dark:bg-blue-950/80 px-2 py-0.5 rounded-full border border-blue-200/50">
                      MAIS PERSUASIVA • IA
                    </span>
                    <h4 className="text-xs font-bold text-stone-900 dark:text-white">Foco em Custo x Benefício</h4>
                    <p className="text-xs text-stone-600 dark:text-slate-300 font-mono bg-white dark:bg-slate-900 p-3 rounded-xl border border-stone-200/50 dark:border-slate-700/50 leading-relaxed">
                      "🎧 Se você queria um fone que dura a semana inteira sem recarregar, esse é o momento. A JBL liberou R$ 100 de desconto oficial + envio FULL: de R$ 299 por R$ 199. Link seguro: https://meli.la/3xK7a"
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCopy(2)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-2 text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    {copiedCopyIndex === 2 ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedCopyIndex === 2 ? 'Copiada para WhatsApp!' : 'Copiar Esta Copy'}</span>
                  </button>
                </div>

                {/* Copy 3 */}
                <div className="rounded-2xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 flex flex-col justify-between shadow-xs">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/50">
                      CUPOM & FRETE FULL
                    </span>
                    <h4 className="text-xs font-bold text-stone-900 dark:text-white">Achadinho com Cupom</h4>
                    <p className="text-xs text-stone-600 dark:text-slate-300 font-mono bg-stone-50 dark:bg-slate-800/60 p-3 rounded-xl border border-stone-200/50 dark:border-slate-700/50 leading-relaxed">
                      "🏷️ ACHADO EXCLUSIVO DO DIA! Use o cupom na finalização e leve o JBL Tune 520BT com -33% e frete grátis garantido. Só restam 12 unidades na loja oficial: https://meli.la/3xK7a"
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCopy(3)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-slate-900 py-2 text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                  >
                    {copiedCopyIndex === 3 ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedCopyIndex === 3 ? 'Copiada para WhatsApp!' : 'Copiar Esta Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ABA 4: VENDAS & COMISSÕES (Fidedigno a DailySalesView e AnalyticsView) */}
          {activeTab === 'dailysales' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
                  <span className="text-[11px] text-stone-500 dark:text-slate-400 font-medium">Vendas Geradas</span>
                  <div className="text-2xl font-black text-stone-900 dark:text-white mt-1">R$ 24.580</div>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
                    <TrendingUp className="h-3 w-3" /> +28.4% no mês
                  </span>
                </div>

                <div className="rounded-2xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
                  <span className="text-[11px] text-stone-500 dark:text-slate-400 font-medium">Comissão Total</span>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">R$ 3.195,40</div>
                  <span className="text-[10px] text-stone-400 mt-0.5 block">13.0% comissão média</span>
                </div>

                <div className="rounded-2xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
                  <span className="text-[11px] text-stone-500 dark:text-slate-400 font-medium">Cliques nos Links</span>
                  <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">1.842</div>
                  <span className="text-[10px] text-stone-400 mt-0.5 block">8.2% taxa de clique</span>
                </div>

                <div className="rounded-2xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
                  <span className="text-[11px] text-stone-500 dark:text-slate-400 font-medium">Taxa de Conversão</span>
                  <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">6.4%</div>
                  <span className="text-[10px] text-emerald-600 font-bold mt-0.5 block">100% entregas</span>
                </div>
              </div>

              {/* Tabela de Vendas Recentes por Grupo */}
              <div className="rounded-2xl border border-stone-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                <div className="px-4 py-3 bg-stone-50 dark:bg-slate-800/80 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-stone-700 dark:text-slate-300">
                  <span>Feed de Vendas Convertidas em Tempo Real</span>
                  <span className="text-[10px] text-emerald-600 font-extrabold uppercase">● Sincronizado</span>
                </div>
                <div className="divide-y divide-stone-100 dark:divide-slate-800 text-xs">
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="font-bold text-stone-900 dark:text-white block">Fone JBL Tune 520BT Bluetooth</span>
                      <span className="text-[11px] text-stone-400">Grupo: 🔥 Achadinhos VIP #1 • Via Mercado Livre</span>
                    </div>
                    <div className="text-right">
                      <strong className="text-emerald-600 dark:text-emerald-400 text-sm font-black">+ R$ 25,87</strong>
                      <span className="text-[10px] text-stone-400 block">Hoje, 14:28</span>
                    </div>
                  </div>

                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="font-bold text-stone-900 dark:text-white block">Fritadeira Elétrica Airfryer 4L</span>
                      <span className="text-[11px] text-stone-400">Grupo: ⚡ Ofertas Mercado Livre • Via Shopee</span>
                    </div>
                    <div className="text-right">
                      <strong className="text-emerald-600 dark:text-emerald-400 text-sm font-black">+ R$ 38,50</strong>
                      <span className="text-[10px] text-stone-400 block">Hoje, 13:50</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA 5: GESTÃO DE GRUPOS (Fidedigno a SettingsView com Limites por Plano) */}
          {activeTab === 'groups' && (
            <div className="max-w-2xl mx-auto w-full space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-blue-900 dark:text-blue-200">
                      Plano Pro Ativo
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-black uppercase">
                      5 Grupos
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
                    Seus disparos estão autorizados para até 5 grupos simultâneos no WhatsApp Web.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-stone-600 dark:text-slate-300">Uso: </span>
                  <strong className="text-sm font-black text-blue-600 dark:text-blue-400">2 de 5 Grupos</strong>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                      01
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 dark:text-white">🔥 Achadinhos VIP #1</h4>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">● Ativo e Sincronizado</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">256 Membros</span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                      02
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 dark:text-white">⚡ Ofertas Mercado Livre</h4>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">● Ativo e Sincronizado</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">198 Membros</span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-dashed border-stone-300 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-900/30">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-stone-200/60 dark:bg-slate-800 text-stone-500 flex items-center justify-center font-bold text-xs">
                      +
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-stone-500 dark:text-slate-400">Adicionar 3º Grupo de WhatsApp</h4>
                      <span className="text-[10px] text-stone-400">Disponível no seu plano Pro (restam 3 vagas)</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-stone-400">Vaga Livre</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-100 dark:bg-slate-800/60 text-center text-xs text-stone-500 dark:text-slate-400">
                💡 Precisa de mais de 5 grupos? Faça upgrade para o <strong>Plano Ultra</strong> e desbloqueie até 10 grupos simultâneos.
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
