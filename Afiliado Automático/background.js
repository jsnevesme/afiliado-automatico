/**
 * Afiliado Mercado Livre - Background Service Worker (Manifest V3)
 * Motor de Busca Inteligente, Integração Groq/Llama AI, Sincronização WhatsApp Web,
 * Geração Oficial meli.la e Disparo Automatizado.
 */

try {
  importScripts('commission.js', 'supabase_client.js');
} catch (e) {
  console.warn('[Afiliado ML] Erro ao carregar scripts em background:', e);
}

// Chave padrão do Groq configurada pelo usuário ou via storage
const DEFAULT_GROQ_API_KEY = '';
const GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-20b'
];

chrome.runtime.onInstalled.addListener(async () => {
  console.log('[Afiliado ML] Extensão instalada com sucesso.');
  // Inicializa a chave padrão se ainda não estiver salva
  const data = await chrome.storage.local.get(['groq_api_key', 'ml_affiliate_tag']);
  if (!data.groq_api_key) {
    await chrome.storage.local.set({ groq_api_key: DEFAULT_GROQ_API_KEY });
  }
  if (data.ml_affiliate_tag === 'jonathansneves') {
    await chrome.storage.local.set({ ml_affiliate_tag: '' });
  }
  // Limpa qualquer dado residual de cupons legados
  await chrome.storage.local.remove(['ml_active_coupons', 'ml_coupons', 'active_coupons', 'activeCouponsList']);
});

/**
 * Ouvinte Global de Mensagens
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 1. ORDEM DE BUSCA VINDA DO POPUP
  if (message.action === 'search_offers') {
    handleSearchOffers(message.query)
      .then(products => sendResponse({ success: true, products }))
      .catch(err => {
        console.warn('[Afiliado ML] Aviso na busca:', err.message);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }

  // 2. SINCRONIZAR GRUPOS AUTOMATICAMENTE DO WHATSAPP WEB
  if (message.action === 'sync_whatsapp_groups') {
    handleSyncWhatsAppGroups()
      .then(res => sendResponse({ success: true, groups: res.groups }))
      .catch(err => {
        console.warn('[Afiliado ML] Erro ao sincronizar grupos:', err.message);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }

  // 3. GERAR COPY PERSUASIVA COM IA GROQ
  if (message.action === 'generate_ai_copy') {
    handleGenerateAiCopy(message.productData, message.affiliateLink, message.copyStyle)
      .then(res => sendResponse({ success: true, copy: res.copy, model: res.model, style: res.style }))
      .catch(err => {
        console.warn('[Afiliado ML] Erro ao gerar copy com Groq:', err.message);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }

  // 4. ORDEM DE DISPARO INDIVIDUAL PARA O WHATSAPP WEB
  if (message.action === 'send_offer') {
    handleSendOffer(message)
      .then(result => sendResponse({ success: true, result }))
      .catch(err => {
        console.warn('[Afiliado ML] Aviso no disparo:', err.message);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }

  // 5. DISPARO EM MASSA EM SEGUNDO PLANO
  if (message.action === 'start_mass_dispatch') {
    handleStartMassDispatch(message)
      .then(res => sendResponse({ success: true, ...res }))
      .catch(err => {
        console.warn('[Afiliado ML] Erro ao iniciar disparo em massa:', err.message);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }

  if (message.action === 'pause_mass_dispatch') {
    handlePauseMassDispatch()
      .then(res => sendResponse({ success: true, ...res }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.action === 'resume_mass_dispatch') {
    handleResumeMassDispatch()
      .then(res => sendResponse({ success: true, ...res }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.action === 'cancel_mass_dispatch') {
    handleCancelMassDispatch()
      .then(res => sendResponse({ success: true, ...res }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.action === 'get_mass_queue_status') {
    handleGetMassQueueStatus()
      .then(res => sendResponse({ success: true, queue: res }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  // 6. GERENCIAMENTO DE CUPONS (Desativado)
  if (['get_coupons', 'save_coupon', 'delete_coupon', 'toggle_coupon', 'sync_ml_coupons', 'register_detected_coupon'].includes(message.action)) {
    sendResponse({ success: true, coupons: [], count: 0 });
    return true;
  }

  // 7. GERENCIAMENTO DE FAVORITOS (TIMELINE POR DIA)
  if (message.action === 'get_favorites') {
    handleGetFavorites()
      .then(favorites => sendResponse({ success: true, favorites }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.action === 'toggle_favorite') {
    handleToggleFavorite(message.product)
      .then(res => sendResponse({ success: true, ...res }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.action === 'delete_favorite') {
    handleDeleteFavorite(message.id || message.url)
      .then(res => sendResponse({ success: true, ...res }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.action === 'clear_favorites') {
    handleClearFavorites()
      .then(res => sendResponse({ success: true, ...res }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  // 8. DOWNLOAD DE IMAGEM PARA BASE64 (BYPASS CORS PARA DISPARO WHATSAPP)
  if (message.action === 'fetch_image_as_base64') {
    handleFetchImageAsBase64(message.url)
      .then(res => sendResponse({ success: true, ...res }))
      .catch(err => {
        console.warn('[Afiliado ML] Erro ao converter imagem para base64:', err.message);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }
});

/**
 * Baixa qualquer imagem dos marketplaces (Mercado Livre, Amazon, Shopee) e converte em base64 DataURL
 * permitindo injeção direta de mídia sem restrições de CORS
 */
async function handleFetchImageAsBase64(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
    throw new Error('URL de imagem inválida.');
  }
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Falha ao baixar imagem: HTTP ${response.status}`);
  }
  const blob = await response.blob();
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  const mimeType = blob.type || 'image/jpeg';
  return {
    dataUrl: `data:${mimeType};base64,${base64}`,
    mimeType
  };
}


// =============================================================================
// INTEGRAÇÃO COM IA GROQ (LLAMA / GPT-OSS / QWEN)
// =============================================================================

// =============================================================================
// CONFIGURAÇÃO DOS MODELOS DE COPYWRITING
// =============================================================================

// =============================================================================
// HELPER MULTIPLATAFORMA (Mercado Livre, Amazon, Shopee)
// =============================================================================

function getPlatformDetails(productData) {
  const u = (productData?.url || '').toLowerCase();
  const p = (productData?.platform || '').toLowerCase();
  if (p === 'amazon' || u.includes('amazon.com.br') || u.includes('amzn.to')) {
    return {
      platform: 'amazon',
      storeName: 'Amazon',
      headline: 'AMAZON',
      shippingGuarantee: '⚡ *Frete Prime Rápido & Compra Protegida Amazon*',
      whyBuy: '• Compra 100% segura com garantia e suporte oficial Amazon\n• Envio ágil e seguro para todo o Brasil'
    };
  }
  if (p === 'shopee' || u.includes('shopee.com.br') || u.includes('s.shopee.com.br')) {
    return {
      platform: 'shopee',
      storeName: 'Shopee',
      headline: 'SHOPEE',
      shippingGuarantee: '⚡ *Envio Rápido & Garantia Shopee Oficial*',
      whyBuy: '• Compra garantida com devolução grátis Shopee\n• Vendedor verificado com excelente reputação'
    };
  }
  return {
    platform: 'mercadolivre',
    storeName: 'Mercado Livre',
    headline: 'MERCADO LIVRE',
    shippingGuarantee: '⚡ *Frete Rápido Full & Garantia Mercado Pago*',
    whyBuy: '• Produto original com excelente avaliação e envio rápido\n• Máxima segurança e compra garantida Mercado Pago'
  };
}

const COPY_STYLE_CONFIGS = {
  // 1. Vantagens & Gatilhos Mentais (Mais Utilizado / Recomendado)
  vantagens_gatilhos: {
    id: 'vantagens_gatilhos',
    name: 'Vantagens & Gatilhos Mentais',
    badge: '⭐ Vantagens & Gatilhos',
    cta: '👉 *Compre com desconto aqui:*',
    footer: '⚠️ _Valores sujeitos a alteração a qualquer momento._',
    getPrompt: ({ title, price, originalPrice, platformDetails }) => {
      const plat = platformDetails || getPlatformDetails(null);
      return `Você é um copywriter especialista em WhatsApp.
Crie uma copy no modelo "Vantagens & Gatilhos Mentais" para esta oferta da ${plat.storeName}:
Produto: ${title}
Preço: ${price} ${originalPrice ? `(De: ${originalPrice})` : ''}

Estrutura EXATA obrigatória (com linhas vazias entre os blocos):
🚨 *ACHADINHO IMPERDÍVEL!* 🚨

📦 *${title}*

${originalPrice ? `🔥 De ~${originalPrice}~ por APENAS *${price}*!` : `🔥 Por APENAS *${price}*!`}

⚡ *Por que vale a pena?*
• [1º benefício forte do produto]
• [2º benefício prático]
• Frete Rápido com compra 100% garantida

Regras: NÃO inclua link (ele será anexado automaticamente no final), NÃO invente cupons, responda APENAS com a mensagem pronta sem introdução.`;
    },
    getFallbackBody: ({ title, price, originalPrice }) => {
      return `🚨 *ACHADINHO IMPERDÍVEL!* 🚨\n\n` +
      `📦 *${title}*\n\n` +
      `${originalPrice ? `🔥 De ~${originalPrice}~ por APENAS *${price}*!` : `🔥 Por APENAS *${price}*!`}\n\n` +
      `⚡ *Por que vale a pena?*\n` +
      `• Melhor custo-benefício da categoria\n` +
      `• Frete Rápido com compra 100% garantida\n` +
      `• Estoque promocional limitado`;
    }
  },

  // 2. Alerta de Preço Baixo / Bug (Máxima Urgência)
  alerta_bug: {
    id: 'alerta_bug',
    name: 'Alerta de Preço Baixo / Bug',
    badge: '🚨 Alerta de Preço Baixo / Bug',
    cta: '👇 *LINK DIRETO NO SITE:*',
    footer: '',
    getPrompt: ({ title, price, platformDetails }) => {
      const plat = platformDetails || getPlatformDetails(null);
      return `Você é um copywriter especialista em WhatsApp.
Crie uma copy de MÁXIMA URGÊNCIA no modelo "Alerta de Preço Baixo / Bug" para ${plat.storeName}:
Produto: ${title}
Preço: ${price}

Estrutura EXATA:
😱 *CORRE QUE TÁ QUASE DE GRAÇA!* 😱

🚨 *${title}*

💥 Tá saindo por APENAS *${price}*!

💨 Não sei até que horas dura esse preço, aproveite antes que esgote o lote!

Regras: NÃO inclua link, responda APENAS com a mensagem pronta.`;
    },
    getFallbackBody: ({ title, price }) => {
      return `😱 *CORRE QUE TÁ QUASE DE GRAÇA!* 😱\n\n` +
      `🚨 *${title}*\n\n` +
      `💥 Tá saindo por APENAS *${price}*!\n\n` +
      `💨 Não sei até que horas dura esse preço, aproveite antes que esgote o lote!`;
    }
  },

  // 3. Direto ao Ponto (Minimalista)
  direto_ao_ponto: {
    id: 'direto_ao_ponto',
    name: 'Direto ao Ponto (Minimalista)',
    badge: '⚡ Direto ao Ponto',
    cta: '🛒 *Compre aqui:*',
    footer: '',
    getPrompt: ({ title, price }) => {
      return `Copywriter WhatsApp: Crie mensagem ultra minimalista de 2 linhas:\n🔥 *${title}*\n\n💰 *${price}*\nRegras: NÃO inclua links nem texto adicional.`;
    },
    getFallbackBody: ({ title, price }) => {
      return `🔥 *${title}*\n\n💰 *${price}*`;
    }
  },

  // 4. Dica do Especialista / Autoridade
  review_especialista: {
    id: 'review_especialista',
    name: 'Dica do Especialista / Autoridade',
    badge: '💡 Dica do Especialista',
    cta: '🔗 *Garanta o seu com desconto:*',
    footer: '',
    getPrompt: ({ title, price, platformDetails }) => {
      const plat = platformDetails || getPlatformDetails(null);
      return `Crie copy de autoridade e recomendação de especialista para ${plat.storeName}:
Produto: ${title}
Preço: ${price}

Estrutura EXATA:
⭐ *DICA DE OURO DO DIA!* ⭐

*${title}*

Se você estava esperando o momento certo para comprar, esse é um dos menores preços registrados!

💵 Por apenas *${price}*

Regras: NÃO inclua link, responda APENAS com a mensagem pronta.`;
    },
    getFallbackBody: ({ title, price }) => {
      return `⭐ *DICA DE OURO DO DIA!* ⭐\n\n` +
      `*${title}*\n\n` +
      `Se você estava esperando o momento certo para comprar, esse é um dos menores preços registrados!\n\n` +
      `💵 Por apenas *${price}*`;
    }
  },

  // 5. Frete Grátis Relâmpago
  frete_gratis: {
    id: 'frete_gratis',
    name: 'Frete Grátis Relâmpago',
    badge: '📦 Frete Grátis',
    cta: '👉 *Pegue o seu agora:*',
    footer: '',
    getPrompt: ({ title, price, platformDetails }) => {
      const plat = platformDetails || getPlatformDetails(null);
      return `Crie copy destacando frete grátis e entrega rápida para ${plat.storeName}:
Produto: ${title}
Preço: ${price}

Estrutura EXATA:
📦 *OFERTA COM FRETE GRÁTIS!* 🚚

*${title}*

🔥 Preço especial: *${price}*

✅ Envio seguro e protegido com devolução grátis garantida!

Regras: NÃO inclua link, responda APENAS com a mensagem pronta.`;
    },
    getFallbackBody: ({ title, price }) => {
      return `📦 *OFERTA COM FRETE GRÁTIS!* 🚚\n\n` +
      `*${title}*\n\n` +
      `🔥 Preço especial: *${price}*\n\n` +
      `✅ Envio seguro e protegido com devolução grátis garantida!`;
    }
  },

  // 6. Últimas Horas / Escassez Noturna
  ultimas_horas: {
    id: 'ultimas_horas',
    name: 'Últimas Horas / Escassez Noturna',
    badge: '⏰ Últimas Horas',
    cta: '👇 *Link oficial com desconto:*',
    footer: '',
    getPrompt: ({ title, price, originalPrice }) => {
      return `Crie copy de escassez noturna e encerramento:
Produto: ${title}
Preço: ${price} ${originalPrice ? `(De: ${originalPrice})` : ''}

Estrutura EXATA:
⏰ *ÚLTIMAS HORAS DESSA OFERTA!* ⏰

*${title}*

${originalPrice ? `De ~${originalPrice}~ por *${price}*` : `Por apenas *${price}*`}

⚠️ O cupom/preço promocional pode expirar à meia-noite. Não deixe para depois!

