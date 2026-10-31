(function () {
  'use strict';

  // Permite atualização a quente das funções em memória mesmo com a aba do WhatsApp Web aberta
  window.__ML_AFILIADO_EXECUTE_DISPATCH__ = executeDispatchToGroup;
  window.__ML_AFILIADO_EXTRACT_GROUPS__ = extractOnlyGroups;

if (!window.__ML_AFILIADO_WA_LISTENER_BOUND__) {
  window.__ML_AFILIADO_WA_LISTENER_BOUND__ = true;

  console.log('[Afiliado ML] Content script do WhatsApp Web inicializado.');

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // 1. EXTRAÇÃO EXCLUSIVA DE GRUPOS DO WHATSAPP CONECTADO
    if (message.action === 'extract_all_groups') {
      window.__ML_AFILIADO_EXTRACT_GROUPS__()
        .then(groups => sendResponse({ success: true, groups }))
        .catch(err => {
          console.warn('[Afiliado ML] Erro ao sincronizar grupos:', err.message);
          sendResponse({ success: false, error: err.message });
        });
      return true;
    }

    // 2. DISPARO DE OFERTA COM IMAGEM PARA O GRUPO
    if (message.action === 'dispatch_to_group') {
      window.__ML_AFILIADO_EXECUTE_DISPATCH__(message)
        .then(res => sendResponse({ success: true, ...res }))
        .catch(err => {
          console.error('[Afiliado ML] Erro durante o disparo:', err);
          showOnScreenNotification(`❌ Erro no disparo: ${err.message}`, '#EF4444');
          sendResponse({ success: false, error: err.message });
        });
      return true;
    }
  });
}

// =============================================================================
// EXTRAÇÃO EXCLUSIVA DE GRUPOS (INDEXEDDB INTERNO + FILTRO NATIVO "GRUPOS")
// =============================================================================

/**
 * Consulta o IndexedDB local do WhatsApp Web ('model-storage' -> 'chat')
 * Grupos possuem IDs terminando estritamente em '@g.us'. Zero risco de contatos pessoais.
 */
function getGroupsFromIndexedDB() {
  return new Promise((resolve) => {
    try {
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
          const getAllReq = store.getAll();
          getAllReq.onsuccess = () => {
            const list = getAllReq.result || [];
            db.close();
            const groupNames = list
              .filter(item => {
                const id = typeof item.id === 'string' ? item.id : (item.id?._serialized || '');
                return (id.endsWith('@g.us') || item.isGroup === true) && !id.endsWith('@c.us') && !id.endsWith('@s.whatsapp.net');
              })
              .map(item => item.name || item.formattedTitle || item.subject || item.title)
              .filter(name => name && typeof name === 'string' && name.trim().length > 1)
              .map(name => name.trim());

            const unique = Array.from(new Set(groupNames)).sort((a, b) => a.localeCompare(b, 'pt-BR'));
            resolve(unique.length > 0 ? unique : null);
          };
          getAllReq.onerror = () => {
            db.close();
            resolve(null);
          };
        } catch (err) {
          resolve(null);
        }
      };
    } catch (err) {
      resolve(null);
    }
  });
}

/**
 * Extrai ÚNICA E EXCLUSIVAMENTE os grupos de WhatsApp, ativando o filtro nativo da tela
 */
async function extractOnlyGroups() {
  const paneSide = document.getElementById('pane-side') || 
                   document.querySelector('div[data-testid="chat-list"]') ||
                   document.querySelector('#side');

  // Verifica se está na tela de QR Code
  const qrCanvas = document.querySelector('canvas[aria-label*="QR"], div[data-ref]');
  if (!paneSide && qrCanvas) {
    throw new Error('WhatsApp Web não está conectado. Escaneie o QR Code na aba do WhatsApp e tente novamente.');
  }

  if (!paneSide) {
    await sleep(2000);
  }

  // 1. TENTA PRIMEIRO EXTRAÇÃO VIA INDEXEDDB LOCAL (100% GARANTIA DE SOMENTE GRUPOS @g.us)
  try {
    const idbGroups = await getGroupsFromIndexedDB();
    if (Array.isArray(idbGroups) && idbGroups.length > 0) {
      console.log(`[Afiliado ML] ✅ ${idbGroups.length} grupos exclusivos encontrados no IndexedDB do WhatsApp!`);
      // Ativa também o filtro visual na tela para comodidade visual do usuário
      activateWhatsAppGroupsFilter().catch(() => {});
      showOnScreenNotification(`✅ ${idbGroups.length} grupos exclusivos importados!`, '#25D366');
      return idbGroups;
    }
  } catch (e) {
    console.warn('[Afiliado ML] IndexedDB fallback para DOM:', e);
  }

  showOnScreenNotification('🔄 Ativando filtro nativo de Grupos na tela...', '#2D3277');

  // 2. ATIVAÇÃO DO FILTRO NATIVO "GRUPOS" NA INTERFACE DO WHATSAPP
  const filterActivated = await activateWhatsAppGroupsFilter();

  const groupsSet = new Set();
  const activePane = document.getElementById('pane-side') || 
                     document.querySelector('div[data-testid="chat-list"]') ||
                     document.querySelector('#side');

  // 3. VARREDURA DE SCROLL PARA CARREGAR OS GRUPOS FILTRADOS
  if (activePane) {
    const scrollContainer = activePane;
    const maxScroll = Math.min(scrollContainer.scrollHeight, 14000);
    const step = scrollContainer.clientHeight * 0.75;
    let currentPos = 0;

    for (let i = 0; i < 14 && currentPos < maxScroll; i++) {
      collectStrictGroupTitles(groupsSet, filterActivated);
      currentPos += step;
      scrollContainer.scrollTop = currentPos;
      await sleep(350);
    }

    scrollContainer.scrollTop = 0;
    await sleep(250);
    collectStrictGroupTitles(groupsSet, filterActivated);
  }

  // Lista final limpa
  const cleanGroups = Array.from(groupsSet).filter(name => {
    const lower = name.toLowerCase();
    if (name.length < 2) return false;
    // Ignora termos de sistema da interface do WhatsApp
    return !['grupos', 'tudo', 'não lidas', 'favoritos', 'conversas', 'status', 'canais', 'comunidades', 'pesquisar', 'search', 'transferências'].includes(lower);
  }).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  console.log(`[Afiliado ML] Sincronização finalizada: ${cleanGroups.length} grupos exclusivos encontrados.`);
  showOnScreenNotification(`✅ ${cleanGroups.length} grupos exclusivos importados com sucesso!`, '#25D366');

  return cleanGroups;
}

