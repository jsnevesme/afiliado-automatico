/**
 * Afiliado Mercado Livre - Content Script para páginas do Mercado Livre
 * 1. Fornece extração robusta do produto aberto (PDP) e resultados de busca.
 * 2. Injeta botão flutuante "⚡ Disparar Oferta WhatsApp" diretamente nas páginas de produtos.
 * 3. Adiciona atalhos de disparo nos cards de busca do Mercado Livre.
 * 4. Executa a geração oficial de link meli.la usando a sessão logada do usuário.
 */

(function () {
  console.log('[Afiliado ML] content_ml.js carregando/atualizando em:', window.location.href);

  // Injeta estilos CSS para o widget flutuante e botões in-page
  if (!window.__ML_AFILIADO_CONTENT_ML_LOADED__) {
    window.__ML_AFILIADO_CONTENT_ML_LOADED__ = true;
    injectInPageStyles();
    setTimeout(initInPageUI, 1000);
  } else {
    if (typeof monitorAffiliateStripe === 'function') {
      monitorAffiliateStripe();
    }
  }

  // =========================================================================
  // OUVINTE DE MENSAGENS DO POPUP E BACKGROUND (com hot-reload limpo)
  // =========================================================================
  if (window.__ML_AFILIADO_MSG_LISTENER__) {
    try {
      chrome.runtime.onMessage.removeListener(window.__ML_AFILIADO_MSG_LISTENER__);
    } catch (e) {}
  }

  window.__ML_AFILIADO_MSG_LISTENER__ = (message, sender, sendResponse) => {
    // 1. Obtém dados do produto da página ativa
    if (message.action === 'get_current_page_product') {
      const product = extractCurrentPageProduct();
      sendResponse({ success: !!product, product });
      return true;
    }

    // 2. Extrai produtos da página de busca atual ou do Portal de Afiliados
    if (message.action === 'get_search_page_products') {
      extractSearchPageProductsWithRetry()
        .then(products => sendResponse({ success: products.length > 0, products }))
        .catch(() => {
          const products = extractSearchPageProducts();
          sendResponse({ success: products.length > 0, products });
        });
      return true;
    }

    // 3. Gera o link oficial meli.la usando a sessão logada
    if (message.action === 'generate_meli_la_internal') {
      generateMeliLaLink(message.url, message.tag)
        .then(shortUrl => sendResponse({ success: true, shortUrl }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;
    }
  };

  chrome.runtime.onMessage.addListener(window.__ML_AFILIADO_MSG_LISTENER__);

  // =========================================================================
  // EXTRAÇÃO DE COMISSÃO REAL DA BARRA DE AFILIADOS DO MERCADO LIVRE
  // =========================================================================
  let cachedAffiliateBarCommission = null;

  /**
   * Extrai a taxa e informações de comissão diretamente da Barra de Afiliados do Mercado Livre (topo da página)
   * Suporta formatos como: "GANHOS EXTRAS 19%", "COMISSÃO 14%", "GANHO 19%"
   */
  function extractAffiliateBarCommission() {
    if (cachedAffiliateBarCommission && cachedAffiliateBarCommission.rate > 0) {
      return cachedAffiliateBarCommission;
    }

    try {
      // -----------------------------------------------------------------------
      // ESTRATÉGIA 1: Buscar diretamente por nós de texto contendo "GANHOS EXTRAS" ou "PATROCINADO POR"
      // No print do usuário: caixa com "GANHOS EXTRAS 19%" e "Patrocinado por LITET"
      // -----------------------------------------------------------------------
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function(node) {
            const val = node.nodeValue;
            if (!val || !val.trim()) return NodeFilter.FILTER_REJECT;
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            if (parent.closest('#ml-afiliado-floating-btn, #ml-afiliado-modal-overlay, .ui-pdp-description, .ui-pdp-reviews, footer')) {
              return NodeFilter.FILTER_REJECT;
            }
            if (/ganhos?\s+extras?/i.test(val) || /patrocinado\s+por/i.test(val)) {
              return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_SKIP;
          }
        }
      );

      let foundNode;
      const targetNodes = [];
      while (foundNode = walker.nextNode()) {
        targetNodes.push(foundNode.parentElement);
      }

      for (const el of targetNodes) {
        let cur = el;
        for (let depth = 0; depth < 5 && cur && cur !== document.body; depth++) {
          const text = cur.innerText || cur.textContent || '';
          const m = text.match(/(\d+(?:[.,]\d+)?)\s*%/);
          if (m) {
            const rate = parseFloat(m[1].replace(',', '.'));
            if (rate > 0 && rate <= 70) {
              console.log('[Afiliado ML] ✅ Taxa de Ganhos Extras extraída com sucesso (Estratégia 1):', rate + '%');
              cachedAffiliateBarCommission = {
                rate,
                ratePercent: `${rate}%`,
                label: 'Ganhos Extras',
                isBonus: true
              };
              return cachedAffiliateBarCommission;
            }
          }
          cur = cur.parentElement;
        }
      }

      // -----------------------------------------------------------------------
      // ESTRATÉGIA 2: Barra de Afiliados ao redor do botão azul "Compartilhar"
      // O botão "Compartilhar" da barra fica logo ao lado da caixa "GANHOS EXTRAS 19%"
      // -----------------------------------------------------------------------
      const buttons = Array.from(document.querySelectorAll('button, div[role="button"], a.andes-button, a[role="button"], span[role="button"]'));
      const shareBtn = buttons.find(b => {
        if (b.closest('.ui-pdp-share, [class*="ui-pdp-share"], .ui-pdp-buybox, .ui-pdp-gallery, #ml-afiliado-floating-btn, #ml-afiliado-modal-overlay')) {
          return false;
        }
        const txt = (b.innerText || b.textContent || '').trim().toLowerCase();
        return txt === 'compartilhar' || txt === 'share';
      });

      if (shareBtn) {
        let cur = shareBtn.parentElement;
        for (let depth = 0; depth < 6 && cur && cur !== document.body; depth++) {
          const pText = cur.innerText || cur.textContent || '';
          const m = pText.match(/(\d+(?:[.,]\d+)?)\s*%/);
          if (m) {
            const rate = parseFloat(m[1].replace(',', '.'));
            if (rate > 0 && rate <= 70) {
              const isExtra = /extra/i.test(pText);
              console.log('[Afiliado ML] ✅ Taxa de comissão extraída via botão Compartilhar (Estratégia 2):', rate + '%');
              cachedAffiliateBarCommission = {
                rate,
                ratePercent: `${rate}%`,
                label: isExtra ? 'Ganhos Extras' : 'Barra Afiliado',
                isBonus: isExtra
              };
              return cachedAffiliateBarCommission;
            }
          }
          cur = cur.parentElement;
        }
      }

      // -----------------------------------------------------------------------
      // ESTRATÉGIA 3: Varredura dos containers superiores (header, nav, toolbar, stripe)
      // -----------------------------------------------------------------------
      const topContainers = Array.from(document.querySelectorAll(
        'header, nav, [class*="stripe" i], [class*="affiliate" i], [id*="stripe" i], [id*="affiliate" i], [class*="toolbar" i], [role="banner"]'
      ));

      for (const container of topContainers) {
        if (container.closest('.ui-pdp-description, .ui-pdp-reviews, footer, #ml-afiliado-floating-btn, #ml-afiliado-modal-overlay')) continue;
        const text = (container.innerText || container.textContent || '').trim();
        if (!text || text.length > 3000) continue;

        const lower = text.toLowerCase();
        if (lower.includes('afiliado') || lower.includes('ganho') || lower.includes('métrica') || lower.includes('patrocinado')) {
          const m = text.match(/(?:ganhos?\s+extras?|comiss(?:ã|a)o|você\s+ganha|ganho)[^\d%]{0,40}(\d+(?:[.,]\d+)?)\s*%/i) ||
                    text.match(/(\d+(?:[.,]\d+)?)\s*%\s*(?:de\s+)?(?:ganhos?\s+extras?|comiss(?:ã|a)o)/i) ||
                    text.match(/(\d+(?:[.,]\d+)?)\s*%/);
          if (m) {
            const rate = parseFloat(m[1].replace(',', '.'));
            if (rate > 0 && rate <= 70) {
              console.log('[Afiliado ML] ✅ Taxa de comissão encontrada no header/nav (Estratégia 3):', rate + '%');
              cachedAffiliateBarCommission = {
                rate,
                ratePercent: `${rate}%`,
                label: lower.includes('extra') ? 'Ganhos Extras' : 'Barra Afiliado',
                isBonus: lower.includes('extra')
              };
              return cachedAffiliateBarCommission;
            }
          }
        }
      }

      // -----------------------------------------------------------------------
      // ESTRATÉGIA 4: Varredura em elementos curtos contendo "GANHOS EXTRAS"
      // -----------------------------------------------------------------------
      const allElements = document.querySelectorAll('div, span, p, b, strong, a');
      for (const el of allElements) {
        if (el.children.length > 3) continue;
        if (el.closest('.ui-pdp-description, .ui-pdp-reviews, footer, #ml-afiliado-floating-btn, #ml-afiliado-modal-overlay')) continue;
        const text = (el.innerText || el.textContent || '').trim();
        if (/ganhos?\s+extras?/i.test(text)) {
          const parent = el.parentElement;
          if (parent) {
            const m = (parent.innerText || parent.textContent || '').match(/(\d+(?:[.,]\d+)?)\s*%/);
            if (m) {
              const rate = parseFloat(m[1].replace(',', '.'));
              if (rate > 0 && rate <= 70) {
                console.log('[Afiliado ML] ✅ Taxa encontrada na varredura global (Estratégia 4):', rate + '%');
                cachedAffiliateBarCommission = {
                  rate,
                  ratePercent: `${rate}%`,
                  label: 'Ganhos Extras',
                  isBonus: true
                };
                return cachedAffiliateBarCommission;
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('[Afiliado ML] Erro ao extrair comissão da barra de afiliados:', err);
    }

    return null;
  }

  // =========================================================================
  // EXTRAÇÃO DE PRODUTO DA PÁGINA ATUAL (PDP)
  // =========================================================================
  function extractCurrentPageProduct() {
    // 1. Título
    let title = '';
    const titleEl = document.querySelector('h1.ui-pdp-title, h1[class*="title"], h1, .ui-pdp-header__title-container h1');
    if (titleEl) {
      title = titleEl.textContent.trim();
    }
    if (!title) {
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle && ogTitle.content) title = ogTitle.content.split('|')[0].trim();
    }
    if (!title) {
      title = document.title.split('|')[0].replace(/no Mercado Livre.*/i, '').trim();
    }
    if (!title || title.length < 3) return null;

    // 2. Preço: Original Riscado e Promocional Atual
    let price = 'Consulte';
    let rawPrice = 0;
    let originalPrice = '';
    let rawOriginalPrice = 0;

    // Encontra o container principal de preço da PDP
    const mainPriceContainer = document.querySelector(
      '.ui-pdp-price, .ui-vip-core-price, .ui-pdp-header__price-container, .ui-pdp-container__row--price, [class*="price-block"]'
    ) || document.querySelector('.ui-pdp-container') || document;

    // A. Preço Cheio Riscado (Previous / Original) da PDP
    // IMPORTANTE: Busca EXCLUSIVAMENTE dentro do container de preço da PDP
    // e ignora qualquer carrossel de recomendações, produtos similares ou rodapé
    const prevMoneyEls = Array.from(mainPriceContainer.querySelectorAll(
      '.ui-pdp-price__original-value, s.andes-money-amount, [class*="price--previous"], s .andes-money-amount, del .andes-money-amount, .andes-money-amount--previous'
    )).filter(el => !el.closest('.ui-recommendations, .ui-vip-recommendations, footer, .ui-pdp-description, .ui-pdp-reviews, aside'));

    for (const prevEl of prevMoneyEls) {
      const pFrac = prevEl.querySelector('.andes-money-amount__fraction, .price-tag-fraction');
      const pCents = prevEl.querySelector('.andes-money-amount__cents');
      if (pFrac) {
        const f = pFrac.textContent.replace(/\./g, '').trim();
        const c = pCents ? pCents.textContent.trim() : '00';
        const num = parseFloat(`${f}.${c}`) || 0;
        if (num > 0) {
          rawOriginalPrice = num;
          originalPrice = `R$ ${pFrac.textContent.trim()}${pCents && pCents.textContent.trim() ? ',' + pCents.textContent.trim() : ''}`;
          break; // O primeiro preço riscado encontrado no bloco de preço da PDP é o preço cheio deste produto!
        }
      }
    }

    // B. Preço Promocional Atual (Second line / Principal)
    let currentMoneyEl = mainPriceContainer.querySelector('.ui-pdp-price__second-line .andes-money-amount');
    
    if (!currentMoneyEl) {
      const allMoney = Array.from(mainPriceContainer.querySelectorAll('.andes-money-amount, .price-tag'));
      currentMoneyEl = allMoney.find(el => {
        if (el.closest('s, del, strike, [class*="original"], [class*="previous"]')) return false;
        if (el.closest('[class*="installment"], [class*="parcel"], [class*="cuotas"], [class*="cashback"], [class*="rebate"]')) return false;
        if (el.closest('.ui-recommendations, .ui-vip-recommendations, footer, .ui-pdp-description, .ui-pdp-reviews, aside')) return false;
        return true;
      });
    }

    if (currentMoneyEl) {
      const fracEl = currentMoneyEl.querySelector('.andes-money-amount__fraction, .price-tag-fraction');
      const centsEl = currentMoneyEl.querySelector('.andes-money-amount__cents');
      if (fracEl) {
        const fNum = fracEl.textContent.replace(/\./g, '').trim();
        const cNum = centsEl ? centsEl.textContent.trim() : '00';
        rawPrice = parseFloat(`${fNum}.${cNum}`) || 0;
        price = `R$ ${fracEl.textContent.trim()}${centsEl && centsEl.textContent.trim() ? ',' + centsEl.textContent.trim() : ''}`;
      }
    }

    // Fallback: se ainda não encontrou ou se o preço deu zero, busca meta tags ou JSON-LD
    if (!rawPrice || rawPrice === 0) {
      const metaPrice = document.querySelector('meta[itemprop="price"], meta[property="product:price:amount"]');
      if (metaPrice && metaPrice.content) {
        rawPrice = parseFloat(metaPrice.content) || 0;
        if (rawPrice > 0) {
          price = `R$ ${rawPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        }
      }
    }

    // JSON-LD verificação adicional para garantir preço promocional correto
    if (!rawPrice || rawPrice === 0) {
      try {
        const jsonLds = document.querySelectorAll('script[type="application/ld+json"]');
        for (const s of jsonLds) {
          const data = JSON.parse(s.textContent);
          const items = Array.isArray(data) ? data : [data];
          for (const item of items) {
            if (item['@type'] === 'Product' && item.offers) {
              const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
              const p = parseFloat(offers.price || offers.lowPrice);
              if (p > 0) {
                rawPrice = p;
                price = `R$ ${rawPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                break;
              }
            }
          }
          if (rawPrice > 0) break;
        }
      } catch (e) {}
    }

    // Validação de Preço Cheio vs Promocional
    if (originalPrice === price || rawOriginalPrice <= rawPrice) {
      originalPrice = '';
      rawOriginalPrice = 0;
    }

    // 3. Detecção de Mídia Robusta (Imagens e Vídeos - Resiliente a produtos com vídeo como 1ª mídia)
    let imageUrl = '';
    let videoUrl = '';
    let videoPoster = '';
    let hasVideo = false;

    // A. Detecta se a página ou galeria contém vídeo
    const videoEl = document.querySelector('.ui-pdp-gallery video, .ui-pdp-video video, video, .andes-video-player video, [data-video] video');
    if (videoEl) {
      hasVideo = true;
      videoUrl = videoEl.src || videoEl.querySelector('source')?.src || videoEl.getAttribute('data-src') || '';
      videoPoster = videoEl.getAttribute('poster') || videoEl.poster || '';
    } else if (document.querySelector('.ui-pdp-video, [class*="ui-pdp-video"], [class*="pdp-video"], [data-video]')) {
      hasVideo = true;
      const iframeEl = document.querySelector('.ui-pdp-video iframe, [class*="ui-pdp-video"] iframe, iframe[src*="youtube"]');
      if (iframeEl) videoUrl = iframeEl.src || '';
    }

    // B. Prioridade 1: Schema.org JSON-LD (Fotos oficiais do anúncio registradas no ML - Nunca falha!)
    try {
      const jsonLds = document.querySelectorAll('script[type="application/ld+json"]');
      for (const s of jsonLds) {
        const data = JSON.parse(s.textContent);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (item['@type'] === 'Product' && item.image) {
            const imgs = Array.isArray(item.image) ? item.image : [item.image];
            for (const imgCandidate of imgs) {
              if (typeof imgCandidate === 'string' && imgCandidate.startsWith('http') && 
                  !imgCandidate.includes('logo_') && !imgCandidate.endsWith('.mp4') && !imgCandidate.endsWith('.webm')) {
                imageUrl = imgCandidate.trim();
                break;
              }
            }
          }
          if (imageUrl) break;
        }
        if (imageUrl) break;
      }
    } catch (e) {}

    // C. Prioridade 2: Video Poster do player de vídeo (se for foto real em alta resolução)
    if (!imageUrl && videoPoster && videoPoster.startsWith('http') && !videoPoster.includes('logo_') && !videoPoster.startsWith('data:')) {
      imageUrl = videoPoster.trim();
    }

    // D. Prioridade 3: Galeria do Mercado Livre (Percorre todas as miniaturas e figuras)
    // Se o 1º item for vídeo, localiza a primeira foto real subsequente na galeria
    if (!imageUrl) {
      const galleryImgs = Array.from(document.querySelectorAll(
        '.ui-pdp-gallery__figure img, img.ui-pdp-image, .ui-pdp-gallery img, [class*="gallery"] img, .ui-pdp-gallery__column img, .andes-carousel-snapped__slide img, span.ui-pdp-gallery__wrapper img, span.andes-thumbnail img'
      ));
      
      for (const gImg of galleryImgs) {
        const zoom = gImg.getAttribute('data-zoom') || '';
        const dataSrc = gImg.getAttribute('data-src') || '';
        const hires = gImg.getAttribute('data-old-hires') || '';
        const src = gImg.src || '';
        
        const candidate = [zoom, dataSrc, hires, src].find(u => {
          if (!u || typeof u !== 'string') return false;
          if (!u.startsWith('http') || u.startsWith('data:')) return false;
          if (u.includes('play-button') || u.includes('play.svg') || u.includes('icon-') || u.includes('logo_') || u.includes('ui-navigation')) return false;
          if (u.endsWith('.mp4') || u.endsWith('.webm')) return false;
          return true;
        });

        if (candidate) {
          // Converte miniatura do ML (-I.webp, -R.webp, -V.webp, etc.) para resolução máxima original (-O.webp)
          imageUrl = candidate.trim().replace(/-[A-Z]\.(webp|jpg|jpeg|png)$/i, '-O.$1');
          break;
        }
      }
    }

    // E. Prioridade 4: Metatags OpenGraph e Twitter (validando contra o logo padrão do Mercado Livre)
    if (!imageUrl) {
      const ogImg = document.querySelector('meta[property="og:image"]');
      if (ogImg && ogImg.content && ogImg.content.startsWith('http') && !ogImg.content.startsWith('data:') && 
          !ogImg.content.includes('logo_') && !ogImg.content.includes('ui-navigation') && !ogImg.content.endsWith('.mp4')) {
        imageUrl = ogImg.content.trim();
      }
    }
    if (!imageUrl) {
      const twImg = document.querySelector('meta[name="twitter:image"]');
      if (twImg && twImg.content && twImg.content.startsWith('http') && !twImg.content.startsWith('data:') && 
          !twImg.content.includes('logo_') && !twImg.content.includes('ui-navigation')) {
        imageUrl = twImg.content.trim();
      }
    }


    // 4. Desconto
    let discount = '';
    let discountPercent = 0;
    const discEl = document.querySelector('.ui-pdp-price__second-line .andes-money-amount__discount, .ui-pdp-price .andes-money-amount__discount, .andes-money-amount__discount, [class*="discount"]');
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

    // 5. Avaliação & Vendas na PDP
    let rating = 0;
    let reviewsCount = '';
    const ratingEl = document.querySelector('.ui-pdp-review__ratings, .ui-pdp-reviews__rating, [class*="review__ratings"], [class*="reviews__rating"], span[class*="rating"]');
    if (ratingEl) {
      const rm = ratingEl.textContent.replace(',', '.').match(/([345](?:\.\d+)?)/);
      if (rm) rating = parseFloat(rm[1]) || 0;
    }
    if (!rating) {
      const ariaEl = document.querySelector('[aria-label*="avaliação" i], [aria-label*="avaliac" i], [aria-label*="estrelas" i], [aria-label*="classificação" i], [aria-label*="classificacao" i]');
      if (ariaEl) {
        const rm = ariaEl.getAttribute('aria-label').replace(',', '.').match(/([345](?:\.\d+)?)/);
        if (rm) rating = parseFloat(rm[1]) || 0;
      }
    }
    const reviewsEl = document.querySelector('.ui-pdp-review__amount, span[class*="review__amount"], [class*="reviews__total"]');
    if (reviewsEl) {
      reviewsCount = reviewsEl.textContent.replace(/[()]/g, '').trim();
    }

    let sales = '';
    let salesCount = 0;
    const subtitleEl = document.querySelector('.ui-pdp-subtitle, span.ui-pdp-buybox__header-text');
    if (subtitleEl) {
      const st = subtitleEl.textContent.trim();
      if (/vendido/i.test(st)) {
        const m = st.match(/(\+?\s*\d+(?:[.,]\d+)?\s*(?:mil)?\s*vendidos|mais\s+vendido[s]?)/i);
        sales = m ? m[0].trim() : (st.length < 35 ? st : '');
        const milM = st.match(/\+?\s*(\d+(?:[.,]\d+)?)\s*mil\s*vendidos/i);
        if (milM) salesCount = parseFloat(milM[1].replace(',', '.')) * 1000;
        else {
          const numM = st.match(/\+?\s*(\d+(?:[.,]\d+)?)\s*vendidos/i);
          if (numM) salesCount = parseInt(numM[1].replace(/\./g, ''), 10);
        }
      }
    }

    const cleanUrl = window.location.href.split('?')[0].split('#')[0];

    // Categoria extraída dos breadcrumbs
    let breadcrumbs = '';
    const breadcrumbEls = document.querySelectorAll('.andes-breadcrumb__item, .ui-pdp-breadcrumb, [class*="breadcrumb"] a');
    if (breadcrumbEls.length > 0) {
      breadcrumbs = Array.from(breadcrumbEls).map(el => el.textContent.trim()).filter(Boolean).join(' > ');
    }

    // 6. Comissão Oficial / Barra de Afiliados
    const affiliateBarComm = extractAffiliateBarCommission();

    let commissionRate = undefined;
    let commissionPercent = '';
    let commissionValue = 0;
    let commissionPrice = '';
    let commissionLabel = '';
    let categoryName = 'Geral';
    let categoryIcon = '🏷️';

    if (affiliateBarComm && affiliateBarComm.rate) {
      commissionRate = affiliateBarComm.rate;
      commissionPercent = affiliateBarComm.ratePercent || `${affiliateBarComm.rate}%`;
      commissionLabel = affiliateBarComm.label || 'Barra Afiliado ML';
      if (rawPrice > 0) {
        commissionValue = (rawPrice * (commissionRate / 100));
        commissionPrice = `R$ ${commissionValue.toFixed(2).replace('.', ',')}`;
      }
    } else if (rawPrice > 0) {
      // Estimativa oficial de comissão por categoria do Mercado Livre
      const fullText = `${title} ${breadcrumbs}`.toLowerCase();
      let rate = 11;
      let cat = 'Mercado Livre';
      let icon = '🟡';

      if (/beleza|perfum|maquiag|skincare|cosm[eé]tic|cabelo/i.test(fullText)) {
        rate = 16;
        cat = 'Beleza e Cuidado Pessoal';
        icon = '💄';
      } else if (/moda|roupa|calcado|calçado|tenis|tênis|vestido|lingerie|baby doll|shorts|pijama|bolsa|mochila/i.test(fullText)) {
        rate = 14;
        cat = 'Moda, Roupas e Calçados';
        icon = '👗';
      } else if (/bebe|bebê|maternidade|fralda|carrinho|chupeta|mamadeira/i.test(fullText)) {
        rate = 14;
        cat = 'Bebês e Maternidade';
        icon = '👶';
      } else if (/esporte|fitness|suplemento|whey|creatina|academia/i.test(fullText)) {
        rate = 14;
        cat = 'Esportes e Fitness';
        icon = '🏋️';
      } else if (/supermercado|alimento|bebida|cafe|café|vinho|cerveja/i.test(fullText)) {
        rate = 14;
        cat = 'Supermercado e Bebidas';
        icon = '🛒';
      } else if (/livro|livros|box livros|manga|mangá|hq/i.test(fullText)) {
        rate = 11;
        cat = 'Livros e Revistas';
        icon = '📚';
      } else if (/eletr[oô]nic|celular|smartphone|tv|gamer|notebook|computador/i.test(fullText)) {
        rate = 8;
        cat = 'Eletrônicos e Celulares';
        icon = '💻';
      }

      commissionRate = rate;
      commissionPercent = `${rate}%`;
      categoryName = cat;
      categoryIcon = icon;
      commissionValue = Math.round((rawPrice * (rate / 100)) * 100) / 100;
      commissionPrice = `R$ ${commissionValue.toFixed(2).replace('.', ',')}`;
    }

    return {
      title,
      price,
      rawPrice,
      originalPrice,
      rawOriginalPrice,
      url: cleanUrl,
      imageUrl: imageUrl || videoPoster || '',
      hasVideo: !!hasVideo,
      videoUrl: videoUrl || '',
      videoPoster: videoPoster || '',
      discount,
      discountPercent,
      rating,
      reviewsCount,
      sales,
      salesCount,
      commissionRate,
      extractedCommissionRate: affiliateBarComm ? affiliateBarComm.rate : undefined,
      commissionPercent,
      commissionValue,
      commissionPrice,
      commissionLabel,
      isBonusCommission: affiliateBarComm ? affiliateBarComm.isBonus : false,
      categoryName,
      categoryIcon,
      breadcrumbs
    };
  }

  // =========================================================================
  // EXTRAÇÃO DE CONTEXTO DE CATEGORIA DA PÁGINA DE BUSCA / LISTA
  // =========================================================================
  function extractPageCategoryContext() {
    let breadcrumbs = '';
    let category = '';

    // 1. Breadcrumbs do Mercado Livre
    const breadcrumbEls = document.querySelectorAll(
      '.andes-breadcrumb__item, .ui-search-breadcrumb, .ui-pdp-breadcrumb, [class*="breadcrumb"] a, [class*="breadcrumb"] li'
    );
    if (breadcrumbEls.length > 0) {
      breadcrumbs = Array.from(breadcrumbEls)
        .map(el => el.textContent.trim())
        .filter(t => t && !/^(in[ií]cio|home|mercado livre|voltar)/i.test(t))
        .join(' > ');
    }

    // 2. Título de busca / Container da lista (Ex: "tudo para seu bebe", "Bebês")
    const searchTitleEl = document.querySelector(
      '.ui-search-breadcrumb__title, .ui-search-search-result__title, h1.ui-search-breadcrumb__title, h1[class*="search"], h1'
    );
    if (searchTitleEl) {
      const titleText = searchTitleEl.textContent.trim();
      if (titleText && titleText.length > 2 && titleText.length < 80) {
        breadcrumbs = breadcrumbs ? `${breadcrumbs} > ${titleText}` : titleText;
      }
    }

    // 3. Extração da URL (Ex: lista.mercadolivre.com.br/_Container_lpsb tudo para seu bebe)
    try {
      const decodedUrl = decodeURIComponent(window.location.href);
      const urlMatches = decodedUrl.match(/(?:_Container_lpsb\s*|lista\.mercadolivre\.com\.br\/)([a-zA-Z0-9\s\-_+]+)/i);
      if (urlMatches && urlMatches[1]) {
        const urlCatPart = urlMatches[1].replace(/[_\-+]/g, ' ').trim();
        if (urlCatPart && !/^(jm|search|c$)/i.test(urlCatPart) && urlCatPart.length > 2) {
          if (!breadcrumbs) {
            breadcrumbs = urlCatPart;
          } else if (!breadcrumbs.toLowerCase().includes(urlCatPart.toLowerCase())) {
            breadcrumbs = `${breadcrumbs} > ${urlCatPart}`;
          }
        }
      }
    } catch (e) {}

    // 4. Input de busca
    const searchInput = document.querySelector('input.nav-search-input, input[name="as_word"]');
    if (searchInput && searchInput.value && searchInput.value.trim()) {
      const query = searchInput.value.trim();
      if (!breadcrumbs.toLowerCase().includes(query.toLowerCase())) {
        breadcrumbs = breadcrumbs ? `${breadcrumbs} > ${query}` : query;
      }
    }

    return { breadcrumbs, category };
  }

  // =========================================================================
  // EXTRAÇÃO DE PRODUTOS DE PÁGINA DE BUSCA E PORTAL DE AFILIADOS (LISTA COMPLETA)
  // =========================================================================
  async function extractSearchPageProductsWithRetry(maxWaitMs = 1800) {
    let prods = extractSearchPageProducts();
    if (prods.length > 0 || !window.location.href.includes('/afiliados')) {
      return prods;
    }
    // No Portal de Afiliados, aguarda renderização assíncrona de ofertas caso necessário
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      await new Promise(r => setTimeout(r, 300));
      prods = extractSearchPageProducts();
      if (prods.length > 0) break;
    }
    return prods;
  }

  function extractSearchPageProducts() {
    // Se a aba for uma PDP (página de produto individual / anúncio), jamais extrai carrossel ou variações como busca
    if (document.querySelector('.ui-pdp-title, #ui-pdp-main-container, .ui-pdp-container, .ui-pdp-price') ||
        window.location.href.includes('/p/MLB') ||
        window.location.href.includes('/up/') ||
        window.location.href.includes('/item/') ||
        window.location.href.includes('MLB-') ||
        /\/MLB\d+/i.test(window.location.href)) {
      return [];
    }

    const list = [];
    const seen = new Set();
    const pageContext = extractPageCategoryContext();

    // 1. Seleciona cards de layouts padrão do Mercado Livre, componentes Andes/Poly e containers de afiliados
    let cards = Array.from(document.querySelectorAll(
      'li.ui-search-layout__item, .poly-card, div.ui-search-result__wrapper, div[class*="poly-card"], div.andes-card, div[class*="andes-card"], section.ui-search-results li, div[class*="ui-recommendations-card"], div[class*="recommendation"], div[class*="affiliate"], div[class*="afiliado"], div[class*="campaign"], div[class*="product-card"], div[class*="ProductCard"], div[role="listitem"], [data-testid*="product"], [data-testid*="card"], [data-testid*="item"]'
    ));

    // 2. Descoberta complementar de cards por links de produtos (essencial para o Portal de Afiliados e carrosséis)
    const productLinks = document.querySelectorAll(
      'a[href*="/MLB-"], a[href*="/p/MLB"], a[href*="produto.mercadolivre.com.br"], a[href*="/MLB"], a[href*="mercadolivre.com.br/MLB"]'
    );
    const cardSet = new Set(cards);
    for (const a of productLinks) {
      if (a.closest('header, nav, footer, #ml-afiliado-floating-btn, #ml-afiliado-modal-overlay')) continue;
      const c = a.closest(
        '.poly-card, .andes-card, [class*="andes-card"], [class*="card" i], [class*="item" i], [class*="product" i], [class*="recommendation" i], [class*="affiliate" i], [class*="afiliado" i], [role="listitem"], li, tr, article'
      ) || a.parentElement;
      if (c && !cardSet.has(c)) {
        cardSet.add(c);
        cards.push(c);
      }
    }

    for (const card of cards) {
      // 1. Título do produto com seletores resilientes para listas e carrosséis
      let title = '';
      const titleEl = card.querySelector(
        '.poly-component__title, .ui-search-item__title, [class*="component__title"], [class*="card__title"], [class*="item__title"], [class*="product__title"], [class*="product-title"], [class*="title" i], h2, h3, h4'
      );
      if (titleEl && titleEl.textContent.trim()) {
        title = titleEl.textContent.trim();
      } else {
        const linkWithTitle = card.querySelector('a[title]');
        if (linkWithTitle && linkWithTitle.getAttribute('title')) {
          title = linkWithTitle.getAttribute('title').trim();
        } else {
          const imgEl = card.querySelector('img[alt]');
          if (imgEl && imgEl.alt && imgEl.alt.length > 3) {
            title = imgEl.alt.trim();
          }
        }
      }

      const linkEl = card.querySelector('a.poly-component__title, a.ui-search-link') ||
                     card.querySelector('a[href*="/MLB-"], a[href*="/p/MLB"]') ||
                     card.querySelector('a[href*="produto.mercadolivre.com.br"], a[href*="/MLB"]') ||
                     titleEl?.closest('a') ||
                     (card.tagName === 'A' ? card : null) ||
                     card.querySelector('a[href*="mercadolivre.com.br"]');
      if (!linkEl || !linkEl.href) continue;

      const cleanUrl = linkEl.href.split('?')[0].split('#')[0];
      if (seen.has(cleanUrl)) continue;
      seen.add(cleanUrl);

      if (!title) {
        title = linkEl.textContent.trim() || 'Produto Mercado Livre';
      }
      // Limpa eventuais prefixos ou sufixos de ações (ex: "OFERTA IMPERDÍVEL", "Copiar link")
      title = title.replace(/^(?:OFERTA IMPERDÍVEL|MAIS VENDIDO|PATROCINADO|NOVO|GANHOS?\s+EXTRAS?\s*\d*%?)\s*/i, '').trim();
      title = title.replace(/(?:copiar\s+link|compartilhar|gerar\s+link|ver\s+produto)\s*$/i, '').trim();

      // Extrai marca do produto se disponível no card (ex: "Litet", "Pampers")
      const brandEl = card.querySelector('.poly-component__brand, [class*="brand"], [class*="seller"]');
      const brand = brandEl ? brandEl.textContent.trim() : '';

      const imgEl = card.querySelector('img');
      let imageUrl = '';
      if (imgEl) {
        const candidates = [
          imgEl.getAttribute('data-src'),
          imgEl.getAttribute('data-lazy-src'),
          imgEl.dataset ? imgEl.dataset.src : null,
          imgEl.src
        ];
        imageUrl = candidates.find(u => u && typeof u === 'string' && u.startsWith('http') && !u.startsWith('data:')) || '';
        if (!imageUrl && imgEl.srcset) {
          const parts = imgEl.srcset.split(',').map(p => p.trim().split(' ')[0]);
          imageUrl = parts.find(u => u && u.startsWith('http') && !u.startsWith('data:')) || '';
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

      // Fallback: se achou prevEl mas não currentEl
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
          }
        }
      }

      // Fallback para páginas do portal de afiliados que exibem preços em texto puro (ex: "R$ 89,90")
      if (!rawPrice || price === 'Consulte') {
        const textPrices = Array.from((card.innerText || card.textContent || '').matchAll(/R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)/g));
        if (textPrices.length > 0) {
          if (textPrices.length >= 2) {
            const p1 = textPrices[0][1];
            const p2 = textPrices[1][1];
            const v1 = parseFloat(p1.replace(/\./g, '').replace(',', '.'));
            const v2 = parseFloat(p2.replace(/\./g, '').replace(',', '.'));
            if (v1 > v2) {
              originalPrice = `R$ ${p1}`;
              rawOriginalPrice = v1;
              price = `R$ ${p2}`;
              rawPrice = v2;
            } else {
              price = `R$ ${p1}`;
              rawPrice = v1;
            }
          } else {
            price = `R$ ${textPrices[0][1]}`;
            rawPrice = parseFloat(textPrices[0][1].replace(/\./g, '').replace(',', '.'));
          }
        }
      }

      // Se originalPrice for igual ao price ou menor, não há desconto
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

      // 4. Avaliação (Estrelas ⭐) e Reviews
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

      // 5. Vendas: extração precisa sem capturar texto de elementos pai
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

      // 6. Cálculo da Comissão Oficial com Contexto de Categoria e Marca
      let comm = { rate: 9, ratePercent: '9%', value: 0, valueFormatted: 'R$ 0,00', categoryName: 'Geral', categoryIcon: '🏷️', label: '', isBonus: false };

      // Se o card do portal de afiliados tiver indicação explícita de comissão ou ganhos extras (ex: "GANHOS EXTRAS 19%")
      const cardRawText = card.innerText || card.textContent || '';
      const bonusMatch = cardRawText.match(/ganhos?\s+extras?\s*(?:de\s*)?(\d+(?:[.,]\d+)?)\s*%/i) ||
                         cardRawText.match(/comiss[aã]o\s*(?:de\s*)?(\d+(?:[.,]\d+)?)\s*%/i) ||
                         cardRawText.match(/(\d+(?:[.,]\d+)?)\s*%\s*(?:de\s*)?(?:comiss[aã]o|ganhos?\s+extras?)/i);

      if (bonusMatch) {
        const rate = parseFloat(bonusMatch[1].replace(',', '.'));
        if (rate > 0) {
          const val = rawPrice ? (rawPrice * (rate / 100)) : 0;
          comm = {
            rate: rate,
            ratePercent: `${rate}%`,
            value: Math.round(val * 100) / 100,
            valueFormatted: `R$ ${val.toFixed(2).replace('.', ',')}`,
            categoryName: 'Ganhos Extras',
            categoryIcon: '⭐',
            label: bonusMatch[0].trim(),
            isBonus: true
          };
        }
      } else if (typeof MLCommission !== 'undefined') {
        comm = MLCommission.calculateCommission({
          title,
          rawPrice,
          price,
          brand,
          breadcrumbs: pageContext.breadcrumbs,
          category: pageContext.category
        });
      }

      list.push({
        title,
        price,
        rawPrice,
        originalPrice,
        rawOriginalPrice,
        url: cleanUrl,
        imageUrl: imageUrl || '',
        discount,
        discountPercent,
        rating,
        reviewsCount,
        sales,
        salesCount,
        brand,
        breadcrumbs: pageContext.breadcrumbs,
        commissionRate: comm.rate,
        commissionPercent: comm.ratePercent,
        commissionValue: comm.value,
        commissionPrice: comm.valueFormatted,
        commissionLabel: comm.label || '',
        isBonusCommission: comm.isBonus || false,
        categoryName: comm.categoryName,
        categoryIcon: comm.categoryIcon
      });
    }

    return list;
  }

  // =========================================================================
  // GERAÇÃO OFICIAL DE LINK meli.la
  // =========================================================================
  async function generateMeliLaLink(productUrl, affiliateTag) {
    const cleanTag = (affiliateTag || '').trim();

    // 1. MÉTODO A: Procura meli.la já presente no DOM (inputs, textareas, links, parágrafos)
    const existingElements = Array.from(document.querySelectorAll('input, textarea, a, p, span'));
    for (const el of existingElements) {
      const val = (el.value || el.href || el.textContent || '').trim();
      const match = val.match(/https?:\/\/meli\.la\/[a-zA-Z0-9_\-]+/i);
      if (match) {
        console.log('[Afiliado ML] Link meli.la encontrado no DOM da página:', match[0]);
        return match[0];
      }
    }

    // 2. MÉTODO B: Clica no botão "Compartilhar" nativo da Barra de Afiliados do ML
    try {
      const shareBtn = await findAffiliateStripeShareButtonWithRetry(8000);

      if (shareBtn) {
        console.log('[Afiliado ML] Acionando botão da Barra de Afiliados:', shareBtn.textContent.trim());
        shareBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        shareBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
        shareBtn.click();

        // Aguarda e monitora a abertura do modal e a chegada do link meli.la por até 8 segundos
        const startWait = Date.now();

        while (Date.now() - startWait < 8000) {
          await new Promise(r => setTimeout(r, 200));

          // A. Verifica inputs e textareas do modal
          const modalInputs = Array.from(document.querySelectorAll('input, textarea'));
          for (const input of modalInputs) {
            const val = (input.value || input.getAttribute('value') || '').trim();
            const match = val.match(/https?:\/\/meli\.la\/[a-zA-Z0-9_\-]+/i);
            if (match) {
              console.log('[Afiliado ML] ✅ Link meli.la extraído do modal:', match[0]);
              closeModalSafely();
              return match[0];
            }
          }

          // B. Verifica texto geral do modal ou diálogos
          const modalEls = Array.from(document.querySelectorAll('.andes-modal, div[role="dialog"], [class*="modal"], div[class*="portal"]'));
          for (const modalEl of modalEls) {
            const match = (modalEl.innerText || modalEl.textContent || '').match(/https?:\/\/meli\.la\/[a-zA-Z0-9_\-]+/i);
            if (match) {
              console.log('[Afiliado ML] ✅ Link meli.la extraído do texto do modal:', match[0]);
              closeModalSafely();
              return match[0];
            }

            // Se o modal abriu, clica no botão de cópia dentro do modal
            if (Date.now() - startWait > 600) {
              const copyBtns = Array.from(modalEl.querySelectorAll('button, div[role="button"], svg, span, [class*="copy"]'));
              for (const cb of copyBtns) {
                const aria = (cb.getAttribute('aria-label') || cb.getAttribute('title') || '').toLowerCase();
                const txt = (cb.innerText || cb.textContent || '').toLowerCase();
                if (aria.includes('copiar') || aria.includes('copy') || txt.includes('copiar')) {
                  try { cb.click(); } catch (e) {}
                }
              }
            }
          }

          // C. Tenta ler o clipboard se disponível
          try {
            if (navigator.clipboard && navigator.clipboard.readText) {
              const clipText = await navigator.clipboard.readText();
              const clipMatch = (clipText || '').match(/https?:\/\/meli\.la\/[a-zA-Z0-9_\-]+/i);
              if (clipMatch) {
                console.log('[Afiliado ML] ✅ Link meli.la obtido do clipboard:', clipMatch[0]);
                closeModalSafely();
                return clipMatch[0];
              }
            }
          } catch(cErr) {}
        }
        closeModalSafely();
      }
    } catch (e) {
      console.warn('[Afiliado ML] Tentativa via botão Compartilhar:', e);
    }

    // 3. MÉTODO C: Fallback via API com URL limpa e credenciais
    const cleanUrl = productUrl.split('?')[0].split('#')[0];
    let csrf = '';
    const match = document.cookie.match(/(?:^|;\s*)_csrf=([^;]+)/);
    if (match) csrf = decodeURIComponent(match[1]);

    const endpoints = [
      window.location.origin + '/affiliate-program/api/v2/stripe/user/links',
      'https://www.mercadolivre.com.br/affiliate-program/api/v2/stripe/user/links',
      'https://www.mercadolivre.com.br/affiliate-program/api/v1/stripe/user/links'
    ];

    const tagsToTry = Array.from(new Set([cleanTag, cleanTag.toUpperCase(), cleanTag.toLowerCase(), '']));
    for (const ep of endpoints) {
      for (const tagOption of tagsToTry) {
        try {
          const bodyPayload = tagOption ? { url: cleanUrl, tag: tagOption } : { url: cleanUrl };
          const response = await fetch(ep, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'accept': 'application/json, text/plain, */*',
              'content-type': 'application/json',
              ...(csrf ? { 'x-csrf-token': csrf } : {})
            },
            body: JSON.stringify(bodyPayload)
          });

          if (response.ok) {
            const data = await response.json();
            if (data && data.short_url) {
              console.log('[Afiliado ML] Link meli.la gerado via API:', data.short_url);
              return data.short_url;
            }
          }
        } catch (err) {}
      }
    }

    throw new Error('Não foi possível obter o link meli.la.');
  }

  function closeModalSafely() {
    try {
      const closeBtn = document.querySelector('button.andes-modal__close-button, button[aria-label*="Fechar"], button[aria-label*="Close"], .andes-modal .andes-button--transparent');
      if (closeBtn) closeBtn.click();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }));
    } catch (e) {}
  }

  /**
   * Localiza especificamente o botão azul "Compartilhar" na barra preta de afiliados (topo da página)
   * Ignora terminantemente os botões de compartilhamento social da própria PDP (.ui-pdp-share)
   */
  async function findAffiliateStripeShareButtonWithRetry(timeoutMs = 8000) {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      // Prioridade 1: elemento dentro da barra preta de afiliados (contendo "afiliados", "ganhos", etc.)
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
          if (found) {
            console.log('[Afiliado ML] Botão azul "Compartilhar" encontrado diretamente na Barra de Afiliados!');
            return found;
          }
        }
      }

      // Prioridade 2: qualquer botão cujo texto seja EXATAMENTE "Compartilhar" e que NÃO esteja na PDP
      const allButtons = Array.from(document.querySelectorAll('button, div[role="button"], a.andes-button, a[role="button"], span[role="button"]'));
      const nonPdpButton = allButtons.find(b => {
        if (b.closest(
          '.ui-pdp-share, [class*="ui-pdp-share"], .ui-pdp-header, .ui-pdp-buybox, ' +
          '.ui-pdp-gallery, #ml-afiliado-floating-btn, #ml-afiliado-modal-overlay'
        )) {
          return false;
        }

        const txt = (b.innerText || b.textContent || '').trim().toLowerCase();
        return txt === 'compartilhar' || txt === 'share';
      });

      if (nonPdpButton) {
        console.log('[Afiliado ML] Botão de compartilhamento de afiliado localizado fora da PDP:', nonPdpButton);
        return nonPdpButton;
      }

      await new Promise(r => setTimeout(r, 250));
    }

    return null;
  }

  // =========================================================================
  // UI IN-PAGE: BOTÃO FLUTUANTE DE DISPARO RÁPIDO NO MERCADO LIVRE
  // =========================================================================

  /**
   * Monitora a página para detectar a Barra de Afiliados do Mercado Livre que renderiza assincronamente
   */
  function monitorAffiliateStripe() {
    let attempts = 0;
    const maxAttempts = 16; // 16 x 500ms = 8 segundos
    const timer = setInterval(() => {
      attempts++;
      const barComm = extractAffiliateBarCommission();
      if (barComm) {
        clearInterval(timer);
        updateFloatingButtonCommission();
      } else if (attempts >= maxAttempts) {
        clearInterval(timer);
      }
    }, 500);
  }

  /**
   * Atualiza o pill de comissão do botão flutuante quando a barra de afiliados carrega
   */
  function updateFloatingButtonCommission() {
    const updated = extractCurrentPageProduct();
    if (!updated) return;
    const pill = document.querySelector('#ml-afiliado-floating-btn .ml-float-comm-pill');
    if (pill) {
      const labelPart = updated.commissionLabel ? ` • ${updated.commissionLabel}` : '';
      pill.innerHTML = `💰 Ganho: <b>${escapeHtml(updated.commissionPrice || 'R$ 0,00')}</b> (${escapeHtml(updated.commissionPercent || '0%')}${escapeHtml(labelPart)})`;
    }
  }

  async function initInPageUI() {
    // 1. Inicia monitoramento assíncrono da barra de afiliados
    monitorAffiliateStripe();

    // 2. Se estiver numa página de produto (PDP)
    const product = extractCurrentPageProduct();
    if (product && !document.getElementById('ml-afiliado-floating-btn')) {
      createFloatingProductButton(product);
    }

    // 3. Se estiver numa página de busca ou no Portal de Afiliados
    injectSearchCardButtons();
    if (window.location.href.includes('/afiliados')) {
      setInterval(injectSearchCardButtons, 2500);
      window.addEventListener('scroll', () => {
        setTimeout(injectSearchCardButtons, 400);
      }, { passive: true });
    }
  }

  /**
   * Cria o botão flutuante discreto e moderno no canto inferior direito
   */
  function createFloatingProductButton(product) {
    const btn = document.createElement('div');
    btn.id = 'ml-afiliado-floating-btn';
    const labelPart = product.commissionLabel ? ` • ${product.commissionLabel}` : '';
    btn.innerHTML = `
      <div class="ml-float-content">
        <svg viewBox="0 0 24 24" class="ml-float-wa-icon">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z"/>
        </svg>
        <div class="ml-float-text-box">
          <span class="ml-float-main-text">⚡ Disparar Oferta WhatsApp</span>
          <span class="ml-float-comm-pill">💰 Ganho: <b>${escapeHtml(product.commissionPrice || 'R$ 0,00')}</b> (${escapeHtml(product.commissionPercent || '0%')}${escapeHtml(labelPart)})</span>
        </div>
      </div>
    `;

    btn.addEventListener('click', () => {
      // Re-extrai na hora do clique para garantir dados mais recentes da barra de afiliados e promoções
      const freshProduct = extractCurrentPageProduct() || product;
      openQuickDispatchModal(freshProduct);
    });
    document.body.appendChild(btn);
  }

  /**
   * Abre o modal de disparo rápido in-page
   */
  async function openQuickDispatchModal(product) {
    // Remove modal anterior se existir
    const existing = document.getElementById('ml-afiliado-modal-overlay');
    if (existing) existing.remove();

    // Carrega dados salvos
    let groups = [];
    let affiliateTag = '';
    let pinnedGroup = '';
    let isFavorited = false;

    try {
      const data = await chrome.storage.local.get(['ml_whatsapp_groups', 'ml_affiliate_tag', 'ml_pinned_group', 'ml_favorite_offers']);
      groups = Array.isArray(data.ml_whatsapp_groups) ? data.ml_whatsapp_groups : [];
      affiliateTag = data.ml_affiliate_tag || '';
      pinnedGroup = data.ml_pinned_group || '';

      const favList = Array.isArray(data.ml_favorite_offers) ? data.ml_favorite_offers : [];
      const cleanUrl = (product.url || window.location.href).split('?')[0].split('#')[0];
      isFavorited = favList.some(f => f.url && f.url.split('?')[0].split('#')[0] === cleanUrl);
    } catch (e) {}

    const overlay = document.createElement('div');
    overlay.id = 'ml-afiliado-modal-overlay';

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

    const labelPart = product.commissionLabel ? ` • ${product.commissionLabel}` : '';
    const isInitiallyPinned = pinnedGroup && groups.includes(pinnedGroup);

    overlay.innerHTML = `
      <div class="ml-afiliado-modal-card">
        <div class="ml-modal-header">
          <div class="ml-modal-title-row">
            <span class="ml-modal-badge">⚡ AFILIADO ML</span>
            <span class="ml-modal-title">Disparar Oferta</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <button id="mlModalFavBtn" class="ml-modal-pin-btn ${isFavorited ? 'active' : ''}" style="margin-right:4px;" title="Salvar / Remover dos Favoritos" type="button">
              <span id="mlModalFavIcon">${isFavorited ? '★' : '⭐'}</span> <span id="mlModalFavText">${isFavorited ? 'Favoritado' : 'Favoritar'}</span>
            </button>
            <button class="ml-modal-close" id="mlModalClose">&times;</button>
          </div>
        </div>

        <div class="ml-modal-product">
          <div style="position:relative;display:inline-block;flex-shrink:0;">
            <img src="${product.imageUrl || ''}" class="ml-modal-img" alt="Produto" onerror="this.style.display='none'">
            ${product.hasVideo ? `<span style="position:absolute;bottom:4px;right:4px;background:rgba(15,23,42,0.85);color:#10b981;font-size:9px;font-weight:700;padding:2px 5px;border-radius:4px;display:flex;align-items:center;gap:3px;backdrop-filter:blur(4px);border:1px solid rgba(16,185,129,0.3);" title="Este produto possui vídeo">▶ Vídeo</span>` : ''}
          </div>
          <div class="ml-modal-info">
            <div class="ml-modal-p-title">${escapeHtml(product.title)}</div>
            <div class="ml-modal-p-price">
              ${product.originalPrice && product.originalPrice !== product.price ? `<span style="text-decoration:line-through;color:#94a3b8;font-size:12px;margin-right:6px;">${escapeHtml(product.originalPrice)}</span>` : ''}
              ${escapeHtml(product.price)}
              ${product.discount ? `<span class="ml-modal-p-disc">${escapeHtml(product.discount)}</span>` : ''}
            </div>
            <div class="ml-modal-p-comm-row">
              <span class="ml-modal-comm-badge">💰 Ganho: <b>${escapeHtml(product.commissionPrice || 'R$ 0,00')}</b> (${escapeHtml(product.commissionPercent || '9%')}${escapeHtml(labelPart)})</span>
              ${product.categoryName ? `<span class="ml-modal-cat-tag">${escapeHtml(product.categoryName)}</span>` : ''}
            </div>
          </div>
        </div>

        <div class="ml-modal-field">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label style="margin-bottom: 0;">Selecione o Grupo do WhatsApp:</label>
            <button type="button" id="mlModalPinGroupBtn" class="ml-modal-pin-btn ${isInitiallyPinned ? 'active' : ''}" title="Fixar este grupo como padrão para não ter que selecionar toda hora">
              📌 <span id="mlModalPinGroupText">${isInitiallyPinned ? 'Grupo Padrão Fixado' : 'Fixar como padrão'}</span>
            </button>
          </div>
          <select id="mlModalGroupSelect" class="ml-modal-select" ${groups.length === 0 ? 'disabled' : ''}>
            ${selectOptions}
          </select>
        </div>

        <button id="mlModalSendBtn" class="ml-modal-btn-send" ${groups.length === 0 ? 'disabled' : ''}>
          <span>🚀 Disparar Agora no WhatsApp Web</span>
        </button>

        <div id="mlModalStatus" class="ml-modal-status"></div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Eventos
    document.getElementById('mlModalClose').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    const sendBtn = document.getElementById('mlModalSendBtn');
    const statusDiv = document.getElementById('mlModalStatus');
    const select = document.getElementById('mlModalGroupSelect');

    const pinGroupBtn = document.getElementById('mlModalPinGroupBtn');
    const pinGroupText = document.getElementById('mlModalPinGroupText');

    // Lógica para Fixar Grupo Padrão
    if (pinGroupBtn) {
      pinGroupBtn.addEventListener('click', async () => {
        const currentGroup = select.value;
        if (!currentGroup) return;

        if (pinnedGroup === currentGroup) {
          // Desfixar
          pinnedGroup = '';
          await chrome.storage.local.set({ ml_pinned_group: '' });
          pinGroupBtn.classList.remove('active');
          pinGroupText.textContent = 'Fixar como padrão';
          statusDiv.textContent = '📌 Grupo desfixado de padrão.';
          statusDiv.className = 'ml-modal-status info';
        } else {
          // Fixar
          pinnedGroup = currentGroup;
          await chrome.storage.local.set({ ml_pinned_group: currentGroup });
          pinGroupBtn.classList.add('active');
          pinGroupText.textContent = 'Grupo Padrão Fixado';
          statusDiv.textContent = `📌 Grupo "${currentGroup}" fixado como padrão!`;
          statusDiv.className = 'ml-modal-status success';
        }

        // Atualiza indicadores visuais no select
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

    const favBtn = document.getElementById('mlModalFavBtn');
    const favIcon = document.getElementById('mlModalFavIcon');
    const favText = document.getElementById('mlModalFavText');

    function updateModalFavUI(active) {
      if (!favBtn) return;
      if (active) {
        favBtn.classList.add('active');
        if (favIcon) favIcon.textContent = '★';
        if (favText) favText.textContent = 'Favoritado';
      } else {
        favBtn.classList.remove('active');
        if (favIcon) favIcon.textContent = '⭐';
        if (favText) favText.textContent = 'Favoritar';
      }
    }

    if (favBtn) {
      favBtn.addEventListener('click', async () => {
        try {
          const resp = await chrome.runtime.sendMessage({
            action: 'toggle_favorite',
            product: product
          });
          if (resp && resp.success) {
            isFavorited = resp.isFavorite;
            updateModalFavUI(isFavorited);
            statusDiv.textContent = isFavorited ? '⭐ Oferta adicionada aos Favoritos com sucesso!' : 'Oferta removida dos seus Favoritos.';
            statusDiv.className = 'ml-modal-status ' + (isFavorited ? 'success' : 'info');
          }
        } catch (e) {
          console.warn('Erro ao favoritar oferta:', e);
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

      delete product.coupon;

      sendBtn.disabled = true;
      sendBtn.textContent = 'Enviando oferta para o WhatsApp...';
      statusDiv.textContent = 'Gerando link meli.la e copy com IA...';
      statusDiv.className = 'ml-modal-status info';

      try {
        const resp = await chrome.runtime.sendMessage({
          action: 'send_offer',
          productData: product,
          affiliateTag: affiliateTag,
          groupName: selectedGroup
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

  /**
   * Adiciona pequenos botões de disparo nos cards de busca do Mercado Livre
   */
  function injectSearchCardButtons() {
    let cards = Array.from(document.querySelectorAll('li.ui-search-layout__item, .poly-card, div[class*="poly-card"], div.andes-card, div[class*="andes-card"], div[class*="affiliate-card"], div[class*="product-card"], [data-testid*="card"], [data-testid*="item"]'));
    if (cards.length === 0 || window.location.href.includes('/afiliados')) {
      const productLinks = document.querySelectorAll('a[href*="/MLB-"], a[href*="/p/MLB"], a[href*="produto.mercadolivre.com.br"], a[href*="/MLB"]');
      const foundCards = new Set(cards);
      productLinks.forEach(link => {
        if (link.closest('header, nav, footer, #ml-afiliado-floating-btn, #ml-afiliado-modal-overlay')) return;
        const card = link.closest('.poly-card, .andes-card, [class*="andes-card"], [class*="card" i], [class*="item" i], [class*="product" i], tr, li, article');
        if (card && !foundCards.has(card)) {
          foundCards.add(card);
          cards.push(card);
        }
      });
    }
    if (cards.length === 0) return;
    const pageContext = extractPageCategoryContext();

    cards.forEach(card => {
      if (card.querySelector('.ml-card-affiliate-actions')) return;

      const titleEl = card.querySelector('.poly-component__title, .ui-search-item__title, h2, a[class*="title"]');
      const linkEl = card.querySelector('a.poly-component__title, a.ui-search-link') ||
                     card.querySelector('a[href*="/MLB-"], a[href*="/p/MLB"]') ||
                     card.querySelector('a[href*="produto.mercadolivre.com.br"], a[href*="/MLB"]') ||
                     titleEl?.closest('a') ||
                     (card.tagName === 'A' ? card : null);
      if (!titleEl || !linkEl) return;

      // Seleciona o preço atual (promocional) ignorando preços riscados <s> ou previous
      let moneyEl = card.querySelector('.poly-price__current .andes-money-amount, .ui-search-price__second-line .andes-money-amount, .poly-component__price .andes-money-amount:not(.andes-money-amount--previous)');
      if (!moneyEl) {
        const allMoney = Array.from(card.querySelectorAll('.andes-money-amount, .price-tag'));
        moneyEl = allMoney.find(el => !el.closest('s, del, [class*="previous"], [class*="original"]')) || allMoney[allMoney.length - 1];
      }

      const fracEl = moneyEl ? moneyEl.querySelector('.andes-money-amount__fraction, .price-tag-fraction') : card.querySelector('.andes-money-amount__fraction, .price-tag-fraction');
      const centsEl = moneyEl ? moneyEl.querySelector('.andes-money-amount__cents') : card.querySelector('.andes-money-amount__cents');
      let price = fracEl ? `R$ ${fracEl.textContent.trim()}` : 'Consulte';
      if (centsEl && fracEl) price += `,${centsEl.textContent.trim()}`;

      let rawPrice = 0;
      if (fracEl) {
        const f = fracEl.textContent.replace(/\./g, '').trim();
        const c = centsEl ? centsEl.textContent.trim() : '00';
        rawPrice = parseFloat(`${f}.${c}`) || 0;
      }

      // Fallback para preços textuais
      if (!rawPrice || price === 'Consulte') {
        const textPrices = Array.from((card.innerText || card.textContent || '').matchAll(/R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)/g));
        if (textPrices.length > 0) {
          price = `R$ ${textPrices[0][1]}`;
          rawPrice = parseFloat(textPrices[0][1].replace(/\./g, '').replace(',', '.'));
        }
      }

      const brandEl = card.querySelector('.poly-component__brand, [class*="brand"], [class*="seller"]');
      const brand = brandEl ? brandEl.textContent.trim() : '';

      const imgEl = card.querySelector('img');
      const discEl = card.querySelector('.andes-money-amount__discount, .ui-search-price__discount');
      const title = titleEl.textContent.trim();

      // Calcula comissão oficial com contexto da página e marca
      let comm = { rate: 9, ratePercent: '9%', value: 0, valueFormatted: 'R$ 0,00', categoryName: 'Geral', label: '', isBonus: false };

      const cardRawText = card.innerText || card.textContent || '';
      const bonusMatch = cardRawText.match(/ganhos?\s+extras?\s*(?:de\s*)?(\d+(?:[.,]\d+)?)\s*%/i) ||
                         cardRawText.match(/comiss[aã]o\s*(?:de\s*)?(\d+(?:[.,]\d+)?)\s*%/i) ||
                         cardRawText.match(/(\d+(?:[.,]\d+)?)\s*%\s*(?:de\s*)?(?:comiss[aã]o|ganhos?\s+extras?)/i);

      if (bonusMatch) {
        const rate = parseFloat(bonusMatch[1].replace(',', '.'));
        if (rate > 0) {
          const val = rawPrice ? (rawPrice * (rate / 100)) : 0;
          comm = {
            rate: rate,
            ratePercent: `${rate}%`,
            value: Math.round(val * 100) / 100,
            valueFormatted: `R$ ${val.toFixed(2).replace('.', ',')}`,
            categoryName: 'Ganhos Extras',
            label: bonusMatch[0].trim(),
            isBonus: true
          };
        }
      } else if (typeof MLCommission !== 'undefined') {
        comm = MLCommission.calculateCommission({
          title,
          rawPrice,
          price,
          brand,
          breadcrumbs: pageContext.breadcrumbs,
          category: pageContext.category
        });
      }

      let cardImageUrl = '';
      if (imgEl) {
        const candidates = [
          imgEl.getAttribute('data-src'),
          imgEl.getAttribute('data-lazy-src'),
          imgEl.dataset ? imgEl.dataset.src : null,
          imgEl.src
        ];
        cardImageUrl = candidates.find(u => u && typeof u === 'string' && u.startsWith('http') && !u.startsWith('data:')) || '';
      }

      const cardProduct = {
        title,
        price,
        rawPrice,
        brand,
        breadcrumbs: pageContext.breadcrumbs,
        url: linkEl.href.split('?')[0].split('#')[0],
        imageUrl: cardImageUrl,
        discount: discEl ? discEl.textContent.trim() : '',
        commissionRate: comm.rate,
        commissionPercent: comm.ratePercent,
        commissionValue: comm.value,
        commissionPrice: comm.valueFormatted,
        commissionLabel: comm.label || '',
        isBonusCommission: comm.isBonus || false,
        categoryName: comm.categoryName
      };

      const labelPart = comm.label ? ` • ${comm.label}` : '';
      const actionBox = document.createElement('div');
      actionBox.className = 'ml-card-affiliate-actions';
      actionBox.innerHTML = `
        <span class="ml-card-comm-pill ${comm.isBonus ? 'is-bonus' : ''}" title="Comissão de Afiliado estimada (${escapeHtml(comm.categoryName)})">
          💰 <b>${escapeHtml(comm.ratePercent)}</b> (${escapeHtml(comm.valueFormatted)}${escapeHtml(labelPart)})
        </span>
        <button class="ml-card-quick-dispatch" title="Disparar esta oferta para o WhatsApp">
          💬 Disparar
        </button>
      `;

      const btn = actionBox.querySelector('.ml-card-quick-dispatch');
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        openQuickDispatchModal(cardProduct);
      });

      card.appendChild(actionBox);
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function injectInPageStyles() {
    if (document.getElementById('ml-afiliado-injected-styles')) return;
    const style = document.createElement('style');
    style.id = 'ml-afiliado-injected-styles';
    style.textContent = `
      #ml-afiliado-floating-btn {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 2147483647;
        background: linear-gradient(135deg, #FFE600 0%, #FFD000 100%);
        color: #1D2640;
        padding: 9px 18px;
        border-radius: 50px;
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.22), 0 0 0 2px rgba(255, 230, 0, 0.4);
        cursor: pointer;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        font-weight: 700;
        font-size: 13px;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      #ml-afiliado-floating-btn:hover {
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
        color: #1D2640;
      }
      .ml-float-comm-pill {
        font-size: 11px;
        font-weight: 700;
        color: #065F46;
      }
      #ml-afiliado-modal-overlay {
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
      .ml-modal-badge {
        background: #FFE600;
        color: #1D2640;
        font-size: 10px;
        font-weight: 800;
        padding: 2px 7px;
        border-radius: 4px;
      }
      .ml-modal-title {
        font-size: 15px;
        font-weight: 700;
        color: #1D2640;
        margin-left: 6px;
      }
      .ml-modal-close {
        background: none;
        border: none;
        font-size: 24px;
        line-height: 1;
        cursor: pointer;
        color: #64748B;
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
        font-weight: 700;
        margin-left: 4px;
      }
      .ml-modal-p-comm-row {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 4px;
        flex-wrap: wrap;
      }
      .ml-modal-comm-badge {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        background-color: #ECFDF5;
        color: #047857;
        font-size: 11px;
        font-weight: 700;
        padding: 2px 7px;
        border-radius: 4px;
        border: 1px solid #A7F3D0;
      }
      .ml-modal-cat-tag {
        font-size: 10px;
        font-weight: 600;
        color: #64748B;
        background: #E2E8F0;
        padding: 1px 6px;
        border-radius: 3px;
      }
      .ml-modal-coupon-section {
        background: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 8px;
        padding: 10px 12px;
        margin-bottom: 14px;
      }
      .ml-modal-coupon-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        user-select: none;
      }
      .ml-modal-coupon-label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        font-weight: 700;
        color: #1E293B;
        cursor: pointer;
      }
      .ml-modal-coupon-badge {
        background: #EDE9FE;
        color: #6D28D9;
        font-size: 10px;
        font-weight: 800;
        padding: 2px 6px;
        border-radius: 4px;
        border: 1px solid #DDD6FE;
      }
      .ml-modal-coupon-body {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px dashed #CBD5E1;
      }
      .ml-modal-coupon-preview {
        margin-top: 8px;
        background: #ECFDF5;
        border: 1px solid #A7F3D0;
        border-radius: 6px;
        padding: 6px 10px;
        font-size: 11px;
        color: #065F46;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .ml-modal-custom-coupon-input {
        width: 100%;
        box-sizing: border-box;
        padding: 7px 10px;
        border-radius: 6px;
        border: 1px solid #CBD5E1;
        font-size: 12px;
        text-transform: uppercase;
        font-weight: 700;
        margin-bottom: 4px;
      }
      .ml-modal-field {
        margin-bottom: 14px;
      }
      .ml-modal-field label {
        display: block;
        font-size: 12px;
        font-weight: 600;
        color: #334155;
        margin-bottom: 6px;
      }
      .ml-modal-select {
        width: 100%;
        padding: 9px 12px;
        border-radius: 8px;
        border: 1px solid #CBD5E1;
        font-size: 13px;
        color: #1E293B;
        background: #FFF;
        cursor: pointer;
      }
      .ml-modal-pin-btn {
        background: #F1F5F9;
        border: 1px solid #CBD5E1;
        border-radius: 4px;
        padding: 2px 7px;
        font-size: 11px;
        font-weight: 600;
        color: #475569;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        transition: all 0.2s ease;
      }
      .ml-modal-pin-btn:hover {
        background: #E2E8F0;
        color: #1E293B;
      }
      .ml-modal-pin-btn.active {
        background: #FEF3C7;
        border-color: #F59E0B;
        color: #92400E;
        font-weight: 700;
      }
      .ml-modal-btn-send {
        width: 100%;
        padding: 12px;
        background: #25D366;
        color: #FFFFFF;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.2s ease;
      }
      .ml-modal-btn-send:hover {
        background: #20BD5A;
      }
      .ml-modal-btn-send:disabled {
        background: #94A3B8;
        cursor: not-allowed;
      }
      .ml-modal-status {
        margin-top: 10px;
        font-size: 12px;
        text-align: center;
        font-weight: 600;
      }
      .ml-modal-status.info { color: #2563EB; }
      .ml-modal-status.success { color: #059669; }
      .ml-modal-status.error { color: #DC2626; }

      .ml-card-affiliate-actions {
        position: absolute;
        bottom: 8px;
        right: 8px;
        z-index: 10;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .ml-card-comm-pill {
        background: #ECFDF5;
        color: #065F46;
        border: 1px solid #A7F3D0;
        padding: 3px 7px;
        border-radius: 5px;
        font-size: 11px;
        font-weight: 600;
        box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        white-space: nowrap;
      }
      .ml-card-comm-pill b {
        font-weight: 800;
        color: #047857;
      }
      .ml-card-quick-dispatch {
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
        white-space: nowrap;
      }
      .ml-card-quick-dispatch:hover {
        transform: scale(1.05);
        background: #20BD5A;
      }
    `;
    document.head.appendChild(style);
  }
})();