Regras: NÃO inclua link, responda APENAS com a mensagem pronta.`;
    },
    getFallbackBody: ({ title, price, originalPrice }) => {
      return `⏰ *ÚLTIMAS HORAS DESSA OFERTA!* ⏰\n\n` +
      `*${title}*\n\n` +
      `${originalPrice ? `De ~${originalPrice}~ por *${price}*` : `Por apenas *${price}*`}\n\n` +
      `⚠️ O cupom/preço promocional pode expirar à meia-noite. Não deixe para depois!`;
    }
  },

  // 7. Custom / Modelo Personalizado do Estúdio
  custom: {
    id: 'custom',
    name: 'Modelo Personalizado (Estúdio de Copys)',
    badge: '✍️ Personalizado',
    cta: '',
    footer: '',
    getPrompt: ({ title, price, originalPrice, customTemplate }) => {
      return `Substitua os dados do produto no template abaixo:\nTemplate: ${customTemplate}\nProduto: ${title}\nPreço: ${price}\nPreço Antigo: ${originalPrice || price}`;
    },
    getFallbackBody: ({ title, price, originalPrice, link, customTemplate }) => {
      if (customTemplate) {
        return customTemplate
          .replace(/{titulo}/gi, title)
          .replace(/{preco}/gi, price)
          .replace(/{preco_antigo}/gi, originalPrice || price)
          .replace(/{link}/gi, link || '');
      }
      return `🔥 *${title}*\n\n💰 *${price}*`;
    }
  }
};

// Aliases para retrocompatibilidade
COPY_STYLE_CONFIGS.curta_direta = COPY_STYLE_CONFIGS.direto_ao_ponto;
COPY_STYLE_CONFIGS.detalhada_persuasiva = COPY_STYLE_CONFIGS.review_especialista;
COPY_STYLE_CONFIGS.urgencia_escassez = COPY_STYLE_CONFIGS.alerta_bug;

/**
 * Gera Copy Persuasiva usando a API do Groq conforme o modelo selecionado
 */
async function handleGenerateAiCopy(productData, affiliateLink, requestedStyle = null) {
  const store = await chrome.storage.local.get(['groq_api_key', 'ml_copy_style', 'ml_custom_copy']);
  const apiKey = (store.groq_api_key || DEFAULT_GROQ_API_KEY).trim();
  const styleKey = requestedStyle || store.ml_copy_style || 'vantagens_gatilhos';
  const styleConfig = COPY_STYLE_CONFIGS[styleKey] || COPY_STYLE_CONFIGS.vantagens_gatilhos;

  const title = (productData?.title || 'Oferta Especial').trim();
  const price = (productData?.price || 'Consulte').trim();
  const originalPrice = (productData?.originalPrice || '').trim();
  const discount = (productData?.discount || '').trim();
  const rating = productData?.rating ? `${productData.rating} ⭐` : '';
  const reviews = productData?.reviewsCount ? `(${productData.reviewsCount})` : '';
  const sales = (productData?.sales || '').trim();
  const link = affiliateLink || productData?.url || '';

  const platformDetails = getPlatformDetails(productData);
  const customTemplate = store.ml_custom_copy || null;

  // Se o estilo for personalizado ('custom') ou se houver um template personalizado salvo
  if (styleKey === 'custom' && customTemplate) {
    let populated = customTemplate
      .replace(/{titulo}/gi, title)
      .replace(/{preco}/gi, price)
      .replace(/{preco_antigo}/gi, originalPrice || price)
      .replace(/{link}/gi, link)
      .replace(/{loja}/gi, platformDetails.storeName);

    // Se o template já tiver placeholder de link, usa-o diretamente
    if (customTemplate.includes('{link}')) {
      return { copy: populated, model: 'custom-template', style: 'custom' };
    }
    const copy = sanitizeCopyForWhatsApp(populated, link, 'custom');
    return { copy, model: 'custom-template', style: 'custom' };
  }

  // Tenta Groq se chave configurada
  if (apiKey && apiKey !== '') {
    const prompt = styleConfig.getPrompt({ title, price, originalPrice, discount, rating, reviews, sales, platformDetails, customTemplate });
    for (const model of GROQ_MODELS) {
      try {
        console.log(`[Afiliado Automático] Solicitando copy [${styleKey}] para Groq (${model})...`);
        let rawCopy = await callGroqChatCompletion(apiKey, model, prompt);
        if (rawCopy && rawCopy.length > 20) {
          const copy = sanitizeCopyForWhatsApp(rawCopy, link, styleKey);
          return { copy, model, style: styleKey };
        }
      } catch (err) {
        console.warn(`[Afiliado Automático] Modelo Groq ${model} falhou:`, err.message);
      }
    }
  }

  // Fallback estruturado de alta fidelidade
  const fallbackBody = styleConfig.getFallbackBody({ title, price, originalPrice, discount, rating, reviews, sales, platformDetails, link, customTemplate });
  const fallback = sanitizeCopyForWhatsApp(fallbackBody, link, styleKey);
  return { copy: fallback, model: 'fallback-template', style: styleKey };
}

/**
 * Chamada HTTP à API do Groq com limite seguro de tokens
 */
async function callGroqChatCompletion(apiKey, model, userPrompt) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'Você é um copywriter profissional para WhatsApp. Crie mensagens persuasivas com parágrafos bem espaçados, formatação elegante (*negrito*) e sem links.'
        },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.6,
      max_tokens: 650
    })
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || `Erro Groq Status ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text || text.trim().length < 20) throw new Error('Groq retornou resposta vazia.');
  return text.trim();
}

/**
 * Sanitiza e formata a copy garantindo markdown perfeito no WhatsApp e isolamento estrito do link
 */
function sanitizeCopyForWhatsApp(copyText, cleanUrl, styleKey = 'vantagens_gatilhos') {
  let text = (copyText || '').replace(/\r\n/g, '\n').trim();

  // 1. Remove eventuais blocos de código markdown que a IA possa ter retornado (```markdown ... ```)
  text = text.replace(/^```[a-z]*\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

  // 2. Remove rigorosamente QUALQUER URL prévia do texto (evita links duplicados, institucionais ou corrompidos)
  text = text.replace(/https?:\/\/[^\s<>"]+/gi, '');

  // 3. Remove chamadas prévias de link e rodapés de promoção prévios (garante idempotência estrita)
  text = text.replace(/(?:👉\s*)?(?:\*?(?:Compre|Garanta|Acesse|Confira)(?:\s+(?:no|com))?\s+(?:link\s+oficial|desconto(?:\s+aqui)?):?\*?\s*)+/gi, '');
  text = text.replace(/(?:👉\s*)?(?:\*?(?:Link\s+de\s+compra|Link\s+oficial|Acesse\s+o\s+link|Garanta\s+no\s+link):?\*?\s*)+/gi, '');
  text = text.replace(/_?\s*⏰?\s*(?:Preço promocional|Oferta válida|Corra, os preços|Promoção válida)[^_\n]*_?/gi, '');

  // 4. Limpa e normaliza linhas
  const rawLines = text.split('\n').map(l => l.trim());
  const formattedLines = [];

  for (let l of rawLines) {
    if (!l) {
      formattedLines.push('');
      continue;
    }

    let s = l;

    // Normaliza ***negrito e itálico*** para *_negrito e itálico_*
    s = s.replace(/\*\*\*([^*]+?)\*\*\*/g, '*_$1_*');

    // Converte **negrito** de markdown padrão para *negrito* do WhatsApp
    s = s.replace(/\*\*([^*]+?)\*\*/g, '*$1*');

    // Transforma marcadores de listas em bullets limpos para não quebrar asteriscos
    s = s.replace(/^\*\s+([^*]+)$/g, '• $1');
    s = s.replace(/^-\s+/g, '• ');

    // Se um emoji estiver colado no início do negrito: "*🚀 Oferta*" -> "🚀 *Oferta*"
    s = s.replace(/\*([\p{Emoji_Presentation}\p{Extended_Pictographic}]+)\s*([^*]+?)\*/gu, '$1 *$2*');
    // Se um emoji estiver colado no fim do negrito: "*Oferta 🚀*" -> "*Oferta* 🚀"
    s = s.replace(/\*([^*]+?)\s*([\p{Emoji_Presentation}\p{Extended_Pictographic}]+)\*/gu, '*$1* $2');

    // Limpa caracteres residuais soltos no final da linha (ex: dois pontos colados em asterisco "*:")
    s = s.replace(/[:*~_]+\s*$/g, match => {
      return match.includes(':') ? match.replace(/[*~_]/g, '') : match;
    });

    // Auto-balanceia asteriscos ímpares na linha
    const stars = (s.match(/\*/g) || []).length;
    if (stars % 2 !== 0) s += '*';

    // Auto-balanceia itálicos ímpares
    const unders = (s.match(/_/g) || []).length;
    if (unders % 2 !== 0) s += '_';

    // Auto-balanceia tachados ímpares
    const tildes = (s.match(/~/g) || []).length;
    if (tildes % 2 !== 0) s += '~';

    formattedLines.push(s);
  }

  // 5. Remove rigorosamente QUALQUER linha com menção a cupons gerada por IA ou resíduo
  for (let i = formattedLines.length - 1; i >= 0; i--) {
    const lineUpper = formattedLines[i].toUpperCase();
    if (
      lineUpper.includes('🎟️') ||
      lineUpper.includes('CUPOM') ||
      lineUpper.includes('VOUCHER') ||
      lineUpper.includes('DESCONTO DE CUPOM') ||
      lineUpper.includes('REGRAS: VÁLIDO') ||
      lineUpper.includes('CUPOM EXCLUSIVO') ||
      lineUpper.includes('CUPOM RELÂMPAGO') ||
      lineUpper.includes('CUPOM DE DESCONTO') ||
      (lineUpper.includes('USE O') && lineUpper.includes('CARRINHO'))
    ) {
      formattedLines.splice(i, 1);
    }
  }

  // Reduz múltiplas linhas vazias consecutivas para no máximo uma (parágrafo limpo)
  const cleanBody = formattedLines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!cleanUrl) return cleanBody;

  const sanitizedUrl = cleanUrl.trim().replace(/[*_~`"'.,;!?]+$/, '');
  const styleCfg = COPY_STYLE_CONFIGS[styleKey] || COPY_STYLE_CONFIGS.vantagens_gatilhos;
  const ctaLine = styleCfg.cta || '';
  const footerLine = styleCfg.footer || '';

  const parts = [cleanBody];
  if (footerLine) parts.push(footerLine);
  if (ctaLine) parts.push(`${ctaLine}\n${sanitizedUrl}`);
  else parts.push(sanitizedUrl);

  return parts.join('\n\n');
}

// =============================================================================
// SINCRONIZAÇÃO AUTOMÁTICA DE GRUPOS DO WHATSAPP WEB
// =============================================================================

/**
 * Conecta à aba do WhatsApp Web e extrai todos os grupos do usuário
 */
async function handleSyncWhatsAppGroups() {
  const tabs = await chrome.tabs.query({ url: '*://web.whatsapp.com/*' });
  let waTab = null;

  if (tabs.length > 0) {
    waTab = tabs[0];
  } else {
    throw new Error('Nenhuma aba do WhatsApp Web encontrada. Abra o WhatsApp Web (web.whatsapp.com) e clique em sincronizar novamente.');
  }

  // Não rouba foco nem altera a aba ativa para manter o popup da extensão aberto
  // 1. Tenta extrair diretamente do IndexedDB ('model-storage') ou memória do WhatsApp Web (world: 'MAIN')
  // Filtro estrito: IDs terminando em @g.us (apenas grupos legítimos, 0 contatos individuais)
  try {
    const [mainResult] = await chrome.scripting.executeScript({
      target: { tabId: waTab.id },
      world: 'MAIN',
      func: async () => {
        // Estratégia A: IndexedDB 'model-storage' -> 'chat'
        try {
          const idbList = await new Promise((resolve) => {
            if (!window.indexedDB) return resolve(null);
            const req = window.indexedDB.open('model-storage');
            req.onerror = () => resolve(null);
            req.onsuccess = (e) => {
              try {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('chat')) {
                  db.close();
                  return resolve(null);
                }
                const tx = db.transaction('chat', 'readonly');
                const store = tx.objectStore('chat');
                const getAll = store.getAll();
                getAll.onsuccess = () => {
                  const items = getAll.result || [];
                  db.close();
                  const groups = items
                    .filter(c => {
                      const id = typeof c.id === 'string' ? c.id : (c.id?._serialized || '');
                      return (id.endsWith('@g.us') || c.isGroup === true) && !id.endsWith('@c.us') && !id.endsWith('@s.whatsapp.net');
                    })
                    .map(c => c.name || c.formattedTitle || c.subject || c.title)
                    .filter(n => n && typeof n === 'string' && n.trim().length > 1)
                    .map(n => n.trim());
                  resolve(groups.length > 0 ? Array.from(new Set(groups)) : null);
                };
                getAll.onerror = () => {
                  db.close();
                  resolve(null);
                };
              } catch (err) {
                resolve(null);
              }
            };
          });

          if (Array.isArray(idbList) && idbList.length > 0) {
            return idbList.sort((a, b) => a.localeCompare(b, 'pt-BR'));
          }
        } catch (e) {}

        // Estratégia B: window.Store
        try {
          if (window.Store && window.Store.Chat && window.Store.Chat.models) {
            const list = window.Store.Chat.models
              .filter(c => (c.isGroup || (c.id && c.id._serialized && c.id._serialized.endsWith('@g.us'))) && !(c.id && c.id._serialized && c.id._serialized.endsWith('@c.us')))
              .map(c => c.name || c.formattedTitle || c.title)
              .filter(Boolean);
            if (list.length > 0) return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b, 'pt-BR'));
          }
        } catch (e) {}

        return null;
      }
    });

    const mainGroups = mainResult?.result;
    if (Array.isArray(mainGroups) && mainGroups.length > 0) {
      console.log(`[Afiliado ML] ✅ ${mainGroups.length} grupos exclusivos (@g.us) obtidos diretamente do WhatsApp!`);
      await chrome.storage.local.set({ all_detected_whatsapp_groups: mainGroups });
      const currentStored = await chrome.storage.local.get(['ml_whatsapp_groups']);
      if (!currentStored.ml_whatsapp_groups || currentStored.ml_whatsapp_groups.length === 0) {
        await chrome.storage.local.set({ ml_whatsapp_groups: [mainGroups[0]] });
      }
      return { groups: mainGroups };
    }
  } catch (err) {
    console.warn('[Afiliado ML] Tentativa no world MAIN / IndexedDB:', err);
  }

  // 2. Fallback: Via content_wa.js acionando o botão nativo de filtro "Grupos"
  let resp = null;
  try {
    resp = await sendMessageToTabWithRetry(waTab.id, { action: 'extract_all_groups' });
  } catch (err) {
    console.log('[Afiliado ML] Injetando content_wa.js na aba do WhatsApp...', err);
    await chrome.scripting.executeScript({
      target: { tabId: waTab.id },
      files: ['content_wa.js']
    });
    await new Promise(r => setTimeout(r, 800));
    resp = await sendMessageToTabWithRetry(waTab.id, { action: 'extract_all_groups' });
  }

  if (resp && resp.success && Array.isArray(resp.groups) && resp.groups.length > 0) {
    await chrome.storage.local.set({ all_detected_whatsapp_groups: resp.groups });
    const currentStored = await chrome.storage.local.get(['ml_whatsapp_groups']);
    if (!currentStored.ml_whatsapp_groups || currentStored.ml_whatsapp_groups.length === 0) {
      await chrome.storage.local.set({ ml_whatsapp_groups: [resp.groups[0]] });
    }
    console.log(`[Afiliado ML] ${resp.groups.length} grupos sincronizados com sucesso via filtro nativo.`);
    return { groups: resp.groups };
  }

  throw new Error(resp?.error || 'Nenhum grupo encontrado. Certifique-se de estar logado no WhatsApp Web.');
}

// =============================================================================
// MOTOR DE BUSCA & SCRAPING NATIVO VIA ABA
// =============================================================================

/**
 * Executa a busca de produtos abrindo uma aba e extraindo os dados
 * via Schema.org (JSON-LD), componentes do DOM (.poly-card / ui-search) e Regex.
 */