/**
 * Localiza e clica no botão nativo que filtra apenas os Grupos no WhatsApp Web
 */
async function activateWhatsAppGroupsFilter() {
  console.log('[Afiliado ML] Verificando filtro "Grupos" no WhatsApp Web...');

  // 1. Verifica se "Grupos" já está selecionado/ativo
  const allSideButtons = Array.from(document.querySelectorAll('#side button, #side div[role="button"], #side div[role="tab"]'));
  const activeGroup = allSideButtons.find(btn => {
    const txt = (btn.textContent || '').trim().toLowerCase();
    const isSelected = btn.getAttribute('aria-selected') === 'true' || 
                       btn.getAttribute('aria-pressed') === 'true' ||
                       btn.className.includes('selected') ||
                       btn.className.includes('active');
    return (txt === 'grupos' || txt === 'groups') && isSelected;
  });

  if (activeGroup) {
    console.log('[Afiliado ML] O filtro "Grupos" já está ativo na tela!');
    return true;
  }

  // 2. Procura botão direto visível na barra de filtros (pills)
  const directGroupBtn = allSideButtons.find(el => {
    const txt = (el.textContent || '').trim().toLowerCase();
    const isVisible = el.offsetParent !== null;
    return isVisible && (txt === 'grupos' || txt === 'groups');
  });

  if (directGroupBtn) {
    console.log('[Afiliado ML] Botão direto "Grupos" visível encontrado! Clicando...');
    clickElementSafely(directGroupBtn);
    await sleep(900);
    return true;
  }

  // 3. Se não estiver visível diretamente, procura o menu dropdown de filtros [ ▾ ]
  console.log('[Afiliado ML] Botão direto não visível, procurando dropdown [ ▾ ] ao lado de "Tudo"...');
  
  const tudoPill = allSideButtons.find(btn => {
    const txt = (btn.textContent || '').trim().toLowerCase();
    return txt === 'tudo' || txt === 'all';
  });

  let dropdownBtn = null;
  if (tudoPill && tudoPill.parentElement) {
    const siblings = Array.from(tudoPill.parentElement.querySelectorAll('button, div[role="button"]'));
    // O dropdown é o botão com ícone svg/chevron ou o último da barra de filtros
    dropdownBtn = siblings.find(b => b !== tudoPill && b.querySelector('svg, span[data-icon]')) || 
                  siblings[siblings.length - 1];
  }

  if (!dropdownBtn) {
    dropdownBtn = document.querySelector(
      '#side button[aria-label*="filtro" i], #side button[aria-label*="filter" i], #side button[aria-label*="mais" i], ' +
      '#side span[data-icon*="chevron-down"], #side span[data-icon*="down"], #side span[data-icon*="filter"]'
    )?.closest('button, div[role="button"]');
  }

  if (dropdownBtn) {
    console.log('[Afiliado ML] Abrindo menu dropdown de filtros [ ▾ ]...');
    clickElementSafely(dropdownBtn);
    await sleep(600);

    const menuOptions = Array.from(document.querySelectorAll('div[role="menuitem"], li[role="menuitem"], div[role="button"], li, span'));
    const groupOption = menuOptions.find(opt => {
      const txt = (opt.textContent || '').trim().toLowerCase();
      return (txt === 'grupos' || txt === 'groups') && opt.offsetParent !== null;
    });

    if (groupOption) {
      console.log('[Afiliado ML] Opção "Grupos" encontrada no menu dropdown! Clicando...');
      clickElementSafely(groupOption);
      await sleep(900);
      return true;
    }
  }

  console.log('[Afiliado ML] Filtro nativo de Grupos não foi acionado automaticamente (usando extração direta).');
  return false;
}

function clickElementSafely(el) {
  if (!el) return;
  el.focus();
  const evtOpts = { bubbles: true, cancelable: true, view: window };
  el.dispatchEvent(new PointerEvent('pointerdown', evtOpts));
  el.dispatchEvent(new MouseEvent('mousedown', evtOpts));
  el.dispatchEvent(new PointerEvent('pointerup', evtOpts));
  el.dispatchEvent(new MouseEvent('mouseup', evtOpts));
  el.click();
}

/**
 * Coleta títulos no DOM garantindo que o item seja realmente um GRUPO
 */
