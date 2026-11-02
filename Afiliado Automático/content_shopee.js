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
    // Se a aba for uma PDP (página de produto individual da Shopee), jamais extrai carrossel ou recomendações como busca
    if (document.querySelector('div[class*="page-product"], div[class*="product-briefing"], .WBVL_7, .attM6q') ||
        window.location.href.includes('-i.') ||
        window.location.href.includes('/product/')) {
      return [];
    }

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

      // 1. Procura em elementos específicos de preço da Shopee ou que contenham R$
      const priceEls = Array.from(card.querySelectorAll('[class*="price" i], [data-sqe="price"], [aria-label*="R$"], .truncate, span, div'));
      for (const el of priceEls) {
        const t = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
        const m = t.match(/R\$\s*([\d\.]+)(?:,(\d{2}))?/i);
        if (m) {
          const intPart = m[1].replace(/\./g, '');
          const decPart = m[2] || '00';
          const val = parseFloat(`${intPart}.${decPart}`) || 0;
          if (val > 0) {
            rawPrice = val;
            price = `R$ ${m[1]}${m[2] ? ',' + m[2] : ',00'}`;
            break;
          }
        }
      }

      // Fallback 1: se ainda for 0, procura nó que contém 'R$' e pega o texto do container pai
      if (rawPrice === 0) {
        const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
        let node;
        while (node = walker.nextNode()) {
          if (node.nodeValue && node.nodeValue.includes('R$')) {
            const p = node.parentElement;
            const parentText = (p?.closest('div, p, [class*="price" i]')?.innerText || p?.innerText || p?.textContent || '').replace(/\s+/g, ' ').trim();
            const m = parentText.match(/R\$\s*([\d\.]+)(?:,(\d{2}))?/i);
            if (m) {
              const intPart = m[1].replace(/\./g, '');
              const decPart = m[2] || '00';
              const val = parseFloat(`${intPart}.${decPart}`) || 0;
              if (val > 0) {
                rawPrice = val;
                price = `R$ ${m[1]}${m[2] ? ',' + m[2] : ',00'}`;
                break;
              }
            }
          }
        }
      }

      // Fallback 2: busca qualquer R$ seguido de número em card.innerText
      if (rawPrice === 0 && card.innerText) {
        const m = card.innerText.match(/R\$\s*([\d\.]+)(?:,(\d{2}))?/i);
        if (m) {
          const intPart = m[1].replace(/\./g, '');
          const decPart = m[2] || '00';
          const val = parseFloat(`${intPart}.${decPart}`) || 0;
          if (val > 0) {
            rawPrice = val;
            price = `R$ ${m[1]}${m[2] ? ',' + m[2] : ',00'}`;
          }
        }
      }

      // Preço Original com Tachado
      const origEl = card.querySelector('[class*="strike" i], [class*="original" i], [class*="line-through" i], [style*="line-through"], del, s');
      if (origEl) {
        const ot = (origEl.innerText || origEl.textContent || '').trim();
        const om = ot.match(/R\$\s*([\d\.]+)(?:,(\d{2}))?/i) || ot.match(/([\d\.]+),(\d{2})/);
        if (om) {
          const intPart = om[1].replace(/\./g, '');
          const decPart = om[2] || '00';
          const val = parseFloat(`${intPart}.${decPart}`) || 0;
          if (val > rawPrice && val > 0) {
            rawOriginalPrice = val;
            originalPrice = `R$ ${om[1]}${om[2] ? ',' + om[2] : ',00'}`;
          }
        }
      }

      // Desconto
      let discount = '';
      let discountPercent = 0;
      const discEl = card.querySelector('[class*="percent"], [class*="discount"], [class*="badge"]');
      if (discEl) {
        const dm = (discEl.innerText || discEl.textContent || '').match(/(\d+)\s*%/);
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
      const rEl = card.querySelector('[class*="rating" i], [class*="stars" i], [aria-label*="avaliação" i], [aria-label*="estrela" i]');
      if (rEl) {
        const rm = (rEl.innerText || rEl.textContent || '').replace(',', '.').match(/([345](?:\.\d+)?)/);
        if (rm) rating = parseFloat(rm[1]) || 0;
      }
      if (!rating && card.innerText) {
        const rm = card.innerText.replace(',', '.').match(/\b([345]\.[0-9])\b/);
        if (rm) rating = parseFloat(rm[1]) || 0;
      }

      // Vendas 🔥
      let sales = '';
      let salesCount = 0;
      const soldEl = card.querySelector('[class*="sold" i], [class*="rN6eW"], [class*="sales" i], [aria-label*="vendido" i]');
      if (soldEl) {
        sales = (soldEl.innerText || soldEl.textContent || '').trim();
      } else if (card.innerText) {
        const sm = card.innerText.match(/\b(\d+(?:[.,]\d+)?\s*(?:mil|k)?)\s*vendido[s]?/i);
        if (sm) sales = `${sm[1]} vendidos`;
      }
      if (sales) {
        // Corrige número colado com preço
        const weirdGluedMatch = sales.match(/\d+[,.]\d{2}(\d+)\s*vendido/i);
        if (weirdGluedMatch) {
          salesCount = parseInt(weirdGluedMatch[1], 10);
          sales = `${salesCount} vendidos`;
        } else {
          const numM = sales.match(/(\d+(?:[.,]\d+)?\s*(?:mil|k)?)/i);
          if (numM) {
            if (/mil|k/i.test(numM[0])) {
              salesCount = Math.round(parseFloat(numM[1].replace(',', '.')) * 1000);
            } else {
              salesCount = parseInt(numM[1].replace(/\D/g, ''), 10) || 0;
            }
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
  // BOTÃO FLUTUANTE E MODAL IN-PAGE NA SHOPEE (PADRÃO UNIFICADO)
  // =========================================================================

  function isShopeeProductPage(url = window.location.href) {
    if (!url) return false;
    if (url.includes('careers.') || url.includes('help.') || url.includes('/legal/') || url.includes('/buyer/') || url.includes('/cart') || url.includes('/checkout')) {
      return false;
    }
    if (isShopeeProductUrl(url)) return true;
    const canonical = document.querySelector('link[rel="canonical"]')?.href;
    if (canonical && isShopeeProductUrl(canonical)) return true;
    const ogUrl = document.querySelector('meta[property="og:url"]')?.content;
    if (ogUrl && isShopeeProductUrl(ogUrl)) return true;
    if (document.querySelector('.WBVL_7, .product-briefing, div[class*="WBVL_7"], [class*="product-briefing"], .attM6q, div[class*="page-product"]')) return true;
    if (document.querySelector('button.btn-solid-primary, button[class*="btn-solid-primary"], button[aria-label*="carrinho" i], button[aria-label*="comprar" i]')) return true;
    const jsonLd = extractShopeeJsonLd();
    if (jsonLd && (jsonLd['@type'] === 'Product' || jsonLd.offers)) return true;
    return false;
  }

  function initShopeeInPageUI() {
    checkAndInjectShopeeUI();
    window.addEventListener('scroll', debounce(injectSearchCardButtons, 400), { passive: true });
    // Periodic check para capturar navegação client-side SPA da Shopee
    setInterval(checkAndInjectShopeeUI, 1000);
  }

  function checkAndInjectShopeeUI() {
    if (isShopeeProductPage()) {
      injectFloatingButton();
    } else {
      const existingBtn = document.getElementById('shp-afiliado-floating-btn');
      if (existingBtn) existingBtn.remove();
    }
    injectSearchCardButtons();
  }

  function injectFloatingButton() {
    const product = extractCurrentPageProduct();
    const existing = document.getElementById('shp-afiliado-floating-btn');
    if (existing) {
      if (product && product.rawPrice) {
        const commPill = existing.querySelector('.ml-float-comm-pill');
        if (commPill && (commPill.textContent.includes('0,00') || !commPill.textContent.includes('R$'))) {
          const commVal = product.rawPrice * 0.14;
          commPill.innerHTML = `💰 Ganho: <b>R$ ${commVal.toFixed(2).replace('.', ',')}</b> (14%)`;
        }
      }
      return;
    }

    const commVal = product && product.rawPrice ? (product.rawPrice * 0.14) : 0;
    const commFormatted = commVal > 0 ? `R$ ${commVal.toFixed(2).replace('.', ',')}` : 'R$ 0,00';

    const btn = document.createElement('div');
    btn.id = 'shp-afiliado-floating-btn';
    btn.title = 'Disparar esta oferta no WhatsApp Web';
    btn.innerHTML = `
      <div class="ml-float-content">
        <svg viewBox="0 0 24 24" class="ml-float-wa-icon">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z"/>
        </svg>
        <div class="ml-float-text-box">
          <span class="ml-float-main-text">⚡ AFILIADO SHOPEE</span>
          <span class="ml-float-comm-pill">💰 Ganho: <b>${commFormatted}</b> (14%)</span>
        </div>
      </div>
    `;

    btn.addEventListener('click', () => {
      const fresh = extractCurrentPageProduct() || product;
      openInPageDispatchModal(fresh);
    });

    document.body.appendChild(btn);
  }

  function injectSearchCardButtons() {
    const cards = document.querySelectorAll('li.shopee-search-item-result__item, div[data-sqe="item"], div.col-xs-2-4');
    for (const card of cards) {
      if (card.querySelector('.shp-card-quick-dispatch')) continue;

      const linkEl = card.querySelector('a[data-sqe="link"], a[href*="-i."], a[href*="/product/"]');
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
  // MODAL IN-PAGE PARA DISPARO RÁPIDO (EXATO PADRÃO UNIFICADO)
  // =========================================================================

  async function openInPageDispatchModal(customProduct = null) {
    const existing = document.getElementById('shp-afiliado-modal-overlay');
    if (existing) existing.remove();

    const product = customProduct || extractCurrentPageProduct();
    if (!product || !product.url) {
      alert('Não foi possível identificar as informações deste produto da Shopee.');
      return;
    }

    // Validação estrita do Plano Starter (Bloqueio prévio obrigatório de 30 dias)
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
        if (allowedPlat && allowedPlat !== 'all' && allowedPlat !== 'shopee') {
          const names = { mercadolivre: 'Mercado Livre', shopee: 'Shopee', amazon: 'Amazon' };
          const curName = names[allowedPlat] || allowedPlat.toUpperCase();
          alert(
            `🔒 Plataforma Não Autorizada (Plano Starter)\n\n` +
            `Sua conta Starter está fixada exclusivamente para disparos no ${curName} durante este ciclo de 30 dias.\n\n` +
            `Para disparar ofertas na Shopee, faça upgrade para o Plano Pro no seu painel!`
          );
          return;
        }
      }
    } catch (e) {
      console.warn('Erro ao validar plano Starter na Shopee:', e);
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
        'shopee_affiliate_tag',
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
      affiliateTag = (data.shopee_affiliate_tag || '').trim();

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
    overlay.id = 'shp-afiliado-modal-overlay';

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

    const commVal = product.rawPrice ? (product.rawPrice * 0.14) : 0;
    const commFormatted = commVal > 0 ? `R$ ${commVal.toFixed(2).replace('.', ',')}` : (product.commissionPrice || 'R$ 0,00');
    const isInitiallyPinned = pinnedGroup && groups.includes(pinnedGroup);

    overlay.innerHTML = `
      <div class="ml-afiliado-modal-card">
        <div class="ml-modal-header">
          <div class="ml-modal-title-row">
            <span class="ml-modal-badge" style="background:#EE4D2D;color:#FFF;">⚡ AFILIADO SHOPEE</span>
            <span class="ml-modal-title">Disparar Oferta</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <button id="shpModalFavBtn" class="ml-modal-pin-btn ${isFavorited ? 'active' : ''}" style="margin-right:4px;" title="Salvar / Remover dos Favoritos" type="button">
              <span id="shpModalFavIcon">${isFavorited ? '★' : '⭐'}</span> <span id="shpModalFavText">${isFavorited ? 'Favoritado' : 'Favoritar'}</span>
            </button>
            <button class="ml-modal-close" id="shpModalClose">&times;</button>
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
              <span class="ml-modal-comm-badge">💰 Ganho: <b>${commFormatted}</b> (14% • Shopee)</span>
              <span class="ml-modal-cat-tag">Shopee Brasil</span>
            </div>
          </div>
        </div>

        <div class="ml-modal-field">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label style="margin-bottom: 0;">Selecione o Grupo do WhatsApp:</label>
            <button type="button" id="shpModalPinGroupBtn" class="ml-modal-pin-btn ${isInitiallyPinned ? 'active' : ''}" title="Fixar este grupo como padrão para não ter que selecionar toda hora">
              📌 <span id="shpModalPinGroupText">${isInitiallyPinned ? 'Grupo Padrão Fixado' : 'Fixar como padrão'}</span>
            </button>
          </div>
          <select id="shpModalGroupSelect" class="ml-modal-select" ${groups.length === 0 ? 'disabled' : ''}>
            ${selectOptions}
          </select>
        </div>

        <button id="shpModalSendBtn" class="ml-modal-btn-send" ${groups.length === 0 ? 'disabled' : ''}>
          <span>🚀 Disparar Agora no WhatsApp Web</span>
        </button>

        <div id="shpModalStatus" class="ml-modal-status"></div>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('shpModalClose').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    const sendBtn = document.getElementById('shpModalSendBtn');
    const statusDiv = document.getElementById('shpModalStatus');
    const select = document.getElementById('shpModalGroupSelect');
    const pinGroupBtn = document.getElementById('shpModalPinGroupBtn');
    const pinGroupText = document.getElementById('shpModalPinGroupText');

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

    const favBtn = document.getElementById('shpModalFavBtn');
    const favIcon = document.getElementById('shpModalFavIcon');
    const favText = document.getElementById('shpModalFavText');

    if (favBtn) {
      favBtn.addEventListener('click', async () => {
        try {
          const resp = await chrome.runtime.sendMessage({
            action: 'toggle_favorite',
            product: {
              ...product,
              platform: 'shopee',
              commissionRate: 14
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
          console.warn('Erro ao favoritar oferta Shopee:', e);
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
        const resp = await chrome.runtime.sendMessage({
          action: 'send_offer',
          productData: {
            ...product,
            platform: 'shopee',
            commissionRate: 14
          },
          affiliateTag: affiliateTag,
          groupName: selectedGroup,
          platform: 'shopee'
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

  function isShopeeProductUrl(url) {
    if (!url) return false;
    if (url.includes('careers.') || url.includes('help.') || url.includes('/legal/') || url.includes('/buyer/')) {
      return false;
    }
    return /-i\.\d+\.\d+/.test(url) || /\/product\/\d+\/\d+/.test(url) || url.includes('s.shopee.com.br/');
  }

  function getCleanShopeeUrl(url) {
    const candidates = [
      url,
      window.location.href,
      document.querySelector('link[rel="canonical"]')?.href,
      document.querySelector('meta[property="og:url"]')?.content
    ];

    for (const cand of candidates) {
      if (!cand) continue;
      try {
        const u = new URL(cand, window.location.origin);
        if (u.hostname === 's.shopee.com.br') {
          return cand.split('?')[0];
        }
        const m = u.pathname.match(/-i\.(\d+)\.(\d+)/) || u.pathname.match(/\/product\/(\d+)\/(\d+)/);
        if (m) {
          return `https://shopee.com.br/product/${m[1]}/${m[2]}`;
        }
      } catch (e) {
        const m = String(cand).match(/-i\.(\d+)\.(\d+)/) || String(cand).match(/\/product\/(\d+)\/(\d+)/);
        if (m) return `https://shopee.com.br/product/${m[1]}/${m[2]}`;
      }
    }
    if (url && (url.includes('shopee.com.br') || url.startsWith('/'))) {
      return url.split('?')[0].split('#')[0];
    }
    return '';
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
  // ESTILOS IN-PAGE DA SHOPEE (UNIFICADOS)
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
        z-index: 2147483647;
        background: linear-gradient(135deg, #EE4D2D 0%, #D03B1B 100%);
        color: #FFFFFF;
        padding: 9px 18px;
        border-radius: 50px;
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.25), 0 0 0 2px rgba(238, 77, 45, 0.4);
        cursor: pointer;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        font-weight: 700;
        font-size: 13px;
        border: none;
        display: flex;
        align-items: center;
        gap: 10px;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      #shp-afiliado-floating-btn:hover {
        transform: translateY(-2px) scale(1.02);
        box-shadow: 0 6px 22px rgba(238, 77, 45, 0.5);
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
        color: #FFFFFF;
      }
      .ml-float-comm-pill {
        font-size: 11px;
        font-weight: 700;
        color: #FEF08A;
      }

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
        background: #EE4D2D;
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
        border-color: #EE4D2D;
        box-shadow: 0 0 0 2px rgba(238,77,45,0.15);
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

  // Inicialização (recarrega estilos e UI mesmo se reinjetado)
  injectShopeeStyles();
  initShopeeInPageUI();
})();