async function handleSearchOffers(query) {
  if (!query || !query.trim()) {
    throw new Error('Digite um nicho para buscar ofertas.');
  }

  let searchUrl = '';
  if (query.includes('mercadolivre.com.br/afiliados') || query.toLowerCase() === 'afiliados') {
    searchUrl = 'https://www.mercadolivre.com.br/afiliados/';
  } else {
    const cleanTerm = query
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-');
    searchUrl = `https://lista.mercadolivre.com.br/${encodeURIComponent(cleanTerm)}`;
  }
  console.log('[Afiliado ML] Carregando busca do Mercado Livre:', searchUrl);

  let tempTab = null;

  try {
    tempTab = await chrome.tabs.create({
      url: searchUrl,
      active: false
    });

    const loadState = await waitForTabCompletelyLoaded(tempTab.id, 16000);
    console.log('[Afiliado ML] Aba de busca estabilizada. URL final:', loadState?.url);

    const [execResult] = await chrome.scripting.executeScript({
      target: { tabId: tempTab.id },
      func: async () => {
        const sleep = ms => new Promise(r => setTimeout(r, ms));

        for (let attempt = 0; attempt < 15; attempt++) {
          const list = [];
          const seen = new Set();

          // --- Estratégia A: Schema.org ItemList (JSON-LD) ---
          try {
            const ldElements = document.querySelectorAll('script[type="application/ld+json"]');
            for (const el of ldElements) {
              try {
                const data = JSON.parse(el.textContent);
                if (data['@type'] === 'ItemList' && Array.isArray(data.itemListElement)) {
                  for (const entry of data.itemListElement) {
                    const item = entry.item || entry;
                    if (item && (item.name || item.title) && (item.url || item['@id'])) {
                      let u = (item.url || item['@id']).split('?')[0].split('#')[0];
                      if (seen.has(u)) continue;
                      seen.add(u);

                      let pStr = 'Consulte';
                      let rawPrice = 0;
                      if (item.offers && item.offers.price) {
                        rawPrice = parseFloat(item.offers.price) || 0;
                        pStr = `R$ ${rawPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                      }

                      let rating = 0;
                      let reviewsCount = '';
                      if (item.aggregateRating) {
                        rating = parseFloat(item.aggregateRating.ratingValue) || 0;
                        reviewsCount = `${item.aggregateRating.reviewCount || item.aggregateRating.ratingCount || ''}`;
                      }

                      list.push({
                        title: item.name || item.title,
                        price: pStr,
                        rawPrice,
                        url: u,
                        imageUrl: item.image || '',
                        discount: '',
                        discountPercent: 0,
                        rating,
                        reviewsCount: reviewsCount ? `(${reviewsCount})` : '',
                        sales: '',
                        salesCount: reviewsCount ? parseInt(reviewsCount, 10) * 5 : 0
                      });
                    }
                  }
                }
              } catch (e) {}
            }
          } catch (e) {}

          if (list.length >= 5) return { success: true, products: list, method: 'json-ld' };

          // --- Estratégia B: Seletores do DOM (.poly-card e ui-search) ---
          let cards = Array.from(document.querySelectorAll(
            'li.ui-search-layout__item, .poly-card, div.ui-search-result__wrapper, div[class*="poly-card"], div.andes-card, div[class*="andes-card"], section.ui-search-results li, div[class*="ui-recommendations-card"], div[class*="recommendation"], div[class*="affiliate"], div[class*="afiliado"], div[class*="campaign"], div[class*="product-card"], [data-testid*="card"], [data-testid*="item"]'
          ));

          const pLinks = document.querySelectorAll('a[href*="/MLB-"], a[href*="/p/MLB"], a[href*="produto.mercadolivre.com.br"], a[href*="/MLB"], a[href*="mercadolivre.com.br/MLB"]');
          const cSet = new Set(cards);
          for (const a of pLinks) {
            if (a.closest('header, nav, footer, #ml-afiliado-floating-btn, #ml-afiliado-modal-overlay')) continue;
            const c = a.closest('.poly-card, .andes-card, [class*="andes-card"], [class*="card" i], [class*="item" i], [class*="product" i], [class*="recommendation" i], [class*="affiliate" i], [class*="afiliado" i], tr, li, article') || a.parentElement;
            if (c && !cSet.has(c)) {
              cSet.add(c);
              cards.push(c);
            }
          }

          for (const card of cards) {
            const titleEl = card.querySelector(
              '.poly-component__title, .ui-search-item__title, h2, h3, h4, a[class*="title"], [class*="title" i]'
            ) || card.querySelector('a[href*="/MLB"], a[href*="produto.mercadolivre.com.br"]');
            if (!titleEl) continue;
            const title = titleEl.textContent.trim();
            if (!title || title.length < 3) continue;

            const linkEl = card.querySelector('a.poly-component__title, a.ui-search-link') ||
                           titleEl.closest('a') ||
                           card.querySelector('a[href*="/MLB-"], a[href*="/p/MLB"], a[href*="produto.mercadolivre.com.br"], a[href*="/MLB"]') ||
                           card.querySelector('a[href*="mercadolivre.com.br"]');
            if (!linkEl || !linkEl.href) continue;

            const cleanUrl = linkEl.href.split('?')[0].split('#')[0];
            if (seen.has(cleanUrl)) continue;
            seen.add(cleanUrl);

            const imgEl = card.querySelector('img');
            let imgUrl = '';
            if (imgEl) {
              const candidates = [
                imgEl.getAttribute('data-src'),
                imgEl.getAttribute('data-lazy-src'),
                imgEl.dataset ? imgEl.dataset.src : null,
                imgEl.getAttribute('data-srcset'),
                imgEl.srcset,
                imgEl.src
              ];
              for (const cand of candidates) {
                if (cand && typeof cand === 'string') {
                  const m = cand.match(/https?:\/\/[^\s,]+/);
                  if (m && !m[0].startsWith('data:')) {
                    imgUrl = m[0];
                    break;
                  }
                }
              }
            }
            if (!imgUrl) {
              const allImgs = card.querySelectorAll('img');
              for (const im of allImgs) {
                const cand = im.getAttribute('data-src') || im.getAttribute('data-lazy-src') || im.src || '';
                if (cand && cand.startsWith('http') && !cand.startsWith('data:')) {
                  imgUrl = cand;
                  break;
                }
              }
            }

            // 2. Preços: Original Riscado e Promocional Atual
            let originalPrice = '';
            let rawOriginalPrice = 0;
            let price = 'Consulte';
            let rawPrice = 0;
            let discount = '';
            let discountPercent = 0;

            // Preço Original Cheio Riscado (<s> ou .andes-money-amount--previous)
            const prevEl = card.querySelector('s.andes-money-amount, s .andes-money-amount, .andes-money-amount--previous, [class*="price--previous"], [class*="price__part--medium"] s');
            if (prevEl) {
              const pFrac = prevEl.querySelector('.andes-money-amount__fraction, .price-tag-fraction');
              const pCents = prevEl.querySelector('.andes-money-amount__cents');
              if (pFrac) {
                const f = pFrac.textContent.replace(/\./g, '').trim();
                const c = pCents ? pCents.textContent.trim() : '00';
                rawOriginalPrice = parseFloat(`${f}.${c}`) || 0;
                originalPrice = `R$ ${pFrac.textContent.trim()}${pCents && pCents.textContent.trim() ? ',' + pCents.textContent.trim() : ''}`;
              }
            }

            // Preço Atual / Promocional (não pode estar dentro de <s> ou previous)
            let currentEl = card.querySelector('.poly-price__current .andes-money-amount, .ui-search-price__second-line .andes-money-amount, .poly-component__price .andes-money-amount:not(.andes-money-amount--previous)');
            if (!currentEl) {
              const allMoney = Array.from(card.querySelectorAll('.andes-money-amount, .price-tag'));
              currentEl = allMoney.find(el => !el.closest('s, del, [class*="previous"]'));
              if (!currentEl && allMoney.length > 0) {
                currentEl = allMoney[allMoney.length - 1];
              }
            }

            if (currentEl) {
              const cFrac = currentEl.querySelector('.andes-money-amount__fraction, .price-tag-fraction');
              const cCents = currentEl.querySelector('.andes-money-amount__cents');
              if (cFrac) {
                const f = cFrac.textContent.replace(/\./g, '').trim();
                const c = cCents ? cCents.textContent.trim() : '00';
                rawPrice = parseFloat(`${f}.${c}`) || 0;
                price = `R$ ${cFrac.textContent.trim()}${cCents && cCents.textContent.trim() ? ',' + cCents.textContent.trim() : ''}`;
              }
            }

            if (!price || price === 'Consulte') {
              if (originalPrice) {
                price = originalPrice;
                rawPrice = rawOriginalPrice;
                originalPrice = '';
                rawOriginalPrice = 0;
              } else {
                const anyFrac = card.querySelector('.andes-money-amount__fraction, .price-tag-fraction');
                const anyCents = card.querySelector('.andes-money-amount__cents');
                if (anyFrac) {
                  const f = anyFrac.textContent.replace(/\./g, '').trim();
                  const c = anyCents ? anyCents.textContent.trim() : '00';
                  rawPrice = parseFloat(`${f}.${c}`) || 0;
                  price = `R$ ${anyFrac.textContent.trim()}${anyCents && anyCents.textContent.trim() ? ',' + anyCents.textContent.trim() : ''}`;
                } else {
                  // Fallback para texto puro (ex: cartões no portal de afiliados)
                  const plainText = (card.innerText || card.textContent || '');
                  const plainMatch = plainText.match(/R\$\s*([\d\.]+)(?:,(\d{2}))?/);
                  if (plainMatch) {
                    const f = plainMatch[1].replace(/\./g, '');
                    const c = plainMatch[2] || '00';
                    rawPrice = parseFloat(`${f}.${c}`) || 0;
                    price = `R$ ${plainMatch[1]}${plainMatch[2] ? ',' + plainMatch[2] : ''}`;
                  }
                }
              }
            }

            if (originalPrice === price || rawOriginalPrice <= rawPrice) {
              originalPrice = '';
              rawOriginalPrice = 0;
            }

            // 3. Desconto
            const discEl = card.querySelector('.andes-money-amount__discount, .poly-price__discount, .ui-search-price__discount, [class*="discount"]');
            if (discEl) {
              const dt = discEl.textContent.trim();
              const dm = dt.match(/(\d+)\s*%/);
              if (dm) {
                discountPercent = parseInt(dm[1], 10);
                discount = `${discountPercent}% OFF`;
              }
            }
            if (!discount && rawOriginalPrice > rawPrice && rawPrice > 0) {
              discountPercent = Math.round(((rawOriginalPrice - rawPrice) / rawOriginalPrice) * 100);
              if (discountPercent > 0) {
                discount = `${discountPercent}% OFF`;
              }
            }

            // 4. Avaliação e Reviews
            let rating = 0;
            let reviewsCount = '';
            const ratingEl = card.querySelector(
              '.poly-reviews__rating, .poly-component__rating, .ui-search-reviews__rating-number, [class*="reviews__rating"], [class*="rating-number"], [class*="rating__number"]'
            );
            if (ratingEl) {
              const rm = ratingEl.textContent.replace(',', '.').match(/([345](?:\.\d+)?)/);
              if (rm) rating = parseFloat(rm[1]) || 0;
            }

            if (!rating) {
              const ariaEl = card.querySelector(
                '[aria-label*="avaliação" i], [aria-label*="avaliac" i], [aria-label*="estrelas" i], [aria-label*="classificação" i], [aria-label*="classificacao" i], [aria-label*="rating" i]'
              );
              if (ariaEl) {
                const label = ariaEl.getAttribute('aria-label') || '';
                const rm = label.replace(',', '.').match(/([345](?:\.\d+)?)/);
                if (rm) rating = parseFloat(rm[1]) || 0;
              }
            }

            if (!rating) {
              const reviewBoxes = card.querySelectorAll('[class*="review"], [class*="rating"], [class*="score"]');
              for (const rb of reviewBoxes) {
                const txt = rb.textContent.replace(',', '.');
                const m = txt.match(/(?:★|☆)?\s*([345]\.[0-9])\b/);
                if (m) {
                  rating = parseFloat(m[1]) || 0;
                  break;
                }
              }
            }

            if (!rating) {
              const cardTxt = card.textContent.replace(',', '.');
              const rm = cardTxt.match(/(?:★\s*|classificação\s*|nota\s*)?([345]\.[0-9])\s*(?:\||\s*(?:estrelas|de 5))/i);
              if (rm) {
                rating = parseFloat(rm[1]) || 0;
              }
            }

            const reviewsEl = card.querySelector(
              '.poly-reviews__total, .ui-search-reviews__amount, [class*="reviews__total"], [class*="reviews-amount"], [class*="reviews-total"]'
            );
            if (reviewsEl) {
              const rClean = reviewsEl.textContent.replace(/[()]/g, '').trim();
              if (rClean) reviewsCount = rClean;
            } else {
              const parenM = card.textContent.match(/\(([0-9]+(?:\.[0-9]+)?)\)/);
              if (parenM) reviewsCount = parenM[1];
            }

            // Vendas / Mais Vendidos
            let sales = '';
            let salesCount = 0;
            const highlightEl = card.querySelector('.poly-component__highlight, .ui-search-item__highlight-label, [class*="highlight"]');
            if (highlightEl) {
              const ht = highlightEl.textContent.trim();
              if (/vendido/i.test(ht) && ht.length < 35) {
                sales = ht;
                salesCount = 99999;
              }
            }

            if (!sales) {
              const leafElements = card.querySelectorAll('span, p, small, strong, em, b');
              for (const el of leafElements) {
                if (el.children.length > 0) continue;
                const t = el.textContent.trim();
                if (!t || t.length > 35 || t.includes('R$') || t.includes('sem juros') || t.includes('grátis')) continue;

                const m = t.match(/(\+?\s*\d+(?:[.,]\d+)?\s*(?:mil)?\s*vendidos|mais\s+vendido[s]?)/i);
                if (m) {
                  sales = m[0].trim();
                  break;
                }
              }
            }

            if (sales) {
              const milM = sales.match(/\+?\s*(\d+(?:[.,]\d+)?)\s*mil/i);
              if (milM) {
                salesCount = parseFloat(milM[1].replace(',', '.')) * 1000;
              } else {
                const numM = sales.match(/\+?\s*(\d+(?:[.,]\d+)?)/);
                if (numM) salesCount = parseInt(numM[1].replace(/\./g, ''), 10);
                else salesCount = 1000;
              }
            }

            if (!salesCount && reviewsCount) {
              const numR = reviewsCount.replace(/\D/g, '');
              if (numR) salesCount = parseInt(numR, 10) * 5;
            }

            // 5. Comissão / Ganhos Extras (comum no Portal de Afiliados)
            let commissionRate = null;
            let commissionBonus = false;
            const cardTxtComm = (card.innerText || card.textContent || '');
            const commMatch = cardTxtComm.match(/(?:ganhos?\s*extras?|comiss[aã]o|ganhe|b[oô]nus)[^\d\n\r%]{0,20}(\d+(?:[.,]\d+)?)\s*%/i);
            if (commMatch) {
              commissionRate = parseFloat(commMatch[1].replace(',', '.')) || null;
              commissionBonus = /ganhos?\s*extras?|b[oô]nus/i.test(commMatch[0]);
            }

            list.push({
              title,
              price,
              rawPrice,
              originalPrice,
              rawOriginalPrice,
              url: cleanUrl,
              imageUrl: imgUrl || '',
              discount,
              discountPercent,
              rating,
              reviewsCount,
              sales,
              salesCount,
              commissionRate,
              commissionBonus
            });
          }

          if (list.length > 0) return { success: true, products: list, method: 'dom' };

          // --- Estratégia C: Regex sobre o HTML real ---
          try {
            const html = document.documentElement.innerHTML;
            const cardChunks = html.split(/(?=<div class="(?:poly-card|ui-search-result__wrapper)|<li class="ui-search-layout__item)/i);
            if (cardChunks.length > 1) {
              for (let i = 1; i < cardChunks.length; i++) {
                const chunk = cardChunks[i];
                const urlM = chunk.match(/href="((?:https?:\/\/(?:www\.|produto\.)?mercadolivre\.com\.br\/[^\s"<>]+|\/MLB-[^\s"<>]+|https?:\/\/[a-zA-Z0-9\.\-]+\/p\/MLB[^\s"<>]+))"/i);
                const titleM = chunk.match(/class="(?:poly-component__title|ui-search-item__title)[^"]*"[^>]*>([^<]+)<\/(?:a|h2)>/i) ||
                               chunk.match(/<h2[^>]*class="[^"]*ui-search-item__title[^"]*"[^>]*>([^<]+)<\/h2>/i);
                const priceM = chunk.match(/class="[^"]*(?:andes-money-amount__fraction|price-tag-fraction)[^"]*"[^>]*>([0-9\.\,]+)<\/span>/i);
                const imgM = chunk.match(/(?:data-src|src)="((?:https?:)?\/\/http2\.mlstatic\.com\/[^\s"<>]+)"/i);

                if (urlM && titleM) {
                  let u = urlM[1];
                  if (u.startsWith('/')) u = 'https://produto.mercadolivre.com.br' + u;
                  u = u.split('?')[0].split('#')[0];
                  if (!seen.has(u)) {
                    seen.add(u);
                    let rawPrice = 0;
                    if (priceM) {
                      rawPrice = parseFloat(priceM[1].replace(/\./g, '').replace(',', '.')) || 0;
                    }
                    list.push({
                      title: titleM[1].replace(/&amp;/g, '&').trim(),
                      price: priceM ? `R$ ${priceM[1]}` : 'Consulte',
                      rawPrice,
                      url: u,
                      imageUrl: imgM ? (imgM[1].startsWith('//') ? 'https:' + imgM[1] : imgM[1]) : '',
                      discount: '',
                      discountPercent: 0,
                      rating: 0,
                      reviewsCount: '',
                      sales: '',
                      salesCount: 0
                    });
                  }
                }
              }
            }
          } catch(e) {}

          if (list.length > 0) return { success: true, products: list, method: 'regex' };

          await sleep(350);
        }

        return {
          success: false,
          currentUrl: window.location.href,
          title: document.title,
          isBlocked: window.location.href.includes('account-verification') || window.location.href.includes('suspicious-traffic')
        };
      }
    });

    const result = execResult?.result;
    if (result && result.success && Array.isArray(result.products) && result.products.length > 0) {
      console.log(`[Afiliado ML] Sucesso: ${result.products.length} ofertas extraídas via ${result.method}.`);
      let customRates = null;
      let defaultRate = 9;
      try {
        const stored = await chrome.storage.local.get(['ml_custom_commission_rates', 'ml_default_commission_rate']);
        customRates = stored.ml_custom_commission_rates || null;
        if (typeof stored.ml_default_commission_rate === 'number') defaultRate = stored.ml_default_commission_rate;
      } catch (e) {}

      const enrichedProducts = result.products.map(p => {
        if (typeof MLCommission !== 'undefined') {
          const comm = MLCommission.calculateCommission(p, customRates, defaultRate);
          return {
            ...p,
            commissionRate: comm.rate,
            commissionPercent: comm.ratePercent,
            commissionValue: comm.value,
            commissionPrice: comm.valueFormatted,
            commissionLabel: comm.label || '',
            isBonusCommission: comm.isBonus || false,
            categoryName: comm.categoryName,
            categoryIcon: comm.categoryIcon
          };
        }
        return p;
      });

      return enrichedProducts;
    }

    if (result && result.isBlocked) {
      await chrome.tabs.update(tempTab.id, { active: true });
      tempTab = null;
      throw new Error('O Mercado Livre abriu uma aba pedindo verificação de segurança ("Não sou um robô"). Confirme na aba e clique em Buscar novamente.');
    }

    throw new Error(`Nenhuma oferta encontrada para "${query}". Tente buscar por outros termos.`);
  } finally {
    if (tempTab && tempTab.id) {
      try {
        await chrome.tabs.remove(tempTab.id);
      } catch (e) {}
    }
  }
}

/**
 * Aguarda a aba atingir status 'complete' com período de quietude de 1.5s
 */
function waitForTabCompletelyLoaded(tabId, timeoutMs = 16000) {
  return new Promise((resolve) => {
    let timer = null;
    let timeoutTimer = null;
    let settled = false;

    function cleanup() {
      if (timer) clearTimeout(timer);
      if (timeoutTimer) clearTimeout(timeoutTimer);
      chrome.tabs.onUpdated.removeListener(listener);
    }

    function checkQuiet() {
      if (settled) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        try {
          const tab = await chrome.tabs.get(tabId);
          if (tab && tab.status === 'complete' && tab.url && !tab.url.startsWith('chrome') && !tab.url.includes('about:blank')) {
            settled = true;
            cleanup();
            resolve(tab);
          }
        } catch (e) {
          settled = true;
          cleanup();
          resolve(null);
        }
      }, 1500);
    }

    function listener(updatedTabId, changeInfo, tab) {
      if (updatedTabId === tabId) {
        if (changeInfo.status === 'loading') {
          if (timer) clearTimeout(timer);
        } else if (changeInfo.status === 'complete' || tab.status === 'complete') {
          checkQuiet();
        }
      }
    }

    chrome.tabs.onUpdated.addListener(listener);

    // Verifica imediatamente se a aba já está completa
    chrome.tabs.get(tabId).then(tab => {
      if (!settled && tab && tab.status === 'complete' && tab.url && !tab.url.startsWith('chrome') && !tab.url.includes('about:blank')) {
        checkQuiet();
      }
    }).catch(() => {});

    timeoutTimer = setTimeout(async () => {
      if (!settled) {
        settled = true;
        cleanup();
        try {
          const tab = await chrome.tabs.get(tabId);
          resolve(tab);
        } catch (e) {
          resolve(null);
        }
      }
    }, timeoutMs);
  });
}

// =============================================================================
// GERAÇÃO OFICIAL DE LINK ENCURTADO meli.la (API DE AFILIADOS)
// =============================================================================

/**
 * Baixa a imagem do produto e converte para Data URL (Base64) para envio direto no WhatsApp Web
 */
async function fetchImageAsBase64(imageUrl) {
  if (!imageUrl || imageUrl.includes('icon128.png')) return null;
  let url = imageUrl.trim();
  if (url.startsWith('data:') && !url.startsWith('data:image/gif')) return url;
  if (url.startsWith('//')) url = 'https:' + url;
  if (!url.startsWith('http')) return null;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();

    // Converte de forma segura sem risco de estouro de pilha (chunked buffer)
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, chunk);
    }
    const mime = blob.type || res.headers.get('content-type') || 'image/jpeg';
    return `data:${mime};base64,${btoa(binary)}`;
  } catch (err) {
    console.warn('[Afiliado ML] Falha ao baixar imagem do produto:', err);
    return null;
  }
}

/**
 * Gera o link oficial meli.la utilizando a sessão logada do afiliado
 */
async function generateMeliShortLink(productUrl, affiliateTag) {
  if (!productUrl) return null;
  const cleanUrl = productUrl.split('?')[0].split('#')[0];
  const cleanTag = (affiliateTag || '').trim();

  // 1. Verifica cache local do chrome.storage
  const cacheKey = `meli_short_${cleanUrl}`;
  try {
    const cached = await chrome.storage.local.get([cacheKey]);
    if (cached[cacheKey] && cached[cacheKey].includes('meli.la/')) {
      console.log('[Afiliado ML] Link meli.la recuperado do cache:', cached[cacheKey]);
      return cached[cacheKey];
    }
  } catch (e) {}

  // 2. Se já existir uma aba aberta com esse mesmo produto, extrai diretamente dela
  try {
    const tabs = await chrome.tabs.query({});
    const matchingTab = tabs.find(t => t.url && t.url.split('?')[0].split('#')[0] === cleanUrl);

    if (matchingTab && matchingTab.id) {
      console.log('[Afiliado ML] Tentando extrair meli.la de aba já aberta...');
      const execResults = await chrome.scripting.executeScript({
        target: { tabId: matchingTab.id },
        func: extractMeliLaInTabContext,
        args: [cleanTag]
      }).catch(() => []);

      const res = execResults?.[0]?.result;
      if (res && res.includes('meli.la/')) {
        await chrome.storage.local.set({ [cacheKey]: res });
        console.log('[Afiliado ML] Link oficial meli.la obtido via aba aberta:', res);
        return res;
      }
    }
  } catch (err) {}

  // 3. Conforme pedido pelo usuário: abre o produto em outra aba temporária para pegar o link curto e fecha a aba
  let tempTab = null;
  try {
    console.log('[Afiliado ML] Abrindo produto em outra aba para copiar link curto meli.la:', cleanUrl);
    tempTab = await chrome.tabs.create({ url: cleanUrl, active: true });
    await waitForTabCompletelyLoaded(tempTab.id, 14000);
    await new Promise(r => setTimeout(r, 1200));

    // Executa a extração diretamente no DOM da página aberta
    const execResults = await chrome.scripting.executeScript({
      target: { tabId: tempTab.id },
      func: extractMeliLaInTabContext,
      args: [cleanTag]
    }).catch(() => []);

    let res = execResults?.[0]?.result;

    // Se a injeção direta não retornou, tenta via sendMessage para content_ml.js
    if (!res || !res.includes('meli.la/')) {
      res = await Promise.race([
        new Promise((resolve) => {
          chrome.tabs.sendMessage(
            tempTab.id,
            { action: 'generate_meli_la_internal', url: cleanUrl, tag: cleanTag },
            (resp) => {
              if (chrome.runtime.lastError || !resp || !resp.success) return resolve(null);
              resolve(resp.shortUrl);
            }
          );
        }),
        new Promise((resolve) => setTimeout(() => resolve(null), 8000))
      ]);
    }

    if (res && res.includes('meli.la/')) {
      await chrome.storage.local.set({ [cacheKey]: res });
      console.log('[Afiliado ML] Link meli.la gerado com sucesso via aba temporária:', res);
      await chrome.tabs.remove(tempTab.id).catch(() => {});
      tempTab = null;
      return res;
    }
  } catch (err) {
    console.warn('[Afiliado ML] Erro ao extrair meli.la via aba temporária:', err);
  } finally {
    if (tempTab && tempTab.id) {
      await chrome.tabs.remove(tempTab.id).catch(() => {});
    }
  }

  // 4. Fallback final via API direta
  try {
    const allCookies = await chrome.cookies.getAll({ domain: 'mercadolivre.com.br' });
    const csrfCookie = allCookies.find(c => c.name === '_csrf' || c.name.toLowerCase().includes('csrf'));
    const csrfToken = csrfCookie ? csrfCookie.value : '';

    const endpoints = [
      'https://www.mercadolivre.com.br/affiliate-program/api/v2/stripe/user/links',
      'https://www.mercadolivre.com.br/affiliate-program/api/v1/stripe/user/links'
    ];

    const tagsToTry = Array.from(new Set([cleanTag, cleanTag.toUpperCase(), cleanTag.toLowerCase(), '']));
    for (const ep of endpoints) {
      for (const t of tagsToTry) {
        try {
          const bodyPayload = t ? { url: cleanUrl, tag: t } : { url: cleanUrl };
          const res = await fetch(ep, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'accept': 'application/json, text/plain, */*',
              'content-type': 'application/json',
              ...(csrfToken ? { 'x-csrf-token': csrfToken } : {})
            },
            body: JSON.stringify(bodyPayload)
          });

          if (res.ok) {
            const data = await res.json();
            if (data && data.short_url) {
              await chrome.storage.local.set({ [cacheKey]: data.short_url });
              console.log('[Afiliado ML] Link meli.la gerado via API direta:', data.short_url);
              return data.short_url;
            }
          }
        } catch (e) {}
      }
    }
  } catch (err) {}

  return null;
}

/**
 * Função injetada diretamente na aba do produto para extrair o link curto meli.la
 * Clica no botão azul "Compartilhar" na barra preta de afiliados e extrai do modal
 */
async function extractMeliLaInTabContext(targetTag) {
  const cleanTag = (targetTag || '').trim();

  // 1. Procura se meli.la já está presente no DOM da página
  const allInputs = Array.from(document.querySelectorAll('input, textarea, a, p, span'));
  for (const el of allInputs) {
    const val = (el.value || el.href || el.textContent || '').trim();
    const m = val.match(/https?:\/\/meli\.la\/[a-zA-Z0-9_\-]+/i);
    if (m) return m[0];
  }

  // 2. Procura botão "Compartilhar" na barra de afiliados (topo preto)
  function findAffiliateButton() {
    const topContainers = Array.from(document.querySelectorAll(
      'header, nav, [class*="stripe" i], [class*="affiliate" i], [id*="stripe" i], [id*="affiliate" i], div[role="banner"], body > div'
    ));

    for (const bar of topContainers) {
      const barText = (bar.innerText || bar.textContent || '').toLowerCase();
      if (barText.includes('afiliado') || barText.includes('ganhos') || barText.includes('métrica') || barText.includes('metrica')) {
        const buttons = Array.from(bar.querySelectorAll('button, div[role="button"], a.andes-button, a[role="button"], [class*="button"]'));
        const found = buttons.find(b => {
          const t = (b.innerText || b.textContent || '').trim().toLowerCase();
          return t === 'compartilhar' || t.includes('compartilhar') || t === 'share';
        });
        if (found) return found;
      }
    }

    const allButtons = Array.from(document.querySelectorAll('button, div[role="button"], a.andes-button, a[role="button"], span[role="button"]'));
    return allButtons.find(b => {
      if (b.closest(
        '.ui-pdp-share, [class*="ui-pdp-share"], .ui-pdp-header, .ui-pdp-buybox, ' +
        '.ui-pdp-gallery, #ml-afiliado-floating-btn, #ml-afiliado-modal-overlay'
      )) {
        return false;
      }
      const txt = (b.innerText || b.textContent || '').trim().toLowerCase();
      return txt === 'compartilhar' || txt === 'share';
    });
  }

  // Aguarda até 7s para a barra de afiliados carregar e clica
  let shareBtn = null;
  const startBtn = Date.now();
  while (Date.now() - startBtn < 7000) {
    shareBtn = findAffiliateButton();
    if (shareBtn) break;
    await new Promise(r => setTimeout(r, 200));
  }

  if (shareBtn) {
    console.log('[Afiliado ML] Clicando no botão Compartilhar da barra de afiliados...');
    shareBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    shareBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
    shareBtn.click();

    // Aguarda até 8s pelo modal e extrai o link
    const startModal = Date.now();
    while (Date.now() - startModal < 8000) {
      await new Promise(r => setTimeout(r, 200));

      for (const input of document.querySelectorAll('input, textarea')) {
        const val = (input.value || input.getAttribute('value') || '').trim();
        const m = val.match(/https?:\/\/meli\.la\/[a-zA-Z0-9_\-]+/i);
        if (m) {
          try {
            document.querySelector('.andes-modal__close-button, button[aria-label*="Fechar"]')?.click();
          } catch(e) {}
          return m[0];
        }
      }

      for (const mEl of document.querySelectorAll('.andes-modal, div[role="dialog"], [class*="modal"], div[class*="portal"]')) {
        const text = mEl.innerText || mEl.textContent || '';
        const m = text.match(/https?:\/\/meli\.la\/[a-zA-Z0-9_\-]+/i);
        if (m) {
          try {
            document.querySelector('.andes-modal__close-button, button[aria-label*="Fechar"]')?.click();
          } catch(e) {}
          return m[0];
        }

        if (Date.now() - startModal > 600) {
          const cBtn = mEl.querySelector('button, [class*="copy"], svg');
          if (cBtn) {
            try { cBtn.click(); } catch(e) {}
          }
        }
      }

      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          const clip = await navigator.clipboard.readText();
          const m = (clip || '').match(/https?:\/\/meli\.la\/[a-zA-Z0-9_\-]+/i);
          if (m) {
            try {
              document.querySelector('.andes-modal__close-button, button[aria-label*="Fechar"]')?.click();
            } catch(e) {}
            return m[0];
          }
        }
      } catch(e) {}
    }
  }

  // 3. Fallback: requisição direta a partir do contexto da página (same-origin com cookies)
  try {
    const cleanU = window.location.href.split('?')[0].split('#')[0];
    let csrf = '';
    const cm = document.cookie.match(/(?:^|;\s*)_csrf=([^;]+)/);
    if (cm) csrf = decodeURIComponent(cm[1]);

    const apiUrls = [
      window.location.origin + '/affiliate-program/api/v2/stripe/user/links',
      'https://www.mercadolivre.com.br/affiliate-program/api/v2/stripe/user/links'
    ];

    for (const aUrl of apiUrls) {
      try {
        const r = await fetch(aUrl, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'accept': 'application/json, text/plain, */*',
            'content-type': 'application/json',
            ...(csrf ? { 'x-csrf-token': csrf } : {})
          },
          body: JSON.stringify({ url: cleanU, tag: cleanTag })
        });
        if (r.ok) {
          const d = await r.json();
          if (d && d.short_url) return d.short_url;
        }
      } catch(e) {}
    }
  } catch(e) {}

  return null;
}

// =============================================================================
// ORQUESTRAÇÃO DE DISPARO PARA O WHATSAPP WEB COM IA GROQ
// =============================================================================

/**
 * Funções auxiliares para geração do Link Curto oficial da Amazon (SiteStripe / amzn.to)
 */
function albCalculateMd5(string) {
  function RotateLeft(lValue, iShiftBits) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }
  function AddUnsigned(lX, lY) {
    var lX4, lY4, lX8, lY8, lResult;
    lX8 = (lX & 0x80000000);
    lY8 = (lY & 0x80000000);
    lX4 = (lX & 0x40000000);
    lY4 = (lY & 0x40000000);
    lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
    if (lX4 & lY4) return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
    if (lX4 | lY4) {
      if (lResult & 0x40000000) return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
      else return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
    } else return (lResult ^ lX8 ^ lY8);
  }
  function F(x, y, z) { return (x & y) | ((~x) & z); }
  function G(x, y, z) { return (x & z) | (y & (~z)); }
  function H(x, y, z) { return (x ^ y ^ z); }
  function I(x, y, z) { return (y ^ (x | (~z))); }
  function FF(a, b, c, d, x, s, ac) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  }
  function GG(a, b, c, d, x, s, ac) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  }
  function HH(a, b, c, d, x, s, ac) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  }
  function II(a, b, c, d, x, s, ac) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  }
  function ConvertToWordArray(string) {
    var lWordCount;
    var lMessageLength = string.length;
    var lNumberOfWords_temp1 = lMessageLength + 8;
    var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
    var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
    var lWordArray = Array(lNumberOfWords - 1);
    var lBytePosition = 0;
    var lByteCount = 0;
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition));
      lByteCount++;
    }
    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  }
  function WordToHex(lValue) {
    var WordToHexValue = '', WordToHexValue_temp = '', lByte, lCount;
    for (lCount = 0; lCount <= 3; lCount++) {
      lByte = (lValue >>> (lCount * 8)) & 255;
      WordToHexValue_temp = '0' + lByte.toString(16);
      WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
    }
    return WordToHexValue;
  }
  string = unescape(encodeURIComponent(string));
  var x = ConvertToWordArray(string);
  var k, AA, BB, CC, DD, a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476;
  var S11 = 7, S12 = 12, S13 = 17, S14 = 22;
  var S21 = 5, S22 = 9, S23 = 14, S24 = 20;
  var S31 = 4, S32 = 11, S33 = 16, S34 = 23;
  var S41 = 6, S42 = 10, S43 = 15, S44 = 21;
  for (k = 0; k < x.length; k += 16) {
    AA = a; BB = b; CC = c; DD = d;
    a = FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
    d = FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
    c = FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
    b = FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
    a = FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
    d = FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
    c = FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
    b = FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
    a = FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
    d = FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
    c = FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
    b = FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
    a = FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
    d = FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
    c = FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
    b = FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
    a = GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
    d = GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
    c = GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
    b = GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
    a = GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
    d = GG(d, a, b, c, x[k + 10], S22, 0x2441453);
    c = GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
    b = GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
    a = GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
    d = GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
    c = GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
    b = GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
    a = GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
    d = GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
    c = GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
    b = GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
    a = HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
    d = HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
    c = HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
    b = HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
    a = HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
    d = HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
    c = HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
    b = HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
    a = HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
    d = HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
    c = HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
    b = HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
    a = HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
    d = HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
    c = HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
    b = HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
    a = II(a, b, c, d, x[k + 0], S41, 0xF4292244);
    d = II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
    c = II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
    b = II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
    a = II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
    d = II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
    c = II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
    b = II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
    a = II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
    d = II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
    c = II(c, d, a, b, x[k + 6], S43, 0xA3014314);
    b = II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
    a = II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
    d = II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
    c = II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
    b = II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
    a = AddUnsigned(a, AA);
    b = AddUnsigned(b, BB);
    c = AddUnsigned(c, CC);
    d = AddUnsigned(d, DD);
  }
  return (WordToHex(a) + WordToHex(b) + WordToHex(c) + WordToHex(d)).toLowerCase();
}

function buildAmazonSiteStripeLongUrl({ asin, storeId, trackingId }) {
  const marketplaceId = 'A2Q3Y263D00KWC'; // Amazon Brasil
  const linkCode = 'll1';
  const subType = 'ShortLinks';
  const payload = {
    p_parameter: 'SS v2',
    test_name: 'Sitestripe',
    toolCreation: 'SS',
    adUnitType: 'TEXT',
    adUnitDescription: 'Product links Text only link',
    destinationType: 'ASIN',
    marketplaceId: String(marketplaceId),
    store: storeId,
    tag: trackingId,
    asin: asin,
    adUnitSubType: subType,
    linkCode: linkCode,
    createTime: Date.now()
  };
  const linkId = albCalculateMd5(JSON.stringify(payload));
  const base = `https://www.amazon.com.br/dp/${asin}`;
  const params = new URLSearchParams();
  params.set('linkCode', linkCode);
  params.set('tag', trackingId);
  params.set('linkId', linkId);
  params.set('ref_', 'ss_li');
  return `${base}?${params.toString()}`;
}

/**
 * Chamada direta ao endpoint oficial do SiteStripe da Amazon (/associates/sitestripe/getShortUrl)
 */
async function fetchAmazonSiteStripeDirect(asin, tag) {
  try {
    const tId = (tag || '').trim();
    const storeCandidates = [tId];
    if (tId.includes('-20')) {
      const baseName = tId.split('-')[0].replace(/\d+$/, '');
      if (baseName && !storeCandidates.includes(`${baseName}-20`)) {
        storeCandidates.push(`${baseName}-20`);
      }
    }

    for (const sId of storeCandidates) {
      try {
        const longUrl = buildAmazonSiteStripeLongUrl({ asin, storeId: sId, trackingId: tId });
        const queryParams = new URLSearchParams({
          longUrl,
          marketplaceId: 'A2Q3Y263D00KWC',
          storeId: sId
        });
        const resp = await fetch(`https://www.amazon.com.br/associates/sitestripe/getShortUrl?${queryParams.toString()}`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json, text/javascript, */*; q=0.01'
          }
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.isOk && data.shortUrl) {
            console.log('[Afiliado Amazon] ✅ Shortlink oficial amzn.to obtido via endpoint SiteStripe:', data.shortUrl);
            return data.shortUrl;
          }
        }
      } catch (e) {}
    }
  } catch (err) {
    console.warn('[Afiliado Amazon] Falha na chamada direta ao endpoint SiteStripe:', err);
  }
  return null;
}

/**
 * Extração de link amzn.to no contexto da aba da Amazon (exatamente igual ao Mercado Livre)
 */
async function extractAmazonSiteStripeInTab(asin, amzTag) {
  const currentAsin = asin || (window.location.pathname.match(/(?:\/dp\/|\/gp\/product\/|\/ASIN\/|^)([A-Z0-9]{10})/i)?.[1]?.toUpperCase());
  const targetTag = (amzTag || '').trim();

  // 1. Limpa URL para remover referências poluídas que causam erro no encurtador
  if (currentAsin && (window.location.pathname.includes('/ref=') || window.location.search.length > 0)) {
    try {
      window.history.replaceState({}, '', `/dp/${currentAsin}`);
    } catch (e) {}
  }

  // 2. Chamada direta ao endpoint interno a partir da própria página logada (first-party)
  try {
    const marketplaceId = 'A2Q3Y263D00KWC';
    const linkCode = 'll1';
    const storeCandidates = [targetTag];
    if (targetTag.includes('-20')) {
      const bName = targetTag.split('-')[0].replace(/\d+$/, '');
      if (bName && !storeCandidates.includes(`${bName}-20`)) storeCandidates.push(`${bName}-20`);
    }

    for (const sId of storeCandidates) {
      try {
        const payload = {
          p_parameter: 'SS v2',
          test_name: 'Sitestripe',
          toolCreation: 'SS',
          adUnitType: 'TEXT',
          adUnitDescription: 'Product links Text only link',
          destinationType: 'ASIN',
          marketplaceId: String(marketplaceId),
          store: sId,
          tag: targetTag,
          asin: currentAsin,
          adUnitSubType: 'ShortLinks',
          linkCode: linkCode,
          createTime: Date.now()
        };
        // Simple MD5 in page
        function pMd5(str) {
          function RotateLeft(lValue, iShiftBits) { return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits)); }
          function AddUnsigned(lX, lY) {
            var lX4 = (lX & 0x40000000), lY4 = (lY & 0x40000000), lX8 = (lX & 0x80000000), lY8 = (lY & 0x80000000);
            var lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
            if (lX4 & lY4) return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
            if (lX4 | lY4) return (lResult & 0x40000000) ? (lResult ^ 0xC0000000 ^ lX8 ^ lY8) : (lResult ^ 0x40000000 ^ lX8 ^ lY8);
            return (lResult ^ lX8 ^ lY8);
          }
          function F(x, y, z) { return (x & y) | ((~x) & z); }
          function G(x, y, z) { return (x & z) | (y & (~z)); }
          function H(x, y, z) { return (x ^ y ^ z); }
          function I(x, y, z) { return (y ^ (x | (~z))); }
          function FF(a, b, c, d, x, s, ac) { a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac)); return AddUnsigned(RotateLeft(a, s), b); }
          function GG(a, b, c, d, x, s, ac) { a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac)); return AddUnsigned(RotateLeft(a, s), b); }
          function HH(a, b, c, d, x, s, ac) { a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac)); return AddUnsigned(RotateLeft(a, s), b); }
          function II(a, b, c, d, x, s, ac) { a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac)); return AddUnsigned(RotateLeft(a, s), b); }
          function Convert(str) {
            var lWordCount, lMessageLength = str.length, lTemp1 = lMessageLength + 8;
            var lWords = ((lTemp1 - (lTemp1 % 64)) / 64 + 1) * 16, lArray = Array(lWords - 1);
            var lBytePos = 0, lByteCount = 0;
            while (lByteCount < lMessageLength) {
              lWordCount = (lByteCount - (lByteCount % 4)) / 4;
              lBytePos = (lByteCount % 4) * 8;
              lArray[lWordCount] = (lArray[lWordCount] | (str.charCodeAt(lByteCount) << lBytePos));
              lByteCount++;
            }
            lWordCount = (lByteCount - (lByteCount % 4)) / 4;
            lBytePos = (lByteCount % 4) * 8;
            lArray[lWordCount] = lArray[lWordCount] | (0x80 << lBytePos);
            lArray[lWords - 2] = lMessageLength << 3;
            lArray[lWords - 1] = lMessageLength >>> 29;
            return lArray;
          }
          function Hex(l) {
            var r = '';
            for (var c = 0; c <= 3; c++) {
              var b = (l >>> (c * 8)) & 255;
              r += ('0' + b.toString(16)).slice(-2);
            }
            return r;
          }
          var x = Convert(unescape(encodeURIComponent(str)));
          var a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476;
          var S = [7,12,17,22, 5,9,14,20, 4,11,16,23, 6,10,15,21];
          for (var k = 0; k < x.length; k += 16) {
            var AA = a, BB = b, CC = c, DD = d;
            a = FF(a, b, c, d, x[k+0], S[0], 0xD76AA478); d = FF(d, a, b, c, x[k+1], S[1], 0xE8C7B756); c = FF(c, d, a, b, x[k+2], S[2], 0x242070DB); b = FF(b, c, d, a, x[k+3], S[3], 0xC1BDCEEE);
            a = FF(a, b, c, d, x[k+4], S[0], 0xF57C0FAF); d = FF(d, a, b, c, x[k+5], S[1], 0x4787C62A); c = FF(c, d, a, b, x[k+6], S[2], 0xA8304613); b = FF(b, c, d, a, x[k+7], S[3], 0xFD469501);
            a = FF(a, b, c, d, x[k+8], S[0], 0x698098D8); d = FF(d, a, b, c, x[k+9], S[1], 0x8B44F7AF); c = FF(c, d, a, b, x[k+10], S[2], 0xFFFF5BB1); b = FF(b, c, d, a, x[k+11], S[3], 0x895CD7BE);
            a = FF(a, b, c, d, x[k+12], S[0], 0x6B901122); d = FF(d, a, b, c, x[k+13], S[1], 0xFD987193); c = FF(c, d, a, b, x[k+14], S[2], 0xA679438E); b = FF(b, c, d, a, x[k+15], S[3], 0x49B40821);
            a = GG(a, b, c, d, x[k+1], S[4], 0xF61E2562); d = GG(d, a, b, c, x[k+6], S[5], 0xC040B340); c = GG(c, d, a, b, x[k+11], S[6], 0x265E5A51); b = GG(b, c, d, a, x[k+0], S[7], 0xE9B6C7AA);
            a = GG(a, b, c, d, x[k+5], S[4], 0xD62F105D); d = GG(d, a, b, c, x[k+10], S[5], 0x2441453); c = GG(c, d, a, b, x[k+15], S[6], 0xD8A1E681); b = GG(b, c, d, a, x[k+4], S[7], 0xE7D3FBC8);
            a = GG(a, b, c, d, x[k+9], S[4], 0x21E1CDE6); d = GG(d, a, b, c, x[k+14], S[5], 0xC33707D6); c = GG(c, d, a, b, x[k+3], S[6], 0xF4D50D87); b = GG(b, c, d, a, x[k+8], S[7], 0x455A14ED);
            a = GG(a, b, c, d, x[k+13], S[4], 0xA9E3E905); d = GG(d, a, b, c, x[k+2], S[5], 0xFCEFA3F8); c = GG(c, d, a, b, x[k+7], S[6], 0x676F02D9); b = GG(b, c, d, a, x[k+12], S[7], 0x8D2A4C8A);
            a = HH(a, b, c, d, x[k+5], S[8], 0xFFFA3942); d = HH(d, a, b, c, x[k+8], S[9], 0x8771F681); c = HH(c, d, a, b, x[k+11], S[10], 0x6D9D6122); b = HH(b, c, d, a, x[k+14], S[11], 0xFDE5380C);
            a = HH(a, b, c, d, x[k+1], S[8], 0xA4BEEA44); d = HH(d, a, b, c, x[k+4], S[9], 0x4BDECFA9); c = HH(c, d, a, b, x[k+7], S[10], 0xF6BB4B60); b = HH(b, c, d, a, x[k+10], S[11], 0xBEBFBC70);
            a = HH(a, b, c, d, x[k+13], S[8], 0x289B7EC6); d = HH(d, a, b, c, x[k+0], S[9], 0xEAA127FA); c = HH(c, d, a, b, x[k+3], S[10], 0xD4EF3085); b = HH(b, c, d, a, x[k+6], S[11], 0x4881D05);
            a = HH(a, b, c, d, x[k+9], S[8], 0xD9D4D039); d = HH(d, a, b, c, x[k+12], S[9], 0xE6DB99E5); c = HH(c, d, a, b, x[k+15], S[10], 0x1FA27CF8); b = HH(b, c, d, a, x[k+2], S[11], 0xC4AC5665);
            a = II(a, b, c, d, x[k+0], S[12], 0xF4292244); d = II(d, a, b, c, x[k+7], S[13], 0x432AFF97); c = II(c, d, a, b, x[k+14], S[14], 0xAB9423A7); b = II(b, c, d, a, x[k+5], S[15], 0xFC93A039);
            a = II(a, b, c, d, x[k+12], S[12], 0x655B59C3); d = II(d, a, b, c, x[k+3], S[13], 0x8F0CCC92); c = II(c, d, a, b, x[k+10], S[14], 0xFFEFF47D); b = II(b, c, d, a, x[k+1], S[15], 0x85845DD1);
            a = II(a, b, c, d, x[k+8], S[12], 0x6FA87E4F); d = II(d, a, b, c, x[k+15], S[13], 0xFE2CE6E0); c = II(c, d, a, b, x[k+6], S[14], 0xA3014314); b = II(b, c, d, a, x[k+13], S[15], 0x4E0811A1);
            a = II(a, b, c, d, x[k+4], S[12], 0xF7537E82); d = II(d, a, b, c, x[k+11], S[13], 0xBD3AF235); c = II(c, d, a, b, x[k+2], S[14], 0x2AD7D2BB); b = II(b, c, d, a, x[k+9], S[15], 0xEB86D391);
            a = AddUnsigned(a, AA); b = AddUnsigned(b, BB); c = AddUnsigned(c, CC); d = AddUnsigned(d, DD);
          }
          return (Hex(a) + Hex(b) + Hex(c) + Hex(d)).toLowerCase();
        }

        const lId = pMd5(JSON.stringify(payload));
        const lUrl = `https://www.amazon.com.br/dp/${currentAsin}?linkCode=${linkCode}&tag=${encodeURIComponent(targetTag)}&linkId=${lId}&ref_=ss_li`;
        const qParams = new URLSearchParams({ longUrl: lUrl, marketplaceId, storeId: sId });
        const res = await fetch(`/associates/sitestripe/getShortUrl?${qParams.toString()}`, {
          credentials: 'include',
          headers: { 'Accept': 'application/json, text/javascript, */*; q=0.01' }
        });
        if (res.ok) {
          const d = await res.json();
          if (d && d.isOk && d.shortUrl) return d.shortUrl;
        }
      } catch (e) {}
    }
  } catch (err) {}

  // 3. Automação da Barra SiteStripe (Clica em "Obter link" -> Modal -> "Copiar link")
  function findSiteStripeBtn() {
    const clickables = Array.from(document.querySelectorAll('button, a, span[role="button"], div[role="button"], input[type="button"], .a-button, span.a-button-inner'));
    return clickables.find(b => {
      if (b.closest('#amz-afiliado-modal-overlay') || b.closest('#amz-afiliado-floating-btn')) return false;
      const t = (b.innerText || b.textContent || b.value || b.getAttribute('aria-label') || '').trim().toLowerCase();
      return t === 'obter link' || t === 'get link' || t === 'texto';
    }) || document.querySelector('#amzn-ss-text-link, a#amzn-ss-text-link, #amzn-ss-wrap [id*="text" i]');
  }

  function findModal() {
    const dialogs = Array.from(document.querySelectorAll('div[role="dialog"], .a-popover, #amzn-ss-text-popover, .amzn-ss-popover, div[class*="popover" i], div[class*="modal" i]'));
    return dialogs.find(d => {
      if (d.closest('#amz-afiliado-modal-overlay') || d.closest('#amz-afiliado-floating-btn')) return false;
      if (d.offsetWidth === 0 && d.offsetHeight === 0) return false;
      const txt = (d.innerText || d.textContent || '').toLowerCase();
      return txt.includes('links de afiliados') || txt.includes('copiar link de associado') || (txt.includes('formato do link') && txt.includes('link curto'));
    }) || document.querySelector('#amzn-ss-text-popover, .amzn-ss-popover');
  }

  let modal = findModal();
  if (!modal) {
    const btn = findSiteStripeBtn();
    if (btn) {
      btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
      btn.click();
      const startW = Date.now();
      while (Date.now() - startW < 3000) {
        await new Promise(r => setTimeout(r, 120));
        modal = findModal();
        if (modal) break;
      }
    }
  }

  if (modal) {
    // Garante que o radio "Link curto" está marcado
    const radios = Array.from(modal.querySelectorAll('input[type="radio"]'));
    const shortRadio = radios.find(r => {
      const lbl = r.closest('label') || r.parentElement;
      const txt = ((lbl && lbl.textContent) || r.value || r.id || '').toLowerCase();
      return txt.includes('curto') || txt.includes('short');
    });
    if (shortRadio && !shortRadio.checked) {
      shortRadio.click();
      shortRadio.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Se os selects NÃO tiverem valor, preenche; se JÁ tiverem valor selecionado, NÃO MEXE!
    const selects = Array.from(modal.querySelectorAll('select'));
    for (const sel of selects) {
      if (!sel.value || sel.value === '0' || sel.value === '') {
        const match = Array.from(sel.options).find(o => o.value && (o.value.includes(targetTag) || o.value.includes('-20')));
        if (match) {
          sel.value = match.value;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    }

    await new Promise(r => setTimeout(r, 400));

    // Clica no botão amarelo "Copiar link de associado"
    const candidates = Array.from(modal.querySelectorAll('button, a, span[role="button"], div[role="button"], input[type="button"], input[type="submit"], .a-button-input, .a-button'));
    const copyBtn = candidates.find(b => {
      const txt = (b.innerText || b.textContent || b.value || b.getAttribute('aria-label') || '').trim().toLowerCase();
      return txt.includes('copiar link de associado') || txt.includes('copiar link') || txt.includes('copiar');
    }) || modal.querySelector('.a-button-primary, button.a-button-text, input[value*="Copiar" i]');

    if (copyBtn) {
      copyBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      copyBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
      copyBtn.click();
    }

    // Aguarda até 4 segundos e varre resultado
    const startExtract = Date.now();
    while (Date.now() - startExtract < 4000) {
      await new Promise(r => setTimeout(r, 150));

      // Varre DOM
      for (const el of modal.querySelectorAll('input, textarea, span, p, a, div')) {
        const val = (el.value || el.textContent || el.href || '').trim();
        const m = val.match(/https?:\/\/(?:amzn\.to|link\.amazon|a\.co)\/[a-zA-Z0-9_\-]+/i);
        if (m) {
          try { modal.querySelector('.a-button-close, button[aria-label*="close" i]')?.click(); } catch (e) {}
          return m[0];
        }
      }

      // Varre clipboard se documento estiver com foco
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          const clip = await navigator.clipboard.readText();
          const m = (clip || '').match(/https?:\/\/(?:amzn\.to|link\.amazon|a\.co)\/[a-zA-Z0-9_\-]+/i);
          if (m) {
            try { modal.querySelector('.a-button-close, button[aria-label*="close" i]')?.click(); } catch (e) {}
            return m[0];
          }
        }
      } catch (e) {}
    }

    try { modal.querySelector('.a-button-close, button[aria-label*="close" i]')?.click(); } catch (e) {}
  }

  return null;
}

/**
 * Gera o link oficial amzn.to ou link.amazon da Amazon
 * Usa cache, endpoint direto e automação em aba temporária (exatamente como Mercado Livre)
 */
async function generateAmazonShortLink(productData, amzTag) {
  const rawUrl = productData?.url || '';
  const asinMatch = (productData?.asin || rawUrl).match(/(?:\/dp\/|\/gp\/product\/|\/ASIN\/|^)([A-Z0-9]{10})/i);
  const asin = asinMatch ? asinMatch[1].toUpperCase() : null;

  // Se já for shortlink oficial (link.amazon ou amzn.to), retorna diretamente
  if (rawUrl.includes('amzn.to/') || rawUrl.includes('link.amazon/') || rawUrl.includes('a.co/')) return rawUrl;
  if (productData?.affiliateShortLink && (productData.affiliateShortLink.includes('amzn.to/') || productData.affiliateShortLink.includes('link.amazon/') || productData.affiliateShortLink.includes('a.co/'))) {
    return productData.affiliateShortLink;
  }

  const stored = await chrome.storage.local.get(['amazon_affiliate_tag']);
  const cleanTag = (amzTag || stored.amazon_affiliate_tag || '').trim();

  // 1. Verifica cache local do chrome.storage
  const cacheKey = asin ? `amz_short_${asin}` : `amz_short_${rawUrl.split('?')[0]}`;
  try {
    const cached = await chrome.storage.local.get([cacheKey]);
    if (cached[cacheKey] && (cached[cacheKey].includes('amzn.to/') || cached[cacheKey].includes('link.amazon/'))) {
      console.log('[Afiliado Amazon] Link recuperado do cache:', cached[cacheKey]);
      return cached[cacheKey];
    }
  } catch (e) {}

  // 2. Chamada direta ao endpoint oficial do SiteStripe em background
  if (asin) {
    const directShort = await fetchAmazonSiteStripeDirect(asin, cleanTag);
    if (directShort) {
      await chrome.storage.local.set({ [cacheKey]: directShort });
      return directShort;
    }
  }

  // 3. Tenta extrair da aba da Amazon aberta no navegador
  try {
    const tabs = await chrome.tabs.query({ url: ['*://*.amazon.com.br/*', '*://amazon.com.br/*'] });
    let targetTab = null;
    if (tabs.length > 0) {
      if (asin) {
        targetTab = tabs.find(t => t.url && t.url.includes(asin)) || tabs.find(t => t.active) || tabs[0];
      } else {
        targetTab = tabs.find(t => t.active) || tabs[0];
      }
    }

    if (targetTab && targetTab.id) {
      const execResults = await chrome.scripting.executeScript({
        target: { tabId: targetTab.id },
        func: extractAmazonSiteStripeInTab,
        args: [asin, cleanTag]
      }).catch(() => []);

      const res = execResults?.[0]?.result;
      if (res && (res.includes('amzn.to/') || res.includes('link.amazon/') || res.includes('a.co/'))) {
        await chrome.storage.local.set({ [cacheKey]: res });
        console.log('[Afiliado Amazon] ✅ Shortlink obtido da aba aberta:', res);
        return res;
      }
    }
  } catch (err) {
    console.warn('[Afiliado Amazon] Falha ao extrair da aba aberta:', err);
  }

  // 4. Conforme solicitado pelo usuário: abre o produto em aba temporária (exatamente como Mercado Livre)
  if (asin) {
    let tempTab = null;
    try {
      const cleanDpUrl = `https://www.amazon.com.br/dp/${asin}`;
      console.log('[Afiliado Amazon] Abrindo produto em aba temporária para pegar shortlink SiteStripe:', cleanDpUrl);
      tempTab = await chrome.tabs.create({ url: cleanDpUrl, active: true });
      await waitForTabCompletelyLoaded(tempTab.id, 14000);
      await new Promise(r => setTimeout(r, 1200));

      const execResults = await chrome.scripting.executeScript({
        target: { tabId: tempTab.id },
        func: extractAmazonSiteStripeInTab,
        args: [asin, cleanTag]
      }).catch(() => []);

      const res = execResults?.[0]?.result;
      if (res && (res.includes('amzn.to/') || res.includes('link.amazon/') || res.includes('a.co/'))) {
        await chrome.storage.local.set({ [cacheKey]: res });
        console.log('[Afiliado Amazon] ✅ Link amzn.to obtido com sucesso via aba temporária:', res);
        await chrome.tabs.remove(tempTab.id).catch(() => {});
        tempTab = null;
        return res;
      }
    } catch (err) {
      console.warn('[Afiliado Amazon] Erro ao extrair via aba temporária:', err);
    } finally {
      if (tempTab && tempTab.id) {
        await chrome.tabs.remove(tempTab.id).catch(() => {});
      }
    }
  }

  // 5. Fallback Canônico Oficial Amazon (com a tag correta)
  if (asin) {
    return `https://www.amazon.com.br/dp/${asin}?tag=${encodeURIComponent(cleanTag)}`;
  }
  const cleanBase = rawUrl.split('?')[0].split('#')[0];
  const sep = cleanBase.includes('?') ? '&' : '?';
  return `${cleanBase}${sep}tag=${encodeURIComponent(cleanTag)}`;
}

/**
 * Automação executada no contexto da página https://affiliate.shopee.com.br/offer/custom_link
 * Conforme instrução exata do usuário:
 * "ao clicar em disparar ele vai copiar a url da página, depois abre o https://affiliate.shopee.com.br/offer/custom_link
 *  e na caixa do link personalizado ele cola a url que havia copiado, em seguida clica em obter link,
 *  ao clicar nisso irá abrir um popup com o link curto de afiliado, clica em copiar link,
 *  em seguida, fecha essa aba e vai para o whatsapp fazer o processo de disparo"
 * 
 * Intercepta automaticamente o window.prompt nativo do navegador para NUNCA exigir clique manual do usuário!
 */
async function automateShopeeCustomLinkInTab(productUrl) {
  console.log('[Shopee In-Tab] Iniciando automação do portal com URL:', productUrl);

  let capturedPromptUrl = null;

  // Intercepta window.prompt nativo do navegador para NUNCA exibir o popup na tela
  // e capturar instantaneamente a URL do link curto s.shopee.com.br
  try {
    const origPrompt = window.prompt;
    window.prompt = function(message, defaultValue) {
      console.log('[Shopee In-Tab] prompt interceptado com sucesso:', message, defaultValue);
      const link = defaultValue || message || '';
      const m = String(link).match(/https?:\/\/s\.shopee\.com\.br\/[a-zA-Z0-9_\-]+/i);
      if (m) {
        capturedPromptUrl = m[0];
        if (document.documentElement) document.documentElement.setAttribute('data-shopee-short-url', m[0]);
        if (document.body) document.body.setAttribute('data-shopee-short-url', m[0]);
      }
      return defaultValue;
    };
    window.alert = function() { return true; };
    window.confirm = function() { return true; };
  } catch (e) {}

  // Intercepta navigator.clipboard.writeText caso a página tente copiar diretamente
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      const origWriteText = navigator.clipboard.writeText.bind(navigator.clipboard);
      navigator.clipboard.writeText = async function(text) {
        console.log('[Shopee In-Tab] writeText interceptado:', text);
        const m = String(text).match(/https?:\/\/s\.shopee\.com\.br\/[a-zA-Z0-9_\-]+/i);
        if (m) {
          capturedPromptUrl = m[0];
          if (document.documentElement) document.documentElement.setAttribute('data-shopee-short-url', m[0]);
          if (document.body) document.body.setAttribute('data-shopee-short-url', m[0]);
        }
        try { return await origWriteText(text); } catch (e) { return Promise.resolve(); }
      };
    }
  } catch (e) {}

  // Intercepta eventos de cópia disparados por document.execCommand('copy')
  try {
    document.addEventListener('copy', (e) => {
      try {
        const sel = window.getSelection ? window.getSelection().toString() : '';
        const m = (sel || '').match(/https?:\/\/s\.shopee\.com\.br\/[a-zA-Z0-9_\-]+/i);
        if (m) {
          capturedPromptUrl = m[0];
          if (document.documentElement) document.documentElement.setAttribute('data-shopee-short-url', m[0]);
          if (document.body) document.body.setAttribute('data-shopee-short-url', m[0]);
        }
      } catch (err) {}
    }, true);
  } catch (e) {}

  // 1. Verifica se foi redirecionado para a tela de autenticação
  const curUrl = window.location.href.toLowerCase();
  const isLoginPage = (
    curUrl.includes('/login') ||
    curUrl.includes('/auth') ||
    curUrl.includes('/buyer/login') ||
    window.location.hostname.includes('login')
  );
  if (isLoginPage) {
    console.warn('[Shopee In-Tab] Página de login detectada:', window.location.href);
    return { error: 'login_required' };
  }

  // 2. Localização precisa da caixa "Link personalizado" (ignora barras de busca do cabeçalho)
  function findCustomLinkInput() {
    // A) Textareas na página (excluindo cabeçalhos/navegação)
    const textareas = Array.from(document.querySelectorAll('textarea')).filter(ta => {
      return !ta.closest('header, nav, .ant-layout-header, .navbar, .shopee-header');
    });
    if (textareas.length > 0) return textareas[0];

    // B) Elemento associado a labels do formulário
    const labels = Array.from(document.querySelectorAll('label, div, span, p, h1, h2, h3, h4')).filter(el => {
      const t = (el.innerText || el.textContent || '').trim().toLowerCase();
      return t === 'link personalizado' || t.includes('link personalizado') || t.includes('link original') || t.includes('link do produto') || t.includes('cole o link') || t.includes('custom link');
    });
    for (const lbl of labels) {
      const parent = lbl.closest('.ant-form-item, .form-item, .ant-space-item, .ant-row, div');
      if (parent) {
        const inp = parent.querySelector('textarea, input[type="text"], input:not([type])');
        if (inp && !inp.closest('header, nav, .ant-layout-header')) return inp;
      }
    }

    // C) Inputs ou textareas com placeholders
    const candidates = Array.from(document.querySelectorAll('textarea, input[type="text"], input:not([type])')).filter(el => {
      if (el.closest('header, nav, .ant-layout-header, .navbar')) return false;
      const ph = (el.getAttribute('placeholder') || '').toLowerCase();
      return ph.includes('http') || ph.includes('link') || ph.includes('shopee') || ph.includes('insira') || ph.includes('cole');
    });
    if (candidates.length > 0) return candidates[0];

    // D) Input text principal
    const mainInputs = Array.from(document.querySelectorAll('main input[type="text"], .ant-layout-content input[type="text"], form input[type="text"]')).filter(el => {
      return !el.closest('header, nav, .ant-layout-header, .navbar, [class*="search" i]');
    });
    if (mainInputs.length > 0) return mainInputs[0];

    return null;
  }

  function humanSleep(minMs, maxMs) {
    const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    return new Promise(r => setTimeout(r, ms));
  }

  function simulateHumanClick(el) {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.round(rect.left + rect.width / 2 + (Math.random() * 8 - 4));
    const y = Math.round(rect.top + rect.height / 2 + (Math.random() * 6 - 3));
    const eventInit = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: Math.max(1, x),
      clientY: Math.max(1, y),
      screenX: (window.screenX || 0) + Math.max(1, x),
      screenY: (window.screenY || 0) + Math.max(1, y)
    };
    try {
      el.dispatchEvent(new PointerEvent('pointerover', eventInit));
      el.dispatchEvent(new MouseEvent('mouseover', eventInit));
      el.dispatchEvent(new PointerEvent('pointerenter', eventInit));
      el.dispatchEvent(new PointerEvent('pointermove', eventInit));
      el.dispatchEvent(new MouseEvent('mousemove', eventInit));
      el.dispatchEvent(new PointerEvent('pointerdown', eventInit));
      el.dispatchEvent(new MouseEvent('mousedown', eventInit));
      el.focus();
      el.dispatchEvent(new PointerEvent('pointerup', eventInit));
      el.dispatchEvent(new MouseEvent('mouseup', eventInit));
      el.dispatchEvent(new MouseEvent('click', eventInit));
    } catch (e) {
      el.click();
    }
  }

  function isCaptchaPresent() {
    const selectors = [
      '.shopee-captcha',
      '.sec-captcha-content',
      'div[class*="captcha" i]',
      'div[class*="verify" i]',
      'iframe[src*="captcha" i]',
      '.geetest',
      '.shopee-drag-box'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && (el.offsetWidth > 0 || el.offsetHeight > 0 || el.offsetParent !== null)) {
        return true;
      }
    }
    return false;
  }

  async function fillInputValue(inputEl, val) {
    // 1. Rola suavemente até o input e clica de forma humanizada para obter foco
    inputEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
    await humanSleep(400, 750);
    simulateHumanClick(inputEl);
    await humanSleep(300, 600);

    // 2. Preenchimento via prototype setter (compatível com React)
    const proto = inputEl instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) {
      setter.call(inputEl, val);
    } else {
      inputEl.value = val;
    }

    // 3. Dispara eventos nativos com pequeno intervalo orgânico
    inputEl.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    inputEl.dispatchEvent(new Event('change', { bubbles: true, composed: true }));

    try {
      inputEl.setSelectionRange(0, inputEl.value.length);
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, val);
    } catch (e) {}

    inputEl.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    inputEl.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    await humanSleep(200, 400);
  }

  function findSubmitBtn() {
    const allButtons = Array.from(document.querySelectorAll('button, div[role="button"], a[role="button"], span[role="button"], input[type="button"], input[type="submit"]')).filter(b => {
      if (b.closest('header, nav, .ant-layout-header, .navbar, .shopee-header')) return false;
      return true;
    });

    // 1. Procura por texto exato ou parcial no botão ou seus filhos
    for (const b of allButtons) {
      const text = (b.innerText || b.textContent || b.value || '').trim().toLowerCase();
      if (
        text === 'obter link' ||
        text === 'obter links' ||
        text === 'get link' ||
        text === 'get links' ||
        text === 'gerar link' ||
        text === 'converter' ||
        text.includes('obter link') ||
        text.includes('get link')
      ) {
        return b;
      }
    }

    // 2. Procura botão primário do Ant Design dentro do formulário/container
    for (const b of allButtons) {
      const cls = (b.className || '').toLowerCase();
      const isPrimary = cls.includes('ant-btn-primary') || cls.includes('shopee-button--primary') || cls.includes('btn-primary');
      const text = (b.innerText || b.textContent || '').trim().toLowerCase();
      if (isPrimary && !text.includes('cancel') && !text.includes('reset') && !text.includes('limpar') && !text.includes('voltar')) {
        return b;
      }
    }

    return null;
  }

  // Aguarda renderização da caixa de texto por até 10s
  let inputEl = null;
  const startInputWait = Date.now();
  while (Date.now() - startInputWait < 10000) {
    inputEl = findCustomLinkInput();
    if (inputEl) break;
    await humanSleep(200, 350);
  }

  if (!inputEl) {
    const pageText = (document.body ? document.body.innerText : '').toLowerCase();
    if (pageText.includes('fazer login') || pageText.includes('entre na sua conta') || pageText.includes('sign in')) {
      return { error: 'login_required' };
    }
  }

  if (inputEl) {
    console.log('[Shopee In-Tab] Caixa de link personalizado localizada. Inserindo URL de forma orgânica...');
    await fillInputValue(inputEl, productUrl);
    // Pausa humanizada entre a digitação e o clique (evita heurísticas anti-bot)
    await humanSleep(900, 1600);

    // Aguarda botão "Obter link" ficar habilitado
    let submitBtn = null;
    const startBtnWait = Date.now();
    while (Date.now() - startBtnWait < 6000) {
      submitBtn = findSubmitBtn();
      if (submitBtn) {
        const isDisabled = submitBtn.disabled || submitBtn.getAttribute('disabled') !== null || submitBtn.classList.contains('ant-btn-loading');
        if (!isDisabled) break;
      }
      await humanSleep(180, 300);
    }

    if (submitBtn) {
      console.log('[Shopee In-Tab] Clicando de forma humanizada no botão Obter link...');
      submitBtn.scrollIntoView({ block: 'center', behavior: 'smooth' });
      await humanSleep(300, 600);
      simulateHumanClick(submitBtn);
    }
  }

  function clickCopyBtn(scope) {
    const root = scope || document;
    const btns = Array.from(root.querySelectorAll('button, div[role="button"], a[role="button"], span[role="button"]'));
    const copyBtn = btns.find(b => {
      const t = (b.innerText || b.textContent || '').trim().toLowerCase();
      return t === 'copiar link' || t === 'copiar' || t.includes('copiar link') || t === 'copy link' || t === 'copy';
    });
    if (copyBtn) {
      try {
        simulateHumanClick(copyBtn);
        console.log('[Shopee In-Tab] Botão Copiar link clicado no modal.');
      } catch (e) {}
    }
  }

  // 3. Aguarda a abertura do modal / popup com o link curto s.shopee.com.br (até 40s para cobrir captcha)
  const startWait = Date.now();
  let warnedCaptcha = false;
  while (Date.now() - startWait < 40000) {
    await humanSleep(250, 400);

    // Detecção de captcha / verificação de segurança na tela
    if (isCaptchaPresent()) {
      if (!warnedCaptcha) {
        warnedCaptcha = true;
        console.log('[Shopee In-Tab] 🛡️ Verificação de segurança (captcha) detectada. Aguardando resolução...');
      }
      continue; // Continua aguardando o usuário resolver ou a página validar
    }

    // A) Se o prompt foi interceptado, retorna instantaneamente sem nenhum clique manual!
    if (capturedPromptUrl) {
      console.log('[Shopee In-Tab] ✅ Link curto capturado diretamente da interceptação do prompt:', capturedPromptUrl);
      return { shortUrl: capturedPromptUrl };
    }

    const docAttr = document.documentElement ? document.documentElement.getAttribute('data-shopee-short-url') : null;
    const bodyAttr = document.body ? document.body.getAttribute('data-shopee-short-url') : null;
    if (docAttr || bodyAttr) {
      const found = docAttr || bodyAttr;
      console.log('[Shopee In-Tab] ✅ Link curto capturado do atributo data-shopee-short-url:', found);
      return { shortUrl: found };
    }

    const modalContainers = Array.from(document.querySelectorAll('.ant-modal, [role="dialog"], .shopee-modal, [class*="modal" i]'));
    const searchScopes = modalContainers.length > 0 ? modalContainers : [document.body];

    for (const scope of searchScopes) {
      if (!scope) continue;

      // Inputs e textareas do modal
      const inputs = scope.querySelectorAll('input, textarea');
      for (const inp of inputs) {
        const val = (inp.value || inp.getAttribute('value') || '').trim();
        const m = val.match(/https?:\/\/s\.shopee\.com\.br\/[a-zA-Z0-9_\-]+/i);
        if (m) {
          console.log('[Shopee In-Tab] ✅ Link curto s.shopee detectado em input:', m[0]);
          clickCopyBtn(scope);
          await humanSleep(300, 600);
          return { shortUrl: m[0] };
        }
      }

      // Nós de texto folha
      const elements = scope.querySelectorAll('a, span, p, div');
      for (const el of elements) {
        if (el.children.length > 2) continue;
        const text = (el.textContent || el.innerText || el.getAttribute('href') || '').trim();
        const m = text.match(/https?:\/\/s\.shopee\.com\.br\/[a-zA-Z0-9_\-]+/i);
        if (m) {
          console.log('[Shopee In-Tab] ✅ Link curto s.shopee detectado em texto:', m[0]);
          clickCopyBtn(scope);
          await humanSleep(300, 600);
          return { shortUrl: m[0] };
        }
      }

      // innerHTML completo do modal
      const htmlMatch = scope.innerHTML.match(/https?:\/\/s\.shopee\.com\.br\/[a-zA-Z0-9_\-]+/i);
      if (htmlMatch) {
        console.log('[Shopee In-Tab] ✅ Link curto s.shopee detectado no innerHTML:', htmlMatch[0]);
        clickCopyBtn(scope);
        await humanSleep(300, 600);
        return { shortUrl: htmlMatch[0] };
      }
    }

    // Leitura do clipboard se o botão de cópia foi disparado
    if (Date.now() - startWait > 800) {
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          const clip = await navigator.clipboard.readText();
          const cm = (clip || '').match(/https?:\/\/s\.shopee\.com\.br\/[a-zA-Z0-9_\-]+/i);
          if (cm) {
            console.log('[Shopee In-Tab] ✅ Link curto s.shopee obtido do clipboard:', cm[0]);
            return { shortUrl: cm[0] };
          }
        }
      } catch (e) {}
    }
  }

  // 4. Fallback GraphQL se o modal da interface não abriu a tempo
  try {
    console.log('[Shopee In-Tab] Tentando fallback GraphQL batchCustomLink...');
    const gqlResp = await fetch('/api/v3/gql?q=batchCustomLink', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        operationName: 'batchGetCustomLink',
        query: 'query batchGetCustomLink($linkParams: [CustomLinkParam!], $sourceCaller: SourceCaller) { batchCustomLink(linkParams: $linkParams, sourceCaller: $sourceCaller) { shortLink longLink failCode } }',
        variables: {
          linkParams: [{ originalLink: productUrl, subId1: 'whatsapp' }],
          sourceCaller: 'DEFAULT'
        }
      })
    });
    if (gqlResp.ok) {
      const data = await gqlResp.json();
      const short = data?.data?.batchCustomLink?.[0]?.shortLink;
      if (short && short.includes('s.shopee.com.br/')) {
        console.log('[Shopee In-Tab] ✅ Link curto s.shopee gerado via GraphQL:', short);
        return { shortUrl: short };
      }
    }
  } catch (e) {}

  return { error: 'link_not_found_in_portal' };
}