function collectStrictGroupTitles(set, isFilterActive) {
  const rows = document.querySelectorAll(
    '#pane-side div[role="listitem"], #pane-side div[role="row"], div[data-testid="chat-list"] div[role="listitem"]'
  );

  rows.forEach(row => {
    // 1. Rejeita contatos que têm avatar de usuário individual padrão
    const isSingleUserAvatar = row.querySelector('span[data-icon="default-user"]');
    if (isSingleUserAvatar) return;

    // 2. Busca o título do chat
    const titleEl = row.querySelector('span[title]');
    if (!titleEl) return;
    const title = (titleEl.getAttribute('title') || titleEl.textContent || '').trim();
    if (!title || title.length < 2) return;

    // Se o filtro nativo "Grupos" está ativo na tela, TODOS os itens visíveis no pane-side são grupos!
    if (isFilterActive) {
      set.add(title);
      return;
    }

    // Se o filtro não estava ativo na tela, SÓ ADICIONA COM PROVA INEQUÍVOCA DE GRUPO:
    // A. Avatar com ícone nativo de grupo
    const hasGroupAvatar = row.querySelector(
      'span[data-icon="default-group"], span[data-icon="community-outline"], span[data-icon="avatar-group"]'
    );
    if (hasGroupAvatar) {
      set.add(title);
      return;
    }

    // B. Prefixo exclusivo de participante em grupo (~Nome:)
    const previewEl = row.querySelector('span[dir="ltr"], div[class*="message-preview"], span[class*="copyable-text"]');
    if (previewEl) {
      const text = (previewEl.textContent || '').trim();
      // NOTA: Apenas o til '~' é garantia de grupo no WhatsApp.
      // NUNCA usamos regex genérica com ':' pois chats privados com 'Foto:', 'Vídeo:', 'Áudio:' falsificavam grupos!
      if (text.startsWith('~')) {
        set.add(title);
        return;
      }
    }
  });
}

// =============================================================================
// DISPARO COM IMAGEM DO PRODUTO & PREVIEW meli.la COM DELAY INTELIGENTE
// =============================================================================

/**
 * Executa o disparo localizando o grupo e enviando mensagem com foto PUXADA DO LINK (link preview nativo)
 */
async function executeDispatchToGroup({ productData, affiliateLink, groupName, messageText }) {
  showOnScreenNotification(`⏳ Abrindo grupo "${groupName}"...`, '#2D3277');

  const finalCopy = (messageText && messageText.trim()) 
    ? messageText.trim() 
    : buildPersuasiveCopy(productData, affiliateLink);

  // 1. Localiza e abre o grupo no WhatsApp
  const chatTitle = await findTargetChat(groupName);
  if (!chatTitle) {
    throw new Error(`Grupo "${groupName}" não encontrado. Certifique-se de que o nome está correto.`);
  }

  // Abre a conversa
  chatTitle.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
  chatTitle.click();
  await sleep(1200);

  // 2. Dispara a oferta ativando o card de link preview (foto puxada do link)
  await dispatchWithLinkPreview(finalCopy, affiliateLink, productData);

  showOnScreenNotification(`✅ Oferta disparada para "${groupName}" com foto do link!`, '#25D366');
  return { success: true, group: groupName };
}

/**
 * Envia o texto da oferta ativando o gerador de link preview nativo do WhatsApp Web
 */
