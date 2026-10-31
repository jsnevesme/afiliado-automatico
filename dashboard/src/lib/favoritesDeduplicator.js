/**
 * Utilitário de Desduplicação e Sanitização de Favoritos
 * Remove cards duplicados (com links ou variações diferentes do mesmo produto)
 * e prioriza cards com fotos válidas e dados mais completos.
 */

export function getCanonicalProductKey(item) {
  if (!item) return ''
  
  const rawUrl = (item.url || item.affiliate_link || item.pageUrl || '').trim().toLowerCase()
  const rawTitle = (item.title || item.product_title || '').trim().toLowerCase()

  // 1. Amazon: Detecção por ASIN (B0...)
  const amzMatch = rawUrl.match(/\/(?:dp|gp\/product)\/([a-z0-9]{10})/i) ||
                   (item.asin ? [null, item.asin.toLowerCase()] : null)
  if (amzMatch && amzMatch[1]) {
    return `amazon_${amzMatch[1].toLowerCase()}`
  }

  // 2. Shopee: Detecção por Shop ID + Item ID (-i.SHOP.ITEM ou /product/SHOP/ITEM)
  const shpMatch = rawUrl.match(/-i\.(\d+)\.(\d+)/) || rawUrl.match(/\/product\/(\d+)\/(\d+)/)
  if (shpMatch && shpMatch[1] && shpMatch[2]) {
    return `shopee_${shpMatch[1]}_${shpMatch[2]}`
  }

  // 3. Mercado Livre: Detecção por MLB ID (/p/MLB... ou MLB-12345 ou MLB12345)
  const mlbMatch = rawUrl.match(/(mlb[-_]?[0-9]{6,14})/i)
  if (mlbMatch && mlbMatch[1]) {
    return `ml_${mlbMatch[1].replace(/[-_]/g, '').toLowerCase()}`
  }

  // 4. Detecção por Título Normalizado (se tiver pelo menos 8 caracteres)
  // Une produtos duplicados com URLs encurtadas (meli.la, s.shopee, amzn.to)
  if (rawTitle && rawTitle.length >= 8) {
    const cleanTitle = rawTitle
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos
      .replace(/[^a-z0-9]/g, ' ')      // apenas letras e números
      .replace(/\s+/g, ' ')
      .trim()
    
    // Identifica plataforma
    let plat = (item.platform || '').toLowerCase()
    if (!plat) {
      if (rawUrl.includes('amazon') || rawUrl.includes('amzn.to')) plat = 'amazon'
      else if (rawUrl.includes('shopee') || rawUrl.includes('s.shopee')) plat = 'shopee'
      else plat = 'mercadolivre'
    }

    // Pega as primeiras 7 palavras chave com mais de 2 letras
    const words = cleanTitle.split(' ').filter(w => w.length > 2).slice(0, 7).join('_')
    if (words.length >= 6) {
      return `${plat}_title_${words}`
    }
  }

  // 5. Fallback por URL limpa (sem query params nem hash)
  return rawUrl.split('?')[0].split('#')[0]
}

/**
 * Desduplica a lista de ofertas favoritas:
 * - Agrupa itens que representam o mesmo produto físico.
 * - Garante que se um card tiver a foto quebrada/vazia e outro tiver a foto real, o card resultante TERÁ A FOTO REAL!
 * - Preserva pasta (folder_id), link de afiliado oficial e preços mais recentes.
 */
export function deduplicateFavorites(items = []) {
  if (!Array.isArray(items) || items.length === 0) return []

  const map = new Map()

  for (const item of items) {
    if (!item) continue
    const key = getCanonicalProductKey(item)
    if (!key) continue

    if (!map.has(key)) {
      map.set(key, { ...item })
    } else {
      const existing = map.get(key)
      
      // Avaliação de qualidade de imagem
      const existingImg = String(existing.imageUrl || existing.image || existing.product_image || '').trim()
      const itemImg = String(item.imageUrl || item.image || item.product_image || '').trim()

      const isItemImgValid = itemImg.startsWith('http') && !itemImg.includes('placeholder') && !itemImg.includes('logo_') && !itemImg.includes('undefined')
      const isExistingImgValid = existingImg.startsWith('http') && !existingImg.includes('placeholder') && !existingImg.includes('logo_') && !existingImg.includes('undefined')

      let bestImage = existingImg
      if (!isExistingImgValid && isItemImgValid) {
        bestImage = itemImg
      } else if (isItemImgValid && isExistingImgValid) {
        // Se ambos são válidos, prefere imagens de alta resolução (-O.webp no ML)
        if (itemImg.includes('-O.') && !existingImg.includes('-O.')) {
          bestImage = itemImg
        }
      }

      // Preserva pasta associada
      const bestFolderId = existing.folder_id || item.folder_id || null

      // Preserva shortlink oficial
      let bestLink = existing.affiliate_link || existing.url
      const itemLink = item.affiliate_link || item.url || ''
      if (itemLink.includes('meli.la') || itemLink.includes('s.shopee') || itemLink.includes('amzn.to')) {
        bestLink = itemLink
      }

      // Preço e comissão mais completos
      const bestPrice = existing.price || item.price
      const bestRawPrice = existing.rawPrice || item.rawPrice
      const bestCommission = existing.commissionPercent || item.commissionPercent || existing.commissionPrice || item.commissionPrice
      const bestDiscount = existing.discount || item.discount

      map.set(key, {
        ...existing,
        ...item,
        id: existing.id || item.id,
        imageUrl: bestImage,
        image: bestImage,
        product_image: bestImage,
        folder_id: bestFolderId,
        affiliate_link: bestLink,
        price: bestPrice,
        rawPrice: bestRawPrice,
        discount: bestDiscount,
        commissionPercent: bestCommission
      })
    }
  }

  return Array.from(map.values())
}