/**
 * Abre aba em https://affiliate.shopee.com.br/offer/custom_link, obtém o link curto e fecha a aba
 * conforme instruído pelo usuário
 */
async function generateShopeeShortLinkViaPortal(cleanProductUrl) {
  let tempTab = null;
  let keepTabOpen = false;
  try {
    console.log('[Afiliado Shopee] Abrindo portal Shopee para gerar link curto:', cleanProductUrl);
    tempTab = await chrome.tabs.create({ url: 'https://affiliate.shopee.com.br/offer/custom_link', active: true });
    const tabId = tempTab.id;
    if (tempTab.windowId) {
      try {
        await chrome.windows.update(tempTab.windowId, { focused: true });
      } catch (e) {}
    }
    try {
      await chrome.tabs.update(tabId, { active: true });
    } catch (e) {}
    await waitForTabCompletelyLoaded(tabId, 16000);
    // Aguarda montagem dos componentes React da página
    await new Promise(r => setTimeout(r, 2000));

    // Executa a automação no world: 'MAIN' para controle total do DOM e interceptação de window.prompt
    const execResults = await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: automateShopeeCustomLinkInTab,
      args: [cleanProductUrl]
    }).catch(err => {
      console.warn('[Afiliado Shopee] Erro ao injetar automação no portal:', err);
      return [];
    });

    const res = execResults?.[0]?.result;
    if (res && res.shortUrl && res.shortUrl.includes('s.shopee.com.br/')) {
      console.log('[Afiliado Shopee] ✅ Link curto s.shopee gerado com sucesso via portal:', res.shortUrl);
      return res.shortUrl;
    }

    if (res && res.error === 'login_required') {
      keepTabOpen = true;
      console.warn('[Afiliado Shopee] Usuário não está logado no portal da Shopee.');
      throw new Error('Você precisa fazer login no Portal de Afiliados da Shopee na aba que abrimos para gerar os links.');
    }

    if (res && res.error) {
      console.warn('[Afiliado Shopee] Erro retornado pelo portal:', res.error);
      throw new Error(`Falha no portal da Shopee: ${res.error}`);
    }
  } catch (err) {
    console.warn('[Afiliado Shopee] Exceção ao gerar via portal custom_link:', err);
    throw err;
  } finally {
    // "em seguida, fecha essa aba e vai para o whatsapp fazer o processo de disparo"
    if (tempTab && tempTab.id && !keepTabOpen) {
      await chrome.tabs.remove(tempTab.id).catch(() => {});
    }
  }

  return null;
}