async function dispatchWithLinkPreview(fullCopy, fallbackUrl, productData = null) {
  let messageBox = document.querySelector('div[data-lexical-editor="true"]') ||
                   document.querySelector('footer div[contenteditable="true"][role="textbox"]') ||
                   document.querySelector('footer div[contenteditable="true"]') ||
                   document.querySelector('div[contenteditable="true"][data-tab="10"]');

  // Aguarda até 3s se a conversa ainda estiver abrindo
  if (!messageBox) {
    for (let i = 0; i < 6; i++) {
      await sleep(500);
      messageBox = document.querySelector('div[data-lexical-editor="true"]') ||
                   document.querySelector('footer div[contenteditable="true"][role="textbox"]') ||
                   document.querySelector('footer div[contenteditable="true"]') ||
                   document.querySelector('div[contenteditable="true"][data-tab="10"]');
      if (messageBox) break;
    }
  }

  if (!messageBox) {
    throw new Error('Campo de digitação do WhatsApp Web não encontrado.');
  }

  // 1. Extrai a URL presente na mensagem de forma rigorosamente limpa
  const urlMatch = fullCopy.match(/(https?:\/\/(?:meli\.la|mercadolivre\.com\.br|produto\.mercadolivre\.com\.br)[^\s<>"]+)/i) ||
                   fullCopy.match(/(https?:\/\/[^\s<>"]+)/i);
  let targetUrl = urlMatch ? urlMatch[1].replace(/[*_~`"'.,;!?]+$/, '') : (fallbackUrl ? fallbackUrl.replace(/[*_~`"'.,;!?]+$/, '') : '');

  // Se por algum motivo a URL veio duplicada ou concatenada (ex: https://meli.la/xyzhttps://meli.la/xyz)
  if (targetUrl) {
    const parts = targetUrl.split(/(?=https?:\/\/)/i).filter(Boolean);
    if (parts.length > 0) {
      targetUrl = parts[0].trim();
    }
  }

  // Validação estrita: NUNCA disparar links institucionais da Shopee ou outras plataformas
  if (targetUrl && (targetUrl.includes('careers.') || targetUrl.includes('help.shopee') || targetUrl.includes('/legal/'))) {
    if (fallbackUrl && !fallbackUrl.includes('careers.') && !fallbackUrl.includes('help.shopee') && !fallbackUrl.includes('/legal/')) {
      console.warn('[Afiliado WA] Link institucional detectado no corpo da copy, recuperando link oficial do produto:', fallbackUrl);
      targetUrl = fallbackUrl;
    } else if (productData?.url && !productData.url.includes('careers.') && !productData.url.includes('help.shopee')) {
      console.warn('[Afiliado WA] Link institucional detectado, usando URL limpa do produto:', productData.url);
      targetUrl = productData.url;
    } else {
      throw new Error('Link institucional detectado. Disparo cancelado automaticamente por segurança.');
    }
  }

  // 2. Limpa completamente qualquer resíduo anterior no campo de digitação
  showOnScreenNotification('✍️ Preparando campo do WhatsApp...', '#2D3277');
  clearMessageBox(messageBox);
  await sleep(250);

  // 3. Remove absolutamente TODAS as URLs do corpo do texto para garantir que o link só apareça uma única vez
  let textWithoutUrl = fullCopy
    .replace(/https?:\/\/(?:meli\.la|mercadolivre\.com\.br|produto\.mercadolivre\.com\.br)[^\s<>"]+/gi, '')
    .replace(/https?:\/\/[^\s<>"]+/gi, '')
    .trim();

  // Remove chamadas de link prévias no final do corpo para não duplicar o título do CTA
  textWithoutUrl = textWithoutUrl
    .replace(/(?:👉\s*)?(?:\*?(?:Compre|Garanta|Acesse|Confira)(?:\s+no)?\s+link\s+oficial:?\*?\s*)+/gi, '')
    .replace(/(?:👉\s*)?(?:\*?(?:Link\s+de\s+compra|Link\s+oficial|Acesse\s+o\s+link|Garanta\s+no\s+link):?\*?\s*)+/gi, '')
    .trimEnd();

  // Monta o corpo sem o link (com o CTA padronizado ao final terminando com nova linha)
  const cleanBody = targetUrl
    ? `${textWithoutUrl}\n\n👉 *Compre no link oficial:*\n`
    : textWithoutUrl;

  // 4. Determina a URL ideal para acionar o preview nativo com FOTO no WhatsApp Web
  const prodImgUrl = productData?.imageUrl || productData?.image || productData?.videoPoster || '';
  const isShopee = targetUrl.includes('shopee') || productData?.platform === 'shopee';
  const hasVideo = !!(productData?.hasVideo || productData?.videoUrl);

  // Se o produto tiver vídeo OU se for Shopee (cujos shortlinks s.shopee.com.br redirecionam para /opaanlp/ e bloqueiam og:image no WhatsApp):
  // Usamos a nossa rota oficial https://afiliado-automatico.vercel.app/api/p
  // que entrega os metadados OpenGraph com a foto oficial em alta resolução e redireciona 100% dos cliques para o link de afiliado oficial.
  let previewTriggerUrl = targetUrl;
  if (prodImgUrl && prodImgUrl.startsWith('http') && (hasVideo || isShopee)) {
    const pTitle = encodeURIComponent(productData?.title || 'Oferta Imperdível');
    const pPrice = encodeURIComponent(productData?.price || '');
    const pImg = encodeURIComponent(prodImgUrl);
    const pTarget = encodeURIComponent(targetUrl);
    previewTriggerUrl = `https://afiliado-automatico.vercel.app/api/p?url=${pTarget}&img=${pImg}&title=${pTitle}&price=${pPrice}`;
  }

  if (targetUrl) {
    // 5. DIGITA A URL DE PREVIEW NO CAMPO VAZIO
    // No WhatsApp Web, digitar a URL no campo vazio aciona imediatamente o gerador de Link Preview com a foto
    showOnScreenNotification('🔗 Carregando prévia e foto do produto...', '#2D3277');
    messageBox.focus();

    // Insere a URL de preview usando execCommand
    document.execCommand('insertText', false, previewTriggerUrl);
    await sleep(200);

    // Digita espaço delimitador que aciona o crawler do WhatsApp Web
    document.execCommand('insertText', false, ' ');
    messageBox.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: ' ' }));
    messageBox.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', keyCode: 32, which: 32, bubbles: true }));
    messageBox.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', code: 'Space', keyCode: 32, which: 32, bubbles: true }));
    await sleep(400);

    // 6. AGUARDA A FOTO REAL CARREGAR NA PRÉVIA DO LINK (Até 8 segundos)
    const previewLoaded = await waitForLinkPreview(8);

    if (previewLoaded) {
      showOnScreenNotification('✍️ Inserindo texto da oferta...', '#2D3277');
      // Se usamos a rota especial para puxar a foto, substitui o texto pelo link de afiliado original
      // mantendo o card da foto fixado na mensagem!
      if (previewTriggerUrl !== targetUrl) {
        await selectAllAndInsert(messageBox, `${textWithoutUrl}\n\n👉 *Compre no link oficial:*\n${targetUrl}`);
      } else if (cleanBody) {
        moveCaretToStart(messageBox);
        await sleep(150);
        await insertMultiLineTextAtCaret(messageBox, cleanBody);
        await sleep(500);
      }
    } else {
      // Fallback: Se por lentidão a foto do preview ainda não carregou, tenta a URL canônica do produto
      if (isShopee && (productData?.url || productData?.pageUrl)) {
        const rawPUrl = productData.pageUrl || productData.url;
        const shpMatch = rawPUrl.match(/-i\.(\d+)\.(\d+)/) || rawPUrl.match(/\/product\/(\d+)\/(\d+)/);
        if (shpMatch) {
          const canonicalShp = `https://shopee.com.br/product/${shpMatch[1]}/${shpMatch[2]}`;
          clearMessageBox(messageBox);
          await sleep(150);
          document.execCommand('insertText', false, canonicalShp + ' ');
          messageBox.dispatchEvent(new InputEvent('input', { bubbles: true }));
          await waitForLinkPreview(5);
          await selectAllAndInsert(messageBox, `${textWithoutUrl}\n\n👉 *Compre no link oficial:*\n${targetUrl}`);
        }
      } else {
        if (cleanBody) {
          moveCaretToStart(messageBox);
          await sleep(150);
          await insertMultiLineTextAtCaret(messageBox, cleanBody);
          await sleep(500);
        }
      }
    }
  } else {
    // Se não há link, apenas insere o texto diretamente
    if (cleanBody) {
      await insertMultiLineTextToWhatsApp(messageBox, cleanBody);
      await sleep(500);
    }
  }

  // 7. Envia a oferta com a foto e o texto confirmados
  showOnScreenNotification('🖼️ Foto e texto prontos! Enviando oferta...', '#25D366');
  await sleep(1000);

  const sendBtn = document.querySelector('span[data-icon="send"]')?.closest('button, div[role="button"]') || 
                  document.querySelector('button[aria-label*="Enviar" i], button[aria-label*="Send" i]') ||
                  document.querySelector('button span[data-icon="send"]')?.parentElement;

  if (sendBtn) {
    sendBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
    sendBtn.click();
  } else {
    messageBox.focus();
    messageBox.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true
    }));
  }

  await sleep(1500);
}

/**
 * Dispara a oferta como mensagem de mídia nativa (foto oficial em alta resolução com a copy como legenda)
 * Funciona como fallback 100% infalível quando o WhatsApp Web não gera foto no link preview (ex: produtos com vídeo)
 */
async function dispatchDirectPhotoWithCaption(imageUrl, fullCopy) {
  // 1. Limpa o campo de digitação
  const messageBox = document.querySelector('div[data-lexical-editor="true"]') ||
                     document.querySelector('footer div[contenteditable="true"]');
  if (messageBox) {
    clearMessageBox(messageBox);
    await sleep(200);
  }

  // 2. Solicita ao background.js o download da imagem como base64 (sem restrições de CORS)
  showOnScreenNotification('📥 Baixando foto de alta resolução...', '#2D3277');
  const base64Res = await new Promise(resolve => {
    chrome.runtime.sendMessage({ action: 'fetch_image_as_base64', url: imageUrl }, res => {
      if (chrome.runtime.lastError || !res || !res.success) {
        return resolve(null);
      }
      resolve(res);
    });
  });

  if (!base64Res || !base64Res.dataUrl) {
    console.warn('[Afiliado WA] Não foi possível obter base64 da imagem para envio direto.');
    return false;
  }

  // 3. Converte a Data URL em um arquivo File real (produto_oferta.jpg)
  const byteString = atob(base64Res.dataUrl.split(',')[1]);
  const mimeType = base64Res.mimeType || 'image/jpeg';
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const file = new File([ab], 'oferta_produto.jpg', { type: mimeType });

  // 4. Injeta o arquivo via evento de paste no container do WhatsApp Web
  showOnScreenNotification('📋 Anexando foto da oferta no WhatsApp...', '#2D3277');
  const targetEl = messageBox || document.querySelector('#main') || document.body;
  targetEl.focus();

  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);

  const pasteEvt = new ClipboardEvent('paste', {
    clipboardData: dataTransfer,
    bubbles: true,
    cancelable: true,
    composed: true
  });
  targetEl.dispatchEvent(pasteEvt);

  // 5. Aguarda o WhatsApp Web abrir o compositor de mídia (tela com campo de legenda)
  let captionBox = null;
  for (let i = 0; i < 15; i++) {
    await sleep(400);
    captionBox = document.querySelector('div[data-testid="media-caption-input"]') ||
                 document.querySelector('div[aria-label*="legenda" i]') ||
                 document.querySelector('div[aria-label*="caption" i]') ||
                 document.querySelector('div[role="dialog"] div[contenteditable="true"]') ||
                 document.querySelector('div[data-animate-media-viewer="true"] div[contenteditable="true"]');
    if (captionBox) break;
  }

  if (!captionBox) {
    console.warn('[Afiliado WA] Compositor de mídia do WhatsApp não abriu a tempo.');
    return false;
  }

  // 6. Insere a copy completa da oferta na legenda da imagem
  showOnScreenNotification('✍️ Inserindo copy na legenda da foto...', '#2D3277');
  await sleep(300);
  await insertMultiLineTextToWhatsApp(captionBox, fullCopy);
  await sleep(600);

  // 7. Clica no botão de enviar mídia do WhatsApp Web
  showOnScreenNotification('🚀 Enviando foto com legenda...', '#25D366');
  const sendMediaBtn = document.querySelector('span[data-icon="send"]')?.closest('button, div[role="button"]') ||
                       document.querySelector('div[aria-label*="Enviar" i][role="button"]') ||
                       document.querySelector('div[aria-label*="Send" i][role="button"]') ||
                       document.querySelector('button[aria-label*="Enviar" i]');

  if (sendMediaBtn) {
    sendMediaBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
    sendMediaBtn.click();
    await sleep(1500);
    return true;
  } else {
    captionBox.focus();
    captionBox.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true
    }));
    await sleep(1500);
    return true;
  }
}

function clearMessageBox(el) {
  if (!el) return;
  el.focus();
  try {
    const sel = window.getSelection();
    if (sel) {
      const range = document.createRange();
      range.selectNodeContents(el);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    document.execCommand('delete', false, null);
  } catch (e) {}

  try {
    document.execCommand('selectAll', false, null);
    document.execCommand('delete', false, null);
  } catch (e) {}

  if (el.textContent && el.textContent.trim().length > 0) {
    try {
      el.focus();
      document.execCommand('selectAll', false, null);
      el.dispatchEvent(new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        inputType: 'deleteContentBackward'
      }));
      document.execCommand('delete', false, null);
    } catch (e) {}
  }

  el.dispatchEvent(new InputEvent('input', { bubbles: true }));
}

function moveCaretToStart(el) {
  if (!el) return;
  el.focus();
  try {
    const sel = window.getSelection();
    if (!sel) return;
    const range = document.createRange();
    let target = el;
    while (target.firstChild) {
      target = target.firstChild;
    }
    range.setStart(target, 0);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  } catch (e) {
    try {
      const sel = window.getSelection();
      const range = document.createRange();
      range.setStart(el, 0);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (err) {}
  }
}

function moveCaretToEnd(el) {
  if (!el) return;
  el.focus();
  try {
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  } catch (e) {}
}

async function insertMultiLineTextAtCaret(messageBox, text) {
  messageBox.focus();
  let pasteOk = false;
  try {
    const dt = new DataTransfer();
    dt.setData('text/plain', text);
    const pasteEvt = new ClipboardEvent('paste', {
      clipboardData: dt,
      bubbles: true,
      cancelable: true,
      composed: true
    });
    messageBox.dispatchEvent(pasteEvt);
    pasteOk = true;
  } catch (e) {}

  if (!pasteOk) {
    document.execCommand('insertText', false, text);
  }
  messageBox.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true }));
}

