import React, { useState } from 'react'
import {
  Sparkles,
  Check,
  Copy,
  Save,
  ArrowUp,
  FileEdit,
  Library,
  Smartphone,
  AlertCircle
} from 'lucide-react'
import { supabase } from '../supabase'
import { askCopywriterAi } from '../services/aiService'

export default function CopyStudioView({ profile, onProfileUpdate }) {
  const [activeTab, setActiveTab] = useState('templates') // 'templates' | 'studio'

  // Modelos Padrão Oficiais Pré-Testados
  const defaultTemplates = [
    {
      id: 'vantagens_gatilhos',
      title: 'Vantagens & Gatilhos Mentais',
      badge: 'Mais Utilizado',
      badgeColor: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300',
      desc: 'Equilíbrio perfeito entre benefícios do produto, frete rápido e gatilho de desconto por tempo limitado.',
      copy: `🚨 *ACHADINHO IMPERDÍVEL!* 🚨\n\n📦 *{titulo}*\n\n🔥 De ~R$ {preco_antigo}~ por APENAS *R$ {preco}*!\n\n⚡ *Por que vale a pena?*\n• Melhor custo-benefício da categoria\n• Frete Rápido com compra 100% garantida\n• Estoque promocional limitado\n\n👉 *Compre com desconto aqui:* {link}\n\n⚠️ _Valores sujeitos a alteração a qualquer momento._`
    },
    {
      id: 'alerta_bug',
      title: 'Alerta de Preço Baixo / Bug',
      badge: 'Máxima Urgência',
      badgeColor: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300',
      desc: 'Foco total em correria e escassez. Gera picos imediatos de cliques em grupos ativos de promoções.',
      copy: `😱 *CORRE QUE TÁ QUASE DE GRAÇA!* 😱\n\n🚨 *{titulo}*\n\n💥 Tá saindo por APENAS *R$ {preco}*!\n\n💨 Não sei até que horas dura esse preço, aproveite antes que esgote o lote!\n\n👇 *LINK DIRETO NO SITE:* {link}`
    },
    {
      id: 'direto_ao_ponto',
      title: 'Direto ao Ponto (Minimalista)',
      badge: 'Rápido & Direto',
      badgeColor: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300',
      desc: 'Ideal para grupos que preferem objetividade. Apenas título, preço em destaque e link limpo.',
      copy: `🔥 *{titulo}*\n\n💰 *R$ {preco}*\n\n🛒 *Compre aqui:* {link}`
    },
    {
      id: 'review_especialista',
      title: 'Dica do Especialista / Autoridade',
      badge: 'Alta Autoridade',
      badgeColor: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300',
      desc: 'Excelente para eletrônicos, celulares, itens de cozinha e produtos de ticket médio-alto.',
      copy: `⭐ *DICA DE OURO DO DIA!* ⭐\n\n*{titulo}*\n\nSe você estava esperando o momento certo para comprar, esse é um dos menores preços registrados!\n\n💵 Por apenas *R$ {preco}*\n\n🔗 *Garanta o seu com desconto:* {link}`
    },
    {
      id: 'frete_gratis',
      title: 'Frete Grátis Relâmpago',
      badge: 'Frete Grátis',
      badgeColor: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
      desc: 'Destaca o frete rápido e garantia de entrega. Alta taxa de conversão na Shopee e Mercado Livre.',
      copy: `📦 *OFERTA COM FRETE GRÁTIS!* 🚚\n\n*{titulo}*\n\n🔥 Preço especial: *R$ {preco}*\n\n✅ Envio seguro e protegido com devolução grátis garantida!\n\n👉 *Pegue o seu agora:* {link}`
    },
    {
      id: 'ultimas_horas',
      title: 'Últimas Horas / Escassez Noturna',
      badge: 'Escassez',
      badgeColor: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300',
      desc: 'Perfeito para disparar à noite e acelerar membros indecisos antes da meia-noite.',
      copy: `⏰ *ÚLTIMAS HORAS DESSA OFERTA!* ⏰\n\n*{titulo}*\n\nDe ~R$ {preco_antigo}~ por *R$ {preco}*\n\n⚠️ O cupom/preço promocional pode expirar à meia-noite. Não deixe para depois!\n\n👇 *Link oficial com desconto:* {link}`
    },
    {
      id: 'aleatorio',
      title: '🎲 Modo Aleatório (Alternar Modelos)',
      badge: 'Inteligência Dinâmica',
      badgeColor: 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300',
      desc: 'O sistema sorteia e alterna automaticamente entre os melhores modelos persuasivos a cada disparo. Seus grupos nunca ficam repetitivos!',
      copy: `[A cada envio o sistema escolherá de forma inteligente um modelo diferente: Vantagens & Gatilhos, Alerta Bug, Direto ao Ponto, Dica do Especialista, Frete Grátis ou Últimas Horas]`
    }
  ]

  const activeStyleId = profile?.ml_copy_style || 'vantagens_gatilhos'

  // Estado do Editor
  const [editorText, setEditorText] = useState(() => {
    try {
      const saved = localStorage.getItem(`ml_custom_copy_${profile?.id}`)
      return profile?.ml_custom_copy || saved || defaultTemplates[0].copy
    } catch (_) {
      return defaultTemplates[0].copy
    }
  })

  // Chat com Copywriter IA
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: 'Olá! Sou o seu Copywriter IA. Me diga que tipo de copy você quer (ex: "crie uma copy curta para relógio com frete grátis", "coloque mais urgência", "crie um modelo para produtos de beleza") e eu escreverei para você.'
    }
  ])
  const [chatInput, setChatInput] = useState('')
  const [loadingAi, setLoadingAi] = useState(false)
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  // Ativar modelo padrão na extensão
  const handleSelectDefaultTemplate = async (templateId, copyText) => {
    setSaving(true)
    setStatusMessage(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Atualiza o modelo de copy ativo na tabela profiles
      const { error } = await supabase
        .from('profiles')
        .update({
          ml_copy_style: templateId
        })
        .eq('id', user.id)

      if (error) throw error

      // Salva texto também no metadata do usuário e localStorage para persistência completa
      try {
        await supabase.auth.updateUser({ data: { ml_custom_copy: copyText } })
      } catch (_) {}
      try {
        localStorage.setItem(`ml_custom_copy_${user.id}`, copyText)
      } catch (_) {}

      setStatusMessage({ type: 'success', text: 'Modelo ativado com sucesso! Sua extensão Chrome já está atualizada.' })
      setEditorText(copyText)
      if (onProfileUpdate) onProfileUpdate({ ml_copy_style: templateId, ml_custom_copy: copyText })
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Erro ao ativar modelo: ' + err.message })
    } finally {
      setSaving(false)
    }
  }

  // Pedido para o Copywriter IA
  const handleAskCopywriter = async (customPrompt = null) => {
    const promptToSend = customPrompt || chatInput
    if (!promptToSend.trim() || loadingAi) return

    setChatMessages(prev => [...prev, { role: 'user', content: promptToSend }])
    if (!customPrompt) setChatInput('')
    setLoadingAi(true)

    try {
      const generatedCopy = await askCopywriterAi({
        userPrompt: promptToSend,
        currentCopy: editorText,
        apiKey: profile?.groq_api_key
      })

      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Aqui está uma nova sugestão de copy pronta para converter:',
          copyDraft: generatedCopy
        }
      ])
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: '⚠️ Erro ao gerar copy: ' + err.message }
      ])
    } finally {
      setLoadingAi(false)
    }
  }

  const handleApplyToEditor = (copyText) => {
    setEditorText(copyText)
    setActiveTab('studio')
    setStatusMessage({ type: 'success', text: 'Copy transferida para o editor! Você pode editar e testar no simulador.' })
  }

  const handleInsertTag = (tag) => {
    setEditorText(prev => prev + ` ${tag}`)
  }

  const handleSaveCustomToExtension = async () => {
    setSaving(true)
    setStatusMessage(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Atualiza estilo para 'custom' na tabela profiles
      const { error } = await supabase
        .from('profiles')
        .update({
          ml_copy_style: 'custom'
        })
        .eq('id', user.id)

      if (error) throw error

      // Persiste o texto customizado no auth metadata e storage local
      try {
        await supabase.auth.updateUser({ data: { ml_custom_copy: editorText } })
      } catch (_) {}
      try {
        localStorage.setItem(`ml_custom_copy_${user.id}`, editorText)
      } catch (_) {}

      setStatusMessage({ type: 'success', text: 'Modelo personalizado salvo e ativado na sua extensão com sucesso!' })
      if (onProfileUpdate) onProfileUpdate({ ml_copy_style: 'custom', ml_custom_copy: editorText })
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Erro ao salvar: ' + err.message })
    } finally {
      setSaving(false)
    }
  }

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Renderizador realista do balão de WhatsApp
  const renderWhatsAppContent = (rawText) => {
    const formatted = rawText
      .replace(/{titulo}/g, 'Fone Bluetooth Sem Fio QCY T13 Cancelamento de Ruído')
      .replace(/{preco}/g, '89,90')
      .replace(/{preco_antigo}/g, '149,90')
      .replace(/{link}/g, 'https://meli.la/exemplo-afiliado')

    const lines = formatted.split('\n')
    return (
      <div className="space-y-1 text-xs leading-relaxed font-sans">
        {lines.map((line, i) => {
          if (!line.trim()) return <div key={i} className="h-2" />

          const parts = line.split(/(\*[^*]+\*|_[^_]+_|~[^~]+~)/g)
          return (
            <p key={i}>
              {parts.map((part, pIdx) => {
                if (part.startsWith('*') && part.endsWith('*')) {
                  return <strong key={pIdx} className="font-bold">{part.slice(1, -1)}</strong>
                }
                if (part.startsWith('_') && part.endsWith('_')) {
                  return <em key={pIdx} className="italic opacity-90">{part.slice(1, -1)}</em>
                }
                if (part.startsWith('~') && part.endsWith('~')) {
                  return <span key={pIdx} className="line-through opacity-70">{part.slice(1, -1)}</span>
                }
                if (part.includes('http')) {
                  return <span key={pIdx} className="text-blue-500 underline font-medium break-all">{part}</span>
                }
                return part
              })}
            </p>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header Profissional com Alternador em Pílula */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Estúdio de Copys de Alta Conversão
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gerencie os modelos de texto que a extensão e a IA utilizam ao disparar ofertas nos seus grupos de WhatsApp.
          </p>
        </div>

        {/* Seletor Segmentado em Pílula Flutuante */}
        <div className="flex items-center bg-white dark:bg-slate-800/80 p-1.5 rounded-full border border-slate-200/70 dark:border-slate-700/60 shadow-2xs">
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeTab === 'templates'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Library className="h-3.5 w-3.5" />
            <span>Copies Testadas ({defaultTemplates.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('studio')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeTab === 'studio'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Assistente IA & Simulador</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className={`flex items-center gap-2.5 rounded-[20px] p-4 text-xs font-semibold ${
          statusMessage.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* ABA 1: COPIES TESTADAS */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {defaultTemplates.map((template) => {
            const isActive = activeStyleId === template.id
            return (
              <div
                key={template.id}
                className={`rounded-[26px] p-6 flex flex-col justify-between transition-all bg-white dark:bg-[#121724] border ${
                  isActive
                    ? 'border-blue-600 dark:border-blue-500 ring-2 ring-blue-500/10 shadow-sm'
                    : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      {template.title}
                    </h2>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${template.badgeColor}`}>
                      {template.badge}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-4 line-clamp-2">
                    {template.desc}
                  </p>

                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800/80 p-3.5 max-h-48 overflow-y-auto mb-4 font-mono text-[11px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {template.copy}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleCopy(template.copy, template.id)}
                    title="Copiar texto da copy"
                    className="p-2 rounded-full border border-slate-200/80 dark:border-slate-700 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    {copiedId === template.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditorText(template.copy)
                        setActiveTab('studio')
                      }}
                      className="rounded-full border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      Personalizar
                    </button>

                    <button
                      onClick={() => handleSelectDefaultTemplate(template.id, template.copy)}
                      disabled={saving || isActive}
                      className={`rounded-full px-4 py-1.5 text-[11px] font-bold transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white cursor-default'
                          : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90'
                      }`}
                    >
                      {isActive ? '✓ Ativo na Extensão' : 'Usar Modelo'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ABA 2: ASSISTENTE IA & SIMULADOR */}
      {activeTab === 'studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Coluna Esquerda: Chat Copywriter IA */}
          <div className="lg:col-span-5 flex flex-col h-[650px] rounded-[28px] border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#121724] p-5 shadow-xs justify-between">
            <div className="flex flex-col h-[calc(100%-80px)]">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      Assistente de Copywriting
                    </h2>
                    <span className="text-[10px] text-slate-400">Gera novos modelos persuasivos com 1 clique</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-[20px] p-3.5 ${
                      msg.role === 'user'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700/60'
                    }`}>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                      {msg.copyDraft && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-700">
                          <div className="rounded-xl bg-white dark:bg-slate-900 p-2.5 text-[11px] font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap border border-slate-200 dark:border-slate-800 mb-2">
                            {msg.copyDraft}
                          </div>
                          <button
                            onClick={() => handleApplyToEditor(msg.copyDraft)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 dark:bg-white px-3.5 py-1.5 text-[11px] font-bold text-white dark:text-slate-900 hover:opacity-90 transition-all shadow-xs"
                          >
                            <span>Aplicar no Simulador</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {loadingAi && (
                  <div className="flex gap-2 text-xs text-slate-400 items-center">
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-900 dark:border-white border-t-transparent" />
                    <span>Copywriter IA criando texto...</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2">
              <div className="rounded-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-1.5 pl-4 flex items-center gap-2 focus-within:ring-2 focus-within:ring-blue-500/20">
                <input
                  type="text"
                  placeholder="Ex: crie copy curta com frete grátis..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAskCopywriter()
                    }
                  }}
                  disabled={loadingAi}
                  className="flex-1 bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAskCopywriter()}
                  disabled={loadingAi || !chatInput.trim()}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 disabled:opacity-30 transition-all flex-shrink-0"
                >
                  <ArrowUp className="h-3.5 w-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Editor + Simulador */}
          <div className="lg:col-span-7 flex flex-col h-[650px] rounded-[28px] border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#121724] p-5 shadow-xs justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <FileEdit className="h-4 w-4 text-blue-600" />
                  <h2 className="text-xs font-bold text-slate-900 dark:text-white">
                    Editor & Variáveis Dinâmicas
                  </h2>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 mr-1 hidden sm:inline">Tags:</span>
                  {['{titulo}', '{preco}', '{link}'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleInsertTag(tag)}
                      className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      +{tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <textarea
                  rows={6}
                  value={editorText}
                  onChange={(e) => setEditorText(e.target.value)}
                  placeholder="Escreva sua copy aqui..."
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/70 p-3.5 text-xs font-mono text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none leading-relaxed"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Smartphone className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Como seus membros verão no WhatsApp:</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Simulação em tempo real</span>
                </div>

                <div className="rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-xs">
                  <div className="bg-[#075E54] dark:bg-[#1F2C34] text-white px-3 py-2 flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-[10px]">
                        VIP
                      </div>
                      <div>
                        <div className="font-bold text-[11px] leading-tight">Grupo de Ofertas VIP</div>
                        <div className="text-[9px] text-emerald-200">online</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#EFEAE2] dark:bg-[#0B141A] p-3 max-h-48 overflow-y-auto">
                    <div className="rounded-2xl rounded-tr-xs bg-[#E7FFDB] dark:bg-[#005C4B] text-slate-900 dark:text-slate-100 p-3 max-w-sm ml-auto shadow-2xs border border-emerald-100/50 dark:border-emerald-700/30">
                      {renderWhatsAppContent(editorText)}
                      <div className="mt-1 flex items-center justify-end gap-1 text-[9px] text-slate-500 dark:text-slate-300">
                        <span>14:32</span>
                        <span className="text-blue-500 font-bold">✓✓</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleCopy(editorText, 'editor-copy')}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {copiedId === 'editor-copy' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedId === 'editor-copy' ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveCustomToExtension}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 text-xs font-bold hover:opacity-90 transition-all shadow-xs disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Sincronizando...' : 'Salvar e Ativar na Extensão'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
