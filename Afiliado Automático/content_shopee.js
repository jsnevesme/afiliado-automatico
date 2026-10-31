/**
 * =============================================================================
 * AFILIADO AUTOMÁTICO - CONTENT SCRIPT: SHOPEE BRASIL
 * =============================================================================
 * Executado nas páginas da Shopee Brasil (shopee.com.br).
 * 1. Extração de ofertas estruturadas (PDP e catálogo/busca).
 * 2. Botão flutuante "⚡ Disparar no WhatsApp" em páginas de produto.
 * 3. Botões rápidos nos cards de busca/recomendações.
 * 4. Suporte a links de afiliados Shopee.
 */

(function () {
  'use strict';

  // Desativa imediatamente em subdomínios institucionais, páginas de ajuda, termos ou portal de afiliados
  if (
    window.location.hostname.includes('careers.') ||
    window.location.hostname.includes('help.') ||
    window.location.hostname.includes('seller.') ||
    window.location.hostname.includes('affiliate.') ||
    window.location.pathname.includes('/legal/')
  ) {
    return;
  }

  console.log('[Afiliado Automático] Content script da Shopee carregando/atualizando em:', window.location.href);

  // Remove listener anterior se houver (para evitar duplicação ou contexto invalidado após reload)
  if (window.__SHOPEE_AFILIADO_MSG_LISTENER__) {
    try {
      chrome.runtime.onMessage.removeListener(window.__SHOPEE_AFILIADO_MSG_LISTENER__);
    } catch (e) {}
  }

  // =========================================================================
  // OUVINTE DE MENSAGENS DO POPUP E BACKGROUND
  // =========================================================================

  window.__SHOPEE_AFILIADO_MSG_LISTENER__ = (message, sender, sendResponse) => {
    // 1. Obtém dados do produto da página ativa
    if (message.action === 'get_current_page_product') {
      const product = extractCurrentPageProduct();
      sendResponse({ success: !!product, product });
      return true;
    }

    // 2. Extrai produtos da página de busca atual
    if (message.action === 'get_search_page_products') {
      const products = extractSearchPageProducts();
      sendResponse({ success: products.length > 0, products });
      return true;
    }
  };

  chrome.runtime.onMessage.addListener(window.__SHOPEE_AFILIADO_MSG_LISTENER__);

  // =========================================================================
  // EXTRAÇÃO DE PRODUTO DA PÁGINA ATUAL (PDP SHOPEE) COM JSON-LD + REGEX
  // =========================================================================

  function extractShopeeJsonLd() {
    try {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const s of scripts) {
        if (!s.textContent) continue;
        const data = JSON.parse(s.textContent);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (item && (item['@type'] === 'Product' || item.offers || item.aggregateRating)) {
            return item;
          }
        }
      }
    } catch (e) {
      console.warn('[Shopee Extractor] Falha ao parsear JSON-LD:', e);
    }
    return null;
  }

  function extractCurrentPageProduct() {
    const cleanUrl = getCleanShopeeUrl(window.location.href);
    if (!cleanUrl || !isShopeeProductUrl(cleanUrl)) {
      return null;
    }
    const jsonLd = extractShopeeJsonLd();

    // 1. Título
    let title = '';
    if (jsonLd && jsonLd.name) {
      title = String(jsonLd.name).trim();
    }
    if (!title) {
      const titleEl = document.querySelector(
        '.WBVL_7, div[class*="WBVL_7"], span[class*="WBVL_7"], .attM6q, h1, div[class*="product-briefing"] h1'
      );
      if (titleEl) title = titleEl.textContent.trim();
    }
    if (!title) {
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle && ogTitle.content) title = ogTitle.content.split('|')[0].trim();
    }
    if (!title) {
      title = document.title.replace(/\|\s*Shopee Brasil.*/i, '').trim();
    }
    if (!title || title.length < 3) return null;

    // 2. Preços (Promocional e Riscado)
    let price = 'Consulte';
    let rawPrice = 0;
    let originalPrice = '';
    let rawOriginalPrice = 0;

    // A) Tentativa Primária: JSON-LD oficial da Shopee (Altamente Confiável)
    if (jsonLd && jsonLd.offers) {
      const offer = Array.isArray(jsonLd.offers) ? jsonLd.offers[0] : jsonLd.offers;
      const jsonPrice = offer?.price || offer?.lowPrice;
      if (jsonPrice !== undefined && jsonPrice !== null) {
        const num = parseFloat(String(jsonPrice).replace(',', '.'));
        if (num > 0) {
          rawPrice = num;
          price = `R$ ${num.toFixed(2).replace('.', ',')}`;
        }
      }
      if (offer?.highPrice) {
        const numOrig = parseFloat(String(offer.highPrice).replace(',', '.'));
        if (numOrig > rawPrice) {
          rawOriginalPrice = numOrig;
          originalPrice = `R$ ${numOrig.toFixed(2).replace('.', ',')}`;
        }
      }
    }

    // B) Fallback de Preço Atual via DOM
    if (rawPrice === 0) {
      const priceEl = document.querySelector(
        '.pqTWkA, div[class*="pqTWkA"], div._3n5z6N, div.G27lta, div.pmmxKx, div[class*="price"], .product-price'
      );
      if (priceEl) {
        const parsed = parsePriceString(priceEl.textContent);
        if (parsed.raw > 0) {
          price = parsed.formatted;
          rawPrice = parsed.raw;
        }
      }
    }

    // C) Fallback Textual por Varredura de Nós Folha com R$
    if (rawPrice === 0) {
      const leafElements = document.querySelectorAll('div, span, p');
      for (const el of leafElements) {
        if (el.children.length > 2) continue;
        const text = el.textContent.trim();
        if (/^R\$\s*[\d\.]+(?:,\d{2})?$/.test(text)) {
          const parsed = parsePriceString(text);
          if (parsed.raw > 0) {
            price = parsed.formatted;
            rawPrice = parsed.raw;
            break;
          }
        }
      }
    }

    // D) Preço Riscado / Original via DOM
    if (!originalPrice) {
      const origEl = document.querySelector(
        '.Y33h3c, div[class*="Y33h3c"], div._3_rm92, div.flex.items-center.del, del, [class*="original-price"]'
      );
      if (origEl) {
        const parsed = parsePriceString(origEl.textContent);
        if (parsed.raw > rawPrice && parsed.raw > 0) {
          originalPrice = parsed.formatted;
          rawOriginalPrice = parsed.raw;
        }
      }
    }

    // 3. Desconto
    let discount = '';
    let discountPercent = 0;
    const discEl = document.querySelector('.W2hEea, div[class*="W2hEea"], span[class*="percent"], [class*="discount"]');
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

    // 4. Detecção de Mídia Robusta (Imagens e Vídeos Shopee)
    let imageUrl = '';
    let videoUrl = '';
    let videoPoster = '';
    let hasVideo = false;

    // Detecta vídeo na página ou galeria
    const shpVideo = document.querySelector('video, div[class*="video"] video, ._12-video video');
    if (shpVideo) {
      hasVideo = true;
      videoUrl = shpVideo.src || shpVideo.querySelector('source')?.src || '';
      videoPoster = shpVideo.getAttribute('poster') || shpVideo.poster || '';
    } else if (document.querySelector('div[class*="video"], ._12-video, [class*="play-button"]')) {
      hasVideo = true;
    }

    // A. JSON-LD
    if (jsonLd && jsonLd.image) {
      const imgs = Array.isArray(jsonLd.image) ? jsonLd.image : [jsonLd.image];
      imageUrl = imgs.find(u => u && typeof u === 'string' && u.startsWith('http') && !u.endsWith('.mp4') && !u.endsWith('.webm')) || '';
    }

    // B. Video poster
    if (!imageUrl && videoPoster && videoPoster.startsWith('http')) {
      imageUrl = videoPoster;
    }

    // C. Galeria e miniaturas
    if (!imageUrl) {
      const shpImgs = Array.from(document.querySelectorAll(
        'picture img, div[style*="background-image"], ._2J7tDe img, img[class*="product-image"], div[class*="gallery"] img, div[class*="product-briefing"] img'
      ));
      for (const imgEl of shpImgs) {
        let u = '';
        if (imgEl.tagName === 'IMG' && imgEl.src && !imgEl.src.startsWith('data:')) {
          u = imgEl.src;
        } else if (imgEl.style && imgEl.style.backgroundImage) {
          const bgM = imgEl.style.backgroundImage.match(/url\(["']?([^"']+)["']?\)/);
          if (bgM) u = bgM[1];
        }
        if (u && u.startsWith('http') && !u.includes('logo') && !u.endsWith('.mp4') && !u.endsWith('.webm')) {
          imageUrl = u;
          break;
        }
      }
    }

    // D. OpenGraph
    if (!imageUrl) {
      const ogImg = document.querySelector('meta[property="og:image"]');
      if (ogImg && ogImg.content && ogImg.content.startsWith('http') && !ogImg.content.includes('logo') && !ogImg.content.endsWith('.mp4')) {
        imageUrl = ogImg.content;
      }
    }


    // 5. Avaliação e Reviews
    let rating = 0;
    let reviewsCount = '';

    if (jsonLd && jsonLd.aggregateRating) {
      const rVal = parseFloat(jsonLd.aggregateRating.ratingValue);
      if (rVal > 0) rating = rVal;
      const rCount = jsonLd.aggregateRating.reviewCount;
      if (rCount) reviewsCount = `${rCount} avaliações`;
    }

    if (!rating) {
      const ratingEl = document.querySelector('div._1k49pf, div.flex.items-center._1k49pf, [class*="rating"], [class*="stars"]');
      if (ratingEl) {
        const rm = ratingEl.textContent.replace(',', '.').match(/([345](?:\.\d+)?)/);
        if (rm) rating = parseFloat(rm[1]) || 0;
      }
    }

    if (!reviewsCount) {
      const revEl = document.querySelector('div._3u92Nj, [class*="reviews"], [class*="rating-total"]');
      if (revEl) {
        reviewsCount = revEl.textContent.replace(/[()]/g, '').trim();
      }
    }

    // 6. Vendas
    let sales = '';
    let salesCount = 0;
    const salesEl = document.querySelector('.eCPGL7, div[class*="sold"], div.flex.items-center._20rZhv, [class*="item-sold"]');
    if (salesEl) {
      sales = salesEl.textContent.trim();
    } else {
      // Varredura por texto com "vendido"
      const leafEls = document.querySelectorAll('div, span');
      for (const el of leafEls) {
        if (el.children.length === 0 && /vendido/i.test(el.textContent)) {
          sales = el.textContent.trim();
          break;
        }
      }
    }

    if (sales) {
      const numM = sales.match(/(\+?\s*\d+(?:[.,]\d+)?\s*(?:mil)?)/i);
      if (numM) {
        if (/mil/i.test(numM[0])) {
          salesCount = parseFloat(numM[1].replace(',', '.')) * 1000;
        } else {
          salesCount = parseInt(numM[1].replace(/\D/g, ''), 10) || 0;
        }
      }
    }

    // 7. Verificação de Link de Afiliado na Barra Shopee (se houver)
    let affiliateShortLink = null;
    const affiliateBarLink = document.querySelector('a[href*="s.shopee.com.br"], input[value*="s.shopee.com.br"]');
    if (affiliateBarLink) {
      affiliateShortLink = affiliateBarLink.href || affiliateBarLink.value || null;
    }

    // 9. Comissão oficial da barra de afiliados Shopee (se presente na página)
    let extractedCommissionRate = undefined;
    let commissionPercent = '';
    const shopeeAffBar = document.querySelector('.shopee-affiliate-bar, [class*="affiliate-bar" i]');
    if (shopeeAffBar) {
      const mRate = shopeeAffBar.textContent.match(/(\d+(?:[.,]\d+)?)\s*%/);
      if (mRate) {
        extractedCommissionRate = parseFloat(mRate[1].replace(',', '.'));
        commissionPercent = `${extractedCommissionRate}%`;
      }
    }

    return {
      title,
      price,
      rawPrice,
      originalPrice,
      rawOriginalPrice,
      discount,
      discountPercent,
      imageUrl: imageUrl || videoPoster || '',
      hasVideo: !!hasVideo,
      videoUrl: videoUrl || '',
      videoPoster: videoPoster || '',
      url: cleanUrl,
      pageUrl: window.location.href.split('?')[0].split('#')[0],
      affiliateShortLink,
      rating,
      reviewsCount: reviewsCount ? `(${reviewsCount})` : '',
      sales,
      salesCount,
      extractedCommissionRate,
      commissionPercent,
      platform: 'shopee',
      platformName: 'Shopee',
      platformIcon: '🟠',
      platformBadge: 'Shopee'
    };
  }

  // =========================================================================
  // EXTRAÇÃO DE PRODUTOS DA PÁGINA DE BUSCA / CATÁLOGO SHOPEE
  // =========================================================================

  function extractSearchPageProducts() {
    const list = [];
    const seen = new Set();

    // 1. Seleciona cards de layouts de busca da Shopee
    let cards = Array.from(document.querySelectorAll(
      'li.shopee-search-item-result__item, div[data-sqe="item"], div.shopee-search-item-result__item, div.col-xs-2-4, div[class*="search-item-result"]'
    ));

    // 2. Descoberta complementar por links de produtos da Shopee
    const productLinks = document.querySelectorAll(
      'a[href*="-i."], a[href*="/product/"], a[data-sqe="link"]'
    );
    const cardSet = new Set(cards);
    for (const a of productLinks) {
      if (a.closest('header, nav, footer, #shp-afiliado-floating-btn, #shp-afiliado-modal-overlay')) continue;
      const c = a.closest(
        'li.shopee-search-item-result__item, div[data-sqe="item"], div.shopee-search-item-result__item, div.col-xs-2-4, div[class*="item-card"], [class*="product-card"], li, div[class*="col"]'
      ) || a;
      if (c && !cardSet.has(c)) {
        cardSet.add(c);
        cards.push(c);
      }
    }

    for (const card of cards) {
      const linkEl = card.tagName === 'A' ? card : (
        card.querySelector('a[href*="-i."], a[href*="/product/"], a[data-sqe="link"]') ||
        card.querySelector('a[href]')
      );
      if (!linkEl || !linkEl.href) continue;

      let cleanUrl = '';
      const m = linkEl.href.match(/-i\.(\d+)\.(\d+)/) || linkEl.href.match(/\/product\/(\d+)\/(\d+)/);
      if (m) {
        cleanUrl = `https://shopee.com.br/product/${m[1]}/${m[2]}`;
      } else if (linkEl.href.includes('s.shopee.com.br/')) {
        cleanUrl = linkEl.href.split('?')[0];
      }
      if (!cleanUrl) continue;
      if (seen.has(cleanUrl)) continue;

      // Título: Multi-estratégia robusta
      let title = '';
      const titleEl = card.querySelector(
        'div[data-sqe="name"], div[class*="name" i], div[class*="title" i], [class*="item-card__title"], [class*="line-clamp"], .whitespace-normal, [style*="-webkit-line-clamp"]'
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
        const aria = linkEl.getAttribute('aria-label') || linkEl.getAttribute('title');
        if (aria && aria.trim().length > 3) {
          title = aria.trim();
        }
      }
      if (!title) {
        try {
          const u = new URL(linkEl.href);
          const mSlug = u.pathname.match(/\/([^\/]+)-i\.\d+\.\d+/);
          if (mSlug && mSlug[1]) {
            title = decodeURIComponent(mSlug[1]).replace(/[-_+]/g, ' ').trim();
          }
        } catch (e) {}
      }
      title = title.replace(/^(?:ad|anúncio|patrocinado|oficial|indicado|novo)\s*/i, '').trim();
      if (!title || title.length < 3) continue;

      seen.add(cleanUrl);

      // Preços: Varre nós de texto e elementos com R$
      let price = 'Consulte';
      let rawPrice = 0;
      let originalPrice = '';
      let rawOriginalPrice = 0;

      const priceTexts = [];
      const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
      let node;
      while (node = walker.nextNode()) {
        const t = node.nodeValue?.trim();
        if (t && /R\$\s*[\d\.]+/i.test(t)) {
          priceTexts.push(t);
        }
      }
      if (priceTexts.length === 0) {
        const pEls = Array.from(card.querySelectorAll('span, div')).filter(el => /R\$\s*[\d\.]+/i.test(el.textContent));
        for (const el of pEls) {
          if (el.children.length === 0 || !el.querySelector('span, div')) {
            priceTexts.push(el.textContent.trim());
          }
        }
      }

      const parsedPrices = priceTexts.map(t => parsePriceString(t)).filter(p => p.raw > 0);
      if (parsedPrices.length > 0) {
        const minPrice = parsedPrices.reduce((prev, curr) => curr.raw < prev.raw ? curr : prev, parsedPrices[0]);
        const maxPrice = parsedPrices.reduce((prev, curr) => curr.raw > prev.raw ? curr : prev, parsedPrices[0]);
        price = minPrice.formatted;
        rawPrice = minPrice.raw;
        if (maxPrice.raw > minPrice.raw) {
          originalPrice = maxPrice.formatted;
          rawOriginalPrice = maxPrice.raw;
        }
      }

      // Desconto
      let discount = '';
      let discountPercent = 0;
      const discEl = card.querySelector('[class*="percent"], [class*="discount"], [class*="badge"]');
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
      const imgEl = card.querySelector('img');
      if (imgEl) {
        const candidates = [
          imgEl.getAttribute('data-src'),
          imgEl.getAttribute('data-lazy-src'),
          imgEl.src
        ];
        imageUrl = candidates.find(u => u && typeof u === 'string' && u.startsWith('http') && !u.startsWith('data:')) || '';
      }

      // Avaliação ⭐
      let rating = 0;
      let reviewsCount = '';
      const rEl = card.querySelector('[class*="rating"], [class*="stars"]');
      if (rEl) {
        const rm = rEl.textContent.replace(',', '.').match(/([345](?:\.\d+)?)/);
        if (rm) rating = parseFloat(rm[1]) || 0;
      }
      if (!rating) {
        const cardText = card.textContent.replace(',', '.');
        const rm = cardText.match(/\b([345]\.[0-9])\b/);
        if (rm) rating = parseFloat(rm[1]) || 0;
      }

      // Vendas 🔥
      let sales = '';
      let salesCount = 0;
      const soldEl = card.querySelector('[class*="sold"], [class*="rN6eW"]');
      if (soldEl) {
        sales = soldEl.textContent.trim();
      } else {
        const sm = card.textContent.match(/(\+?\s*\d+(?:[.,]\d+)?\s*(?:mil)?\s*vendido[s]?)/i);
        if (sm) sales = sm[0].trim();
      }
      if (sales) {
        const numM = sales.match(/(\+?\s*\d+(?:[.,]\d+)?\s*(?:mil)?)/i);
        if (numM) {
          salesCount = /mil/i.test(numM[0]) ? parseFloat(numM[1].replace(',', '.')) * 1000 : parseInt(numM[1].replace(/\D/g, ''), 10);
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
        rating,
        reviewsCount: reviewsCount ? `(${reviewsCount})` : '',
        sales,
        salesCount,
        platform: 'shopee',
        platformName: 'Shopee',
        platformIcon: '🟠',
        platformBadge: 'Shopee'
      });
    }

    return list;
  }

  // =========================================================================
  // BOTÃO FLUTUANTE E MODAL IN-PAGE NA SHOPEE
  // =========================================================================

  function initShopeeInPageUI() {
    if (isShopeeProductUrl(window.location.href)) {
      injectFloatingButton();
    }
    injectSearchCardButtons();

    window.addEventListener('scroll', debounce(injectSearchCardButtons, 400), { passive: true });
  }

  function injectFloatingButton() {
    if (document.getElementById('shp-afiliado-floating-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'shp-afiliado-floating-btn';
    btn.title = 'Disparar esta oferta no WhatsApp';
    btn.innerHTML = `
      <div class="shp-float-icon">⚡</div>
      <div class="shp-float-label">Disparar Oferta</div>
    `;

    btn.addEventListener('click', () => {
      openInPageDispatchModal();
    });

    document.body.appendChild(btn);
  }

  function injectSearchCardButtons() {
    const cards = document.querySelectorAll('li.shopee-search-item-result__item, div[data-sqe="item"]');
    for (const card of cards) {
      if (card.querySelector('.shp-card-quick-dispatch')) continue;

      const linkEl = card.querySelector('a[data-sqe="link"], a[href*="-i."]');
      if (!linkEl || !linkEl.href) continue;

      const quickBtn = document.createElement('button');
      quickBtn.type = 'button';
      quickBtn.className = 'shp-card-quick-dispatch';
      quickBtn.innerHTML = `⚡ Disparar`;
      quickBtn.title = 'Disparar oferta no WhatsApp';

      quickBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const prodData = extractSingleCardProduct(card, linkEl.href);
        if (prodData) {
          openInPageDispatchModal(prodData);
        }
      });

      card.style.position = 'relative';
      const container = document.createElement('div');
      container.className = 'shp-card-actions-wrapper';
      container.appendChild(quickBtn);
      card.appendChild(container);
    }
  }

  function extractSingleCardProduct(card, href) {
    const cleanUrl = getCleanShopeeUrl(href);
    if (!cleanUrl || !isShopeeProductUrl(cleanUrl)) {
      return null;
    }

    const titleEl = card.querySelector('div[data-sqe="name"], div[class*="name"], div[class*="title"]');
    if (!titleEl) return null;
    const title = titleEl.textContent.trim();
    if (!title || title.length < 3) return null;

    let price = 'Consulte';
    let rawPrice = 0;
    const pEl = card.querySelector('span, div');
    if (pEl) {
      const parsed = parsePriceString(card.textContent);
      if (parsed.raw > 0) {
        price = parsed.formatted;
        rawPrice = parsed.raw;
      }
    }

    let imageUrl = '';
    const imgEl = card.querySelector('img');
    if (imgEl && imgEl.src && !imgEl.src.startsWith('data:')) {
      imageUrl = imgEl.src;
    }

    return {
      title,
      price,
      rawPrice,
      url: cleanUrl,
      imageUrl,
      platform: 'shopee',
      platformName: 'Shopee',
      platformIcon: '🟠',
      platformBadge: 'Shopee'
    };
  }

  // =========================================================================
  // MODAL IN-PAGE PARA DISPARO RÁPIDO
  // =========================================================================

  async function openInPageDispatchModal(customProduct = null) {
    const existing = document.getElementById('shp-afiliado-modal-overlay');
    if (existing) existing.remove();

    const product = customProduct || extractCurrentPageProduct();
    if (!product || !product.url || !isShopeeProductUrl(product.url)) {
      alert('Não foi possível identificar as informações de um produto válido da Shopee.');
      return;
    }

    const modal = document.createElement('div');
    modal.id = 'shp-afiliado-modal-overlay';
    modal.innerHTML = `
      <div class="shp-modal-card">
        <div class="shp-modal-header">
          <div class="shp-modal-brand">
            <span class="shp-modal-brand-badge">🟠 Shopee</span>
            <span class="shp-modal-title">Disparar Oferta</span>
          </div>
          <button id="shpModalCloseBtn" class="shp-modal-close" title="Fechar">&times;</button>
        </div>

        <div class="shp-modal-body">
          <div class="shp-modal-prod-summary">
            <img src="${product.imageUrl || ''}" class="shp-modal-img" alt="Produto">
            <div class="shp-modal-prod-info">
              <div class="shp-modal-prod-title">${escapeHtml(product.title)}</div>
              <div class="shp-modal-prod-price">${product.price} ${product.discount ? `<span class="shp-modal-badge">${product.discount}</span>` : ''}</div>
            </div>
          </div>

          <div class="shp-modal-field">
            <label class="shp-modal-label">Grupo de Destino (WhatsApp):</label>
            <select id="shpModalGroupSelect" class="shp-modal-select">
              <option value="">Carregando grupos...</option>
            </select>
          </div>

          <div class="shp-modal-field">
            <label class="shp-modal-label">Modelo de Copy (IA):</label>
            <select id="shpModalStyleSelect" class="shp-modal-select">
              <option value="vantagens_gatilhos" selected>⭐ Vantagens & Gatilhos</option>
              <option value="curta_direta">⚡ Curta & Direta (Oferta Relâmpago)</option>
              <option value="detalhada_persuasiva">📋 Detalhada & Completa</option>
              <option value="urgencia_escassez">🔥 Urgência Máxima</option>
            </select>
          </div>

          <div id="shpModalStatus" class="shp-modal-status"></div>

          <button id="shpModalSendBtn" class="shp-modal-btn-send">
            🚀 Disparar para o WhatsApp
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('shpModalCloseBtn').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    const groupSelect = document.getElementById('shpModalGroupSelect');
    const sendBtn = document.getElementById('shpModalSendBtn');
    const statusDiv = document.getElementById('shpModalStatus');
    const styleSelect = document.getElementById('shpModalStyleSelect');

    try {
      const stored = await chrome.storage.local.get(['saved_whatsapp_groups', 'pinned_whatsapp_group', 'ml_copy_style']);
      const groups = stored.saved_whatsapp_groups || [];
      const pinned = stored.pinned_whatsapp_group || '';
      if (stored.ml_copy_style) styleSelect.value = stored.ml_copy_style;

      groupSelect.innerHTML = '';
      if (groups.length === 0) {
        groupSelect.innerHTML = '<option value="">Nenhum grupo sincronizado</option>';
      } else {
        groups.forEach(g => {
          const opt = document.createElement('option');
          opt.value = g;
          opt.textContent = g + (g === pinned ? ' 📌 (Padrão)' : '');
          if (g === pinned) opt.selected = true;
          groupSelect.appendChild(opt);
        });
      }
    } catch (e) {}

    sendBtn.addEventListener('click', async () => {
      const group = groupSelect.value;
      if (!group) {
        statusDiv.textContent = 'Selecione um grupo de WhatsApp.';
        statusDiv.className = 'shp-modal-status error';
        return;
      }

      sendBtn.disabled = true;
      statusDiv.textContent = 'Gerando link e copy com IA...';
      statusDiv.className = 'shp-modal-status info';

      chrome.runtime.sendMessage({
        action: 'send_offer',
        productData: product,
        groupName: group,
        copyStyle: styleSelect.value
      }, (resp) => {
        sendBtn.disabled = false;
        if (resp && resp.success) {
          statusDiv.textContent = '✅ Disparado com sucesso!';
          statusDiv.className = 'shp-modal-status success';
          setTimeout(() => modal.remove(), 1400);
        } else {
          statusDiv.textContent = `❌ ${(resp && resp.error) || 'Erro no envio'}`;
          statusDiv.className = 'shp-modal-status error';
        }
      });
    });
  }

  // =========================================================================
  // AUXILIARES
  // =========================================================================

  function isShopeeProductUrl(url) {
    if (!url) return false;
    if (url.includes('careers.') || url.includes('help.') || url.includes('/legal/') || url.includes('/buyer/')) {
      return false;
    }
    return /-i\.\d+\.\d+/.test(url) || /\/product\/\d+\/\d+/.test(url) || url.includes('s.shopee.com.br/');
  }

  function getCleanShopeeUrl(url) {
    if (!url) return '';
    try {
      const u = new URL(url);
      if (u.hostname === 's.shopee.com.br') {
        return url.split('?')[0];
      }
      const m = u.pathname.match(/-i\.(\d+)\.(\d+)/) || u.pathname.match(/\/product\/(\d+)\/(\d+)/);
      if (m) {
        return `https://shopee.com.br/product/${m[1]}/${m[2]}`;
      }
      return '';
    } catch (e) {
      const m = String(url).match(/-i\.(\d+)\.(\d+)/) || String(url).match(/\/product\/(\d+)\/(\d+)/);
      if (m) return `https://shopee.com.br/product/${m[1]}/${m[2]}`;
      return '';
    }
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
  // ESTILOS IN-PAGE DA SHOPEE
  // =========================================================================

  function injectShopeeStyles() {
    if (document.getElementById('shp-afiliado-styles')) return;
    const style = document.createElement('style');
    style.id = 'shp-afiliado-styles';
    style.textContent = `
      #shp-afiliado-floating-btn {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 999999;
        display: flex;
        align-items: center;
        gap: 8px;
        background: linear-gradient(135deg, #EE4D2D 0%, #D03B1B 100%);
        color: #FFFFFF;
        border: 2px solid #FFFFFF;
        padding: 10px 18px;
        border-radius: 50px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(238, 77, 45, 0.45);
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease;
      }
      #shp-afiliado-floating-btn:hover {
        transform: translateY(-2px) scale(1.03);
        box-shadow: 0 6px 22px rgba(238, 77, 45, 0.6);
      }
      .shp-float-icon { font-size: 16px; }

      .shp-card-actions-wrapper {
        position: absolute;
        bottom: 8px;
        right: 8px;
        z-index: 10;
      }
      .shp-card-quick-dispatch {
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
      .shp-card-quick-dispatch:hover {
        transform: scale(1.05);
        background: #20BD5A;
      }

      #shp-afiliado-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.65);
        backdrop-filter: blur(4px);
        z-index: 9999999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      .shp-modal-card {
        background: #FFFFFF;
        width: 100%;
        max-width: 440px;
        border-radius: 14px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.25);
        overflow: hidden;
      }
      .shp-modal-header {
        background: #EE4D2D;
        color: #FFFFFF;
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .shp-modal-brand {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .shp-modal-brand-badge {
        background: #FFFFFF;
        color: #EE4D2D;
        padding: 2px 7px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 800;
      }
      .shp-modal-title {
        font-weight: 700;
        font-size: 14px;
      }
      .shp-modal-close {
        background: transparent;
        border: none;
        color: rgba(255,255,255,0.8);
        font-size: 22px;
        cursor: pointer;
        line-height: 1;
      }
      .shp-modal-close:hover { color: #FFF; }
      .shp-modal-body { padding: 16px; }
      .shp-modal-prod-summary {
        display: flex;
        gap: 12px;
        align-items: center;
        background: #F8FAFC;
        padding: 10px;
        border-radius: 8px;
        margin-bottom: 14px;
        border: 1px solid #E2E8F0;
      }
      .shp-modal-img {
        width: 52px;
        height: 52px;
        object-fit: contain;
        border-radius: 6px;
        background: #FFF;
      }
      .shp-modal-prod-info {
        flex: 1;
        min-width: 0;
      }
      .shp-modal-prod-title {
        font-size: 12px;
        font-weight: 600;
        color: #1E293B;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .shp-modal-prod-price {
        font-size: 14px;
        font-weight: 800;
        color: #059669;
        margin-top: 3px;
      }
      .shp-modal-badge {
        font-size: 10px;
        background: #EF4444;
        color: #FFF;
        padding: 1px 5px;
        border-radius: 4px;
        margin-left: 6px;
      }
      .shp-modal-field { margin-bottom: 12px; }
      .shp-modal-label {
        display: block;
        font-size: 11px;
        font-weight: 700;
        color: #475569;
        margin-bottom: 4px;
      }
      .shp-modal-select {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid #CBD5E1;
        border-radius: 6px;
        font-size: 13px;
        color: #1E293B;
      }
      .shp-modal-btn-send {
        width: 100%;
        background: #25D366;
        color: #FFF;
        border: none;
        padding: 11px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.2s;
        margin-top: 10px;
      }
      .shp-modal-btn-send:hover { background: #20BD5A; }
      .shp-modal-status {
        margin-top: 8px;
        font-size: 12px;
        text-align: center;
        font-weight: 600;
      }
      .shp-modal-status.info { color: #2563EB; }
      .shp-modal-status.success { color: #059669; }
      .shp-modal-status.error { color: #DC2626; }
    `;
    document.head.appendChild(style);
  }

  if (!window.__AFILIADO_SHOPEE_INITIALIZED__) {
    window.__AFILIADO_SHOPEE_INITIALIZED__ = true;
    injectShopeeStyles();
    initShopeeInPageUI();
  }

})();