async function selectAllAndInsert(el, text) {
  if (!el) return;
  el.focus();
  try {
    const sel = window.getSelection();
    if (sel) {
      const range = document.createRange();
      range.selectNodeContents(el);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  } catch (e) {}

  let pasteOk = false;
  try {
    const dt = new DataTransfer();
    dt.setData('text/plain', text);
    const pasteEvt = new ClipboardEvent('paste', {
      clipboardData: dt,
      bubbles: true,
      cancelable: true,
      composed: true
    });
    el.dispatchEvent(pasteEvt);
    pasteOk = true;
  } catch (e) {}

  if (!pasteOk) {
    document.execCommand('insertText', false, text);
  }
  el.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true }));
  await sleep(300);
}

/**
 * Detecta se o card de prévia com imagem real já foi carregado no DOM do WhatsApp Web
 * Busca em containers de preview ativos (excluindo o histórico de mensagens já enviadas)
 */
function isLinkPreviewImageLoaded() {
  const searchRoots = [
    document.querySelector('#main'),
    document.querySelector('footer'),
    document.body
  ].filter(Boolean);

  const previewSelectors = [
    '[data-animate-link-preview="true"]',
    '[data-testid="link-preview-container"]',
    '[data-testid="link-preview"]',
    'div[class*="link-preview"]',
    'div[class*="rich-text-preview"]'
  ];

  const containers = [];

  for (const root of searchRoots) {
    for (const sel of previewSelectors) {
      const list = root.querySelectorAll(sel);
      for (const el of list) {
        // Evita containers dentro de bolhas de mensagens já enviadas na lista de chat
        if (el.closest('div[data-testid="msg-container"], div[class*="message-in"], div[class*="message-out"]')) {
          continue;
        }
        if (!containers.includes(el)) containers.push(el);
      }
    }

    // Botões de fechar prévia [X] (apenas o card em rascunho de envio possui botão de fechar)
    const closeBtns = root.querySelectorAll(
      'span[data-icon="x-alt"], span[data-icon="x"], button[aria-label*="fechar" i], button[aria-label*="close" i]'
    );
    for (const btn of closeBtns) {
      if (btn.closest('div[data-testid="msg-container"], div[class*="message-in"], div[class*="message-out"]')) {
        continue;
      }
      const p = btn.closest('[data-animate-link-preview="true"], [data-testid="link-preview-container"], div[class*="preview"], div[role="region"]') ||
                btn.parentElement?.parentElement;
      if (p && !containers.includes(p)) {
        containers.push(p);
      }
    }
  }

  // Se nenhum container de preview ativo apareceu ainda
  if (containers.length === 0) {
    return false;
  }

  for (const c of containers) {
    // 1. Verifica <img> dentro do container de preview
    const imgs = c.querySelectorAll('img');
    for (const img of imgs) {
      const src = img.src || img.getAttribute('src') || '';
      if (!src) continue;
      // Rejeita ícones pequenos de placeholder, perfis ou favicons svg
      if (src.includes('avatar') || src.includes('profile') || src.includes('favicon') || src.includes('data:image/svg')) continue;

      const w = img.naturalWidth || img.clientWidth || img.offsetWidth || 0;
      const h = img.naturalHeight || img.clientHeight || img.offsetHeight || 0;
      if (w >= 45 && h >= 45) {
        return true;
      }
      if (img.complete && (src.startsWith('blob:') || src.includes('mlstatic') || src.includes('susercontent') || src.includes('media-amazon'))) {
        return true;
      }
    }

    // 2. Verifica <canvas> (WhatsApp Web frequentemente usa canvas para thumbnails de prévia)
    const canvases = c.querySelectorAll('canvas');
    for (const cv of canvases) {
      const w = cv.width || cv.clientWidth || cv.offsetWidth || 0;
      const h = cv.height || cv.clientHeight || cv.offsetHeight || 0;
      if (w >= 45 && h >= 45) {
        return true;
      }
    }

    // 3. Verifica background-image no container
    const bgEls = c.querySelectorAll('div[style*="background-image"], span[style*="background-image"]');
    for (const bg of bgEls) {
      const bgStyle = bg.style.backgroundImage || '';
      if (bgStyle.includes('url(') && !bgStyle.includes('svg') && !bgStyle.includes('favicon')) {
        const w = bg.clientWidth || bg.offsetWidth || 0;
        const h = bg.clientHeight || bg.offsetHeight || 0;
        if (w >= 45 || h >= 45 || bgStyle.includes('susercontent') || bgStyle.includes('mlstatic') || bgStyle.includes('media-amazon')) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Aguarda de forma inteligente até que o WhatsApp Web renderize a foto da prévia do link
 * Garante tempo mínimo obrigatório para o crawler do WhatsApp baixar a imagem
 */
async function waitForLinkPreview(maxSeconds = 8) {
  const startTime = Date.now();
  const maxMs = maxSeconds * 1000;
  const minWaitMs = 2500; // Tempo mínimo para dar chance ao crawler do WhatsApp
  let imageFound = false;

  while (Date.now() - startTime < maxMs) {
    const elapsed = Date.now() - startTime;
    const elapsedSec = Math.floor(elapsed / 1000);
    const remainingSec = Math.max(1, Math.ceil((maxMs - elapsed) / 1000));

    // Só valida a imagem se já passou do tempo mínimo do crawler do WhatsApp
    if (elapsed >= minWaitMs && isLinkPreviewImageLoaded()) {
      imageFound = true;
      console.log(`[Afiliado ML] ✅ Foto da prévia detectada no WhatsApp com sucesso aos ${elapsedSec}s!`);
      showOnScreenNotification('🖼️ Foto do produto carregada com sucesso!', '#25D366');
      await sleep(1500); // Buffer crucial para o WhatsApp consolidar a foto no payload de envio
      return true;
    }

    showOnScreenNotification(`⏳ Aguardando foto do produto carregar (${remainingSec}s)...`, '#2D3277');

    // A cada 4 segundos, se a prévia ainda não carregou, envia um estímulo no campo
    if (elapsedSec > 0 && elapsedSec % 4 === 0 && (elapsed % 1000) < 400) {
      const messageBox = document.querySelector('div[data-lexical-editor="true"]') ||
                         document.querySelector('footer div[contenteditable="true"]');
      if (messageBox) {
        messageBox.dispatchEvent(new InputEvent('input', { bubbles: true }));
      }
    }

    await sleep(400);
  }

  if (imageFound) return true;

  console.warn('[Afiliado ML] ⚠️ Tempo limite de espera pela imagem atingido sem confirmação de foto na prévia.');
  return false;
}

var executeMandatoryPreviewDelay = waitForLinkPreview;

/**
 * Injeta texto multi-linha no campo Lexical do WhatsApp Web preservando parágrafos e evitando aglutinação
 */
async function insertMultiLineTextToWhatsApp(messageBox, text) {
  messageBox.focus();

  // 1. Limpa completamente qualquer conteúdo anterior no campo
  try {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(messageBox);
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand('delete', false, null);
  } catch (e) {
    document.execCommand('selectAll', false, null);
    document.execCommand('delete', false, null);
  }

  // 2. ESTRATÉGIA A (Principal): ClipboardEvent 'paste' com DataTransfer
  let pasteSucceeded = false;
  try {
    const dataTransfer = new DataTransfer();
    dataTransfer.setData('text/plain', text);

    const pasteEvent = new ClipboardEvent('paste', {
      clipboardData: dataTransfer,
      bubbles: true,
      cancelable: true,
      composed: true
    });

    messageBox.dispatchEvent(pasteEvent);
  } catch (err) {
    console.warn('[Afiliado ML] Erro ao disparar pasteEvent:', err);
  }

  // Aguarda 150ms para verificar se o Lexical inseriu o conteúdo
  await sleep(150);

  const currentContent = (messageBox.textContent || '').trim();
  if (currentContent.length > 10) {
    pasteSucceeded = true;
  }

  // 3. ESTRATÉGIA B (Fallback avançado com InputEvent real para Lexical):
  if (!pasteSucceeded) {
    console.log('[Afiliado ML] Aplicando inserção de fallback com eventos Lexical...');
    messageBox.focus();
    document.execCommand('selectAll', false, null);
    document.execCommand('delete', false, null);

    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.length > 0) {
        document.execCommand('insertText', false, line);
      }
      if (i < lines.length - 1) {
        messageBox.dispatchEvent(new InputEvent('beforeinput', {
          bubbles: true,
          cancelable: true,
          composed: true,
          inputType: 'insertLineBreak'
        }));
        messageBox.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          shiftKey: true,
          bubbles: true
        }));
        messageBox.dispatchEvent(new InputEvent('input', {
          bubbles: true,
          cancelable: true,
          composed: true,
          inputType: 'insertLineBreak'
        }));
      }
    }
  }

  messageBox.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true }));
  messageBox.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Sanitiza e formata a copy garantindo markdown perfeito no WhatsApp e isolamento estrito do link
 */
