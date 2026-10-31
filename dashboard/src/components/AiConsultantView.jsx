import React, { useState, useRef, useEffect } from 'react'
import {
  Sparkles,
  ArrowUp,
  Plus,
  Copy,
  Check,
  TrendingUp,
  Target,
  Zap,
  Users2,
  Trash2,
  Search,
  Paperclip,
  Cpu,
  Layers,
  Flame,
  MessageSquare,
  Compass
} from 'lucide-react'
import { askAiConsultant } from '../services/aiService'
import MarkdownRenderer from './MarkdownRenderer'

export default function AiConsultantView({ profile, sales, dispatches, user }) {
  const storageKey = `gemini_chat_sessions_${user?.id || 'guest'}`

  // Sessões salvas no histórico
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (e) {}
    return []
  })

  // Sessão ativa atual
  const [currentSessionId, setCurrentSessionId] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0].id
      }
    } catch (e) {}
    return null
  })

  const [historySearch, setHistorySearch] = useState('')
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [attachSalesData, setAttachSalesData] = useState(true)

  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  const activeSession = sessions.find((s) => s.id === currentSessionId)
  const messages = activeSession ? activeSession.messages : []

  // Persistência automática no localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(sessions))
    } catch (e) {}
  }, [sessions, storageKey])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const firstName = (profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Afiliado').split(' ')[0]
  const totalCommission = sales.reduce((acc, s) => acc + (parseFloat(s.commission_amount) || 0), 0)
  const totalGross = sales.reduce((acc, s) => acc + (parseFloat(s.gross_amount) || 0), 0)
  const topProductsList = sales.slice(0, 5).map(s => `${s.product_name} (${s.platform})`).join(', ')

  // 3 Bento Suggestion Cards (Idênticos ao layout da imagem SETO)
  const bentoPromptCards = [
    {
      title: 'Melhores Nichos',
      subtitle: 'Descobrir produtos com selo Full e maior margem',
      prompt: 'Com base no meu histórico de vendas e no mercado brasileiro atual, quais são os 3 nichos mais lucrativos para eu focar esta semana?',
      gradient: 'from-blue-500 to-indigo-600',
      icon: Compass
    },
    {
      title: 'Multiplicar Cliques',
      subtitle: 'Gatilhos mentais e escassez para grupos VIP',
      prompt: 'Quais técnicas e gatilhos mentais imediatos eu posso aplicar nas minhas mensagens de WhatsApp para dobrar a taxa de cliques dos membros?',
      gradient: 'from-purple-500 to-pink-500',
      icon: Zap
    },
    {
      title: 'Estratégia Ticket Alto',
      subtitle: 'Como vender itens de R$ 300+ sem objeção',
      prompt: 'Como vender produtos com comissão maior (R$ 300 a R$ 1.000) no WhatsApp sem espantar os membros do grupo?',
      gradient: 'from-amber-500 to-rose-500',
      icon: Target
    }
  ]

  const handleStartNewChat = () => {
    setCurrentSessionId(null)
    setInputText('')
  }

  const handleDeleteSession = (sessionId, e) => {
    e.stopPropagation()
    const updated = sessions.filter((s) => s.id !== sessionId)
    setSessions(updated)
    if (currentSessionId === sessionId) {
      setCurrentSessionId(updated.length > 0 ? updated[0].id : null)
    }
  }

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputText
    if (!textToSend.trim() || loading) return

    let targetSessionId = currentSessionId
    let currentMsgs = messages

    if (!targetSessionId) {
      targetSessionId = 'chat_' + Date.now()
      const title = textToSend.slice(0, 36) + (textToSend.length > 36 ? '...' : '')
      const newSession = {
        id: targetSessionId,
        title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [{ role: 'user', content: textToSend }]
      }
      setSessions((prev) => [newSession, ...prev])
      setCurrentSessionId(targetSessionId)
      currentMsgs = [{ role: 'user', content: textToSend }]
    } else {
      const updatedMessages = [...currentMsgs, { role: 'user', content: textToSend }]
      setSessions((prev) =>
        prev.map((s) =>
          s.id === targetSessionId
            ? { ...s, messages: updatedMessages, updatedAt: new Date().toISOString() }
            : s
        )
      )
      currentMsgs = updatedMessages
    }

    if (!customText) setInputText('')
    setLoading(true)

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      const businessContext = attachSalesData
        ? {
            totalSalesCount: sales.length,
            totalCommission,
            totalGross,
            topProducts: topProductsList || 'Nenhuma venda registrada ainda',
            dispatchesCount: dispatches.length,
            platformsSummary: 'Mercado Livre, Shopee e Amazon'
          }
        : null

      const response = await askAiConsultant({
        userMessage: textToSend,
        conversationHistory: currentMsgs,
        businessContext,
        apiKey: profile?.groq_api_key
      })

      setSessions((prev) =>
        prev.map((s) =>
          s.id === targetSessionId
            ? {
                ...s,
                messages: [...s.messages, { role: 'assistant', content: response }],
                updatedAt: new Date().toISOString()
              }
            : s
        )
      )
    } catch (err) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === targetSessionId
            ? {
                ...s,
                messages: [
                  ...s.messages,
                  { role: 'assistant', content: 'Falha temporária de comunicação: ' + err.message }
                ]
              }
            : s
        )
      )
    } finally {
      setLoading(false)
    }
  }

  const handleCopyMessage = (text, idx) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(idx)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  // Filtragem de histórico de conversas
  const filteredSessions = sessions.filter((s) =>
    (s.title || '').toLowerCase().includes(historySearch.toLowerCase())
  )

  return (
    <div className="flex h-[calc(100vh-5.5rem)] w-full overflow-hidden rounded-[28px] bg-white dark:bg-[#101522] border border-slate-200/70 dark:border-slate-800 shadow-xs">
      {/* =========================================================================
          COLUNA CENTRAL: WORKSPACE DE IA (ESTILO SETO)
          ========================================================================= */}
      <main className="flex-1 flex flex-col justify-between min-w-0 p-4 sm:p-6 lg:p-8 relative">
        {/* Stream de Mensagens / Tela Inicial SETO */}
        <div className="flex-1 overflow-y-auto pr-1">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[460px] text-center max-w-2xl mx-auto py-8">
              {/* Emblema 3D Iridescente (Idêntico ao SETO) */}
              <div className="relative mb-5 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-pink-500 blur-xl opacity-40 animate-pulse" />
                <svg
                  className="relative h-20 w-20 drop-shadow-lg"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="setoGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="50%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                    <linearGradient id="setoGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="50%" stopColor="#ec4899" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                  {/* Pétalas 3D entrelaçadas estilo SETO */}
                  <path
                    d="M50 10 C60 30, 70 40, 90 50 C70 60, 60 70, 50 90 C40 70, 30 60, 10 50 C30 40, 40 30, 50 10 Z"
                    fill="url(#setoGradient1)"
                    opacity="0.9"
                  />
                  <circle cx="50" cy="50" r="16" fill="url(#setoGradient2)" />
                  <circle cx="50" cy="50" r="7" fill="#ffffff" />
                </svg>
              </div>

              {/* Saudação Elegante (Idêntico à Imagem 2 SETO) */}
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Olá, {firstName}!
              </h1>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-normal mt-1.5 mb-8">
                Como posso ajudar a impulsionar suas comissões hoje?
              </p>

              {/* 3 Bento Cards Horizontais com Ícones 3D (Idêntico à Imagem 2 SETO) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full text-left">
                {bentoPromptCards.map((card, idx) => {
                  const Icon = card.icon
                  return (
                    <button
                      key={idx}
                      disabled={loading}
                      onClick={() => handleSendMessage(card.prompt)}
                      className="group flex flex-col justify-between p-4 rounded-[22px] bg-slate-50/80 dark:bg-[#151c2c] border border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-[#182033] transition-all shadow-2xs hover:shadow-xs hover:-translate-y-0.5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className={`h-8 w-8 rounded-xl bg-gradient-to-tr ${card.gradient} text-white flex items-center justify-center shadow-xs`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          Explorar →
                        </span>
                      </div>

                      <div>
                        <h2 className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">
                          {card.title}
                        </h2>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {card.subtitle}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            /* Stream de Mensagens Realistas */
            <div className="space-y-6 max-w-3xl mx-auto py-4">
              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user'

                if (isUser) {
                  return (
                    <div key={idx} className="flex justify-end">
                      <div className="max-w-xl rounded-[22px] bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 text-xs font-medium leading-relaxed shadow-xs">
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={idx} className="flex gap-3.5 items-start text-left">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-pink-500 text-white shadow-2xs mt-0.5">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <MarkdownRenderer content={msg.content} />

                      <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500">
                        <button
                          onClick={() => handleCopyMessage(msg.content, idx)}
                          className="inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                        >
                          {copiedIndex === idx ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-500" />
                              <span className="text-emerald-500 font-bold">Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copiar resposta</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}

              {loading && (
                <div className="flex gap-3.5 items-start text-left animate-pulse">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-pink-500 text-white mt-0.5">
                    <Sparkles className="h-3.5 w-3.5 animate-spin" />
                  </div>
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3.5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-full" />
                    <div className="h-3.5 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-full" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* =====================================================================
            PROMPT BAR FLUTUANTE EM CÁPSULA (ESTILO EXATO SETO)
            ===================================================================== */}
        <div className="pt-3 max-w-3xl w-full mx-auto">
          <div className="rounded-[26px] bg-white dark:bg-[#151c2c] border border-slate-200/90 dark:border-slate-700/60 shadow-xl p-3 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            {/* Input de Texto */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              placeholder="Pergunte sobre estratégia, nichos, copy ou análise dos seus dados..."
              disabled={loading}
              className="w-full resize-none bg-transparent px-2 pt-1 pb-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none leading-relaxed"
            />

            {/* Linha Inferior da Cápsula: Chips à esquerda + Botão Círculo Preto com Seta à direita */}
            <div className="flex items-center justify-between pt-1">
              {/* Chips de Ação (Estilo SETO) */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setAttachSalesData(!attachSalesData)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${
                    attachSalesData
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  <Paperclip className="h-3 w-3" />
                  <span>Dados de Vendas</span>
                </button>

                <div className="hidden sm:flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  <Cpu className="h-3 w-3 text-slate-400" />
                  <span>Groq GPT-120B</span>
                </div>
              </div>

              {/* Botão de Envio: Círculo Preto com Seta para Cima (Idêntico ao SETO) */}
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={loading || !inputText.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 disabled:opacity-30 transition-all shadow-md flex-shrink-0"
              >
                <ArrowUp className="h-4 w-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* =========================================================================
          COLUNA DA DIREITA: CHAT HISTORY (ESTILO IDÊNTICO À IMAGEM 2 SETO)
          ========================================================================= */}
      <aside className="w-64 sm:w-72 lg:w-80 flex-shrink-0 border-l border-slate-200/70 dark:border-slate-800 bg-[#F7F8FA] dark:bg-[#0E131F] flex flex-col justify-between p-4 transition-colors">
        <div className="space-y-3">
          {/* Topo: Chat History + Botão Pílula Preto 'Create new chat' */}
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Chat history
            </h2>
            <span className="text-[10px] text-slate-400 font-semibold">
              {sessions.length} chats
            </span>
          </div>

          {/* Botão Pílula Preto "Create new chat" (Idêntico à Imagem 2 SETO) */}
          <button
            onClick={handleStartNewChat}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2.5 px-4 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-xs"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Create new chat</span>
          </button>

          {/* Campo de Busca em Pílula */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Search history..."
              className="w-full rounded-full bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Lista de Sessões Anteriores */}
          <div className="space-y-1 max-h-[calc(100vh-320px)] overflow-y-auto pr-1 pt-1">
            {filteredSessions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Nenhuma conversa encontrada.
              </div>
            ) : (
              filteredSessions.map((sess) => {
                const isActive = currentSessionId === sess.id
                return (
                  <div
                    key={sess.id}
                    onClick={() => setCurrentSessionId(sess.id)}
                    className={`group flex items-center justify-between rounded-2xl p-2.5 text-xs cursor-pointer transition-all ${
                      isActive
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-white/70 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-1">
                      <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="h-3.5 w-3.5 text-slate-500 dark:text-slate-300" />
                      </div>
                      <span className="truncate text-xs font-semibold">
                        {sess.title}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteSession(sess.id, e)}
                      title="Excluir"
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Rodapé do Histórico */}
        <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 text-center">
          <p className="text-[10px] text-slate-400">
            Armazenamento seguro sincronizado
          </p>
        </div>
      </aside>
    </div>
  )
}