/**
 * Gera o link oficial rastreável da Shopee via s.shopee.com.br
 * Executa SEMPRE a automação oficial no portal https://affiliate.shopee.com.br/offer/custom_link
 */
async function generateShopeeAffiliateLink(productData, shpTag) {
  const rawUrl = productData?.url || '';
  if (rawUrl.includes('s.shopee.com.br/')) return rawUrl;

  // Validação estrita: rejeita links institucionais
  if (rawUrl.includes('careers.') || rawUrl.includes('help.') || rawUrl.includes('/legal/')) {
    throw new Error('A oferta selecionada não é um produto válido da Shopee.');
  }

  // Extrai shopId e itemId reais do produto Shopee
  const m = rawUrl.match(/-i\.(\d+)\.(\d+)/) || rawUrl.match(/\/product\/(\d+)\/(\d+)/);
  const cleanProductUrl = m ? `https://shopee.com.br/product/${m[1]}/${m[2]}` : rawUrl.split('?')[0].split('#')[0];
  if (!cleanProductUrl || !cleanProductUrl.includes('shopee.com.br')) {
    throw new Error('Não foi possível identificar o código do produto na Shopee.');
  }

  // Método Oficial Shopee: automação via https://affiliate.shopee.com.br/offer/custom_link
  // Conforme descoberto e solicitado pelo usuário: abre portal, cola URL, clica Obter link, captura s.shopee, copia e fecha aba
  const targetUrlForPortal = (productData?.pageUrl && productData.pageUrl.includes('shopee.com.br')) ? productData.pageUrl : cleanProductUrl;
  const shortLink = await generateShopeeShortLinkViaPortal(targetUrlForPortal);
  if (shortLink && shortLink.includes('s.shopee.com.br/')) {
    return shortLink;
  }

  throw new Error('Não foi possível obter o link curto s.shopee.com.br pelo portal da Shopee.');
}