function sanitizeCopyForWhatsApp(copyText, cleanUrl) {
  let text = (copyText || '').replace(/\r\n/g, '\n').trim();

  // 1. Remove eventuais blocos de código markdown que a IA possa ter retornado
  text = text.replace(/^```[a-z]*\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

  // 2. Remove qualquer URL existente no texto gerado pela IA
  text = text.replace(/https?:\/\/(?:www\.|produto\.)?mercadolivre\.com\.br\/[^\s<>"]+/gi, '');
  text = text.replace(/https?:\/\/meli\.la\/[^\s<>"]+/gi, '');
  text = text.replace(/https?:\/\/(?:www\.)?amazon\.com\.br\/[^\s<>"]+/gi, '');
  text = text.replace(/https?:\/\/(?:www\.)?amzn\.to\/[^\s<>"]+/gi, '');
  text = text.replace(/https?:\/\/(?:www\.)?link\.amazon\/[^\s<>"]+/gi, '');
  text = text.replace(/https?:\/\/(?:www\.)?shopee\.com\.br\/[^\s<>"]+/gi, '');
  text = text.replace(/https?:\/\/s\.shopee\.com\.br\/[^\s<>"]+/gi, '');

  // 3. Remove chamadas prévias de link e rodapés de promoção prévios (garante idempotência estrita)
  text = text.replace(/(?:👉\s*)?(?:\*?Compre no link oficial:?\*?\s*)+/gi, '');
  text = text.replace(/(?:👉\s*)?(?:\*?Garanta no link oficial:?\*?\s*)+/gi, '');
  text = text.replace(/(?:👉\s*)?(?:\*?Link de compra:?\*?\s*)+/gi, '');
  text = text.replace(/(?:👉\s*)?(?:\*?Acesse o link:?\*?\s*)+/gi, '');
  text = text.replace(/_?\s*⏰?\s*(?:Preço promocional|Oferta válida)[^_\n]*_?/gi, '');

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

    // Remove espaços internos nos asteriscos: '* texto *' -> '*texto*'
    s = s.replace(/\*\s+([^*]+?)\s+\*/g, '*$1*');
    // Remove espaços internos no itálico: '_ texto _' -> '_$1_'
    s = s.replace(/_\s+([^_]+?)\s+_/g, '_$1_');
    // Remove espaços internos no tachado: '~ texto ~' -> '~$1~'
    s = s.replace(/~\s+([^~]+?)\s+~/g, '~$1~');

    // Limpa caracteres residuais soltos no final da linha
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

  // Reduz múltiplas linhas vazias consecutivas para no máximo uma (parágrafo limpo)
  const cleanBody = formattedLines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!cleanUrl) return cleanBody;

  const sanitizedUrl = cleanUrl.trim().replace(/[*_~`"'.,;!?]+$/, '');

  // Monta a mensagem final simples e direta com o link
  return (
    `${cleanBody}\n\n` +
    `👉 *Garanta no link oficial:*\n` +
    `${sanitizedUrl}\n`
  );
}

/**
 * Constrói a Copy simples e direta fallback
 */
function buildPersuasiveCopy(product, affiliateLink) {
  const title = (product?.title || 'Produto em Destaque').trim();
  const price = (product?.price || 'Confira no link').trim();
  const discount = product?.discount ? ` 🔥 *(${product.discount})*` : '';

  return (
    `🚨 *OFERTA IMPERDÍVEL!* 🚨\n\n` +
    `📦 *${title}*\n\n` +
    `💰 *Preço:* ${price}${discount}\n` +
    `⚡ *Frete Rápido Full & Garantia Mercado Pago*\n\n` +
    `👉 *Garanta no link oficial:*\n` +
    `${affiliateLink}`
  );
}

/**
 * Localiza o elemento do chat pelo nome do grupo
 */
async function findTargetChat(groupName) {
  const normalizedTarget = groupName.trim().toLowerCase();

  // 1. Busca exata case-insensitive
  const allTitleSpans = Array.from(document.querySelectorAll('#pane-side span[title], #side span[title], div[role="listitem"] span[title]'));
  const found = allTitleSpans.find(span => {
    const titleAttr = (span.getAttribute('title') || span.textContent || '').trim().toLowerCase();
    return titleAttr === normalizedTarget;
  });
  if (found) return found;

  // 2. Busca parcial
  const partial = allTitleSpans.find(span => {
    const titleAttr = (span.getAttribute('title') || span.textContent || '').trim().toLowerCase();
    return titleAttr.includes(normalizedTarget) || normalizedTarget.includes(titleAttr);
  });
  if (partial) return partial;

  // 3. Usa a barra de busca do WhatsApp Web
  const searchInput = document.querySelector('div[contenteditable="true"][data-tab="3"]') ||
                      document.querySelector('#side div[contenteditable="true"][role="textbox"]') ||
                      document.querySelector('div[role="textbox"][title*="Pesquisar"], div[role="textbox"][title*="Search"]');

  if (searchInput) {
    searchInput.focus();
    document.execCommand('selectAll', false, null);
    document.execCommand('insertText', false, groupName.trim());
    searchInput.dispatchEvent(new InputEvent('input', { bubbles: true }));

    await sleep(1200);

    const searchResult = Array.from(document.querySelectorAll('#pane-side span[title]'))
                              .find(s => {
                                const t = (s.getAttribute('title') || s.textContent || '').trim().toLowerCase();
                                return t === normalizedTarget || t.includes(normalizedTarget);
                              });

    if (searchResult) return searchResult;
  }

  return null;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function showOnScreenNotification(text, bgColor = '#25D366') {
  let banner = document.getElementById('ml-afiliado-floating-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'ml-afiliado-floating-banner';
    banner.style.cssText = `
      position: fixed;
      top: 18px;
      right: 24px;
      z-index: 999999;
      color: #FFFFFF;
      padding: 12px 18px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
      transition: opacity 0.3s ease, transform 0.3s ease;
      display: flex;
      align-items: center;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(banner);
  }

  banner.style.backgroundColor = bgColor;
  banner.textContent = text;
  banner.style.opacity = '1';
  banner.style.transform = 'translateY(0)';

  clearTimeout(window.__mlBannerTimeout);
  window.__mlBannerTimeout = setTimeout(() => {
    if (banner) {
      banner.style.opacity = '0';
      banner.style.transform = 'translateY(-10px)';
    }
  }, 4000);
}
})();

