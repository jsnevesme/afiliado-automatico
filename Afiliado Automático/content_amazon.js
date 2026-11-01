/**
 * =============================================================================
 * AFILIADO AUTOMÁTICO - CONTENT SCRIPT: AMAZON BRASIL
 * =============================================================================
 * Executado nas páginas da Amazon Brasil (amazon.com.br).
 * 1. Extração estruturada de ofertas (PDP e catálogo/busca).
 * 2. Botão flutuante "⚡ Disparar no WhatsApp" em páginas de produto.
 * 3. Botões rápidos nos cards de busca.
 * 4. Suporte a tags de associado Amazon e geração de links de afiliado.
 */

(function () {
  'use strict';

  console.log('[Afiliado Automático] Content script da Amazon carregando/atualizando em:', window.location.href);

  // Remove elementos visuais anteriores para garantir renderização limpa
  const lingeringAmzBtn = document.getElementById('amz-afiliado-floating-btn');
  if (lingeringAmzBtn) lingeringAmzBtn.remove();
  const lingeringAmzModal = document.getElementById('amz-afiliado-modal-overlay');
  if (lingeringAmzModal) lingeringAmzModal.remove();

  // Remove listener anterior se houver (para evitar duplicação ou contexto invalidado após reload)
  if (window.__AMAZON_AFILIADO_MSG_LISTENER__) {
    try {
      chrome.runtime.onMessage.removeListener(window.__AMAZON_AFILIADO_MSG_LISTENER__);
    } catch (e) {}
  }

  // =========================================================================
  // OUVINTE DE MENSAGENS DO POPUP E BACKGROUND
  // =========================================================================

  window.__AMAZON_AFILIADO_MSG_LISTENER__ = (message, sender, sendResponse) => {
    // 1. Obtém dados do produto da página ativa
    if (message.action === 'get_current_page_product') {
      try {
        const product = extractCurrentPageProduct();
        sendResponse({ success: !!product, product });
      } catch (err) {
        console.error('[Afiliado Automático] Erro ao extrair produto Amazon:', err);
        sendResponse({ success: false, error: err.message });
      }
      return true;
    }

    // 2. Extrai produtos da página de busca atual
    if (message.action === 'get_search_page_products') {
      try {
        const products = extractSearchPageProducts();
        sendResponse({ success: products.length > 0, products });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
      return true;
    }

    // 3. Gera link oficial amzn.to usando a Barra de Afiliados (SiteStripe) logada
    if (message.action === 'generate_amazon_sitestripe_internal') {
      generateAmazonSiteStripeLink(message.asin, message.tag)
        .then(shortUrl => sendResponse({ success: true, shortUrl }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;
    }
  };

  chrome.runtime.onMessage.addListener(window.__AMAZON_AFILIADO_MSG_LISTENER__);

  // =========================================================================
  // EXTRAÇÃO DE PRODUTO DA PÁGINA ATUAL (PDP AMAZON)
  // =========================================================================

  function isGarbageAmazonTitle(str) {
    if (!str || typeof str !== 'string') return true;
    const s = str.trim();
    if (s.length < 3) return true;
    // Normalização sem acentos para pegar variações (histórico, historico, conversas, rufus, chat)
    const norm = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const junkWords = [
      'historico de conversas',
      'historico',
      'conversa',
      'conversas',
      'rufus',
      'chat',
      'historico de navegacao',
      'carrinho de compras',
      'carrinho',
      'sua conta',
      'compre novamente',
      'fale conosco',
      'atendimento ao cliente',
      'resultados de busca',
      'resultados para',
      'mais vendidos',
      'ofertas do dia',
      'amazon.com.br',
      'selecione o endereco',
      'enviar para',
      'ola, faca seu login',
      'devolucoes e pedidos'
    ];
    return junkWords.some(p => norm.includes(p));
  }

  function extractCurrentPageProduct() {
    const asin = getAsinFromUrl(window.location.href) || getAsinFromDom();
    if (!asin && !document.querySelector('#productTitle, #titleSection, #centerCol, #dp-container')) {
      return null;
    }

    // 1. Título: Prioridade absoluta e exclusiva para seletores oficiais do título do produto da Amazon (#productTitle)
    let title = '';
    const titleCandidates = [
      '#productTitle',
      'span#productTitle',
      '#title #productTitle',
      '#centerCol #productTitle',
      '#ppd #productTitle'
    ];

    for (const sel of titleCandidates) {
      const el = document.querySelector(sel);
      if (el) {
        const text = el.textContent.trim().replace(/\s+/g, ' ');
        if (text && !isGarbageAmazonTitle(text)) {
          title = text;
          break;
        }
      }
    }

    // Fallback 1: meta og:title (sempre limpo na Amazon)
    if (!title || isGarbageAmazonTitle(title)) {
      const ogTitle = document.querySelector('meta[property="og:title"], meta[name="title"]');
      if (ogTitle && ogTitle.content) {
        let clean = ogTitle.content.split(/:\s*Amazon/i)[0].trim();
        clean = clean.split(' | ')[0].trim();
        if (clean && !isGarbageAmazonTitle(clean)) {
          title = clean;
        }
      }
    }

    // Fallback 2: document.title
    if (!title || isGarbageAmazonTitle(title)) {
      let docTitle = document.title || '';
      docTitle = docTitle.replace(/:\s*Amazon\.com\.br.*/i, '')
                         .replace(/:\s*Amazon\.com.*/i, '')
                         .replace(/\|\s*Amazon.*/i, '')
                         .trim();
      if (docTitle && !isGarbageAmazonTitle(docTitle)) {
        title = docTitle;
      }
    }

    // Fallback 3: alt da imagem principal
    if (!title || isGarbageAmazonTitle(title)) {
      const mainImg = document.querySelector('#landingImage, #imgBlkFront, #main-image');
      if (mainImg && mainImg.alt && !isGarbageAmazonTitle(mainImg.alt)) {
        title = mainImg.alt.trim();
      }
    }

    if (!title || isGarbageAmazonTitle(title) || title.length < 3) return null;

    // 2. Preços (Promocional e Riscado)
    let price = 'Consulte';
    let rawPrice = 0;
    let originalPrice = '';
    let rawOriginalPrice = 0;

    // Preço Atual / Promocional (Múltiplos seletores robustos da Amazon)
    const currentPriceSelectors = [
      '#corePriceDisplay_desktop_feature_div .priceToPay .a-offscreen',
      '.priceToPay .a-offscreen',
      '#corePrice_desktop .a-price .a-offscreen',
      '#apex_desktop .priceToPay .a-offscreen',
      '#apex_desktop .a-price .a-offscreen',
      '#corePrice_feature_div .a-price .a-offscreen',
      '#price_inside_buybox',
      '#tp_price_block_total_price_ww .a-offscreen',
      '#priceblock_ourprice',
      '#priceblock_dealprice',
      '#priceblock_saleprice',
      '.a-price .a-offscreen'
    ];

    for (const sel of currentPriceSelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent) {
        const parsed = parsePriceString(el.textContent);
        if (parsed.raw > 0) {
          price = parsed.formatted;
          rawPrice = parsed.raw;
          break;
        }
      }
    }

    // Fallback composto: .a-price-whole + .a-price-fraction
    if (rawPrice === 0) {
      const wholeEl = document.querySelector('#corePriceDisplay_desktop_feature_div .a-price-whole, .priceToPay .a-price-whole, #apex_desktop .a-price-whole, .a-price-whole');
      if (wholeEl) {
        const whole = wholeEl.textContent.replace(/[^\d]/g, '');
        const fracEl = wholeEl.parentElement?.querySelector('.a-price-fraction');
        const frac = fracEl ? fracEl.textContent.replace(/[^\d]/g, '') : '00';
        if (whole) {
          const num = parseFloat(`${whole}.${frac}`);
          if (num > 0) {
            rawPrice = num;
            price = `R$ ${num.toFixed(2).replace('.', ',')}`;
          }
        }
      }
    }

    // Preço Riscado / Original
    const origPriceSelectors = [
      '#corePriceDisplay_desktop_feature_div .basisPrice .a-offscreen',
      '.basisPrice .a-offscreen',
      '#corePriceDisplay_desktop_feature_div .a-text-price .a-offscreen',
      'span.a-text-price span.a-offscreen',
      'span[data-a-strike="true"] .a-offscreen',
      '#priceblock_ourprice_row .a-text-strike'
    ];

    for (const sel of origPriceSelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent) {
        const parsed = parsePriceString(el.textContent);
        if (parsed.raw > rawPrice && parsed.raw > 0) {
          originalPrice = parsed.formatted;
          rawOriginalPrice = parsed.raw;
          break;
        }
      }
    }

    // 3. Desconto
    let discount = '';
    let discountPercent = 0;
    const discEl = document.querySelector('.savingsPercentage, span.savingPriceOverride, .reinventPriceSavingsPercentageMargin');
    if (discEl) {
      const dm = discEl.textContent.match(/(\d+)\s*%/);
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

    // 4. Detecção de Mídia Robusta (Imagens e Vídeos Amazon)
    let imageUrl = '';
    let videoUrl = '';
    let hasVideo = false;

    // Detecta vídeo na página ou galeria
    const amzVideo = document.querySelector('#vse-video-container video, .vse-player video, video, #video-player-container video');
    if (amzVideo) {
      hasVideo = true;
      videoUrl = amzVideo.src || amzVideo.querySelector('source')?.src || '';
    } else if (document.querySelector('#vse-video-container, .vse-player, #video-player-container, [id*="video"]')) {
      hasVideo = true;
    }

    const imgEl = document.querySelector('#landingImage, #imgBlkFront, #main-image');
    if (imgEl) {
      // Prioridade 1: data-old-hires
      const hires = imgEl.getAttribute('data-old-hires');
      if (hires && hires.startsWith('http')) {
        imageUrl = hires;
      }
      // Prioridade 2: data-a-dynamic-image (JSON com múltiplos tamanhos)
      if (!imageUrl) {
        const dyn = imgEl.getAttribute('data-a-dynamic-image');
        if (dyn) {
          try {
            const parsed = JSON.parse(dyn);
            const urls = Object.keys(parsed);
            if (urls.length > 0) {
              // Pega a imagem de maior resolução
              imageUrl = urls.reduce((max, u) => {
                const dim = parsed[u];
                const area = (dim[0] || 0) * (dim[1] || 0);
                return area > (max.area || 0) ? { url: u, area } : max;
              }, { url: urls[0], area: 0 }).url;
            }
          } catch (e) {}
        }
      }
      // Prioridade 3: src direto
      if (!imageUrl && imgEl.src && !imgEl.src.startsWith('data:')) {
        imageUrl = imgEl.src;
      }
    }

    // Prioridade 4: Miniaturas de galeria (quando o 1º item ativo é um vídeo!)
    if (!imageUrl) {
      const altImgs = Array.from(document.querySelectorAll('#altImages ul li img, #imageBlockThumbs img, .imageThumbnail img'));
      for (const aImg of altImgs) {
        const src = aImg.src || aImg.getAttribute('data-src') || '';
        if (src && src.startsWith('http') && !src.includes('play-icon') && !src.includes('video') && !src.endsWith('.mp4')) {
          // Converte miniatura da Amazon para tamanho original 1500px
          imageUrl = src.replace(/\._[A-Z0-9_,]+_\.jpg$/i, '._AC_SL1500_.jpg');
          break;
        }
      }
    }

    // Prioridade 5: OpenGraph
    if (!imageUrl) {
      const ogImg = document.querySelector('meta[property="og:image"]');
      if (ogImg && ogImg.content && ogImg.content.startsWith('http')) imageUrl = ogImg.content;
    }


    // 5. Avaliação e Reviews
    let rating = 0;
    let reviewsCount = '';
    const ratingEl = document.querySelector('#acrPopover [title], span.a-icon-alt, #averageCustomerReviews .a-icon-alt');
    if (ratingEl) {
      const rm = (ratingEl.title || ratingEl.textContent).replace(',', '.').match(/([345](?:\.\d+)?)/);
      if (rm) rating = parseFloat(rm[1]) || 0;
    }
    const reviewsEl = document.querySelector('#acrCustomerReviewText, span[data-hook="total-review-count"]');
    if (reviewsEl) {
      reviewsCount = reviewsEl.textContent.replace(/[()]/g, '').trim();
    }

    // 6. Destaque / Vendas
    let sales = '';
    let salesCount = 0;
    const salesEl = document.querySelector(
      '#social-proofing-faceout-title-text span, span.social-proofing-faceout-title-text, #zeitgeistBadge_feature_div .badge-text'
    );
    if (salesEl) {
      sales = salesEl.textContent.trim();
      const numM = sales.match(/(\+?\s*\d+(?:[.,]\d+)?\s*(?:mil)?)/i);
      if (numM) {
        if (/mil/i.test(numM[0])) {
          salesCount = parseFloat(numM[1].replace(',', '.')) * 1000;
        } else {
          salesCount = parseInt(numM[1].replace(/\D/g, ''), 10);
        }
      }
    }

    // 7. URL limpa e verificação de shortlink oficial SiteStripe (amzn.to)
    const cleanUrl = asin ? `https://www.amazon.com.br/dp/${asin}` : window.location.href.split('?')[0].split('#')[0];
    let affiliateShortLink = null;
    const stripeInput = document.querySelector('input[value*="amzn.to"], textarea[value*="amzn.to"], a[href*="amzn.to"]');
    if (stripeInput) {
      affiliateShortLink = stripeInput.value || stripeInput.href || null;
    }

    return {
      title,
      price,
      rawPrice,
      originalPrice,
      rawOriginalPrice,
      discount,
      discountPercent,
      imageUrl: imageUrl || '',
      hasVideo: !!hasVideo,
      videoUrl: videoUrl || '',
      url: cleanUrl,
      affiliateShortLink,
      asin,
      rating,
      reviewsCount: reviewsCount ? `(${reviewsCount})` : '',
      sales,
      salesCount,
      platform: 'amazon',
      platformName: 'Amazon',
      platformIcon: '🔷',
      platformBadge: 'Amazon'
    };
  }

  // =========================================================================
  // EXTRAÇÃO DE PRODUTOS DA PÁGINA DE BUSCA / OFERTAS DA AMAZON
  // =========================================================================

  function extractSearchPageProducts() {
    // Se a aba for uma PDP (página de produto individual), jamais extrai carrossel ou recomendações como busca
    if (document.querySelector('#productTitle, #centerCol #productTitle, #ppd #productTitle, #dp-container') ||
        window.location.href.includes('/dp/') ||
        window.location.href.includes('/gp/product/')) {
      return [];
    }

    const list = [];
    const seen = new Set();

    // 1. Cards conhecidos da Amazon
    let cards = Array.from(document.querySelectorAll(
      'div[data-component-type="s-search-result"], .s-result-item[data-asin], [data-asin]:not([data-asin=""]), .s-card-container, div.puis-card-container, .a-carousel-card'
    ));

    // 2. Descoberta complementar por links /dp/
    const productLinks = document.querySelectorAll('a[href*="/dp/"], a[href*="/gp/product/"]');
    const cardSet = new Set(cards);
    for (const a of productLinks) {
      if (a.closest('header, nav, #nav-main, footer, #amz-afiliado-floating-btn, #amz-afiliado-modal-overlay')) continue;
      const c = a.closest('.s-result-item, [data-asin], .puis-card-container, .s-card-container, div.sg-col-inner') || a.parentElement;
      if (c && !cardSet.has(c)) {
        cardSet.add(c);
        cards.push(c);
      }
    }

    for (const card of cards) {
      let asin = card.getAttribute('data-asin') || '';
      if (!asin || asin.length < 5) {
        const dp = card.querySelector('a[href*="/dp/"], a[href*="/gp/product/"]');
        if (dp && dp.href) {
          const mAsin = dp.href.match(/(?:\/dp\/|\/gp\/product\/|\/ASIN\/|\/d\/|\/aw\/d\/)([A-Z0-9]{10})/i);
          if (mAsin) asin = mAsin[1].toUpperCase();
        }
      }
      if (!asin || asin.length < 5) continue;

      const cleanUrl = `https://www.amazon.com.br/dp/${asin}`;
      if (seen.has(cleanUrl)) continue;

      // Título: Multi-estratégia robusta
      let title = '';
      const titleEl = card.querySelector(
        'h2 a span, h2 a, h2 span, h2, [data-cy="title-recipe"] h2, [data-cy="title-recipe"], span.a-size-medium, span.a-size-base-plus, [class*="title" i]'
      );
      if (titleEl && titleEl.textContent.trim().length > 3) {
        title = titleEl.textContent.trim();
      }
      if (!title) {
        const imgEl = card.querySelector('img[alt]');
        if (imgEl && imgEl.alt && imgEl.alt.trim().length > 3) {
          title = imgEl.alt.trim();
        }
      }
      if (!title) {
        const dp = card.querySelector('a[href*="/dp/"]');
        if (dp && dp.textContent.trim().length > 3) {
          title = dp.textContent.trim();
        }
      }
      title = title.replace(/^(?:escolha da amazon|mais vendido|patrocinado|novo)\s*/i, '').trim();
      if (!title || title.length < 3) continue;

      seen.add(cleanUrl);

      // Preço atual
      let price = 'Consulte';
      let rawPrice = 0;
      let originalPrice = '';
      let rawOriginalPrice = 0;

      const pCurrent = card.querySelector('.a-price:not(.a-text-price) .a-offscreen, .a-price .a-offscreen');
      if (pCurrent) {
        const parsed = parsePriceString(pCurrent.textContent);
        if (parsed.raw > 0) {
          price = parsed.formatted;
          rawPrice = parsed.raw;
        }
      }
      if (rawPrice === 0) {
        const wholeEl = card.querySelector('.a-price-whole');
        if (wholeEl) {
          const whole = wholeEl.textContent.replace(/[^\d]/g, '');
          const fracEl = wholeEl.parentElement?.querySelector('.a-price-fraction');
          const frac = fracEl ? fracEl.textContent.replace(/[^\d]/g, '') : '00';
          if (whole) {
            rawPrice = parseFloat(`${whole}.${frac}`) || 0;
            if (rawPrice > 0) price = `R$ ${rawPrice.toFixed(2).replace('.', ',')}`;
          }
        }
      }

      // Preço riscado
      const pOrig = card.querySelector('.a-text-price .a-offscreen, s .a-offscreen, span[data-a-strike="true"] .a-offscreen');
      if (pOrig) {
        const parsed = parsePriceString(pOrig.textContent);
        if (parsed.raw > rawPrice && parsed.raw > 0) {
          originalPrice = parsed.formatted;
          rawOriginalPrice = parsed.raw;
        }
      }

      // Desconto
      let discount = '';
      let discountPercent = 0;
      const discEl = card.querySelector('.a-letter-space + span, [class*="savingsPercentage"], [class*="discount"]');
      if (discEl) {
        const dm = discEl.textContent.match(/(\d+)\s*%/);
        if (dm) {
          discountPercent = parseInt(dm[1], 10);
          discount = `${discountPercent}% OFF`;
        }
      }
      if (!discount && rawOriginalPrice > rawPrice && rawPrice > 0) {
        discountPercent = Math.round(((rawOriginalPrice - rawPrice) / rawOriginalPrice) * 100);
        if (discountPercent > 0) discount = `${discountPercent}% OFF`;
      }

      // Imagem
      let imageUrl = '';
      const imgEl = card.querySelector('img.s-image, img');
      if (imgEl) {
        const candidates = [
          imgEl.getAttribute('data-src'),
          imgEl.src
        ];
        imageUrl = candidates.find(u => u && typeof u === 'string' && u.startsWith('http') && !u.startsWith('data:')) || '';
        if (!imageUrl && imgEl.srcset) {
          const parts = imgEl.srcset.split(',').map(p => p.trim().split(' ')[0]);
          imageUrl = parts.find(u => u && u.startsWith('http') && !u.startsWith('data:')) || '';
        }
      }

      // Rating & Reviews
      let rating = 0;
      let reviewsCount = '';
      const rEl = card.querySelector('span.a-icon-alt, i.a-icon-star-small span');
      if (rEl) {
        const rm = rEl.textContent.replace(',', '.').match(/([345](?:\.\d+)?)/);
        if (rm) rating = parseFloat(rm[1]) || 0;
      }
      const revEl = card.querySelector('span.s-underline-text, [aria-label*="avaliações"]');
      if (revEl) {
        reviewsCount = revEl.textContent.replace(/[()]/g, '').trim();
      }

      // Destaque / Vendas
      let sales = '';
      let salesCount = 0;
      const salesEl = card.querySelector('.a-color-secondary, .puis-social-proofing, [class*="social-proofing"]');
      if (salesEl) {
        const txt = salesEl.textContent.trim();
        if (/compras|vendido/i.test(txt)) {
          sales = txt;
          const numM = sales.match(/(\+?\s*\d+(?:[.,]\d+)?\s*(?:mil)?)/i);
          if (numM) {
            salesCount = /mil/i.test(numM[0]) ? parseFloat(numM[1].replace(',', '.')) * 1000 : parseInt(numM[1].replace(/\D/g, ''), 10);
          }
        }
      }

      list.push({
        title,
        price,
        rawPrice,
        originalPrice,
        rawOriginalPrice,
        discount,
        discountPercent,
        imageUrl,
        url: cleanUrl,
        asin,
        rating,
        reviewsCount: reviewsCount ? `(${reviewsCount})` : '',
        sales,
        salesCount,
        platform: 'amazon',
        platformName: 'Amazon',
        platformIcon: '🔷',
        platformBadge: 'Amazon'
      });
    }

    return list;
  }

  // =========================================================================
  // BOTÃO FLUTUANTE E MODAL IN-PAGE NA AMAZON
  // =========================================================================

  function initAmazonInPageUI() {
    checkAndInjectAmazonUI();
    injectSearchCardButtons();

    // Monitora carregamento dinâmico
    window.addEventListener('scroll', debounce(injectSearchCardButtons, 400), { passive: true });
    setInterval(checkAndInjectAmazonUI, 1500);
  }

  function checkAndInjectAmazonUI() {
    const isPDP = !!(getAsinFromUrl(window.location.href) || getAsinFromDom());
    if (isPDP && !document.getElementById('amz-afiliado-floating-btn')) {
      const product = extractCurrentPageProduct();
      if (product) {
        createFloatingProductButton(product);
      }
    }
  }

  function createFloatingProductButton(product) {
    if (document.getElementById('amz-afiliado-floating-btn')) return;

    const btn = document.createElement('div');
    btn.id = 'amz-afiliado-floating-btn';
    const commVal = product.rawPrice ? (product.rawPrice * 0.09) : 0;
    const commFormatted = commVal > 0 ? `R$ ${commVal.toFixed(2).replace('.', ',')}` : 'R$ 0,00';

    btn.innerHTML = `
      <div class="ml-float-content">
        <svg viewBox="0 0 24 24" class="ml-float-wa-icon">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z"/>
        </svg>
        <div class="ml-float-text-box">
          <span class="ml-float-main-text">⚡ Disparar Oferta WhatsApp</span>
          <span class="ml-float-comm-pill">💰 Ganho: <b>${commFormatted}</b> (9% • Amazon)</span>
        </div>
      </div>
    `;

    btn.addEventListener('click', () => {
      const fresh = extractCurrentPageProduct() || product;
      openQuickDispatchModal(fresh);
    });

    document.body.appendChild(btn);
  }

  function injectSearchCardButtons() {
    const cards = document.querySelectorAll('div[data-component-type="s-search-result"], .s-result-item[data-asin]');
    for (const card of cards) {
      if (card.querySelector('.amz-card-quick-dispatch')) continue;
      const asin = card.getAttribute('data-asin');
      if (!asin || asin.length < 5) continue;

      const targetBox = card.querySelector('.a-section.a-spacing-small, .s-product-image-container') || card;
      const quickBtn = document.createElement('button');
      quickBtn.type = 'button';
      quickBtn.className = 'amz-card-quick-dispatch';
      quickBtn.innerHTML = `⚡ Disparar`;
      quickBtn.title = 'Disparar oferta no WhatsApp';

      quickBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const prodData = extractSingleCardProduct(card, asin);
        if (prodData) {
          openQuickDispatchModal(prodData);
        }
      });

      card.style.position = 'relative';
      const container = document.createElement('div');
      container.className = 'amz-card-actions-wrapper';
      container.appendChild(quickBtn);
      targetBox.appendChild(container);
    }
  }

  function extractSingleCardProduct(card, asin) {
    const titleEl = card.querySelector('h2 a span, h2 a, span.a-size-medium, span.a-size-base-plus');
    if (!titleEl) return null;
    const title = titleEl.textContent.trim();

    let price = 'Consulte';
    let rawPrice = 0;
    const pCurrent = card.querySelector('.a-price .a-offscreen');
    if (pCurrent) {
      const parsed = parsePriceString(pCurrent.textContent);
      if (parsed.raw > 0) {
        price = parsed.formatted;
        rawPrice = parsed.raw;
      }
    }

    let imageUrl = '';
    const imgEl = card.querySelector('img.s-image, img');
    if (imgEl && imgEl.src && !imgEl.src.startsWith('data:')) {
      imageUrl = imgEl.src;
    }

    return {
      title,
      price,
      rawPrice,
      url: `https://www.amazon.com.br/dp/${asin}`,
      asin,
      imageUrl,
      platform: 'amazon',
      platformName: 'Amazon',
      platformIcon: '🔷',
      platformBadge: 'Amazon',
      commissionRate: 9,
      commissionPrice: rawPrice ? `R$ ${(rawPrice * 0.09).toFixed(2).replace('.', ',')}` : 'R$ 0,00',
      commissionPercent: '9%'
    };
  }

  // =========================================================================
  // MODAL IN-PAGE PARA DISPARO RÁPIDO (DESIGN UNIFICADO PADRÃO MERCADO LIVRE)
  // =========================================================================

  async function openQuickDispatchModal(customProduct = null) {
    const existing = document.getElementById('amz-afiliado-modal-overlay');
    if (existing) existing.remove();

    const product = customProduct || extractCurrentPageProduct();
    if (!product) {
      alert('Não foi possível identificar as informações do produto.');
      return;
    }

    // 1. Sanitização e garantia absoluta contra qualquer título inválido ("Histórico de conversas", Rufus, gavetas)
    if (!product.title || isGarbageAmazonTitle(product.title)) {
      const og = document.querySelector('meta[property="og:title"], meta[name="title"]')?.content || '';
      const docT = document.title || '';
      const fallbackClean = (og || docT).split(/:\s*Amazon/i)[0].split(' | ')[0].trim();
      if (fallbackClean && !isGarbageAmazonTitle(fallbackClean)) {
        product.title = fallbackClean;
      } else {
        const elTitle = document.querySelector('#productTitle, span#productTitle');
        if (elTitle && elTitle.textContent && !isGarbageAmazonTitle(elTitle.textContent)) {
          product.title = elTitle.textContent.trim().replace(/\s+/g, ' ');
        } else {
          product.title = (docT.replace(/:\s*Amazon.*/i, '').trim()) || 'Produto Amazon';
        }
      }
    }

    // 2. Validação estrita do Plano Starter (Bloqueio prévio obrigatório de 30 dias)
    try {
      const authStore = await chrome.storage.local.get(['sb_profile', 'starter_platform', 'starter_platform_locked_until']);
      const prof = authStore.sb_profile || {};
      const isStarterOrTrial = prof.role !== 'superadmin' && (prof.plan === 'starter' || prof.plan === 'free_trial' || !prof.plan);
      const lockedUntilVal = authStore.starter_platform_locked_until || prof.starter_platform_locked_until || prof.platform_locked_until;
      const isLocked = isStarterOrTrial && Boolean(lockedUntilVal && new Date(lockedUntilVal) > new Date());
      const allowedPlat = (authStore.starter_platform || prof.allowed_platform || '').toLowerCase();

      if (isStarterOrTrial) {
        if (!isLocked) {
          alert(
            '🔒 Seleção de Plataforma Pendente (Plano Starter)\n\n' +
            'Você precisa primeiro escolher e travar sua plataforma de disparo por 30 dias no Painel de Configurações antes de buscar ou disparar ofertas.'
          );
          return;
        }
        if (allowedPlat && allowedPlat !== 'all' && allowedPlat !== 'amazon') {
          const names = { mercadolivre: 'Mercado Livre', shopee: 'Shopee', amazon: 'Amazon' };
          const curName = names[allowedPlat] || allowedPlat.toUpperCase();
          alert(
            `🔒 Plataforma Não Autorizada (Plano Starter)\n\n` +
            `Sua conta Starter está fixada exclusivamente para disparos no ${curName} durante este ciclo de 30 dias.\n\n` +
            `Para disparar ofertas na Amazon, faça upgrade para o Plano Pro no seu painel!`
          );
          return;
        }
      }
    } catch (e) {
      console.warn('Erro ao validar autorização do plano Starter na Amazon:', e);
    }

    let groups = [];
    let affiliateTag = '';
    let pinnedGroup = '';
    let isFavorited = false;

    try {
      const data = await chrome.storage.local.get([
        'ml_whatsapp_groups',
        'all_detected_whatsapp_groups',
        'saved_whatsapp_groups',
        'amazon_affiliate_tag',
        'ml_affiliate_tag',
        'ml_pinned_group',
        'pinned_whatsapp_group',
        'ml_favorite_offers'
      ]);

      groups = (Array.isArray(data.ml_whatsapp_groups) && data.ml_whatsapp_groups.length > 0)
        ? data.ml_whatsapp_groups
        : (Array.isArray(data.all_detected_whatsapp_groups) && data.all_detected_whatsapp_groups.length > 0
          ? data.all_detected_whatsapp_groups
          : (Array.isArray(data.saved_whatsapp_groups) && data.saved_whatsapp_groups.length > 0
            ? data.saved_whatsapp_groups
            : []));

      pinnedGroup = data.ml_pinned_group || data.pinned_whatsapp_group || '';
      affiliateTag = (data.amazon_affiliate_tag || '').trim();

      const favList = Array.isArray(data.ml_favorite_offers) ? data.ml_favorite_offers : [];
      const cleanUrl = (product.url || window.location.href).split('?')[0].split('#')[0];
      isFavorited = favList.some(f => f.url && f.url.split('?')[0].split('#')[0] === cleanUrl);
    } catch (e) {}

    // Fallback RPC com o background caso o storage local ainda esteja vazio
    if (groups.length === 0) {
      try {
        const bgRes = await chrome.runtime.sendMessage({ action: 'get_registered_groups' });
        if (bgRes && Array.isArray(bgRes.groups) && bgRes.groups.length > 0) {
          groups = bgRes.groups;
          pinnedGroup = bgRes.pinned || pinnedGroup;
        }
      } catch (e) {}
    }

    const overlay = document.createElement('div');
    overlay.id = 'amz-afiliado-modal-overlay';

    let selectOptions = '';
    if (groups.length === 0) {
      selectOptions = '<option value="">Nenhum grupo cadastrado (abra a extensão para cadastrar)</option>';
    } else {
      selectOptions = groups.map(g => {
        const isSelected = (pinnedGroup && g === pinnedGroup) || (!pinnedGroup && g === groups[0]);
        const isPinnedBadge = (pinnedGroup && g === pinnedGroup) ? ' 📌 (Padrão)' : '';
        return `<option value="${escapeHtml(g)}" ${isSelected ? 'selected' : ''}>${escapeHtml(g)}${isPinnedBadge}</option>`;
      }).join('');
    }

    const commVal = product.rawPrice ? (product.rawPrice * 0.09) : 0;
    const commFormatted = commVal > 0 ? `R$ ${commVal.toFixed(2).replace('.', ',')}` : (product.commissionPrice || 'R$ 0,00');
    const isInitiallyPinned = pinnedGroup && groups.includes(pinnedGroup);

    overlay.innerHTML = `
      <div class="ml-afiliado-modal-card">
        <div class="ml-modal-header">
          <div class="ml-modal-title-row">
            <span class="ml-modal-badge" style="background:#2563EB;color:#FFF;">⚡ AFILIADO AMAZON</span>
            <span class="ml-modal-title">Disparar Oferta</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <button id="amzModalFavBtn" class="ml-modal-pin-btn ${isFavorited ? 'active' : ''}" style="margin-right:4px;" title="Salvar / Remover dos Favoritos" type="button">
              <span id="amzModalFavIcon">${isFavorited ? '★' : '⭐'}</span> <span id="amzModalFavText">${isFavorited ? 'Favoritado' : 'Favoritar'}</span>
            </button>
            <button class="ml-modal-close" id="amzModalClose">&times;</button>
          </div>
        </div>

        <div class="ml-modal-product">
          <div style="position:relative;display:inline-block;flex-shrink:0;">
            <img src="${product.imageUrl || ''}" class="ml-modal-img" alt="Produto" onerror="this.style.display='none'">
          </div>
          <div class="ml-modal-info">
            <div class="ml-modal-p-title">${escapeHtml(product.title)}</div>
            <div class="ml-modal-p-price">
              ${product.originalPrice && product.originalPrice !== product.price ? `<span style="text-decoration:line-through;color:#94a3b8;font-size:12px;margin-right:6px;">${escapeHtml(product.originalPrice)}</span>` : ''}
              ${escapeHtml(product.price)}
              ${product.discount ? `<span class="ml-modal-p-disc">${escapeHtml(product.discount)}</span>` : ''}
            </div>
            <div class="ml-modal-p-comm-row">
              <span class="ml-modal-comm-badge">💰 Ganho: <b>${commFormatted}</b> (9% • Amazon)</span>
              <span class="ml-modal-cat-tag">Amazon Brasil</span>
            </div>
          </div>
        </div>

        <div class="ml-modal-field">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label style="margin-bottom: 0;">Selecione o Grupo do WhatsApp:</label>
            <button type="button" id="amzModalPinGroupBtn" class="ml-modal-pin-btn ${isInitiallyPinned ? 'active' : ''}" title="Fixar este grupo como padrão para não ter que selecionar toda hora">
              📌 <span id="amzModalPinGroupText">${isInitiallyPinned ? 'Grupo Padrão Fixado' : 'Fixar como padrão'}</span>
            </button>
          </div>
          <select id="amzModalGroupSelect" class="ml-modal-select" ${groups.length === 0 ? 'disabled' : ''}>
            ${selectOptions}
          </select>
        </div>

        <button id="amzModalSendBtn" class="ml-modal-btn-send" ${groups.length === 0 ? 'disabled' : ''}>
          <span>🚀 Disparar Agora no WhatsApp Web</span>
        </button>

        <div id="amzModalStatus" class="ml-modal-status"></div>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('amzModalClose').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    const sendBtn = document.getElementById('amzModalSendBtn');
    const statusDiv = document.getElementById('amzModalStatus');
    const select = document.getElementById('amzModalGroupSelect');
    const pinGroupBtn = document.getElementById('amzModalPinGroupBtn');
    const pinGroupText = document.getElementById('amzModalPinGroupText');

    if (pinGroupBtn) {
      pinGroupBtn.addEventListener('click', async () => {
        const currentGroup = select.value;
        if (!currentGroup) return;

        if (pinnedGroup === currentGroup) {
          pinnedGroup = '';
          await chrome.storage.local.set({ ml_pinned_group: '' });
          pinGroupBtn.classList.remove('active');
          pinGroupText.textContent = 'Fixar como padrão';
          statusDiv.textContent = 'Padrão removido.';
          statusDiv.className = 'ml-modal-status info';
        } else {
          pinnedGroup = currentGroup;
          await chrome.storage.local.set({ ml_pinned_group: currentGroup });
          pinGroupBtn.classList.add('active');
          pinGroupText.textContent = 'Grupo Padrão Fixado';
          statusDiv.textContent = `📌 Grupo "${currentGroup}" fixado como padrão!`;
          statusDiv.className = 'ml-modal-status success';
        }

        Array.from(select.options).forEach(opt => {
          const isPin = opt.value && opt.value === pinnedGroup;
          opt.textContent = opt.value + (isPin ? ' 📌 (Padrão)' : '');
        });
      });

      select.addEventListener('change', () => {
        const isNowPinned = pinnedGroup && select.value === pinnedGroup;
        if (isNowPinned) {
          pinGroupBtn.classList.add('active');
          pinGroupText.textContent = 'Grupo Padrão Fixado';
        } else {
          pinGroupBtn.classList.remove('active');
          pinGroupText.textContent = 'Fixar como padrão';
        }
      });
    }

    const favBtn = document.getElementById('amzModalFavBtn');
    const favIcon = document.getElementById('amzModalFavIcon');
    const favText = document.getElementById('amzModalFavText');

    if (favBtn) {
      favBtn.addEventListener('click', async () => {
        try {
          const resp = await chrome.runtime.sendMessage({
            action: 'toggle_favorite',
            product: {
              ...product,
              platform: 'amazon',
              commissionRate: 9
            }
          });
          if (resp && resp.success) {
            isFavorited = resp.isFavorite;
            if (isFavorited) {
              favBtn.classList.add('active');
              if (favIcon) favIcon.textContent = '★';
              if (favText) favText.textContent = 'Favoritado';
              statusDiv.textContent = '⭐ Oferta adicionada aos Favoritos com sucesso!';
              statusDiv.className = 'ml-modal-status success';
            } else {
              favBtn.classList.remove('active');
              if (favIcon) favIcon.textContent = '⭐';
              if (favText) favText.textContent = 'Favoritar';
              statusDiv.textContent = 'Oferta removida dos seus Favoritos.';
              statusDiv.className = 'ml-modal-status info';
            }
          }
        } catch (e) {
          console.warn('Erro ao favoritar oferta Amazon:', e);
        }
      });
    }

    sendBtn.addEventListener('click', async () => {
      const selectedGroup = select.value;
      if (!selectedGroup) {
        statusDiv.textContent = 'Cadastre ao menos um grupo no ícone da extensão no topo!';
        statusDiv.className = 'ml-modal-status error';
        return;
      }

      sendBtn.disabled = true;
      sendBtn.textContent = 'Enviando oferta para o WhatsApp...';
      statusDiv.textContent = 'Gerando link e copy com IA...';
      statusDiv.className = 'ml-modal-status info';

      try {
        try {
          const shortLink = await generateAmazonSiteStripeLink(product.asin, affiliateTag);
          if (shortLink && (shortLink.includes('link.amazon/') || shortLink.includes('amzn.to/') || shortLink.includes('a.co/'))) {
            product.affiliateShortLink = shortLink;
            product.url = shortLink;
          }
        } catch(e) {}

        const resp = await chrome.runtime.sendMessage({
          action: 'send_offer',
          productData: {
            ...product,
            platform: 'amazon',
            commissionRate: 9
          },
          affiliateTag: affiliateTag,
          groupName: selectedGroup,
          platform: 'amazon'
        });

        if (resp && resp.success) {
          sendBtn.textContent = '✅ Disparado com Sucesso!';
          sendBtn.style.backgroundColor = '#10B981';
          statusDiv.textContent = `Oferta enviada para "${selectedGroup}"!`;
          statusDiv.className = 'ml-modal-status success';
          setTimeout(() => overlay.remove(), 2500);
        } else {
          throw new Error(resp?.error || 'Falha ao disparar');
        }
      } catch (err) {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Tentar Novamente';
        statusDiv.textContent = `Erro: ${err.message}`;
        statusDiv.className = 'ml-modal-status error';
      }
    });
  }

  // =========================================================================
  // AUXILIARES
  // =========================================================================

  function getAsinFromUrl(url) {
    if (!url) return null;
    const m = url.match(/(?:\/dp\/|\/gp\/product\/|\/ASIN\/|\/d\/|\/aw\/d\/|^)([A-Z0-9]{10})/i);
    return m ? m[1].toUpperCase() : null;
  }

  function getAsinFromDom() {
    const el = document.querySelector('input#ASIN, input[name="ASIN"], #ASIN, [data-asin]');
    if (el) {
      const val = (el.value || el.getAttribute('data-asin') || '').trim();
      if (val && val.length === 10) return val.toUpperCase();
    }
    return null;
  }

  function parsePriceString(str) {
    if (!str) return { raw: 0, formatted: 'Consulte' };
    const m = str.match(/R\$\s*([\d\.]+)(?:,(\d{2}))?/) || str.match(/([\d\.]+),(\d{2})/);
    if (!m) return { raw: 0, formatted: str.trim() };
    const intPart = m[1].replace(/\./g, '');
    const decPart = m[2] || '00';
    const raw = parseFloat(`${intPart}.${decPart}`) || 0;
    const formatted = `R$ ${m[1]}${m[2] ? ',' + m[2] : ''}`;
    return { raw, formatted };
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function debounce(fn, delay) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // =========================================================================
  // ESTILOS IN-PAGE DA AMAZON
  // =========================================================================

  function injectAmazonStyles() {
    if (document.getElementById('amz-afiliado-styles')) return;
    const style = document.createElement('style');
    style.id = 'amz-afiliado-styles';
    style.textContent = `
      #amz-afiliado-floating-btn {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 2147483647;
        background: linear-gradient(135deg, #FF9900 0%, #E68A00 100%);
        color: #111827;
        padding: 9px 18px;
        border-radius: 50px;
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.22), 0 0 0 2px rgba(255, 153, 0, 0.4);
        cursor: pointer;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        font-weight: 700;
        font-size: 13px;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      #amz-afiliado-floating-btn:hover {
        transform: translateY(-2px) scale(1.02);
        box-shadow: 0 6px 22px rgba(0, 0, 0, 0.3);
      }
      .ml-float-content {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .ml-float-wa-icon {
        width: 22px;
        height: 22px;
        fill: #25D366;
        flex-shrink: 0;
      }
      .ml-float-text-box {
        display: flex;
        flex-direction: column;
        line-height: 1.25;
      }
      .ml-float-main-text {
        font-size: 13px;
        font-weight: 800;
        color: #111827;
      }
      .ml-float-comm-pill {
        font-size: 11px;
        font-weight: 700;
        color: #065F46;
      }

      .amz-card-actions-wrapper {
        position: absolute;
        bottom: 8px;
        right: 8px;
        z-index: 10;
      }
      .amz-card-quick-dispatch {
        background: #25D366;
        color: #FFF;
        border: none;
        padding: 4px 9px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0,0,0,0.18);
        transition: transform 0.15s ease, background 0.15s ease;
      }
      .amz-card-quick-dispatch:hover {
        transform: scale(1.05);
        background: #20BD5A;
      }

      #amz-afiliado-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(4px);
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .ml-afiliado-modal-card {
        background: #FFFFFF;
        width: 90%;
        max-width: 440px;
        border-radius: 14px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        padding: 20px;
        position: relative;
        animation: mlModalFadeIn 0.2s ease-out;
      }
      @keyframes mlModalFadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
      .ml-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 14px;
      }
      .ml-modal-title-row {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .ml-modal-badge {
        background: #2563EB;
        color: #FFFFFF;
        font-size: 10px;
        font-weight: 800;
        padding: 2px 7px;
        border-radius: 4px;
      }
      .ml-modal-title {
        font-size: 15px;
        font-weight: 700;
        color: #1D2640;
      }
      .ml-modal-close {
        background: none;
        border: none;
        font-size: 24px;
        line-height: 1;
        cursor: pointer;
        color: #64748B;
      }
      .ml-modal-pin-btn {
        background: #F1F5F9;
        border: 1px solid #CBD5E1;
        color: #475569;
        font-size: 11px;
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .ml-modal-pin-btn:hover { background: #E2E8F0; }
      .ml-modal-pin-btn.active {
        background: #FEF3C7;
        border-color: #F59E0B;
        color: #B45309;
      }
      .ml-modal-product {
        display: flex;
        gap: 12px;
        background: #F8FAFC;
        padding: 12px;
        border-radius: 8px;
        border: 1px solid #E2E8F0;
        margin-bottom: 14px;
      }
      .ml-modal-img {
        width: 54px;
        height: 54px;
        object-fit: contain;
        border-radius: 6px;
        background: #FFF;
      }
      .ml-modal-info {
        flex: 1;
        min-width: 0;
      }
      .ml-modal-p-title {
        font-size: 12px;
        font-weight: 600;
        color: #1E293B;
        line-height: 1.3;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .ml-modal-p-price {
        font-size: 14px;
        font-weight: 800;
        color: #0F172A;
        margin-top: 4px;
      }
      .ml-modal-p-disc {
        color: #00A650;
        font-size: 11px;
        font-weight: 800;
        background: #DCFCE7;
        padding: 1px 5px;
        border-radius: 4px;
        margin-left: 6px;
      }
      .ml-modal-p-comm-row {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 5px;
        flex-wrap: wrap;
      }
      .ml-modal-comm-badge {
        font-size: 11px;
        color: #047857;
        background: #D1FAE5;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 700;
      }
      .ml-modal-cat-tag {
        font-size: 10px;
        color: #64748B;
        background: #E2E8F0;
        padding: 2px 5px;
        border-radius: 4px;
      }
      .ml-modal-field {
        margin-bottom: 14px;
      }
      .ml-modal-field label {
        display: block;
        font-size: 12px;
        font-weight: 700;
        color: #334155;
        margin-bottom: 6px;
      }
      .ml-modal-select {
        width: 100%;
        padding: 9px 12px;
        border: 1px solid #CBD5E1;
        border-radius: 8px;
        font-size: 13px;
        color: #1E293B;
        background: #FFF;
        outline: none;
      }
      .ml-modal-select:focus {
        border-color: #2563EB;
        box-shadow: 0 0 0 2px rgba(37,99,235,0.15);
      }
      .ml-modal-btn-send {
        width: 100%;
        background: #25D366;
        color: #FFF;
        border: none;
        padding: 12px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 800;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        transition: background 0.15s ease;
      }
      .ml-modal-btn-send:hover { background: #20BD5A; }
      .ml-modal-btn-send:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .ml-modal-status {
        margin-top: 10px;
        font-size: 12px;
        font-weight: 600;
        text-align: center;
        min-height: 18px;
      }
      .ml-modal-status.info { color: #2563EB; }
      .ml-modal-status.success { color: #059669; }
      .ml-modal-status.error { color: #DC2626; }
    `;
    document.head.appendChild(style);
  }

  // =========================================================================
  // GERAÇÃO OFICIAL DE LINK amzn.to VIA BARRA DE AFILIADOS (SITESTRIPE)
  // =========================================================================

  // =========================================================================
  // GERAÇÃO OFICIAL DE LINK amzn.to / link.amazon VIA BARRA DE AFILIADOS (SITESTRIPE)
  // =========================================================================

  function injectMainWorldClipboardInterceptor() {
    // Content script escuta diretamente eventos no DOM sem injetar script inline sujeito a CSP
  }

  async function generateAmazonSiteStripeLink(asin, tag) {
    console.log('[Afiliado Automático] Iniciando captura do shortlink oficial via SiteStripe...');
    injectMainWorldClipboardInterceptor();

    // 0. Listener de captura imediata no evento customizado e no evento 'copy'
    let interceptedCopyLink = null;
    
    // Verifica se o interceptor do MAIN WORLD já capturou algo recentemente
    const preAttr = document.documentElement.getAttribute('data-amz-last-shortlink');
    if (preAttr && /https?:\/\/(?:amzn\.to|link\.amazon|a\.co)\/[a-zA-Z0-9_\-]+/i.test(preAttr)) {
      interceptedCopyLink = preAttr;
    }

    const customEventListener = (e) => {
      if (e.detail && /https?:\/\/(?:amzn\.to|link\.amazon|a\.co)\/[a-zA-Z0-9_\-]+/i.test(e.detail)) {
        interceptedCopyLink = e.detail;
        console.log('[Afiliado Automático] ✅ Shortlink interceptado via MAIN WORLD hook:', interceptedCopyLink);
      }
    };
    window.addEventListener('AMZ_LINK_COPIED_EVENT', customEventListener);

    const copyInterceptor = (e) => {
      try {
        const text = e.clipboardData ? e.clipboardData.getData('text/plain') : null;
        if (text && /https?:\/\/(?:amzn\.to|link\.amazon|a\.co)\/[a-zA-Z0-9_\-]+/i.test(text)) {
          interceptedCopyLink = text.match(/https?:\/\/(?:amzn\.to|link\.amazon|a\.co)\/[a-zA-Z0-9_\-]+/i)[0];
          console.log('[Afiliado Automático] Link curto oficial interceptado via evento copy:', interceptedCopyLink);
        }
      } catch (err) {}
    };
    document.addEventListener('copy', copyInterceptor, true);

    function cleanup() {
      window.removeEventListener('AMZ_LINK_COPIED_EVENT', customEventListener);
      document.removeEventListener('copy', copyInterceptor, true);
    }

    // Normaliza URL se contiver parâmetros pesados de ref que travam o encurtador da Amazon
    const currentAsin = asin || getAsinFromUrl(window.location.href) || getAsinFromDom();
    if (currentAsin && (window.location.pathname.includes('/ref=') || window.location.search.length > 0)) {
      try {
        window.history.replaceState({}, '', `/dp/${currentAsin}`);
      } catch (e) {}
    }

    const stored = await chrome.storage.local.get(['amazon_affiliate_tag']);
    const activeTag = (tag || stored.amazon_affiliate_tag || '').trim();

    try {
      // 1. Tenta primariamente endpoint oficial SiteStripe no contexto da própria página (first-party com cookies)
      if (currentAsin) {
        try {
          const marketplaceId = 'A2Q3Y263D00KWC';
          const linkCode = 'll1';
          const storeCandidates = [activeTag];
          if (activeTag.includes('-20')) {
            const bName = activeTag.split('-')[0].replace(/\d+$/, '');
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
                tag: activeTag,
                asin: currentAsin,
                adUnitSubType: 'ShortLinks',
                linkCode: linkCode,
                createTime: Date.now()
              };
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
              const lUrl = `https://www.amazon.com.br/dp/${currentAsin}?linkCode=${linkCode}&tag=${encodeURIComponent(activeTag)}&linkId=${lId}&ref_=ss_li`;
              const qParams = new URLSearchParams({ longUrl: lUrl, marketplaceId, storeId: sId });
              const res = await fetch(`/associates/sitestripe/getShortUrl?${qParams.toString()}`, {
                credentials: 'include',
                headers: { 'Accept': 'application/json, text/javascript, */*; q=0.01' }
              });
              if (res.ok) {
                const d = await res.json();
                if (d && d.isOk && d.shortUrl) {
                  cleanup();
                  return d.shortUrl;
                }
              }
            } catch (e) {}
          }
        } catch (e) {}
      }

      // 2. Procura se shortlink já existe no DOM atualmente
      const quickMatch = scanDomForAmazonShortLink();
      if (quickMatch) {
        cleanup();
        return quickMatch;
      }

      // 3. Verifica se o modal "Compartilhar links de afiliados" já está aberto na tela
      let modal = findSiteStripeModal();

      // 4. Se o modal não estiver aberto, localiza e clica no botão "Obter link" na barra do SiteStripe
      if (!modal) {
        const getLinkBtn = findSiteStripeGetLinkButton();
        if (getLinkBtn) {
          console.log('[Afiliado Automático] Clicando no botão "Obter link" do SiteStripe...', getLinkBtn);
          const evtOpts = { bubbles: true, cancelable: true, view: window };
          getLinkBtn.dispatchEvent(new PointerEvent('pointerdown', evtOpts));
          getLinkBtn.dispatchEvent(new MouseEvent('mousedown', evtOpts));
          getLinkBtn.dispatchEvent(new PointerEvent('pointerup', evtOpts));
          getLinkBtn.dispatchEvent(new MouseEvent('mouseup', evtOpts));
          getLinkBtn.click();

          // Aguarda abertura do modal por até 3 segundos
          const startModalWait = Date.now();
          while (Date.now() - startModalWait < 3000) {
            await new Promise(r => setTimeout(r, 120));
            modal = findSiteStripeModal();
            if (modal) break;
          }
        }
      }

      // 5. Se temos o modal (já aberto ou recém-aberto)
      if (modal) {
        console.log('[Afiliado Automático] Modal do SiteStripe detectado!');

        // Garante ID da loja, Número de rastreamento e radio Link Curto selecionados sem resetar
        ensureSiteStripeSelectsAndRadios(modal, activeTag);
        await new Promise(r => setTimeout(r, 350));

        // Clica no botão "Copiar link de associado" dentro do modal
        clickCopyButtonInModal(modal);

        // Se após 600ms ainda não copiou, clica novamente
        setTimeout(() => {
          if (!interceptedCopyLink && modal) {
            clickCopyButtonInModal(modal);
          }
        }, 600);

        // Aguarda e varre clipboard, evento copy, atributo DOM e DOM por até 4 segundos
        const startExtract = Date.now();
        while (Date.now() - startExtract < 4000) {
          if (interceptedCopyLink) {
            closeSiteStripeSafely();
            cleanup();
            return interceptedCopyLink;
          }

          const attr = document.documentElement.getAttribute('data-amz-last-shortlink');
          if (attr && /https?:\/\/(?:amzn\.to|link\.amazon|a\.co)\/[a-zA-Z0-9_\-]+/i.test(attr)) {
            closeSiteStripeSafely();
            cleanup();
            return attr;
          }

          // Tenta ler o clipboard nativo (suporta link.amazon e amzn.to)
          try {
            if (navigator.clipboard && navigator.clipboard.readText) {
              const clip = await navigator.clipboard.readText();
              const m = (clip || '').match(/https?:\/\/(?:amzn\.to|link\.amazon|a\.co)\/[a-zA-Z0-9_\-]+/i);
              if (m) {
                console.log('[Afiliado Automático] ✅ Link curto oficial obtido do clipboard:', m[0]);
                closeSiteStripeSafely();
                cleanup();
                return m[0];
              }
            }
          } catch (e) {}

          // Varre elementos do modal e DOM
          const found = scanDomForAmazonShortLink(modal);
          if (found) {
            closeSiteStripeSafely();
            cleanup();
            return found;
          }

          await new Promise(r => setTimeout(r, 150));
        }

        closeSiteStripeSafely();
      }
    } catch (err) {
      console.warn('[Afiliado Automático] Erro na automação do SiteStripe:', err);
    } finally {
      cleanup();
    }

    // 5. Fallback Canônico Oficial Amazon com a Tag salva ou padrão (comissão 100% garantida)
    const fallbackStored = await chrome.storage.local.get(['amazon_affiliate_tag']);
    const cleanTag = (tag || fallbackStored.amazon_affiliate_tag || '').trim();
    const productAsin = asin || getAsinFromUrl(window.location.href) || getAsinFromDom();
    if (productAsin) {
      return `https://www.amazon.com.br/dp/${productAsin}?tag=${encodeURIComponent(cleanTag)}`;
    }
    const cleanUrl = window.location.href.split('?')[0].split('#')[0];
    const sep = cleanUrl.includes('?') ? '&' : '?';
    return `${cleanUrl}${sep}tag=${encodeURIComponent(cleanTag)}`;
  }

  function scanDomForAmazonShortLink(root = document) {
    const elements = Array.from(root.querySelectorAll('input, textarea, a, p, span, div'));
    for (const el of elements) {
      const val = (el.value || el.getAttribute('value') || el.href || el.textContent || '').trim();
      const match = val.match(/https?:\/\/(?:amzn\.to|link\.amazon|a\.co)\/[a-zA-Z0-9_\-]+/i);
      if (match) {
        return match[0];
      }
    }
    return null;
  }

  function findSiteStripeModal() {
    const dialogs = Array.from(document.querySelectorAll(
      'div[role="dialog"], .a-popover, #amzn-ss-text-popover, .amzn-ss-popover, div[class*="popover" i], div[class*="modal" i], section, aside'
    ));
    return dialogs.find(d => {
      if (d.closest('#amz-afiliado-modal-overlay') || d.closest('#amz-afiliado-floating-btn')) return false;
      if (d.offsetWidth === 0 && d.offsetHeight === 0) return false;
      const txt = (d.innerText || d.textContent || '').toLowerCase();
      return (
        txt.includes('compartilhar links de afiliados') ||
        txt.includes('copiar link de associado') ||
        (txt.includes('formato do link') && txt.includes('link curto')) ||
        txt.includes('share affiliate links')
      );
    }) || document.querySelector('#amzn-ss-text-popover, .amzn-ss-popover');
  }

  function findSiteStripeGetLinkButton() {
    // 1. Prioridade absoluta: botão com texto exato "Obter link" ou "Get link"
    const clickables = Array.from(document.querySelectorAll('button, a, span[role="button"], div[role="button"], input[type="button"], .a-button, span.a-button-inner'));
    const exact = clickables.find(b => {
      if (b.closest('#amz-afiliado-modal-overlay') || b.closest('#amz-afiliado-floating-btn')) return false;
      const txt = (b.innerText || b.textContent || b.value || b.getAttribute('aria-label') || '').trim().toLowerCase();
      return txt === 'obter link' || txt === 'get link';
    });
    if (exact) return exact;

    // 2. Seletor clássico de SiteStripe se existir
    const classic = document.querySelector('#amzn-ss-text-link, a#amzn-ss-text-link, #amzn-ss-text-link-title, #amzn-ss-wrap [id*="text" i]');
    if (classic) return classic;

    // 3. Procura na barra SiteStripe
    const stripeBars = Array.from(document.querySelectorAll('#nav-associates-toolbar, #sitestripe, #amzn-ss-wrap, .amzn-ss-toolbar, div[id*="associates" i], div[id*="sitestripe" i], div[class*="sitestripe" i]'));
    for (const bar of stripeBars) {
      const candidates = Array.from(bar.querySelectorAll('a, button, span[role="button"], div[role="button"], span.a-button-inner, span.a-button'));
      const found = candidates.find(b => {
        const txt = (b.innerText || b.textContent || '').trim().toLowerCase();
        return txt === 'obter link' || txt === 'texto' || txt.includes('obter link');
      });
      if (found) return found;
    }

    return null;
  }

  function ensureSiteStripeSelectsAndRadios(modal, tag) {
    try {
      const targetTag = (tag || '').trim();
      const selects = Array.from(modal.querySelectorAll('select'));
      for (const sel of selects) {
        const options = Array.from(sel.options);
        // Se a opção selecionada atual já for válida, preserva intacta para não resetar o estado da Amazon
        if (sel.selectedIndex > 0 && sel.value && sel.value !== '0' && sel.value !== '') {
          if (sel.value.includes('-20') && sel.value !== 'associados-20') {
            chrome.storage.local.set({ amazon_affiliate_tag: sel.value.trim() });
          }
          continue;
        }

        // Procura opção que tenha a tag (ou contenha -20)
        const match = options.find(o => o.value && o.value.includes(targetTag)) ||
                      options.find(o => o.text && o.text.includes(targetTag)) ||
                      options.find(o => o.value && o.value.includes('-20') && o.value !== 'associados-20') ||
                      options.find(o => o.value && o.value.length > 2 && o.value !== '0');

        if (match && sel.value !== match.value) {
          console.log('[Afiliado Automático] Selecionando no SiteStripe dropdown:', match.value);
          sel.value = match.value;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
          sel.dispatchEvent(new Event('input', { bubbles: true }));
          chrome.storage.local.set({ amazon_affiliate_tag: match.value.trim() });
        }
      }

      // Garante radio "Link curto" selecionado
      const radios = Array.from(modal.querySelectorAll('input[type="radio"]'));
      const shortRadio = radios.find(r => {
        const label = r.closest('label') || r.parentElement;
        const txt = ((label && label.textContent) || r.value || r.id || '').toLowerCase();
        return txt.includes('curto') || txt.includes('short');
      });
      if (shortRadio && !shortRadio.checked) {
        shortRadio.click();
        shortRadio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } catch (e) {
      console.warn('[Afiliado Automático] Erro ao ajustar selects do SiteStripe:', e);
    }
  }

  function clickCopyButtonInModal(modal) {
    try {
      const candidates = Array.from(modal.querySelectorAll(
        'button, a, span[role="button"], div[role="button"], input[type="button"], input[type="submit"], .a-button-input, .a-button, span.a-button-inner'
      ));
      const copyBtn = candidates.find(b => {
        const txt = (b.innerText || b.textContent || b.value || b.getAttribute('aria-label') || '').trim().toLowerCase();
        return txt.includes('copiar link de associado') || txt.includes('copiar link') || txt.includes('copiar') || txt.includes('copy');
      }) || modal.querySelector('.a-button-primary, button.a-button-text, [class*="copy" i], input[value*="Copiar" i]');

      if (copyBtn) {
        console.log('[Afiliado Automático] Clicando no botão Copiar link dentro do modal...');
        const evtOpts = { bubbles: true, cancelable: true, view: window };
        copyBtn.dispatchEvent(new PointerEvent('pointerdown', evtOpts));
        copyBtn.dispatchEvent(new MouseEvent('mousedown', evtOpts));
        copyBtn.dispatchEvent(new PointerEvent('pointerup', evtOpts));
        copyBtn.dispatchEvent(new MouseEvent('mouseup', evtOpts));
        copyBtn.click();
        return true;
      }
    } catch (e) {}
    return false;
  }

  function closeSiteStripeSafely() {
    try {
      const closeBtn = document.querySelector(
        'div[role="dialog"] button[aria-label*="close" i], div[role="dialog"] .a-button-close, .a-popover .a-button-close, #amzn-ss-text-popover .a-button-close, .amzn-ss-popover .a-button-close, button[aria-label="Close"], button[aria-label="Fechar"], .a-button-close'
      );
      if (closeBtn) closeBtn.click();
    } catch (e) {}
  }

  // Inicialização (recarrega estilos e UI mesmo se reinjetado)
  injectAmazonStyles();
  injectMainWorldClipboardInterceptor();
  initAmazonInPageUI();
})();