/**
 * Orquestra geração de link meli.la/sitestripe/s.shopee, IA Groq, foco no WhatsApp e disparo de texto com card de imagem
 */
async function handleSendOffer({ productData, affiliateLink, affiliateTag, groupName, messageText, copyStyle }) {
  if (!groupName) {
    throw new Error('Nenhum grupo de WhatsApp selecionado.');
  }

  let tag = affiliateTag;
  if (!tag) {
    const data = await chrome.storage.local.get(['ml_affiliate_tag']);
    tag = (data.ml_affiliate_tag || '').trim();
  }

  // 1. Limpa a URL base do produto
  const rawUrl = productData?.url || affiliateLink || '';
  const cleanBaseUrl = rawUrl.split('?')[0].split('#')[0];

  // 2. Tenta obter o link oficial de acordo com a plataforma (Amazon, Shopee, Mercado Livre)
  let finalLink = null;
  let isMeliLa = false;

  const isAmazon = productData?.platform === 'amazon' || cleanBaseUrl.includes('amazon.com.br') || cleanBaseUrl.includes('amzn.to');
  const isShopee = productData?.platform === 'shopee' || cleanBaseUrl.includes('shopee.com.br') || cleanBaseUrl.includes('s.shopee.com.br');

  let detectedPlatform = 'mercadolivre';
  if (isAmazon) {
    detectedPlatform = 'amazon';
  } else if (isShopee) {
    detectedPlatform = 'shopee';
  }

  // Validação em tempo real do plano e limite diário na nuvem Supabase
  if (typeof supabase !== 'undefined') {
    await supabase.initSession();
    const checkResult = await supabase.checkAndIncrementDispatch(detectedPlatform);
    if (!checkResult.success) {
      throw new Error(checkResult.message || 'Disparo bloqueado: limite diário atingido ou plano expirado.');
    }
  }

  if (isAmazon) {
    const amzData = await chrome.storage.local.get(['amazon_affiliate_tag']);
    const amzTag = (amzData.amazon_affiliate_tag || '').trim() || '';
    finalLink = await generateAmazonShortLink(productData, amzTag);
  } else if (isShopee) {
    if (cleanBaseUrl.includes('careers.') || cleanBaseUrl.includes('help.') || cleanBaseUrl.includes('/legal/')) {
      throw new Error('A oferta selecionada é uma página institucional da Shopee, não um produto.');
    }
    const shpData = await chrome.storage.local.get(['shopee_affiliate_tag']);
    const shpTag = (shpData.shopee_affiliate_tag || '').trim();
    finalLink = await generateShopeeAffiliateLink(productData, shpTag);
  } else {
    // Mercado Livre (padrão oficial com meli.la e matt_tool)
    if (tag && cleanBaseUrl) {
      const shortUrl = await generateMeliShortLink(cleanBaseUrl, tag);
      if (shortUrl) {
        finalLink = shortUrl;
        isMeliLa = true;
      }
    }

    // Fallback caso não seja possível encurtar via meli.la (sem duplicar parâmetros)
    if (!finalLink) {
      const sep = cleanBaseUrl.includes('?') ? '&' : '?';
      finalLink = `${cleanBaseUrl}${sep}matt_tool=${encodeURIComponent(tag)}&matt_word=${encodeURIComponent(tag)}&afiliado=${encodeURIComponent(tag)}`;
    }
  }

  // 3. Garante que temos a copy gerada por IA com o link oficial de afiliado
  let finalCopy = messageText;
  if (!finalCopy || !finalCopy.trim()) {
    console.log(`[Afiliado ML] Gerando copy com IA Groq (modelo: ${copyStyle || 'padrão'})...`);
    const aiResult = await handleGenerateAiCopy(productData, finalLink, copyStyle);
    finalCopy = aiResult.copy;
  } else {
    // Se o usuário passou texto customizado, sanitiza isolando o link para preview perfeito de imagem
    finalCopy = sanitizeCopyForWhatsApp(finalCopy, finalLink, copyStyle);
  }

  // 5. Localiza ou abre a aba do WhatsApp Web
  const tabs = await chrome.tabs.query({ url: '*://web.whatsapp.com/*' });
  let targetTab = null;

  if (tabs.length > 0) {
    targetTab = tabs[0];
  } else {
    targetTab = await chrome.tabs.create({
      url: 'https://web.whatsapp.com',
      active: true
    });
    await waitForTabCompletelyLoaded(targetTab.id, 25000);
    await new Promise(r => setTimeout(r, 4000));
  }

  // 6. Foca na janela e aba do WhatsApp Web
  if (targetTab.windowId) {
    try {
      await chrome.windows.update(targetTab.windowId, { focused: true });
    } catch (e) {}
  }
  await chrome.tabs.update(targetTab.id, { active: true });

  // 7. Garante que o content_wa.js mais recente esteja carregado e ativo na aba
  try {
    await chrome.scripting.executeScript({
      target: { tabId: targetTab.id },
      files: ['content_wa.js']
    });
    await new Promise(r => setTimeout(r, 350));
  } catch (injErr) {
    console.warn('[Afiliado ML] Pré-injeção de content_wa.js:', injErr);
  }

  // 8. Envia ordem para o content_wa.js disparar a mensagem com link preview nativo (foto puxada do link)
  const payload = {
    action: 'dispatch_to_group',
    productData,
    affiliateLink: finalLink,
    groupName,
    messageText: finalCopy
  };

  const dispatchResult = await sendMessageToTabWithRetry(targetTab.id, payload);

  // Registra no histórico do Dashboard em tempo real
  if (typeof supabase !== 'undefined' && dispatchResult && dispatchResult.success !== false) {
    let metaSuffix = '';
    try {
      const commRate = productData?.commissionRate || productData?.commission_rate || productData?.extractedCommissionRate;
      let commVal = productData?.commissionValue || productData?.commission_value;
      const cat = productData?.category || productData?.categoryName || productData?.niche;
      if (!commVal && commRate && (productData?.price || productData?.rawPrice)) {
        const rawP = productData?.rawPrice || parseFloat(String(productData?.price).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
        if (rawP > 0) commVal = Math.round((rawP * (commRate / 100)) * 100) / 100;
      }
      if (commRate || commVal || cat) {
        const metaObj = {};
        if (commRate) metaObj.rate = commRate;
        if (commVal) metaObj.value = commVal;
        if (cat) metaObj.cat = cat;
        metaSuffix = `\n<!--META:${JSON.stringify(metaObj)}-->`;
      }
    } catch (_) {}

    supabase.logDispatch({
      platform: detectedPlatform,
      title: productData?.title || 'Oferta',
      price: productData?.price || productData?.currentPrice,
      url: cleanBaseUrl,
      affiliateLink: finalLink,
      image: productData?.image || productData?.imageUrl,
      groupName,
      copyText: finalCopy + metaSuffix
    }).catch(err => console.log('[LogDispatch] erro:', err.message));
  }

  return {
    ...dispatchResult,
    isMeliLa,
    finalLink,
    finalCopy
  };

}

function sendMessageToTabWithRetry(tabId, payload) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, payload, (response) => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      if (response && response.error) {
        return reject(new Error(response.error));
      }
      resolve(response || { success: true });
    });
  });
}

