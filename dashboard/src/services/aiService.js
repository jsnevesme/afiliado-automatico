const DEFAULT_GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || ''
const GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-20b'
]

async function callGroq(messages, apiKey = null, temperature = 0.7) {
  const key = (apiKey || DEFAULT_GROQ_KEY).trim()

  for (const model of GROQ_MODELS) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: 1500
        })
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        console.warn(`[Groq ${model}] falhou com status ${res.status}:`, errJson)
        continue
      }

      const data = await res.json()
      const content = data.choices?.[0]?.message?.content
      if (content && content.trim()) {
        return content.trim()
      }
    } catch (err) {
      console.warn(`[Groq ${model}] erro de rede:`, err.message)
    }
  }

  throw new Error('Não foi possível obter resposta da IA no momento. Verifique sua chave da API Groq nas configurações.')
}

/**
 * Chat com o Consultor Estrategista de Negócios de Afiliados
 */
export async function askAiConsultant({ userMessage, conversationHistory = [], businessContext = {}, apiKey = null }) {
  const salesCount = businessContext.totalSalesCount || 0
  const totalCommission = (businessContext.totalCommission || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const totalGross = (businessContext.totalGross || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const topProducts = businessContext.topProducts || 'Nenhum registrado ainda'
  const platformsSummary = businessContext.platformsSummary || 'Mercado Livre, Amazon e Shopee'
  const dispatchesCount = businessContext.dispatchesCount || 0

  const systemPrompt = `Você é o Estrategista Chefe do "Afiliado Automático", um consultor sênior de growth e marketing de afiliados especialista no mercado brasileiro (Mercado Livre, Shopee e Amazon) e em vendas através de grupos de WhatsApp e canais de ofertas.

DADOS REAIS DO NEGÓCIO DESTE AFILIADO ATÉ O MOMENTO:
- Total de Vendas Registradas: ${salesCount} vendas
- Faturamento Total Gerado: ${totalGross}
- Comissões Líquidas Acumuladas: ${totalCommission}
- Produtos/Nichos que mais venderam: ${topProducts}
- Distribuição por Plataforma: ${platformsSummary}
- Total de Ofertas Disparadas pela Extensão: ${dispatchesCount}

SUAS DIRETRIZES DE RESPOSTA:
1. Seja prático, direto, estratégico e encorajador. Evite respostas genéricas ou teóricas demais.
2. Dê conselhos acionáveis focados em: aumento de cliques nos links, gatilhos de compra no WhatsApp, retenção de membros nos grupos, melhores nichos e produtos em alta.
3. Use os números reais do usuário para personalizar a resposta.
4. Formate a resposta de forma limpa com tópicos claros, negritos e emojis estratégicos.
5. Fale sempre em português do Brasil.`

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-6),
    { role: 'user', content: userMessage }
  ]

  return await callGroq(messages, apiKey, 0.7)
}

/**
 * Chat / Gerador do Copywriter IA
 */
export async function askCopywriterAi({ userPrompt, currentCopy = '', apiKey = null }) {
  const systemPrompt = `Você é um Copywriter Especialista em Ofertas e Vendas para WhatsApp e Grupos de Achadinhos (Mercado Livre, Shopee e Amazon).

SUA MISSÃO:
Criar ou refinar copys altamente persuasivas formatadas para o WhatsApp.

REGRAS OBRIGATÓRIAS DE FORMATAÇÃO:
1. Use a sintaxe nativa do WhatsApp: *negrito*, _itálico_, ~tachado~.
2. Deixe os placeholders padronizados para substituição dinâmica:
   - {titulo} = Nome do produto
   - {preco} = Preço com desconto
   - {link} = Link de afiliado
3. Use emojis chamativos mas organizados (🚨, 🔥, ⚡, 📦, 👉, 👇, 💥).
4. Aplique gatilhos mentais fortes: urgência, escassez, prova social ou quebra de objeção de frete.
5. Retorne APENAS o texto da copy pronta para ser copiada e disparada, sem comentários adicionais fora da copy.`

  const userContent = currentCopy
    ? `Instrução do usuário: "${userPrompt}"\n\nCopy atual para editar/melhorar:\n${currentCopy}`
    : `Instrução do usuário: "${userPrompt}"\n\nCrie um modelo completo de copy para WhatsApp seguindo as regras.`

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent }
  ]

  return await callGroq(messages, apiKey, 0.6)
}