// =============================================================================
// MOTOR DE DISPARO EM MASSA EM SEGUNDO PLANO (CHROME ALARMS + STORAGE)
// =============================================================================

const MASS_ALARM_NAME = 'ml_mass_dispatch_alarm';

/**
 * Ouvinte de alarmes para despertar o Service Worker e processar o próximo item da fila
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === MASS_ALARM_NAME) {
    console.log('[Afiliado ML] Alarme disparado: processando próximo item da fila em massa...');
    await processNextMassQueueItem();
  }
});

/**
 * Inicia a fila de disparo em massa com intervalos longos e aleatórios
 */
async function handleStartMassDispatch(params) {
  const { products, affiliateTag, copyStyle } = params;
  const groupName = params.groupName || params.targetGroup;
  const minIntervalMinutes = params.minIntervalMinutes || params.minInterval;
  const maxIntervalMinutes = params.maxIntervalMinutes || params.maxInterval;
  const randomInterval = params.randomInterval !== undefined ? params.randomInterval : (params.isRandom !== undefined ? params.isRandom : true);

  if (!Array.isArray(products) || products.length === 0) {
    throw new Error('Nenhum produto selecionado para o disparo em massa.');
  }
  const targetGroups = Array.isArray(params.targetGroups) && params.targetGroups.length > 0
    ? params.targetGroups
    : (groupName ? [groupName] : []);

  if (targetGroups.length === 0) {
    throw new Error('Selecione pelo menos um grupo de WhatsApp cadastrado para o disparo em massa.');
  }

  const minMin = Math.max(1, parseInt(minIntervalMinutes, 10) || 10);
  const maxMin = Math.max(minMin, parseInt(maxIntervalMinutes, 10) || 30);
  const isRandom = randomInterval !== false;

  const queue = {
    id: 'queue_' + Date.now(),
    status: 'running',
    targetGroups: targetGroups,
    targetGroup: targetGroups.join(', '),
    affiliateTag: affiliateTag || '',
    copyStyle: copyStyle || 'vantagens_gatilhos',
    minIntervalMinutes: minMin,
    maxIntervalMinutes: maxMin,
    randomInterval: isRandom,
    currentIndex: 0,
    totalItems: products.length,
    startedAt: Date.now(),
    nextDispatchTimestamp: null,
    items: products.map((prod, idx) => ({
      index: idx,
      product: prod,
      status: 'pending', // 'pending' | 'sending' | 'sent' | 'error'
      dispatchedAt: null,
      error: null
    }))
  };

  await chrome.storage.local.set({ ml_mass_queue: queue });
  await updateBadgeForQueue(queue);

  // Dispara o primeiro item imediatamente em segundo plano
  processNextMassQueueItem();

  return { success: true, total: products.length, queueId: queue.id };
}

/**
 * Pausa a fila de disparo em massa
 */
async function handlePauseMassDispatch() {
  const data = await chrome.storage.local.get(['ml_mass_queue']);
  const queue = data.ml_mass_queue;
  if (!queue || queue.status !== 'running') {
    return { success: false, message: 'Nenhuma fila ativa para pausar.' };
  }

  queue.status = 'paused';
  await chrome.alarms.clear(MASS_ALARM_NAME);
  await chrome.storage.local.set({ ml_mass_queue: queue });
  await updateBadgeForQueue(queue);

  return { success: true, status: 'paused' };
}

/**
 * Retoma a fila de disparo em massa
 */
async function handleResumeMassDispatch() {
  const data = await chrome.storage.local.get(['ml_mass_queue']);
  const queue = data.ml_mass_queue;
  if (!queue || queue.status !== 'paused') {
    return { success: false, message: 'Nenhuma fila pausada para retomar.' };
  }

  queue.status = 'running';
  await chrome.storage.local.set({ ml_mass_queue: queue });
  await updateBadgeForQueue(queue);

  // Continua o processamento do item pendente
  processNextMassQueueItem();

  return { success: true, status: 'running' };
}

/**
 * Cancela a fila de disparo em massa
 */
async function handleCancelMassDispatch() {
  await chrome.alarms.clear(MASS_ALARM_NAME);
  await chrome.storage.local.remove(['ml_mass_queue']);
  try {
    await chrome.action.setBadgeText({ text: '' });
  } catch (e) {}
  return { success: true, status: 'cancelled' };
}

/**
 * Obtém o estado atual da fila de disparo em massa
 */
async function handleGetMassQueueStatus() {
  const data = await chrome.storage.local.get(['ml_mass_queue']);
  return data.ml_mass_queue || null;
}

/**
 * Processa o próximo item pendente da fila de disparo em massa
 */
async function processNextMassQueueItem() {
  const data = await chrome.storage.local.get(['ml_mass_queue']);
  const queue = data.ml_mass_queue;

  if (!queue || queue.status !== 'running') {
    return;
  }

  const index = queue.currentIndex;
  if (index >= queue.items.length) {
    // Fila concluída com sucesso!
    queue.status = 'completed';
    queue.completedAt = Date.now();
    await chrome.alarms.clear(MASS_ALARM_NAME);
    await chrome.storage.local.set({ ml_mass_queue: queue });
    try {
      await chrome.action.setBadgeText({ text: '✓' });
      await chrome.action.setBadgeBackgroundColor({ color: '#25D366' });
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Disparo em Massa Concluído! 🚀',
        message: `Todos os ${queue.items.length} produtos foram enviados para "${queue.targetGroup}"!`
      });
    } catch(e) {}
    return;
  }

  const currentItem = queue.items[index];
  currentItem.status = 'sending';
  await chrome.storage.local.set({ ml_mass_queue: queue });
  await updateBadgeForQueue(queue);

  console.log(`[Afiliado ML] Disparando item ${index + 1}/${queue.items.length}: "${currentItem.product.title}"...`);

  try {
    const groupsToSend = (Array.isArray(queue.targetGroups) && queue.targetGroups.length > 0)
      ? queue.targetGroups
      : [queue.targetGroup];

    let lastRes = null;
    for (let g = 0; g < groupsToSend.length; g++) {
      const gName = groupsToSend[g];
      lastRes = await handleSendOffer({
        productData: currentItem.product,
        affiliateTag: queue.affiliateTag,
        groupName: gName,
        messageText: '', // Deixa vazio para a IA criar uma copy exclusiva com o modelo selecionado
        copyStyle: queue.copyStyle
      });
      if (g < groupsToSend.length - 1) {
        await new Promise(r => setTimeout(r, 3500));
      }
    }

    currentItem.status = 'sent';
    currentItem.dispatchedAt = Date.now();
    currentItem.finalLink = lastRes?.finalLink || '';
  } catch (err) {
    console.error(`[Afiliado ML] Erro ao disparar item ${index + 1}:`, err);
    currentItem.status = 'error';
    currentItem.error = err.message;
  }

  // Avança para o próximo item
  queue.currentIndex = index + 1;

  if (queue.currentIndex < queue.items.length) {
    // Calcula o próximo intervalo (em minutos)
    let nextMinutes = queue.minIntervalMinutes;
    if (queue.randomInterval && queue.maxIntervalMinutes > queue.minIntervalMinutes) {
      nextMinutes = queue.minIntervalMinutes + Math.random() * (queue.maxIntervalMinutes - queue.minIntervalMinutes);
    }
    nextMinutes = Math.round(nextMinutes * 10) / 10; // 1 casa decimal

    const intervalMs = Math.round(nextMinutes * 60 * 1000);
    queue.nextDispatchTimestamp = Date.now() + intervalMs;
    queue.nextIntervalMinutes = nextMinutes;

    await chrome.storage.local.set({ ml_mass_queue: queue });
    await updateBadgeForQueue(queue);

    // Agenda o alarme do Chrome para despertar no tempo exato
    chrome.alarms.create(MASS_ALARM_NAME, { when: queue.nextDispatchTimestamp });
    console.log(`[Afiliado ML] Próximo disparo em ${nextMinutes} minutos (${new Date(queue.nextDispatchTimestamp).toLocaleTimeString()}).`);
  } else {
    // Último item enviado!
    queue.status = 'completed';
    queue.completedAt = Date.now();
    await chrome.alarms.clear(MASS_ALARM_NAME);
    await chrome.storage.local.set({ ml_mass_queue: queue });
    try {
      await chrome.action.setBadgeText({ text: '✓' });
      await chrome.action.setBadgeBackgroundColor({ color: '#25D366' });
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Disparo em Massa Concluído! 🚀',
        message: `Todos os ${queue.items.length} produtos foram enviados para "${queue.targetGroup}"!`
      });
    } catch(e) {}
  }
}

async function updateBadgeForQueue(queue) {
  try {
    if (!queue || queue.status === 'completed' || queue.status === 'cancelled') {
      chrome.action.setBadgeText({ text: '' });
      return;
    }
    const txt = `${queue.currentIndex}/${queue.items.length}`;
    chrome.action.setBadgeText({ text: txt });
    chrome.action.setBadgeBackgroundColor({ color: queue.status === 'paused' ? '#FFA500' : '#2D3277' });
  } catch (e) {}
}

// =============================================================================
// GERENCIAMENTO E SINCRONIZAÇÃO DE CUPONS DE DESCONTO
// =============================================================================

// Gerenciamento de cupons desativado a pedido do usuário
async function handleGetCoupons() { return []; }
async function handleSaveCoupon() { return { success: true }; }
async function handleDeleteCoupon() { return { success: true }; }
async function handleToggleCoupon() { return { success: true }; }
async function handleRegisterDetectedCoupon() { return { success: true }; }
async function handleSyncMercadoLivreCoupons() { return { success: true, coupons: [] }; }

// =============================================================================
// GERENCIAMENTO DE OFERTAS FAVORITAS (TIMELINE POR DIA)
// =============================================================================

async function fetchProductImageFallback(url) {
  if (!url || !url.startsWith('http')) return '';
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    clearTimeout(timer);
    if (!resp.ok) return '';
    const html = await resp.text();
    const ogMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                    html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
    if (ogMatch && ogMatch[1] && ogMatch[1].startsWith('http')) {
      return ogMatch[1].trim();
    }
  } catch (e) {}
  return '';
}

async function handleGetFavorites() {
  try {
    const data = await chrome.storage.local.get(['ml_favorite_offers']);
    let list = Array.isArray(data.ml_favorite_offers) ? data.ml_favorite_offers : [];
    
    // Purga ofertas inválidas ou institucionais
    const cleanList = list.filter(item => {
      if (!item || !item.url) return false;
      if (item.url.includes('careers.shopee') || item.url.includes('help.shopee') || item.url.includes('/legal/')) return false;
      return true;
    });

    let updated = (cleanList.length !== list.length);
    list = cleanList;

    // Desduplicação inteligente
    if (typeof deduplicateFavoritesList === 'function') {
      const deduped = deduplicateFavoritesList(list);
      if (deduped.length !== list.length) {
        list = deduped;
        updated = true;
      }
    }

    for (const item of list) {
      let img = item.imageUrl || item.image || item.thumbnail || '';
      if (!img && item.url) {
        try {
          img = await fetchProductImageFallback(item.url);
        } catch (e) {}
      }
      if (img) {
        if (item.imageUrl !== img) { item.imageUrl = img; updated = true; }
        if (item.image !== img) { item.image = img; updated = true; }
      }
    }

    if (updated) {
      await chrome.storage.local.set({ ml_favorite_offers: list });
      if (typeof supabase !== 'undefined' && supabase.session) {
        try {
          await supabase.updateProfile({ favorite_offers: list });
        } catch (e) {}
      }
    }
    return list;
  } catch (e) {
    return [];
  }
}

async function handleToggleFavorite(product) {
  if (!product || !product.url) {
    throw new Error('Dados do produto insuficientes para favoritar.');
  }

  if (product.url.includes('careers.shopee') || product.url.includes('help.shopee') || product.url.includes('/legal/')) {
    throw new Error('Páginas institucionais não podem ser favoritadas.');
  }

  const favorites = await handleGetFavorites();
  const targetKey = (typeof getCanonicalProductKey === 'function')
    ? getCanonicalProductKey(product)
    : product.url.split('?')[0].split('#')[0];

  const existingIndex = favorites.findIndex(f => {
    if (!f) return false;
    const fKey = (typeof getCanonicalProductKey === 'function')
      ? getCanonicalProductKey(f)
      : (f.url ? f.url.split('?')[0].split('#')[0] : '');
    return fKey === targetKey;
  });

  let isFavorite = false;

  if (existingIndex >= 0) {
    favorites.splice(existingIndex, 1);
    isFavorite = false;
  } else {
    const now = Date.now();
    let resolvedImage = product.imageUrl || product.image || product.thumbnail || '';
    if (!resolvedImage && product.url) {
      try {
        resolvedImage = await fetchProductImageFallback(product.url);
      } catch (e) {}
    }

    let commVal = product.commissionValue || 0;
    let commRate = product.commissionRate || product.extractedCommissionRate || 0;
    let commPrice = product.commissionPrice || '';
    let commPercent = product.commissionPercent || (commRate ? `${commRate}%` : '');
    const numPrice = typeof product.rawPrice === 'number' && product.rawPrice > 0 ? product.rawPrice : 0;
    if ((!commVal || commVal <= 0) && numPrice > 0 && commRate > 0) {
      commVal = Math.round((numPrice * (commRate / 100)) * 100) / 100;
      commPrice = `R$ ${commVal.toFixed(2).replace('.', ',')}`;
    }

    const favItem = {
      id: `fav_${now}_${Math.random().toString(36).substr(2, 6)}`,
      url: product.url,
      title: product.title || 'Oferta sem título',
      price: product.price || '',
      rawPrice: numPrice,
      originalPrice: product.originalPrice || '',
      discount: product.discount || '',
      rating: product.rating || '',
      reviewsCount: product.reviewsCount || '',
      sales: product.sales || '',
      image: resolvedImage,
      imageUrl: resolvedImage,
      commissionValue: commVal,
      commissionPrice: commPrice,
      commissionRate: commRate,
      commissionPercent: commPercent,
      categoryName: product.categoryName || '',
      categoryIcon: product.categoryIcon || '🏷️',
      savedAt: now
    };
    favorites.unshift(favItem);
    isFavorite = true;
  }

  await chrome.storage.local.set({ ml_favorite_offers: favorites });

  // Sincroniza imediatamente com a nuvem Supabase com sessão garantida
  if (typeof supabase !== 'undefined') {
    try {
      await supabase.ensureSession();
      await supabase.updateProfile({ favorite_offers: favorites });
    } catch (e) {
      console.warn('[Supabase] Erro ao sincronizar favoritos na nuvem:', e);
    }
  }

  return { success: true, isFavorite, count: favorites.length, favorites };
}

async function handleDeleteFavorite(idOrUrl) {
  if (!idOrUrl) throw new Error('Identificador da oferta não informado.');
  const favorites = await handleGetFavorites();
  const cleanTarget = String(idOrUrl).split('?')[0].split('#')[0];
  const targetKey = (typeof getCanonicalProductKey === 'function')
    ? getCanonicalProductKey({ url: idOrUrl, id: idOrUrl })
    : cleanTarget;

  const filtered = favorites.filter(f => {
    if (!f) return false;
    if (f.id === idOrUrl) return false;
    const fUrl = f.url ? f.url.split('?')[0].split('#')[0] : '';
    if (fUrl === cleanTarget) return false;
    if (typeof getCanonicalProductKey === 'function') {
      const fKey = getCanonicalProductKey(f);
      if (fKey && fKey === targetKey) return false;
    }
    return true;
  });
  await chrome.storage.local.set({ ml_favorite_offers: filtered });

  if (typeof supabase !== 'undefined') {
    try {
      await supabase.ensureSession();
      await supabase.updateProfile({ favorite_offers: filtered });
    } catch (e) {
      console.warn('[Supabase] Erro ao sincronizar remoção na nuvem:', e);
    }
  }

  return { success: true, count: filtered.length, favorites: filtered };
}

async function handleClearFavorites() {
  await chrome.storage.local.set({ ml_favorite_offers: [] });

  if (typeof supabase !== 'undefined') {
    try {
      await supabase.ensureSession();
      await supabase.updateProfile({ favorite_offers: [] });
    } catch (e) {
      console.warn('[Supabase] Erro ao limpar favoritos na nuvem:', e);
    }
  }

  return { success: true, count: 0, favorites: [] };
}

