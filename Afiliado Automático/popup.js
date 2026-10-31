/**
 * Afiliado Mercado Livre - Popup Script (v2.0.0)
 * Gerencia o estado, sincronização de grupos do WhatsApp Web,
 * filtragem e ordenação inteligente (Mais Vendidos, Preço, Avaliação),
 * geração de copy persuasiva individualizada com IA Groq,
 * e sistema completo de disparo em massa em segundo plano.
 */

document.addEventListener('DOMContentLoaded', () => {
  // =========================================================================
  // ELEMENTOS DO DOM
  // =========================================================================

  // Header & Accordion de Configurações
  const toggleConfigBtn = document.getElementById('toggleConfigBtn');
  const configAccordion = document.getElementById('configAccordion');

  // SaaS Auth, Badges e Paywall
  const userPlanBadgeBtn = document.getElementById('userPlanBadgeBtn');
  const headerPlanBadgeText = document.getElementById('headerPlanBadgeText');
  const dailyDispatchCounter = document.getElementById('dailyDispatchCounter');
  const userEmailDisplay = document.getElementById('userEmailDisplay');
  const userPlanDisplay = document.getElementById('userPlanDisplay');
  const userPlanExpiryDisplay = document.getElementById('userPlanExpiryDisplay');
  const btnLogout = document.getElementById('btnLogout');
  const starterPlatformSection = document.getElementById('starterPlatformSection');
  const starterPlatformSelect = document.getElementById('starterPlatformSelect');
  const starterLockBadge = document.getElementById('starterLockBadge');
  const starterLockActionRow = document.getElementById('starterLockActionRow');
  const starterLockNotice = document.getElementById('starterLockNotice');
  const btnLockStarterPlatform = document.getElementById('btnLockStarterPlatform');

  // Modal Auth
  const authModal = document.getElementById('authModal');
  const tabAuthLogin = document.getElementById('tabAuthLogin');
  const tabAuthRegister = document.getElementById('tabAuthRegister');
  const authSubtitle = document.getElementById('authSubtitle');
  const authForm = document.getElementById('authForm');
  const authEmailInput = document.getElementById('authEmailInput');
  const authPasswordInput = document.getElementById('authPasswordInput');
  const togglePasswordVisibilityBtn = document.getElementById('togglePasswordVisibilityBtn');
  const authTrialNotice = document.getElementById('authTrialNotice');
  const authErrorMessage = document.getElementById('authErrorMessage');
  const btnAuthSubmitText = document.getElementById('btnAuthSubmitText');

  // Modal Upgrade / Paywall
  const upgradeModal = document.getElementById('upgradeModal');
  const upgradeTitle = document.getElementById('upgradeTitle');
  const upgradeSubtitle = document.getElementById('upgradeSubtitle');
  const btnCheckSubscriptionStatus = document.getElementById('btnCheckSubscriptionStatus');
  const btnCloseUpgradeModal = document.getElementById('btnCloseUpgradeModal');

  // Configurações (Tag, Groq, Grupos)
  const affiliateTagInput = document.getElementById('affiliateTagInput');
  const saveTagBtn = document.getElementById('saveTagBtn');
  const amazonTagInput = document.getElementById('amazonTagInput');
  const saveAmazonTagBtn = document.getElementById('saveAmazonTagBtn');
  const shopeeTagInput = document.getElementById('shopeeTagInput');
  const saveShopeeTagBtn = document.getElementById('saveShopeeTagBtn');
  const currentProductPlatformBadge = document.getElementById('currentProductPlatformBadge');
  const groqApiKeyInput = document.getElementById('groqApiKeyInput');
  const saveGroqKeyBtn = document.getElementById('saveGroqKeyBtn');
  const openGroqKeysBtn = document.getElementById('openGroqKeysBtn');
  const btnSyncGroups = document.getElementById('btnSyncGroups');
  const btnSyncText = document.getElementById('btnSyncText');
  const groupsList = document.getElementById('groupsList');
  const groupsCount = document.getElementById('groupsCount');

  // Destino WhatsApp Multi-Grupos & Modal de Cadastro
  const targetGroupsContainer = document.getElementById('targetGroupsContainer');
  const targetSelectedCountBadge = document.getElementById('targetSelectedCountBadge');
  const btnSelectAllTargetGroups = document.getElementById('btnSelectAllTargetGroups');
  const btnClearTargetGroups = document.getElementById('btnClearTargetGroups');
  const btnManageGroupsHeader = document.getElementById('btnManageGroupsHeader');
  const planGroupsLimitBadge = document.getElementById('planGroupsLimitBadge');
  const btnOpenGroupRegisterModal = document.getElementById('btnOpenGroupRegisterModal');

  const groupRegisterModal = document.getElementById('groupRegisterModal');
  const btnCloseGroupRegisterModal = document.getElementById('btnCloseGroupRegisterModal');
  const btnCancelGroupRegister = document.getElementById('btnCancelGroupRegister');
  const btnSaveRegisteredGroups = document.getElementById('btnSaveRegisteredGroups');
  const modalPlanName = document.getElementById('modalPlanName');
  const modalQuotaText = document.getElementById('modalQuotaText');
  const modalQuotaCounterBadge = document.getElementById('modalQuotaCounterBadge');
  const groupSearchInput = document.getElementById('groupSearchInput');
  const manualGroupNameInput = document.getElementById('manualGroupNameInput');
  const btnAddManualGroupBtn = document.getElementById('btnAddManualGroupBtn');
  const allDetectedGroupsList = document.getElementById('allDetectedGroupsList');

  // Fallbacks legados
  const targetGroupSelect = document.getElementById('targetGroup');
  const quickSyncBtn = document.getElementById('quickSyncBtn');
  const btnPinTargetGroup = document.getElementById('btnPinTargetGroup');
  const btnPinTargetGroupText = document.getElementById('btnPinTargetGroupText');
  const useAiCopyCheckbox = document.getElementById('useAiCopyCheckbox');
  const toggleAiPreviewBtn = document.getElementById('toggleAiPreviewBtn');
  const aiPreviewBox = document.getElementById('aiPreviewBox');
  const aiCustomCopyTextarea = document.getElementById('aiCustomCopyTextarea');
  const regenerateCopyBtn = document.getElementById('regenerateCopyBtn');
  const copyStyleSelect = document.getElementById('copyStyleSelect');

  // Banner da Fila de Disparo em Massa
  const massDispatchQueueBanner = document.getElementById('massDispatchQueueBanner');
  const queueProgressBadge = document.getElementById('queueProgressBadge');
  const queueProgressBar = document.getElementById('queueProgressBar');
  const queueNextDispatchInfo = document.getElementById('queueNextDispatchInfo');
  const btnPauseQueue = document.getElementById('btnPauseQueue');
  const btnCancelQueue = document.getElementById('btnCancelQueue');

  // Barra de Ordenação, Filtros e Seleção em Massa
  const filterSortToolbar = document.getElementById('filterSortToolbar');
  const sortSelect = document.getElementById('sortSelect');
  const ratingFilterSelect = document.getElementById('ratingFilterSelect');
  const salesFilterSelect = document.getElementById('salesFilterSelect');
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');
  const selectedCountLabel = document.getElementById('selectedCountLabel');
  const toggleMassConfigBtn = document.getElementById('toggleMassConfigBtn');

  // Painel de Configuração do Disparo em Massa
  const massConfigPanel = document.getElementById('massConfigPanel');
  const minIntervalInput = document.getElementById('minIntervalInput');
  const maxIntervalInput = document.getElementById('maxIntervalInput');
  const randomIntervalCheckbox = document.getElementById('randomIntervalCheckbox');
  const btnStartMassDispatch = document.getElementById('btnStartMassDispatch');
  const btnStartMassText = document.getElementById('btnStartMassText');

  // Resultados
  const resultsContainer = document.getElementById('results');
  const resultsCountBadge = document.getElementById('resultsCountBadge');

  // Banner do Produto Aberto na Página Atual
  const currentPageSection = document.getElementById('currentPageSection');
  const currentProductImg = document.getElementById('currentProductImg');
  const currentProductTitle = document.getElementById('currentProductTitle');
  const currentProductOriginalPrice = document.getElementById('currentProductOriginalPrice');
  const currentProductPrice = document.getElementById('currentProductPrice');
  const currentProductDiscount = document.getElementById('currentProductDiscount');
  const currentProductMetaRow = document.getElementById('currentProductMetaRow');
  const currentProductRatingBadge = document.getElementById('currentProductRatingBadge');
  const currentProductSalesBadge = document.getElementById('currentProductSalesBadge');
  const dispatchCurrentBtn = document.getElementById('dispatchCurrentBtn');
  const currentCommissionRow = document.getElementById('currentCommissionRow');
  const currentProductCommission = document.getElementById('currentProductCommission');
  const currentProductCategory = document.getElementById('currentProductCategory');

  // Abas Principais (Busca vs Favoritos)
  const tabBtnSearch = document.getElementById('tabBtnSearch');
  const tabBtnFavorites = document.getElementById('tabBtnFavorites');
  const favoritesBadge = document.getElementById('favoritesBadge');
  const searchControlsSection = document.getElementById('searchControlsSection');
  const searchResultsSection = document.getElementById('searchResultsSection');

  // Aba de Favoritos e Linha do Tempo
  const favoritesTabPane = document.getElementById('favoritesTabPane');
  const favAiPreviewBox = document.getElementById('favAiPreviewBox');
  const favAiCustomCopyTextarea = document.getElementById('favAiCustomCopyTextarea');
  const btnFavRegenerateCopy = document.getElementById('btnFavRegenerateCopy');
  const favSelectAllCheckbox = document.getElementById('favSelectAllCheckbox');
  const favSelectedCountLabel = document.getElementById('favSelectedCountLabel');
  const btnDispatchSelectedFavorites = document.getElementById('btnDispatchSelectedFavorites');
  const favBatchCount = document.getElementById('favBatchCount');
  const btnClearAllFavorites = document.getElementById('btnClearAllFavorites');
  const favTotalSavedCount = document.getElementById('favTotalSavedCount');
  const favoritesTimelineContainer = document.getElementById('favoritesTimelineContainer');
  const favFoldersBar = document.getElementById('favFoldersBar');

  // Botão de Favoritar Produto Atual
  const btnFavCurrentProduct = document.getElementById('btnFavCurrentProduct');
  const btnFavCurrentIcon = document.getElementById('btnFavCurrentIcon');

  // Toast Flutuante
  const toastNotification = document.getElementById('toastNotification');
  const toastIcon = document.getElementById('toastIcon');
  const toastMessage = document.getElementById('toastMessage');

  // =========================================================================
  // ESTADO LOCAL
  // =========================================================================
  let groups = []; // Grupos cadastrados ativos (ml_whatsapp_groups)
  let allDetectedGroups = []; // Todos os grupos detectados no WhatsApp Web
  let selectedDispatchGroups = new Set(); // Grupos selecionados para envio atual
  let modalTempSelectedGroups = new Set(); // Seleção temporária no modal de cadastro
  let pinnedGroup = '';
  let affiliateTag = '';
  let amazonAffiliateTag = '';
  let shopeeAffiliateTag = '';
  let groqApiKey = '';
  let currentCopyStyle = 'vantagens_gatilhos';
  let toastTimeout = null;
  let currentPageProductData = null;
  let isSyncingGroups = false;

  // Favoritos e Pastas
  let favoriteOffers = [];
  let favoriteFolders = [];
  let activeFavoriteFolder = 'all';
  let selectedFavoriteUrls = new Set();
  let activeMainTab = 'search';

  // Comissões
  let customCommissionRates = {};
  let defaultCommissionRate = 9;

  // Produtos e Seleção em Massa
  let allProducts = [];
  let currentFilteredProducts = [];
  let selectedProductUrls = new Set();

  // Monitoramento da Fila de Disparo em Massa
  let cachedQueueData = null;
  let queueMonitoringInterval = null;

  /**
   * Obtém ou calcula as informações oficiais de comissão de qualquer oferta
   * Garante taxa e valor em R$ sempre visíveis na UI da extensão
   */
  function getProductCommissionInfo(product) {
    if (!product) return null;

    // 1. Se o produto já possui dados válidos de comissão
    if (product.extractedCommissionRate || (product.commissionPrice && product.commissionPercent && product.commissionPercent !== '0%') || product.commissionValue) {
      let rateNum = product.extractedCommissionRate || product.commissionRate;
      if (!rateNum && product.commissionPercent) {
        rateNum = parseFloat(String(product.commissionPercent).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
      }
      const rateText = product.commissionPercent || (rateNum ? `${rateNum}%` : '11%');
      let valText = product.commissionPrice || '';
      if (!valText) {
        let rawPrice = (typeof product.rawPrice === 'number' && product.rawPrice > 0) ? product.rawPrice : 0;
        if (!rawPrice && product.price) {
          const m = String(product.price).replace(/[^\d.,]/g, '');
          if (m.includes(',')) rawPrice = parseFloat(m.replace(/\./g, '').replace(',', '.')) || 0;
          else rawPrice = parseFloat(m) || 0;
        }
        let val = product.commissionValue;
        if (!val && rawPrice > 0 && rateNum > 0) {
          val = Math.round((rawPrice * (rateNum / 100)) * 100) / 100;
        }
        if (val > 0) {
          valText = `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          product.commissionValue = val;
          product.commissionPrice = valText;
        }
      }
      const isBonus = product.isBonusCommission || /extra/i.test(product.commissionLabel || '');
      const labelPart = product.commissionLabel ? ` • ${product.commissionLabel}` : '';
      return {
        rateText,
        valText,
        isBonus,
        labelPart,
        categoryName: product.categoryName || '',
        categoryIcon: product.categoryIcon || '🏷️'
      };
    }

    // 2. Calcula via MLCommission oficial
    if (typeof MLCommission !== 'undefined' && MLCommission.calculateCommission) {
      try {
        const comm = MLCommission.calculateCommission(product, customCommissionRates, defaultCommissionRate);
        if (comm && comm.rate > 0) {
          product.commissionRate = comm.rate;
          product.commissionPercent = comm.ratePercent;
          product.commissionValue = comm.value;
          product.commissionPrice = comm.valueFormatted;
          product.categoryName = comm.categoryName;
          product.categoryIcon = comm.categoryIcon;
          product.commissionLabel = comm.label || '';
          product.isBonusCommission = comm.isBonus || false;

          return {
            rateText: comm.ratePercent,
            valText: comm.valueFormatted,
            isBonus: comm.isBonus || false,
            labelPart: comm.label ? ` • ${comm.label}` : '',
            categoryName: comm.categoryName || '',
            categoryIcon: comm.categoryIcon || '🏷️'
          };
        }
      } catch (e) {
        console.warn('[Afiliado ML] Erro ao calcular comissão:', e);
      }
    }

    // 3. Fallback inteligente por preço e plataforma
    let rawPrice = (typeof product.rawPrice === 'number' && product.rawPrice > 0) ? product.rawPrice : 0;
    if (!rawPrice && product.price) {
      const m = String(product.price).replace(/[^\d.,]/g, '');
      if (m.includes(',')) {
        rawPrice = parseFloat(m.replace(/\./g, '').replace(',', '.')) || 0;
      } else {
        rawPrice = parseFloat(m) || 0;
      }
    }

    if (rawPrice > 0) {
      const plat = product.platform || (product.url && product.url.includes('amazon') ? 'amazon' : (product.url && product.url.includes('shopee') ? 'shopee' : 'mercadolivre'));
      const defaultRate = plat === 'amazon' ? 8 : (plat === 'shopee' ? 9 : 11);
      const val = Math.round((rawPrice * (defaultRate / 100)) * 100) / 100;
      const valFormatted = `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      product.commissionRate = defaultRate;
      product.commissionPercent = `${defaultRate}%`;
      product.commissionValue = val;
      product.commissionPrice = valFormatted;

      return {
        rateText: `${defaultRate}%`,
        valText: valFormatted,
        isBonus: false,
        labelPart: '',
        categoryName: plat === 'amazon' ? 'Amazon' : (plat === 'shopee' ? 'Shopee' : 'Mercado Livre'),
        categoryIcon: plat === 'amazon' ? '🔷' : (plat === 'shopee' ? '🟠' : '🟡')
      };
    }

    return null;
  }

  // =========================================================================
  // INICIALIZAÇÃO
  // =========================================================================
  setupEventListeners(); // Registra TODOS os botões da UI imediatamente sem esperar nada assíncrono!
  initApp();

  async function initApp() {
    try {
      await checkAuthStatus();
    } catch (e) {
      console.warn('[Afiliado ML] Erro ao verificar autenticação:', e);
    }

    try {
      await loadStoredData();
    } catch (e) {
      console.warn('[Afiliado ML] Erro ao carregar storage:', e);
    }

    try {
      await checkCurrentPageProduct();
    } catch (e) {
      console.warn('[Afiliado ML] Erro ao checar produto atual:', e);
    }

    try {
      await initQueueMonitoring();
    } catch (e) {
      console.warn('[Afiliado ML] Erro ao iniciar monitoramento da fila:', e);
    }
  }

  /**
   * Carrega os dados salvos no chrome.storage.local e sincroniza com a nuvem
   */
  async function loadStoredData() {
    try {
      // Se houver sessão Supabase ativa, sincroniza SEMPRE as configurações mais recentes da nuvem
      if (typeof supabase !== 'undefined' && supabase.session) {
        try {
          await supabase.fetchProfile();
          await supabase.syncCloudToLocal();
        } catch (_) {}
      }

      // Se houver perfil Supabase carregado, hidrata com as configurações da nuvem
      if (typeof supabase !== 'undefined' && supabase.profile) {
        const p = supabase.profile;
        if (p.ml_affiliate_tag) {
          affiliateTag = p.ml_affiliate_tag;
          await chrome.storage.local.set({ ml_affiliate_tag: affiliateTag });
        }
        if (p.amazon_affiliate_tag) {
          amazonAffiliateTag = p.amazon_affiliate_tag;
          await chrome.storage.local.set({ amazon_affiliate_tag: amazonAffiliateTag });
        }
        if (p.shopee_affiliate_tag) {
          shopeeAffiliateTag = p.shopee_affiliate_tag;
          await chrome.storage.local.set({ shopee_affiliate_tag: shopeeAffiliateTag });
        }
        if (p.groq_api_key) {
          groqApiKey = p.groq_api_key;
          await chrome.storage.local.set({ groq_api_key: groqApiKey });
        }
        if (p.ml_copy_style) {
          currentCopyStyle = p.ml_copy_style;
          await chrome.storage.local.set({ ml_copy_style: currentCopyStyle });
        }
        if (p.ml_pinned_group) {
          pinnedGroup = p.ml_pinned_group;
          await chrome.storage.local.set({ ml_pinned_group: pinnedGroup });
        }
        if (p.ml_whatsapp_groups && Array.isArray(p.ml_whatsapp_groups) && p.ml_whatsapp_groups.length > 0) {
          await chrome.storage.local.set({ ml_whatsapp_groups: p.ml_whatsapp_groups });
        }
      }

      const data = await chrome.storage.local.get([
        'ml_affiliate_tag',
        'amazon_affiliate_tag',
        'shopee_affiliate_tag',
        'ml_whatsapp_groups',
        'all_detected_whatsapp_groups',
        'ml_selected_dispatch_groups',
        'ml_pinned_group',
        'groq_api_key',
        'use_ai_copy',
        'ml_copy_style',
        'ml_custom_copy',
        'ml_custom_commission_rates',
        'ml_default_commission_rate'
      ]);

      affiliateTag = (data.ml_affiliate_tag || '').trim();
      if (affiliateTag === 'jonathansneves' && (!data.user_email || data.user_email.toLowerCase() !== 'jsnevesme@gmail.com')) {
        affiliateTag = '';
      }
      affiliateTagInput.value = affiliateTag;

      amazonAffiliateTag = (data.amazon_affiliate_tag || '').trim();
      if (amazonTagInput) amazonTagInput.value = amazonAffiliateTag;

      shopeeAffiliateTag = (data.shopee_affiliate_tag || '').trim();
      if (shopeeAffiliateTag.includes('careers.shopee') || shopeeAffiliateTag.includes('help.shopee') || shopeeAffiliateTag.includes('/legal/')) {
        shopeeAffiliateTag = '';
        chrome.storage.local.set({ shopee_affiliate_tag: '' });
      }
      if (shopeeTagInput) shopeeTagInput.value = shopeeAffiliateTag;

      groqApiKey = (data.groq_api_key || '').trim();
      groqApiKeyInput.value = groqApiKey;

      currentCopyStyle = data.ml_copy_style || 'vantagens_gatilhos';
      if (copyStyleSelect) {
        copyStyleSelect.value = currentCopyStyle;
        if (!copyStyleSelect.value) {
          copyStyleSelect.value = 'vantagens_gatilhos';
        }
      }

      if (data.use_ai_copy !== undefined) {
        useAiCopyCheckbox.checked = !!data.use_ai_copy;
      }

      allDetectedGroups = Array.isArray(data.all_detected_whatsapp_groups) ? data.all_detected_whatsapp_groups : [];
      pinnedGroup = (data.ml_pinned_group || '').trim();
      groups = Array.isArray(data.ml_whatsapp_groups) ? data.ml_whatsapp_groups : [];

      if (Array.isArray(data.ml_selected_dispatch_groups) && data.ml_selected_dispatch_groups.length > 0) {
        selectedDispatchGroups = new Set(data.ml_selected_dispatch_groups);
      } else if (pinnedGroup && groups.includes(pinnedGroup)) {
        selectedDispatchGroups = new Set([pinnedGroup]);
      } else if (groups.length > 0) {
        selectedDispatchGroups = new Set([groups[0]]);
      } else {
        selectedDispatchGroups = new Set();
      }

      renderGroupsUI();
      renderTargetGroupsSelector();

      // Favoritos
      await loadFavorites();

      // Sincronização em tempo real de alterações no storage (vindas da nuvem ou plataforma)
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
          if (changes.ml_favorite_offers) {
            favoriteOffers = Array.isArray(changes.ml_favorite_offers.newValue) ? changes.ml_favorite_offers.newValue : [];
            updateFavoritesBadge();
            if (activeMainTab === 'favorites') {
              renderFavoritesUI();
            }
          }
          if (changes.ml_copy_style && changes.ml_copy_style.newValue) {
            currentCopyStyle = changes.ml_copy_style.newValue;
            if (copyStyleSelect) {
              copyStyleSelect.value = currentCopyStyle;
              if (!copyStyleSelect.value) copyStyleSelect.value = 'vantagens_gatilhos';
            }
          }
        }
      });
    } catch (err) {
      console.error('Erro ao carregar dados do storage:', err);
    }
  }

  /**
   * Configura os ouvintes de eventos da interface
   */
  function setupEventListeners() {
    // --- AUTENTICAÇÃO E PLANOS SAAS ---
    if (tabAuthLogin) {
      tabAuthLogin.addEventListener('click', () => showAuthModal(false));
    }
    if (tabAuthRegister) {
      tabAuthRegister.addEventListener('click', () => showAuthModal(true));
    }
    if (togglePasswordVisibilityBtn && authPasswordInput) {
      togglePasswordVisibilityBtn.addEventListener('click', () => {
        const isPwd = authPasswordInput.type === 'password';
        authPasswordInput.type = isPwd ? 'text' : 'password';
        togglePasswordVisibilityBtn.textContent = isPwd ? '🙈' : '👁️';
      });
    }
    if (authForm) {
      authForm.addEventListener('submit', handleAuthSubmit);
    }
    if (btnLogout) {
      btnLogout.addEventListener('click', handleLogout);
    }
    if (userPlanBadgeBtn) {
      userPlanBadgeBtn.addEventListener('click', () => {
        const status = typeof supabase !== 'undefined' ? supabase.getPlanStatus() : null;
        if (status && status.isSuperAdmin) {
          showToast('👑 Você é Super Admin com acesso vitalício ilimitado!', '👑');
        } else {
          showUpgradeModal('Detalhes do Seu Plano', 'Faça upgrade ou gerencie sua assinatura Cakto para acelerar suas vendas:');
        }
      });
    }
    if (btnCloseUpgradeModal) {
      btnCloseUpgradeModal.addEventListener('click', hideUpgradeModal);
    }
    if (btnCheckSubscriptionStatus) {
      btnCheckSubscriptionStatus.addEventListener('click', handleCheckSubscriptionStatus);
    }
    if (starterPlatformSelect) {
      starterPlatformSelect.addEventListener('change', handleStarterPlatformChange);
    }
    const btnOpenDashboard = document.getElementById('btnOpenDashboard');
    if (btnOpenDashboard) {
      btnOpenDashboard.addEventListener('click', () => {
        chrome.tabs.create({ url: 'http://localhost:5173' });
      });
    }
    const subbarAccountPill = document.getElementById('subbarAccountPill');
    if (subbarAccountPill) {
      subbarAccountPill.addEventListener('click', () => {
        const status = typeof supabase !== 'undefined' ? supabase.getPlanStatus() : null;
        if (!status || !status.isAuthenticated) {
          showAuthModal(false);
        } else {
          configAccordion.classList.remove('collapsed');
          toggleConfigBtn.classList.add('active');
          const appContainer = document.querySelector('.app-container');
          if (appContainer) appContainer.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }

    // Botão de Recarregar Extensão (Manual Hot-Reload)
    const btnReloadExtension = document.getElementById('btnReloadExtension');
    if (btnReloadExtension) {
      btnReloadExtension.addEventListener('click', (e) => {
        e.preventDefault();
        btnReloadExtension.style.transform = 'rotate(360deg)';
        btnReloadExtension.style.transition = 'transform 0.4s ease';
        showToast('Recarregando extensão...', '🔄');
        chrome.runtime.sendMessage({ action: 'reload_extension' });
        setTimeout(() => window.close(), 250);
      });
    }

    // Alternar Accordion de Configurações
    toggleConfigBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isCollapsed = configAccordion.classList.contains('collapsed');
      if (isCollapsed) {
        configAccordion.classList.remove('collapsed');
        toggleConfigBtn.classList.add('active');
        const appContainer = document.querySelector('.app-container');
        if (appContainer) {
          appContainer.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        configAccordion.classList.add('collapsed');
        toggleConfigBtn.classList.remove('active');
      }
    });

    // Salvar Tag de Afiliado Mercado Livre
    saveTagBtn.addEventListener('click', saveAffiliateTag);
    affiliateTagInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') saveAffiliateTag();
    });

    // Salvar Tag Amazon
    if (saveAmazonTagBtn && amazonTagInput) {
      saveAmazonTagBtn.addEventListener('click', saveAmazonTag);
      amazonTagInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveAmazonTag();
      });
    }

    // Salvar Tag Shopee
    if (saveShopeeTagBtn && shopeeTagInput) {
      saveShopeeTagBtn.addEventListener('click', saveShopeeTag);
      shopeeTagInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveShopeeTag();
      });
    }

    // Salvar Chave Groq
    saveGroqKeyBtn.addEventListener('click', saveGroqKey);
    groqApiKeyInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') saveGroqKey();
    });

    // Botão para obter Chave no Groq
    if (openGroqKeysBtn) {
      openGroqKeysBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://console.groq.com/keys' });
      });
    }

    // Ações de Seleção de Grupos de Destino
    if (btnSelectAllTargetGroups) {
      btnSelectAllTargetGroups.addEventListener('click', () => {
        const status = (typeof supabase !== 'undefined' && supabase.getPlanStatus)
          ? supabase.getPlanStatus()
          : { isSuperAdmin: false, maxAllowedGroups: 1 };
        const maxAllowed = status.isSuperAdmin ? 9999 : (status.maxAllowedGroups || 1);
        const activeGroups = status.isSuperAdmin ? groups : groups.slice(0, maxAllowed);

        activeGroups.forEach(g => selectedDispatchGroups.add(g));
        chrome.storage.local.set({ ml_selected_dispatch_groups: Array.from(selectedDispatchGroups) });
        renderTargetGroupsSelector();
        showToast(`${selectedDispatchGroups.size} grupo(s) selecionado(s) para disparo.`, '💬');
      });
    }

    if (btnClearTargetGroups) {
      btnClearTargetGroups.addEventListener('click', () => {
        selectedDispatchGroups.clear();
        chrome.storage.local.set({ ml_selected_dispatch_groups: [] });
        renderTargetGroupsSelector();
        showToast('Seleção de grupos limpa.', 'ℹ️');
      });
    }

    // Modal de Cadastro de Grupos
    if (btnManageGroupsHeader) {
      btnManageGroupsHeader.addEventListener('click', openGroupRegisterModal);
    }
    if (btnOpenGroupRegisterModal) {
      btnOpenGroupRegisterModal.addEventListener('click', openGroupRegisterModal);
    }
    if (btnCloseGroupRegisterModal) {
      btnCloseGroupRegisterModal.addEventListener('click', closeGroupRegisterModal);
    }
    if (btnCancelGroupRegister) {
      btnCancelGroupRegister.addEventListener('click', closeGroupRegisterModal);
    }
    if (btnSaveRegisteredGroups) {
      btnSaveRegisteredGroups.addEventListener('click', handleSaveRegisteredGroups);
    }
    if (groupSearchInput) {
      groupSearchInput.addEventListener('input', renderAllDetectedGroupsList);
    }
    if (btnAddManualGroupBtn) {
      btnAddManualGroupBtn.addEventListener('click', handleAddManualGroup);
    }
    if (manualGroupNameInput) {
      manualGroupNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddManualGroup();
        }
      });
    }

    // Sincronização de Grupos com WhatsApp Web
    if (btnSyncGroups) {
      btnSyncGroups.addEventListener('click', handleSyncGroups);
    }
    if (quickSyncBtn) {
      quickSyncBtn.addEventListener('click', handleSyncGroups);
    }

    // IA Copywriting: Checkbox de Ativação
    useAiCopyCheckbox.addEventListener('change', async () => {
      await chrome.storage.local.set({ use_ai_copy: useAiCopyCheckbox.checked });
      showToast(useAiCopyCheckbox.checked ? 'Inteligência Artificial ativada para copies!' : 'IA desativada (usando template padrão).', '🤖');
    });

    // IA Copywriting: Seletor de Modelo de Copy (Apenas nas Configurações)
    if (copyStyleSelect) {
      copyStyleSelect.addEventListener('change', async () => {
        currentCopyStyle = copyStyleSelect.value;
        await chrome.storage.local.set({ ml_copy_style: currentCopyStyle });
        showToast(`Modelo alterado: ${copyStyleSelect.options[copyStyleSelect.selectedIndex].text}`, '✍️');

        // Sincroniza com o Supabase cloud para a plataforma atualizar em tempo real
        try {
          if (typeof supabase !== 'undefined' && supabase.updateProfile) {
            await supabase.updateProfile({ ml_copy_style: currentCopyStyle });
          }
        } catch (syncErr) {
          console.warn('[Popup] Falha ao atualizar perfil no Supabase:', syncErr);
        }

        if (!aiPreviewBox.classList.contains('hidden')) {
          generatePreviewCopy(true);
        }
        if (favAiPreviewBox && !favAiPreviewBox.classList.contains('hidden')) {
          generateFavPreviewCopy(true);
        }
      });
    }

    if (btnFavRegenerateCopy) {
      btnFavRegenerateCopy.addEventListener('click', () => generateFavPreviewCopy(true));
    }

    // IA Copywriting: Toggle Prévia
    toggleAiPreviewBtn.addEventListener('click', () => {
      const isHidden = aiPreviewBox.classList.contains('hidden');
      if (isHidden) {
        aiPreviewBox.classList.remove('hidden');
        toggleAiPreviewBtn.textContent = '✖️ Ocultar Prévia';
        if (!aiCustomCopyTextarea.value.trim()) {
          generatePreviewCopy();
        }
      } else {
        aiPreviewBox.classList.add('hidden');
        toggleAiPreviewBtn.textContent = '👁️ Ver / Editar Texto';
      }
    });

    // IA Copywriting: Botão de Regenerar
    regenerateCopyBtn.addEventListener('click', () => generatePreviewCopy(true));

    // Disparo do produto da página atual
    if (dispatchCurrentBtn) {
      dispatchCurrentBtn.addEventListener('click', () => {
        if (currentPageProductData) {
          handleDispatchOffer(currentPageProductData, dispatchCurrentBtn);
        }
      });
    }

    // --- CONTROLES DE ORDENAÇÃO E FILTRAGEM ---
    if (sortSelect) {
      sortSelect.addEventListener('change', () => applyFiltersAndSorting());
    }
    if (ratingFilterSelect) {
      ratingFilterSelect.addEventListener('change', () => applyFiltersAndSorting());
    }
    if (salesFilterSelect) {
      salesFilterSelect.addEventListener('change', () => applyFiltersAndSorting());
    }

    // --- SELEÇÃO EM MASSA (SELECT ALL) ---
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', handleSelectAllToggle);
    }

    // --- PAINEL DE DISPARO EM MASSA ---
    if (toggleMassConfigBtn) {
      toggleMassConfigBtn.addEventListener('click', () => {
        const isHidden = massConfigPanel.classList.contains('hidden');
        if (isHidden) {
          massConfigPanel.classList.remove('hidden');
          toggleMassConfigBtn.classList.add('active');
        } else {
          massConfigPanel.classList.add('hidden');
          toggleMassConfigBtn.classList.remove('active');
        }
      });
    }

    // Iniciar Disparo em Massa
    if (btnStartMassDispatch) {
      btnStartMassDispatch.addEventListener('click', handleStartMassDispatchSubmit);
    }

    // Controles da Fila (Pausar/Retomar e Cancelar)
    if (btnPauseQueue) {
      btnPauseQueue.addEventListener('click', handlePauseResumeQueue);
    }
    if (btnCancelQueue) {
      btnCancelQueue.addEventListener('click', handleCancelQueue);
    }

    // --- NAVEGAÇÃO ENTRE ABAS (BUSCAR vs FAVORITOS) ---
    if (tabBtnSearch) {
      tabBtnSearch.addEventListener('click', () => switchMainTab('search'));
    }
    if (tabBtnFavorites) {
      tabBtnFavorites.addEventListener('click', () => switchMainTab('favorites'));
    }

    // --- FAVORITAR PRODUTO ABERTO NA PÁGINA ---
    if (btnFavCurrentProduct) {
      btnFavCurrentProduct.addEventListener('click', async () => {
        if (currentPageProductData) {
          await toggleFavorite(currentPageProductData);
        } else {
          showToast('Nenhum produto detectado nesta página para favoritar.', '⚠️');
        }
      });
    }

    // --- AÇÕES DA ABA DE FAVORITOS ---
    if (favSelectAllCheckbox) {
      favSelectAllCheckbox.addEventListener('change', handleFavSelectAllToggle);
    }
    if (btnDispatchSelectedFavorites) {
      btnDispatchSelectedFavorites.addEventListener('click', handleDispatchSelectedFavorites);
    }
    if (btnClearAllFavorites) {
      btnClearAllFavorites.addEventListener('click', handleClearAllFavorites);
    }
  }

  // =========================================================================
  // SISTEMA DE FILTRAGEM E ORDENAÇÃO DINÂMICA
  // =========================================================================

  /**
   * Aplica filtros (avaliação, vendas) e ordenação (mais vendidos, preço, rating, desconto)
   */
  function applyFiltersAndSorting() {
    if (!allProducts || allProducts.length === 0) {
      if (filterSortToolbar) filterSortToolbar.classList.add('hidden');
      resultsCountBadge.style.display = 'none';
      return;
    }

    if (filterSortToolbar) filterSortToolbar.classList.remove('hidden');

    let filtered = [...allProducts];

    // Deduplicação estrita: remove ofertas duplicadas por ASIN / URL / Título
    // e garante que o produto aberto exibido no banner superior nunca apareça repetido na lista abaixo
    const seenKeys = new Set();
    filtered = filtered.filter(p => {
      const key = p.asin || (p.url ? p.url.split('?')[0].toLowerCase() : '') || p.title;
      if (!key || seenKeys.has(key)) return false;
      if (currentPageProductData) {
        const bannerKey = currentPageProductData.asin || (currentPageProductData.url ? currentPageProductData.url.split('?')[0].toLowerCase() : '') || currentPageProductData.title;
        if (key === bannerKey) return false;
      }
      seenKeys.add(key);
      return true;
    });

    // 1. Filtro por Avaliação
    const minRatingStr = ratingFilterSelect ? ratingFilterSelect.value : 'all';
    if (minRatingStr !== 'all') {
      const minRating = parseFloat(minRatingStr);
      filtered = filtered.filter(p => {
        const r = typeof p.rating === 'number' ? p.rating : parseFloat(p.rating);
        return !isNaN(r) && r >= minRating;
      });
    }

    // 2. Filtro por Vendas
    const salesFilter = salesFilterSelect ? salesFilterSelect.value : 'all';
    if (salesFilter === 'best_sellers') {
      filtered = filtered.filter(p => {
        const count = typeof p.salesCount === 'number' ? p.salesCount : parseInt(p.salesCount, 10);
        const hasSalesBadge = p.sales && /mais vendido|\+mil|\+cem|\+500|\+1000/i.test(p.sales);
        return (count && count > 0) || hasSalesBadge;
      });
    }

    // Recalcula as comissões com base nas taxas atuais
    filtered.forEach(p => {
      if (typeof MLCommission !== 'undefined') {
        const comm = MLCommission.calculateCommission(p, customCommissionRates, defaultCommissionRate);
        p.commissionRate = comm.rate;
        p.commissionPercent = comm.ratePercent;
        p.commissionValue = comm.value;
        p.commissionPrice = comm.valueFormatted;
        p.categoryName = comm.categoryName;
        p.categoryIcon = comm.categoryIcon;
        p.commissionLabel = comm.label || '';
        p.isBonusCommission = comm.isBonus || false;
      }
    });

    // 3. Ordenação
    const sortVal = sortSelect ? sortSelect.value : 'sales_desc';
    filtered.sort((a, b) => {
      switch (sortVal) {
        case 'sales_desc': {
          const sA = (typeof a.salesCount === 'number' ? a.salesCount : parseInt(a.salesCount, 10)) || 0;
          const sB = (typeof b.salesCount === 'number' ? b.salesCount : parseInt(b.salesCount, 10)) || 0;
          return sB - sA;
        }
        case 'commission_val_desc': {
          const vA = (typeof a.commissionValue === 'number' ? a.commissionValue : 0);
          const vB = (typeof b.commissionValue === 'number' ? b.commissionValue : 0);
          return vB - vA;
        }
        case 'commission_rate_desc': {
          const rA = (typeof a.commissionRate === 'number' ? a.commissionRate : 0);
          const rB = (typeof b.commissionRate === 'number' ? b.commissionRate : 0);
          return rB - rA;
        }
        case 'rating_desc': {
          const rA = (typeof a.rating === 'number' ? a.rating : parseFloat(a.rating)) || 0;
          const rB = (typeof b.rating === 'number' ? b.rating : parseFloat(b.rating)) || 0;
          return rB - rA;
        }
        case 'price_asc': {
          const pA = (typeof a.rawPrice === 'number' ? a.rawPrice : parsePrice(a.price)) || 0;
          const pB = (typeof b.rawPrice === 'number' ? b.rawPrice : parsePrice(b.price)) || 0;
          return pA - pB;
        }
        case 'price_desc': {
          const pA = (typeof a.rawPrice === 'number' ? a.rawPrice : parsePrice(a.price)) || 0;
          const pB = (typeof b.rawPrice === 'number' ? b.rawPrice : parsePrice(b.price)) || 0;
          return pB - pA;
        }
        case 'discount_desc': {
          const dA = (typeof a.discountPercent === 'number' ? a.discountPercent : parseDiscount(a.discount)) || 0;
          const dB = (typeof b.discountPercent === 'number' ? b.discountPercent : parseDiscount(b.discount)) || 0;
          return dB - dA;
        }
        case 'default':
        default:
          return 0;
      }
    });

    currentFilteredProducts = filtered;
    renderProducts(currentFilteredProducts);
    updateSelectionCounters();
  }

  function parsePrice(str) {
    if (!str) return 0;
    const cleaned = String(str).replace(/[^\d,\.]/g, '').replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  function parseDiscount(str) {
    if (!str) return 0;
    const match = String(str).match(/(\d+)\s*%/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Atualiza os contadores de seleção e o estado visual do checkbox mestre (selectAll)
   */
  function updateSelectionCounters() {
    const selectedCount = selectedProductUrls.size;
    if (selectedCountLabel) {
      selectedCountLabel.textContent = `${selectedCount} selecionados`;
    }

    if (selectAllCheckbox) {
      if (currentFilteredProducts.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
      } else {
        const visibleSelectedCount = currentFilteredProducts.filter(p => selectedProductUrls.has(p.url)).length;
        if (visibleSelectedCount === currentFilteredProducts.length) {
          selectAllCheckbox.checked = true;
          selectAllCheckbox.indeterminate = false;
        } else if (visibleSelectedCount > 0) {
          selectAllCheckbox.checked = false;
          selectAllCheckbox.indeterminate = true;
        } else {
          selectAllCheckbox.checked = false;
          selectAllCheckbox.indeterminate = false;
        }
      }
    }
  }

  /**
   * Marca ou desmarca todos os itens atualmente visíveis na lista filtrada
   */
  function handleSelectAllToggle() {
    const isChecked = selectAllCheckbox.checked;

    currentFilteredProducts.forEach(prod => {
      if (isChecked) {
        selectedProductUrls.add(prod.url);
      } else {
        selectedProductUrls.delete(prod.url);
      }
    });

    // Atualiza classes e inputs nos cards renderizados
    const cards = resultsContainer.querySelectorAll('.product-card');
    cards.forEach(card => {
      const cardUrl = card.dataset.url;
      const chk = card.querySelector('.product-item-checkbox');
      if (chk) chk.checked = isChecked;
      if (isChecked) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });

    updateSelectionCounters();
  }

  // =========================================================================
  // RENDERIZAÇÃO DOS PRODUTOS COM CHECKBOXES E BADGES PREMIUM
  // =========================================================================

  function renderProducts(products) {
    resultsContainer.innerHTML = '';
    resultsCountBadge.textContent = `${products.length} itens`;
    resultsCountBadge.style.display = 'inline-block';

    if (products.length === 0) {
      resultsContainer.innerHTML = `
        <div class="empty-state" style="padding: 24px 16px;">
          <div class="empty-icon">🔍</div>
          <h3>Nenhum produto encontrado</h3>
          <p>Tente ajustar os filtros de avaliação e vendas acima para ver mais ofertas.</p>
        </div>
      `;
      return;
    }

    products.forEach((product) => {
      const isSelected = selectedProductUrls.has(product.url);
      const card = document.createElement('div');
      card.className = `product-card ${isSelected ? 'selected' : ''}`;
      card.dataset.url = product.url;

      // 1. Coluna Esquerda: Checkbox de Seleção + Imagem do Produto
      const leftCol = document.createElement('div');
      leftCol.className = 'card-left-col';

      const checkLabel = document.createElement('label');
      checkLabel.className = 'card-select-checkbox';
      checkLabel.title = 'Marcar para disparo em massa';

      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.className = 'product-item-checkbox';
      chk.checked = isSelected;
      chk.addEventListener('change', (e) => {
        e.stopPropagation();
        if (chk.checked) {
          selectedProductUrls.add(product.url);
          card.classList.add('selected');
        } else {
          selectedProductUrls.delete(product.url);
          card.classList.remove('selected');
        }
        updateSelectionCounters();
      });

      const chkSpan = document.createElement('span');
      chkSpan.className = 'custom-chk-box';
      checkLabel.appendChild(chk);
      checkLabel.appendChild(chkSpan);

      const imgWrapper = document.createElement('div');
      imgWrapper.className = 'card-img-wrapper';

      const img = document.createElement('img');
      img.className = 'card-img';
      img.src = product.imageUrl || 'icons/icon128.png';
      img.alt = product.title || 'Produto';
      img.loading = 'lazy';
      img.onerror = () => { img.src = 'icons/icon128.png'; };
      imgWrapper.appendChild(img);

      leftCol.appendChild(checkLabel);
      leftCol.appendChild(imgWrapper);

      // 2. Coluna Central: Dados do Produto (Título, Preço, Desconto e Badges)
      const info = document.createElement('div');
      info.className = 'card-info';

      // Badge da Loja / Plataforma
      const plat = (product.platform || (product.url && product.url.includes('amazon') ? 'amazon' : (product.url && product.url.includes('shopee') ? 'shopee' : 'mercadolivre')));
      const platBadge = document.createElement('span');
      if (plat === 'amazon') {
        platBadge.className = 'card-platform-badge badge-amazon';
        platBadge.textContent = '🔷 Amazon';
      } else if (plat === 'shopee') {
        platBadge.className = 'card-platform-badge badge-shopee';
        platBadge.textContent = '🟠 Shopee';
      } else {
        platBadge.className = 'card-platform-badge badge-ml';
        platBadge.textContent = '🟡 Mercado Livre';
      }
      info.appendChild(platBadge);

      const title = document.createElement('a');
      title.className = 'card-title';
      title.href = product.url;
      title.target = '_blank';
      title.rel = 'noopener noreferrer';
      title.textContent = product.title || (plat === 'amazon' ? 'Produto Amazon' : (plat === 'shopee' ? 'Produto Shopee' : 'Produto Mercado Livre'));
      title.title = product.title || '';

      // Linha de Preço & Desconto
      const priceRow = document.createElement('div');
      priceRow.className = 'card-price-row';

      // Preço Original Cheio Riscado (se houver desconto)
      if (product.originalPrice && product.originalPrice !== product.price) {
        const origPrice = document.createElement('span');
        origPrice.className = 'card-original-price';
        origPrice.textContent = product.originalPrice;
        priceRow.appendChild(origPrice);
      }

      // Preço Promocional Atual
      const price = document.createElement('span');
      price.className = 'card-price';
      price.textContent = product.price || 'Consulte';
      priceRow.appendChild(price);

      // Badge de Desconto (ex: 50% OFF)
      if (product.discount) {
        const discountBadge = document.createElement('span');
        discountBadge.className = 'card-discount-badge';
        discountBadge.textContent = product.discount;
        priceRow.appendChild(discountBadge);
      }

      // Linha de Metadados: Avaliação ⭐ e Prova Social / Vendas 🔥
      const metaRow = document.createElement('div');
      metaRow.className = 'card-metadata-row';

      const numRating = typeof product.rating === 'number' ? product.rating : parseFloat(product.rating);
      if (numRating && numRating > 0) {
        const ratingBadge = document.createElement('span');
        ratingBadge.className = 'card-rating-badge';
        const reviewsText = product.reviewsCount ? ` <span class="reviews-count">(${product.reviewsCount})</span>` : '';
        ratingBadge.innerHTML = `⭐ ${numRating}${reviewsText}`;
        metaRow.appendChild(ratingBadge);
      }

      // Limpeza estrita de vendas para não mostrar blocos gigantes
      let cleanSales = product.sales || '';
      if (cleanSales) {
        if (cleanSales.length > 30 || cleanSales.includes('R$') || cleanSales.includes('estrelas') || cleanSales.includes('grátis')) {
          const sm = cleanSales.match(/(\+?\s*\d+(?:[.,]\d+)?\s*(?:mil)?\s*vendidos|mais\s+vendido[s]?)/i);
          cleanSales = sm ? sm[0].trim() : '';
        }
      }
      if (cleanSales) {
        const salesBadge = document.createElement('span');
        salesBadge.className = 'card-sales-badge';
        salesBadge.innerHTML = `🔥 ${escapeHtml(cleanSales)}`;
        metaRow.appendChild(salesBadge);
      }



      // Linha de Comissão (% e R$) calculada/informada
      const commInfo = getProductCommissionInfo(product);
      if (commInfo) {
        const commRow = document.createElement('div');
        commRow.className = 'card-commission-row';
        const valDisplay = commInfo.valText ? ` (${escapeHtml(commInfo.valText)})` : '';
        commRow.innerHTML = `
          <span class="card-commission-badge ${commInfo.isBonus ? 'is-bonus' : ''}" title="Comissão para esta oferta">
            💰 Comissão: <b>${escapeHtml(commInfo.rateText)}</b>${valDisplay}${escapeHtml(commInfo.labelPart)}
          </span>
          ${commInfo.categoryName ? `<span class="card-category-tag">${commInfo.categoryIcon || '🏷️'} ${escapeHtml(commInfo.categoryName)}</span>` : ''}
        `;
        info.appendChild(commRow);
      }

      info.appendChild(title);
      info.appendChild(priceRow);
      if (metaRow.children.length > 0) {
        info.appendChild(metaRow);
      }

      // 3. Coluna Direita: Ações Rápidas (Link Externo + Botão de Disparo Compacto)
      const actions = document.createElement('div');
      actions.className = 'card-actions-col';

      const previewLinkBtn = document.createElement('a');
      previewLinkBtn.className = 'btn-preview-link-mini';
      previewLinkBtn.href = product.url;
      previewLinkBtn.target = '_blank';
      previewLinkBtn.rel = 'noopener noreferrer';
      previewLinkBtn.title = `Visualizar na ${plat === 'amazon' ? 'Amazon' : (plat === 'shopee' ? 'Shopee' : 'Mercado Livre')}`;
      previewLinkBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      `;

      const dispatchBtn = document.createElement('button');
      dispatchBtn.className = 'btn-dispatch-compact';
      dispatchBtn.title = 'Disparar esta oferta para o WhatsApp';
      dispatchBtn.innerHTML = `
        <svg viewBox="0 0 24 24">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z"/>
        </svg>
        <span>Disparar</span>
      `;
      dispatchBtn.addEventListener('click', () => handleDispatchOffer(product, dispatchBtn));

      actions.appendChild(previewLinkBtn);
      actions.appendChild(dispatchBtn);

      // Botão de Favoritar Oferta (Estrela)
      const cleanTargetUrl = cleanProductUrl(product.url);
      const isFav = favoriteOffers.some(f => cleanProductUrl(f.url) === cleanTargetUrl);
      const cardFavBtn = document.createElement('button');
      cardFavBtn.className = `card-fav-btn ${isFav ? 'active' : ''}`;
      cardFavBtn.type = 'button';
      cardFavBtn.title = isFav ? 'Remover dos Favoritos' : 'Salvar nos Favoritos';
      cardFavBtn.innerHTML = isFav ? '★' : '⭐';
      cardFavBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await toggleFavorite(product);
        const nowFav = favoriteOffers.some(f => cleanProductUrl(f.url) === cleanTargetUrl);
        cardFavBtn.className = `card-fav-btn ${nowFav ? 'active' : ''}`;
        cardFavBtn.innerHTML = nowFav ? '★' : '⭐';
        cardFavBtn.title = nowFav ? 'Remover dos Favoritos' : 'Salvar nos Favoritos';
      });

      card.appendChild(cardFavBtn);
      card.appendChild(leftCol);
      card.appendChild(info);
      card.appendChild(actions);

      resultsContainer.appendChild(card);
    });
  }

  // =========================================================================
  // SISTEMA DE DISPARO EM MASSA (BACKGROUND ENGINE)
  // =========================================================================

  /**
   * Valida e inicia o disparo em massa para os produtos marcados
   */
  async function handleStartMassDispatchSubmit() {
    if (typeof supabase !== 'undefined') {
      if (!supabase.session) {
        showAuthModal(false);
        showToast('Faça login na sua conta para disparar ofertas.', '⚠️');
        return;
      }

      const status = supabase.getPlanStatus();
      if (status.isLocked) {
        showUpgradeModal('Seu Período de Teste Expirou!', 'Para continuar disparando ofertas com IA em massa, assine um de nossos planos:');
        showToast('Seu período de teste expirou. Assine um plano para continuar!', '⚠️');
        return;
      }
    }

    const selectedGroups = Array.from(selectedDispatchGroups);
    if (selectedGroups.length === 0) {
      if (targetGroupsContainer) {
        targetGroupsContainer.classList.add('highlight-error');
        setTimeout(() => targetGroupsContainer.classList.remove('highlight-error'), 800);
      }
      showToast('Selecione pelo menos um grupo cadastrado para o disparo em massa!', '⚠️');
      return;
    }

    const selectedProducts = allProducts.filter(p => selectedProductUrls.has(p.url));
    if (selectedProducts.length === 0) {
      showToast('Marque pelo menos um produto para o disparo em massa.', '⚠️');
      return;
    }

    if (typeof supabase !== 'undefined') {
      const status = supabase.getPlanStatus();
      if (status.plan === 'starter' && !status.isSuperAdmin && status.allowedPlatform && status.allowedPlatform !== 'all') {
        const hasOtherPlatform = selectedProducts.some(p => {
          const prodPlat = (p.platform || (p.url?.includes('amazon') ? 'amazon' : (p.url?.includes('shopee') ? 'shopee' : 'mercadolivre'))).toLowerCase();
          return prodPlat !== status.allowedPlatform.toLowerCase();
        });
        if (hasOtherPlatform) {
          showToast(`O Plano Starter permite disparar apenas ofertas de ${status.allowedPlatform.toUpperCase()}. Faça upgrade para o Pro ou Ultra!`, '⚠️');
          showUpgradeModal('Plataforma Bloqueada no Plano Starter', `Seu plano atual permite apenas ofertas da plataforma ${status.allowedPlatform.toUpperCase()}. Faça upgrade para o Pro ou Ultra para usar todas simultaneamente!`);
          return;
        }
      }
    }

    const minInterval = parseInt(minIntervalInput.value, 10) || 10;
    const maxInterval = parseInt(maxIntervalInput.value, 10) || 30;
    const isRandom = randomIntervalCheckbox.checked;

    if (minInterval <= 0 || maxInterval < minInterval) {
      showToast('O intervalo máximo deve ser maior ou igual ao mínimo.', '⚠️');
      return;
    }

    btnStartMassDispatch.disabled = true;
    btnStartMassText.textContent = 'Iniciando Fila de Disparo...';

    try {
      const currentTag = affiliateTagInput.value.trim() || affiliateTag;
      const response = await chrome.runtime.sendMessage({
        action: 'start_mass_dispatch',
        products: selectedProducts,
        targetGroups: selectedGroups,
        groupName: selectedGroups.join(', '),
        minIntervalMinutes: minInterval,
        maxIntervalMinutes: maxInterval,
        randomInterval: isRandom,
        affiliateTag: currentTag,
        copyStyle: currentCopyStyle
      });

      if (response && response.success) {
        showToast(`🚀 Disparo em massa iniciado com ${selectedProducts.length} produtos!`, '🔥');
        massConfigPanel.classList.add('hidden');
        toggleMassConfigBtn.classList.remove('active');
        await refreshQueueStatus();
      } else {
        throw new Error(response?.error || 'Erro ao iniciar disparo em massa.');
      }
    } catch (err) {
      console.warn('[Afiliado ML] Erro no disparo em massa:', err);
      showToast(`Erro ao iniciar: ${err.message}`, '❌');
    } finally {
      btnStartMassDispatch.disabled = false;
      btnStartMassText.textContent = 'Iniciar Disparo em Massa';
    }
  }

  /**
   * Alterna entre pausar e retomar a fila de disparo em massa
   */
  async function handlePauseResumeQueue() {
    if (!cachedQueueData) return;
    btnPauseQueue.disabled = true;

    try {
      if (cachedQueueData.status === 'running') {
        const res = await chrome.runtime.sendMessage({ action: 'pause_mass_dispatch' });
        if (res && res.success) {
          showToast('Fila de disparo em massa pausada.', '⏸️');
        }
      } else if (cachedQueueData.status === 'paused') {
        const res = await chrome.runtime.sendMessage({ action: 'resume_mass_dispatch' });
        if (res && res.success) {
          showToast('Fila de disparo retomada!', '▶️');
        }
      }
      await refreshQueueStatus();
    } catch (err) {
      showToast(`Erro: ${err.message}`, '⚠️');
    } finally {
      btnPauseQueue.disabled = false;
    }
  }

  /**
   * Cancela e limpa a fila de disparo em massa
   */
  async function handleCancelQueue() {
    btnCancelQueue.disabled = true;
    try {
      const res = await chrome.runtime.sendMessage({ action: 'cancel_mass_dispatch' });
      if (res && res.success) {
        showToast('Fila de disparo cancelada.', '🛑');
        massDispatchQueueBanner.classList.add('hidden');
        cachedQueueData = null;
      }
    } catch (err) {
      showToast(`Erro ao cancelar: ${err.message}`, '⚠️');
    } finally {
      btnCancelQueue.disabled = false;
    }
  }

  /**
   * Inicializa o monitoramento contínuo da fila com contagem regressiva em tempo real
   */
  async function initQueueMonitoring() {
    await refreshQueueStatus();

    if (queueMonitoringInterval) clearInterval(queueMonitoringInterval);
    queueMonitoringInterval = setInterval(async () => {
      if (cachedQueueData && cachedQueueData.status === 'running') {
        renderQueueBanner(cachedQueueData);
        // Quando atingir ou passar o tempo agendado, sincroniza com o background
        if (cachedQueueData.nextDispatchTimestamp && Date.now() >= cachedQueueData.nextDispatchTimestamp) {
          await refreshQueueStatus();
        }
      }
    }, 1000);
  }

  /**
   * Consulta o estado atual da fila no background
   */
  async function refreshQueueStatus() {
    try {
      const res = await chrome.runtime.sendMessage({ action: 'get_mass_queue_status' });
      cachedQueueData = res?.queue || null;
      renderQueueBanner(cachedQueueData);
    } catch (e) {
      console.warn('[Afiliado ML] Erro ao consultar fila:', e);
    }
  }

  /**
   * Atualiza a interface gráfica do banner de fila
   */
  function renderQueueBanner(queue) {
    if (!queue || queue.status === 'cancelled') {
      massDispatchQueueBanner.classList.add('hidden');
      return;
    }

    massDispatchQueueBanner.classList.remove('hidden');

    const currentIndex = queue.currentIndex || 0;
    const total = queue.totalItems || (queue.items ? queue.items.length : 0);
    const percent = total > 0 ? Math.min(100, Math.round((currentIndex / total) * 100)) : 0;

    queueProgressBadge.textContent = `${currentIndex} / ${total} enviados`;
    queueProgressBar.style.width = `${percent}%`;

    if (queue.status === 'paused') {
      btnPauseQueue.textContent = '▶️ Retomar';
      btnPauseQueue.style.display = 'inline-block';
      queueNextDispatchInfo.textContent = '⏸️ Fila pausada pelo usuário.';
      return;
    }

    btnPauseQueue.textContent = '⏸️ Pausar';

    if (queue.status === 'completed' || currentIndex >= total) {
      queueNextDispatchInfo.textContent = `✅ Disparo concluído! ${total} ofertas enviadas para "${queue.targetGroup}".`;
      btnPauseQueue.style.display = 'none';
      return;
    }

    btnPauseQueue.style.display = 'inline-block';

    // Contagem regressiva em minutos e segundos
    if (queue.nextDispatchTimestamp) {
      const diffMs = queue.nextDispatchTimestamp - Date.now();
      if (diffMs > 0) {
        const totalSec = Math.floor(diffMs / 1000);
        const min = Math.floor(totalSec / 60);
        const sec = totalSec % 60;
        queueNextDispatchInfo.textContent = `⏳ Próximo envio para "${queue.targetGroup}" em: ${min}m ${sec < 10 ? '0' : ''}${sec}s`;
      } else {
        queueNextDispatchInfo.textContent = `🚀 Disparando próximo produto com IA...`;
      }
    } else {
      queueNextDispatchInfo.textContent = `⏳ Preparando próximo envio com IA...`;
    }
  }

  // =========================================================================
  // SINCRONIZAÇÃO AUTOMÁTICA COM O WHATSAPP WEB
  // =========================================================================

  async function handleSyncGroups() {
    if (isSyncingGroups) return;
    isSyncingGroups = true;

    if (btnSyncGroups) {
      btnSyncGroups.disabled = true;
      btnSyncGroups.classList.add('syncing');
    }
    if (quickSyncBtn) quickSyncBtn.classList.add('syncing');
    if (btnSyncText) btnSyncText.textContent = 'Conectando ao WhatsApp Web...';
    showToast('Conectando ao WhatsApp Web para puxar os grupos...', '⏳');

    try {
      const response = await chrome.runtime.sendMessage({ action: 'sync_whatsapp_groups' });

      if (response && response.success && Array.isArray(response.groups) && response.groups.length > 0) {
        allDetectedGroups = response.groups;
        await chrome.storage.local.set({ all_detected_whatsapp_groups: allDetectedGroups });

        const status = (typeof supabase !== 'undefined' && supabase.getPlanStatus)
          ? supabase.getPlanStatus()
          : { isSuperAdmin: false, maxAllowedGroups: 1, planName: 'STARTER' };
        const maxAllowed = status.isSuperAdmin ? 9999 : (status.maxAllowedGroups || 1);

        // Se ainda não tiver grupos cadastrados, auto-registra os primeiros até o limite
        if (groups.length === 0) {
          groups = allDetectedGroups.slice(0, maxAllowed);
          await chrome.storage.local.set({ ml_whatsapp_groups: groups });
          if (typeof supabase !== 'undefined' && supabase.session) {
            try {
              await supabase.updateProfile({ ml_whatsapp_groups: groups });
            } catch (_) {}
          }
        }

        renderGroupsUI();
        renderTargetGroupsSelector();

        showToast(`✅ ${allDetectedGroups.length} grupos encontrados no WhatsApp Web!`, '🚀');

        // Abre o modal de cadastro para o usuário selecionar seus grupos preferidos
        setTimeout(() => {
          openGroupRegisterModal();
        }, 500);
      } else {
        throw new Error(response?.error || 'Nenhum grupo encontrado.');
      }
    } catch (err) {
      console.warn('[Afiliado ML] Erro ao sincronizar grupos:', err);
      showToast(`Falha na sincronização: ${err.message}`, '⚠️');
    } finally {
      isSyncingGroups = false;
      if (btnSyncGroups) {
        btnSyncGroups.disabled = false;
        btnSyncGroups.classList.remove('syncing');
      }
      if (quickSyncBtn) quickSyncBtn.classList.remove('syncing');
      if (btnSyncText) btnSyncText.textContent = 'Puxar do WhatsApp';
    }
  }

  // =========================================================================
  // IA GROQ (PRÉVIA E REGENERAÇÃO DE COPY)
  // =========================================================================

  async function buildFallbackCopy(style, product, affiliateLink) {
    const rawPlat = (product.platform || (product.url?.includes('amazon') ? 'amazon' : (product.url?.includes('shopee') ? 'shopee' : 'mercadolivre'))).toLowerCase();
    const platName = rawPlat === 'amazon' ? 'Amazon' : (rawPlat === 'shopee' ? 'Shopee' : 'Mercado Livre');
    const price = product.price || 'Consulte';
    const originalPrice = product.originalPrice || '';
    const discount = product.discount ? `🔥 *(${product.discount})*` : '';
    const link = affiliateLink || product.url || '';
    const priceFormatted = originalPrice && originalPrice !== price
      ? `*De:* ~${originalPrice}~ *Por apenas:* ${price}`
      : `*Preço:* ${price}`;

    if (style === 'aleatorio' || style === 'random') {
      const randomPool = ['vantagens_gatilhos', 'alerta_bug', 'direto_ao_ponto', 'review_especialista', 'frete_gratis', 'ultimas_horas'];
      const picked = randomPool[Math.floor(Math.random() * randomPool.length)];
      return buildFallbackCopy(picked, product, affiliateLink);
    }

    if (style === 'custom') {
      const data = await chrome.storage.local.get(['ml_custom_copy']);
      if (data.ml_custom_copy) {
        return data.ml_custom_copy
          .replace(/{titulo}/gi, product.title || 'Oferta')
          .replace(/{preco}/gi, price.replace(/^[^\d]*/, ''))
          .replace(/{preco_antigo}/gi, (originalPrice || price).replace(/^[^\d]*/, ''))
          .replace(/{link}/gi, link)
          .replace(/{loja}/gi, platName);
      }
    }

    if (style === 'alerta_bug' || style === 'urgencia_escassez') {
      return `😱 *CORRE QUE TÁ QUASE DE GRAÇA!* 😱\n\n` +
        `🚨 *${product.title}*\n\n` +
        `💥 Tá saindo por APENAS *${price}*! ${discount}\n\n` +
        `💨 Não sei até que horas dura esse preço, aproveite antes que esgote o lote!\n\n` +
        `👇 *LINK DIRETO NO SITE:*\n\n` +
        `${link}`;
    }

    if (style === 'direto_ao_ponto' || style === 'curta_direta') {
      return `🔥 *${product.title}*\n\n` +
        `💰 *${price}* ${discount}\n\n` +
        `🛒 *Compre aqui:*\n\n` +
        `${link}`;
    }

    if (style === 'review_especialista' || style === 'detalhada_persuasiva') {
      return `⭐ *DICA DE OURO DO DIA!* ⭐\n\n` +
        `*${product.title}*\n\n` +
        `Se você estava esperando o momento certo para comprar, esse é um dos menores preços registrados!\n\n` +
        `💵 Por apenas *${price}* ${discount}\n\n` +
        `🔗 *Garanta o seu com desconto:*\n\n` +
        `${link}`;
    }

    if (style === 'frete_gratis') {
      return `📦 *OFERTA COM FRETE GRÁTIS!* 🚚\n\n` +
        `*${product.title}*\n\n` +
        `🔥 Preço especial: *${price}* ${discount}\n\n` +
        `✅ Envio seguro e protegido com devolução grátis garantida!\n\n` +
        `👉 *Pegue o seu agora:*\n\n` +
        `${link}`;
    }

    if (style === 'ultimas_horas') {
      return `⏰ *ÚLTIMAS HORAS DESSA OFERTA!* ⏰\n\n` +
        `*${product.title}*\n\n` +
        `${priceFormatted} ${discount}\n\n` +
        `⚠️ O cupom/preço promocional pode expirar à meia-noite. Não deixe para depois!\n\n` +
        `👇 *Link oficial com desconto:*\n\n` +
        `${link}`;
    }

    // Padrão: vantagens_gatilhos
    return `🚨 *ACHADINHO IMPERDÍVEL!* 🚨\n\n` +
      `📦 *${product.title}*\n\n` +
      `${originalPrice && originalPrice !== price ? `🔥 De ~${originalPrice}~ por APENAS *${price}*!` : `🔥 Por APENAS *${price}*!`} ${discount}\n\n` +
      `⚡ *Por que vale a pena?*\n` +
      `• Melhor custo-benefício na ${platName}\n` +
      `• Frete Rápido com compra 100% garantida\n` +
      `• Estoque promocional limitado\n\n` +
      `👉 *Compre com desconto aqui:*\n\n` +
      `${link}\n\n` +
      `⚠️ _Valores sujeitos a alteração a qualquer momento._`;
  }

  async function generatePreviewCopy(force = false) {
    const product = currentPageProductData || allProducts[0];
    if (!product) {
      aiCustomCopyTextarea.value = 'Abra um produto (Shopee, Amazon ou Mercado Livre) ou faça uma busca acima para gerar uma copy persuasiva com IA!';
      return;
    }

    regenerateCopyBtn.disabled = true;
    regenerateCopyBtn.textContent = '⚡ Criando copy com IA...';
    aiCustomCopyTextarea.value = 'Gerando texto persuasivo de alta conversão com Inteligência Artificial...';

    try {
      const platTag = product.platform === 'amazon'
        ? (amazonAffiliateTag || (amazonTagInput ? amazonTagInput.value.trim() : ''))
        : (product.platform === 'shopee'
            ? (shopeeAffiliateTag || (shopeeTagInput ? shopeeTagInput.value.trim() : ''))
            : (affiliateTag || ''));
      const dummyLink = buildAffiliateLink(product, platTag);
      const res = await chrome.runtime.sendMessage({
        action: 'generate_ai_copy',
        productData: product,
        affiliateLink: dummyLink,
        copyStyle: currentCopyStyle
      });

      if (res && res.success && res.copy) {
        aiCustomCopyTextarea.value = res.copy;
        if (res.randomSelected && res.chosenStyleName) {
          showToast(`🎲 Sorteado: ${res.chosenStyleName}`, '✨');
        } else {
          showToast('Copy de alta conversão gerada com sucesso!', '✨');
        }
      } else {
        throw new Error(res?.error || 'Erro ao gerar copy');
      }
    } catch (err) {
      console.warn('[Afiliado Automático] Falha ao gerar copy:', err);
      const platTag = product.platform === 'amazon'
        ? (amazonAffiliateTag || (amazonTagInput ? amazonTagInput.value.trim() : ''))
        : (product.platform === 'shopee'
            ? (shopeeAffiliateTag || (shopeeTagInput ? shopeeTagInput.value.trim() : ''))
            : (affiliateTag || ''));
      const dummyLink = buildAffiliateLink(product, platTag);
      aiCustomCopyTextarea.value = await buildFallbackCopy(currentCopyStyle, product, dummyLink);
      showToast('Usando template padrão do modelo selecionado.', 'ℹ️');
    } finally {
      regenerateCopyBtn.disabled = false;
      regenerateCopyBtn.textContent = '⚡ Regenerar com IA';
    }
  }

  async function generateFavPreviewCopy(force = false) {
    if (!favAiCustomCopyTextarea) return;

    let product = null;
    if (selectedFavoriteUrls && selectedFavoriteUrls.size > 0) {
      product = favoriteOffers.find(f => selectedFavoriteUrls.has(f.url) || selectedFavoriteUrls.has(cleanProductUrl(f.url)));
    }
    if (!product && favoriteOffers.length > 0) {
      product = favoriteOffers[0];
    }
    if (!product) {
      product = currentPageProductData || allProducts[0];
    }

    if (!product) {
      favAiCustomCopyTextarea.value = 'Nenhuma oferta salva nos favoritos para prévia. Salve ofertas clicando na estrela ⭐!';
      return;
    }

    if (btnFavRegenerateCopy) {
      btnFavRegenerateCopy.disabled = true;
      btnFavRegenerateCopy.textContent = '⚡ Criando copy...';
    }
    favAiCustomCopyTextarea.value = 'Gerando texto persuasivo de alta conversão com Inteligência Artificial para os favoritos...';

    try {
      const platTag = product.platform === 'amazon'
        ? (amazonAffiliateTag || (amazonTagInput ? amazonTagInput.value.trim() : ''))
        : (product.platform === 'shopee'
            ? (shopeeAffiliateTag || (shopeeTagInput ? shopeeTagInput.value.trim() : ''))
            : (affiliateTag || ''));
      const dummyLink = buildAffiliateLink(product, platTag);
      const res = await chrome.runtime.sendMessage({
        action: 'generate_ai_copy',
        productData: product,
        affiliateLink: dummyLink,
        copyStyle: currentCopyStyle
      });

      if (res && res.success && res.copy) {
        favAiCustomCopyTextarea.value = res.copy;
        if (res.randomSelected && res.chosenStyleName) {
          showToast(`🎲 Sorteado: ${res.chosenStyleName}`, '✨');
        } else {
          showToast('Copy dos favoritos gerada com sucesso!', '✨');
        }
      } else {
        throw new Error(res?.error || 'Erro ao gerar copy');
      }
    } catch (err) {
      console.warn('[Afiliado ML] Falha ao gerar copy dos favoritos:', err);
      const platTag = product.platform === 'amazon'
        ? (amazonAffiliateTag || (amazonTagInput ? amazonTagInput.value.trim() : ''))
        : (product.platform === 'shopee'
            ? (shopeeAffiliateTag || (shopeeTagInput ? shopeeTagInput.value.trim() : ''))
            : (affiliateTag || ''));
      const dummyLink = buildAffiliateLink(product, platTag);
      favAiCustomCopyTextarea.value = await buildFallbackCopy(currentCopyStyle, product, dummyLink);
      showToast('Usando template padrão do modelo selecionado.', 'ℹ️');
    } finally {
      if (btnFavRegenerateCopy) {
        btnFavRegenerateCopy.disabled = false;
        btnFavRegenerateCopy.textContent = '⚡ Regenerar';
      }
    }
  }

  // =========================================================================
  // =========================================================================
  // DETECÇÃO AUTOMÁTICA DA PÁGINA ATUAL (MERCADO LIVRE, AMAZON, SHOPEE)
  // =========================================================================

  function isSupportedPageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    if (url.includes('careers.') || url.includes('help.') || url.includes('seller.') || url.includes('/legal/')) return false;
    return url.includes('amazon.') || url.includes('amzn.to') || url.includes('link.amazon') ||
           url.includes('shopee.com.br') || url.includes('s.shopee.com.br') ||
           url.includes('mercadolivre.com.br') || url.includes('meli.la');
  }

  async function checkCurrentPageProduct() {
    try {
      let activeTab = null;

      // 1. Prioridade absoluta: Aba ativa da janela atual do Chrome
      const currentWindowTabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (currentWindowTabs && currentWindowTabs.length > 0 && isSupportedPageUrl(currentWindowTabs[0].url)) {
        activeTab = currentWindowTabs[0];
      }

      // 2. Aba ativa da última janela com foco
      if (!activeTab) {
        const lastFocused = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        if (lastFocused && lastFocused.length > 0 && isSupportedPageUrl(lastFocused[0].url)) {
          activeTab = lastFocused[0];
        }
      }

      // 3. Qualquer aba aberta que corresponda a um produto suportado
      if (!activeTab) {
        const allTabs = await chrome.tabs.query({});
        const supported = (allTabs || []).filter(t => isSupportedPageUrl(t.url));
        if (supported.length > 0) {
          activeTab = supported.find(t => 
            t.active ||
            t.url.includes('/dp/') ||
            t.url.includes('/gp/product/') ||
            t.url.includes('/p/MLB') ||
            t.url.includes('-i.') ||
            t.url.includes('produto.mercadolivre')
          ) || supported[0];
        }
      }

      if (!activeTab || !activeTab.id || !activeTab.url) return;

      const url = activeTab.url;
      if (url.startsWith('chrome:') || url.startsWith('chrome-extension:') || url.startsWith('edge:') || url.startsWith('about:') || url.startsWith('devtools:')) {
        return;
      }
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return;
      }

      const isML = url.includes('mercadolivre.com.br') || url.includes('meli.la');
      const isAmz = url.includes('amazon.') || url.includes('amzn.to') || url.includes('link.amazon');
      const isShp = (url.includes('shopee.com.br') || url.includes('s.shopee.com.br')) && !url.includes('careers.') && !url.includes('help.');

      if (!isML && !isAmz && !isShp) return;

      // Garante que os content scripts corretos estão injetados na aba ativa
      try {
        if (isML) {
          await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            files: ['commission.js', 'content_ml.js']
          });
        } else if (isAmz) {
          await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            files: ['commission.js', 'content_amazon.js']
          });
        } else if (isShp) {
          await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            files: ['commission.js', 'content_shopee.js']
          });
        }
      } catch (e) {}

      // 1. Se for página de busca, catálogo de ofertas ou Portal de Afiliados
      const isMLCatalog = isML && (
        url.includes('lista.mercadolivre.com.br') ||
        url.includes('/jm/search') ||
        url.includes('/ofertas') ||
        url.includes('/c/') ||
        url.includes('/afiliados') ||
        (!url.includes('/p/MLB') && !url.includes('MLB-') && !url.includes('produto.mercadolivre'))
      );
      const isAmzCatalog = isAmz && (
        url.includes('/s?') || url.includes('/s/') || url.includes('/b?') || url.includes('/b/') || url.includes('/deals') || url.includes('node=') ||
        (!url.includes('/dp/') && !url.includes('/gp/product/'))
      );
      const isShpCatalog = isShp && (
        url.includes('/search') || url.includes('/shop/') ||
        (!url.includes('-i.') && !url.includes('/product/'))
      );

      const isCatalogOrSearch = isMLCatalog || isAmzCatalog || isShpCatalog;

      if (isCatalogOrSearch) {
        let products = [];
        // Tentativa 1: Mensagem para o content script da aba ativa
        try {
          const searchRes = await new Promise(resolve => {
            chrome.tabs.sendMessage(activeTab.id, { action: 'get_search_page_products' }, res => {
              if (chrome.runtime.lastError) {
                return resolve(null);
              }
              resolve(res || null);
            });
          });

          if (searchRes && searchRes.success && Array.isArray(searchRes.products) && searchRes.products.length > 0) {
            products = searchRes.products;
          }
        } catch (e) {}

        // Tentativa 2: Fallback DIRETO in-page via chrome.scripting.executeScript (100% infalível em qualquer aba)
        if (products.length === 0 && activeTab && activeTab.id && (isML || isAmz || isShp)) {
          try {
            const [execRes] = await chrome.scripting.executeScript({
              target: { tabId: activeTab.id },
              func: extractDirectSearchProductsInTab
            });
            if (execRes && execRes.result && Array.isArray(execRes.result) && execRes.result.length > 0) {
              products = execRes.result;
            }
          } catch (execErr) {
            console.log('[Afiliado Automático] Extração direta de busca não aplicável:', execErr.message);
          }
        }

        if (products.length > 0) {
          allProducts = products;
          selectedProductUrls = new Set(allProducts.map(p => p.url));
          applyFiltersAndSorting();
          let sourceName = 'Mercado Livre';
          if (isAmz) sourceName = 'Amazon';
          if (isShp) sourceName = 'Shopee';
          if (url.includes('/afiliados')) sourceName = 'Portal de Afiliados ML';
          showToast(`⚡ ${allProducts.length} ofertas carregadas de ${sourceName}!`, '✨');
          return;
        }

        // Se estiver em página de busca ou catálogo, NUNCA tenta extrair como produto único (PDP)
        allProducts = [];
        renderProducts([]);
        return;
      }

      // 2. Se for página de produto específico (PDP)
      let currentProduct = null;
      try {
        const pdpRes = await new Promise(resolve => {
          chrome.tabs.sendMessage(activeTab.id, { action: 'get_current_page_product' }, res => {
            if (chrome.runtime.lastError) {
              return resolve(null);
            }
            resolve(res || null);
          });
        });

        if (pdpRes && pdpRes.success && pdpRes.product) {
          currentProduct = pdpRes.product;
        }
      } catch (e) {}

      // Fallback DIRETO in-page via chrome.scripting.executeScript (infalível mesmo se content script não respondeu)
      if (!currentProduct && activeTab && activeTab.id && (isML || isAmz || isShp)) {
        try {
          const [execRes] = await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            func: extractDirectProductInTab
          });
          if (execRes && execRes.result && execRes.result.title) {
            currentProduct = execRes.result;
            console.log('[Afiliado Automático] Produto extraído via fallback direto in-page:', currentProduct.title);
          }
        } catch (directErr) {
          console.log('[Afiliado Automático] Extração direta in-page não aplicável:', directErr.message);
        }
      }

      if (currentProduct) {
        // Exibe estritamente no banner superior de destaque sem duplicar na lista abaixo
        renderCurrentProductBanner(currentProduct);
      }
    } catch (err) {
      console.warn('[Afiliado Automático] Detecção de página ativa:', err);
    }
  }

  /**
   * Extração direta e independente de produtos de buscas/catálogos executada no contexto da aba ativa
   * Funciona como fallback infalível para Shopee, Amazon e Mercado Livre
   */
  function extractDirectSearchProductsInTab() {
    const url = window.location.href;
    const isML = url.includes('mercadolivre.com.br') || url.includes('meli.la');
    const isAmz = url.includes('amazon.') || url.includes('amzn.to') || url.includes('link.amazon');
    const isShp = (url.includes('shopee.com.br') || url.includes('s.shopee.com.br')) && !url.includes('careers.') && !url.includes('help.');

    function parsePrice(str) {
      if (!str) return { raw: 0, formatted: 'Consulte' };
      const m = str.match(/R\$\s*([\d\.]+)(?:,(\d{2}))?/) || str.match(/([\d\.]+),(\d{2})/);
      if (!m) return { raw: 0, formatted: str.trim() };
      const intPart = m[1].replace(/\./g, '');
      const decPart = m[2] || '00';
      const raw = parseFloat(`${intPart}.${decPart}`) || 0;
      const formatted = `R$ ${m[1]}${m[2] ? ',' + m[2] : ''}`;
      return { raw, formatted };
    }

    // ==========================================
    // 1. AMAZON SEARCH / DEALS / CATALOG
    // ==========================================
    if (isAmz) {
      const list = [];
      const seen = new Set();
      const cards = Array.from(document.querySelectorAll(
        'div[data-component-type="s-search-result"], .s-result-item[data-asin], [data-asin]:not([data-asin=""]), .s-card-container, div.puis-card-container, .a-carousel-card'
      ));

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

        let title = '';
        const titleEl = card.querySelector('h2 a span, h2 a, h2 span, h2, [data-cy="title-recipe"] h2, [data-cy="title-recipe"], span.a-size-medium, span.a-size-base-plus, [class*="title" i]');
        if (titleEl && titleEl.textContent.trim().length > 3) {
          title = titleEl.textContent.trim();
        }
        if (!title) {
          const imgEl = card.querySelector('img[alt]');
          if (imgEl && imgEl.alt && imgEl.alt.trim().length > 3) title = imgEl.alt.trim();
        }
        if (!title) {
          const dp = card.querySelector('a[href*="/dp/"]');
          if (dp && dp.textContent.trim().length > 3) title = dp.textContent.trim();
        }
        title = title.replace(/^(?:escolha da amazon|mais vendido|patrocinado|novo)\s*/i, '').trim();
        if (!title || title.length < 3) continue;

        seen.add(cleanUrl);

        let price = 'Consulte';
        let rawPrice = 0;
        let originalPrice = '';
        let rawOriginalPrice = 0;

        const pCurrent = card.querySelector('.a-price:not(.a-text-price) .a-offscreen, .a-price .a-offscreen');
        if (pCurrent) {
          const parsed = parsePrice(pCurrent.textContent);
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

        const pOrig = card.querySelector('.a-text-price .a-offscreen, s .a-offscreen, span[data-a-strike="true"] .a-offscreen');
        if (pOrig) {
          const parsed = parsePrice(pOrig.textContent);
          if (parsed.raw > rawPrice && parsed.raw > 0) {
            originalPrice = parsed.formatted;
            rawOriginalPrice = parsed.raw;
          }
        }

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

        let imageUrl = '';
        const imgEl = card.querySelector('img.s-image, img');
        if (imgEl) {
          const candidates = [imgEl.getAttribute('data-src'), imgEl.src];
          imageUrl = candidates.find(u => u && typeof u === 'string' && u.startsWith('http') && !u.startsWith('data:')) || '';
          if (!imageUrl && imgEl.srcset) {
            const parts = imgEl.srcset.split(',').map(p => p.trim().split(' ')[0]);
            imageUrl = parts.find(u => u && u.startsWith('http') && !u.startsWith('data:')) || '';
          }
        }

        let rating = 0;
        let reviewsCount = '';
        const rEl = card.querySelector('span.a-icon-alt, i.a-icon-star-small span');
        if (rEl) {
          const rm = rEl.textContent.replace(',', '.').match(/([345](?:\.\d+)?)/);
          if (rm) rating = parseFloat(rm[1]) || 0;
        }
        const revEl = card.querySelector('span.s-underline-text, [aria-label*="avaliações"]');
        if (revEl) reviewsCount = revEl.textContent.replace(/[()]/g, '').trim();

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

    // ==========================================
    // 2. SHOPEE SEARCH / CATÁLOGO
    // ==========================================
    if (isShp) {
      const list = [];
      const seen = new Set();
      const cards = Array.from(document.querySelectorAll(
        'li.shopee-search-item-result__item, div[data-sqe="item"], div.shopee-search-item-result__item, div.col-xs-2-4, div[class*="search-item-result"]'
      ));

      const productLinks = document.querySelectorAll('a[href*="-i."], a[href*="/product/"], a[data-sqe="link"]');
      const cardSet = new Set(cards);
      for (const a of productLinks) {
        if (a.closest('header, nav, footer, #shp-afiliado-floating-btn, #shp-afiliado-modal-overlay')) continue;
        const c = a.closest('li.shopee-search-item-result__item, div[data-sqe="item"], div.shopee-search-item-result__item, div.col-xs-2-4, div[class*="item-card"], [class*="product-card"], li, div[class*="col"]') || a;
        if (c && !cardSet.has(c)) {
          cardSet.add(c);
          cards.push(c);
        }
      }

      for (const card of cards) {
        const linkEl = card.tagName === 'A' ? card : (
          card.querySelector('a[href*="-i."], a[href*="/product/"], a[data-sqe="link"]') || card.querySelector('a[href]')
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

        let title = '';
        const titleEl = card.querySelector('div[data-sqe="name"], div[class*="name" i], div[class*="title" i], [class*="item-card__title"], [class*="line-clamp"], .whitespace-normal, [style*="-webkit-line-clamp"]');
        if (titleEl && titleEl.textContent.trim().length > 3) title = titleEl.textContent.trim();
        if (!title) {
          const imgEl = card.querySelector('img[alt]');
          if (imgEl && imgEl.alt && imgEl.alt.trim().length > 3) title = imgEl.alt.trim();
        }
        if (!title) {
          const aria = linkEl.getAttribute('aria-label') || linkEl.getAttribute('title');
          if (aria && aria.trim().length > 3) title = aria.trim();
        }
        if (!title) {
          try {
            const u = new URL(linkEl.href);
            const mSlug = u.pathname.match(/\/([^\/]+)-i\.\d+\.\d+/);
            if (mSlug && mSlug[1]) title = decodeURIComponent(mSlug[1]).replace(/[-_+]/g, ' ').trim();
          } catch (e) {}
        }
        title = title.replace(/^(?:ad|anúncio|patrocinado|oficial|indicado|novo)\s*/i, '').trim();
        if (!title || title.length < 3) continue;

        seen.add(cleanUrl);

        let price = 'Consulte';
        let rawPrice = 0;
        let originalPrice = '';
        let rawOriginalPrice = 0;

        const priceTexts = [];
        const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
        let node;
        while (node = walker.nextNode()) {
          const t = node.nodeValue?.trim();
          if (t && /R\$\s*[\d\.]+/i.test(t)) priceTexts.push(t);
        }
        if (priceTexts.length === 0) {
          const pEls = Array.from(card.querySelectorAll('span, div')).filter(el => /R\$\s*[\d\.]+/i.test(el.textContent));
          for (const el of pEls) {
            if (el.children.length === 0 || !el.querySelector('span, div')) priceTexts.push(el.textContent.trim());
          }
        }

        const parsedPrices = priceTexts.map(t => parsePrice(t)).filter(p => p.raw > 0);
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

        let imageUrl = '';
        const imgEl = card.querySelector('img');
        if (imgEl) {
          const candidates = [imgEl.getAttribute('data-src'), imgEl.getAttribute('data-lazy-src'), imgEl.src];
          imageUrl = candidates.find(u => u && typeof u === 'string' && u.startsWith('http') && !u.startsWith('data:')) || '';
        }

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

    // ==========================================
    // 3. MERCADO LIVRE SEARCH / LISTA
    // ==========================================
    if (isML) {
      const list = [];
      const seen = new Set();
      const cards = Array.from(document.querySelectorAll(
        'li.ui-search-layout__item, .poly-card, div.ui-search-result__wrapper, div[class*="poly-card"], div.andes-card, section.ui-search-results li, div[role="listitem"]'
      ));

      const productLinks = document.querySelectorAll('a[href*="/MLB-"], a[href*="/p/MLB"], a[href*="produto.mercadolivre.com.br"]');
      const cardSet = new Set(cards);
      for (const a of productLinks) {
        if (a.closest('header, nav, footer, #ml-afiliado-floating-btn, #ml-afiliado-modal-overlay')) continue;
        const c = a.closest('.poly-card, .andes-card, [class*="andes-card"], li, article') || a.parentElement;
        if (c && !cardSet.has(c)) {
          cardSet.add(c);
          cards.push(c);
        }
      }

      for (const card of cards) {
        let title = '';
        const titleEl = card.querySelector('.poly-component__title, .ui-search-item__title, [class*="component__title"], [class*="card__title"], [class*="item__title"], h2, h3');
        if (titleEl && titleEl.textContent.trim()) title = titleEl.textContent.trim();
        else {
          const imgEl = card.querySelector('img[alt]');
          if (imgEl && imgEl.alt && imgEl.alt.length > 3) title = imgEl.alt.trim();
        }

        const linkEl = card.querySelector('a.poly-component__title, a.ui-search-link') ||
                       card.querySelector('a[href*="/MLB-"], a[href*="/p/MLB"], a[href*="produto.mercadolivre.com.br"]') ||
                       titleEl?.closest('a') || (card.tagName === 'A' ? card : null);
        if (!linkEl || !linkEl.href) continue;

        const cleanUrl = linkEl.href.split('?')[0].split('#')[0];
        if (seen.has(cleanUrl)) continue;

        if (!title) title = linkEl.textContent.trim() || 'Produto Mercado Livre';
        title = title.replace(/^(?:oferta imperdível|mais vendido|patrocinado|novo)\s*/i, '').trim();
        if (!title || title.length < 3) continue;

        seen.add(cleanUrl);

        let originalPrice = '';
        let rawOriginalPrice = 0;
        let price = 'Consulte';
        let rawPrice = 0;
        let discount = '';
        let discountPercent = 0;

        const prevEl = card.querySelector('s.andes-money-amount, .andes-money-amount--previous');
        if (prevEl) {
          const pFrac = prevEl.querySelector('.andes-money-amount__fraction');
          const pCents = prevEl.querySelector('.andes-money-amount__cents');
          if (pFrac) {
            const f = pFrac.textContent.replace(/\./g, '').trim();
            const c = pCents ? pCents.textContent.trim() : '00';
            rawOriginalPrice = parseFloat(`${f}.${c}`) || 0;
            originalPrice = `R$ ${pFrac.textContent.trim()}${pCents && pCents.textContent.trim() ? ',' + pCents.textContent.trim() : ''}`;
          }
        }

        let currentEl = card.querySelector('.poly-price__current .andes-money-amount, .ui-search-price__second-line .andes-money-amount');
        if (!currentEl) {
          const allMoney = Array.from(card.querySelectorAll('.andes-money-amount'));
          currentEl = allMoney.find(el => !el.closest('s, del, [class*="previous"]'));
          if (!currentEl && allMoney.length > 0) currentEl = allMoney[allMoney.length - 1];
        }

        if (currentEl) {
          const cFrac = currentEl.querySelector('.andes-money-amount__fraction');
          const cCents = currentEl.querySelector('.andes-money-amount__cents');
          if (cFrac) {
            const f = cFrac.textContent.replace(/\./g, '').trim();
            const c = cCents ? cCents.textContent.trim() : '00';
            rawPrice = parseFloat(`${f}.${c}`) || 0;
            price = `R$ ${cFrac.textContent.trim()}${cCents && cCents.textContent.trim() ? ',' + cCents.textContent.trim() : ''}`;
          }
        }

        const discEl = card.querySelector('.andes-money-amount__discount, [class*="discount"]');
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

        let imageUrl = '';
        const imgEl = card.querySelector('img');
        if (imgEl) {
          const candidates = [imgEl.getAttribute('data-src'), imgEl.src];
          imageUrl = candidates.find(u => u && typeof u === 'string' && u.startsWith('http') && !u.startsWith('data:')) || '';
        }

        let rating = 0;
        let reviewsCount = '';
        const rEl = card.querySelector('.poly-reviews__rating, [class*="review"]');
        if (rEl) {
          const rm = rEl.textContent.replace(',', '.').match(/([345](?:\.\d+)?)/);
          if (rm) rating = parseFloat(rm[1]) || 0;
        }

        let sales = '';
        let salesCount = 0;
        const salesEl = card.querySelector('.poly-component__highlight, [class*="highlight"]');
        if (salesEl) sales = salesEl.textContent.trim();

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
          reviewsCount,
          sales,
          salesCount,
          platform: 'mercadolivre',
          platformName: 'Mercado Livre',
          platformIcon: '🟡',
          platformBadge: 'Mercado Livre'
        });
      }
      return list;
    }

    return [];
  }

  /**
   * Extração direta e independente executada no contexto da aba ativa
   * Funciona mesmo se o content script não tiver inicializado ou a aba não tiver sido recarregada
   */
  function extractDirectProductInTab() {
    const url = window.location.href;
    const isAmz = url.includes('amazon.') || url.includes('amzn.to') || url.includes('link.amazon');
    const isShp = (url.includes('shopee.com.br') || url.includes('s.shopee.com.br')) && !url.includes('careers.') && !url.includes('help.');
    const isML = url.includes('mercadolivre.com.br') || url.includes('meli.la');

    function parsePrice(str) {
      if (!str) return { raw: 0, formatted: 'Consulte' };
      const m = str.match(/R\$\s*([\d\.]+)(?:,(\d{2}))?/) || str.match(/([\d\.]+),(\d{2})/);
      if (!m) return { raw: 0, formatted: str.trim() };
      const intPart = m[1].replace(/\./g, '');
      const decPart = m[2] || '00';
      const raw = parseFloat(`${intPart}.${decPart}`) || 0;
      const formatted = `R$ ${m[1]}${m[2] ? ',' + m[2] : ''}`;
      return { raw, formatted };
    }

    if (isAmz) {
      // 1. ASIN obrigatório para ser considerado PDP
      const m = url.match(/(?:\/dp\/|\/gp\/product\/|\/ASIN\/|\/d\/|\/aw\/d\/)([A-Z0-9]{10})/i);
      let asin = m ? m[1].toUpperCase() : null;
      if (!asin) {
        const el = document.querySelector('input#ASIN, input[name="ASIN"], #ASIN');
        if (el) {
          const val = (el.value || el.getAttribute('data-asin') || '').trim();
          if (val && val.length === 10) asin = val.toUpperCase();
        }
      }
      if (!asin) return null;
      if (!document.querySelector('#productTitle, #title, h1#title')) return null;

      // 2. Título
      let title = '';
      const titleEl = document.querySelector('#productTitle, #title, h1#title');
      if (titleEl) title = titleEl.textContent.trim();
      if (!title) {
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle && ogTitle.content) title = ogTitle.content.split(':')[0].trim();
      }
      if (!title || title.length < 3) return null;

      // 3. Preço Atual
      let price = 'Consulte';
      let rawPrice = 0;
      let originalPrice = '';
      let rawOriginalPrice = 0;

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
          const p = parsePrice(el.textContent);
          if (p.raw > 0) {
            price = p.formatted;
            rawPrice = p.raw;
            break;
          }
        }
      }
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

      // Preço Original
      const origPriceSelectors = [
        '#corePriceDisplay_desktop_feature_div .basisPrice .a-offscreen',
        '.basisPrice .a-offscreen',
        '#corePriceDisplay_desktop_feature_div .a-text-price .a-offscreen',
        'span.a-text-price span.a-offscreen',
        'span[data-a-strike="true"] .a-offscreen'
      ];
      for (const sel of origPriceSelectors) {
        const el = document.querySelector(sel);
        if (el && el.textContent) {
          const p = parsePrice(el.textContent);
          if (p.raw > rawPrice && p.raw > 0) {
            originalPrice = p.formatted;
            rawOriginalPrice = p.raw;
            break;
          }
        }
      }

      // Desconto
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
        if (discountPercent > 0) discount = `${discountPercent}% OFF`;
      }

      // Mídia Robusta Amazon (detecta vídeo e imagens)
      let imageUrl = '';
      let videoUrl = '';
      let hasVideo = false;
      const amzVideo = document.querySelector('#vse-video-container video, .vse-player video, video, #video-player-container video');
      if (amzVideo) {
        hasVideo = true;
        videoUrl = amzVideo.src || amzVideo.querySelector('source')?.src || '';
      } else if (document.querySelector('#vse-video-container, .vse-player, #video-player-container')) {
        hasVideo = true;
      }

      const imgEl = document.querySelector('#landingImage, #imgBlkFront, #main-image');
      if (imgEl) {
        const hires = imgEl.getAttribute('data-old-hires');
        if (hires && hires.startsWith('http')) imageUrl = hires;
        if (!imageUrl) {
          const dyn = imgEl.getAttribute('data-a-dynamic-image');
          if (dyn) {
            try {
              const parsed = JSON.parse(dyn);
              const urls = Object.keys(parsed);
              if (urls.length > 0) imageUrl = urls[0];
            } catch (e) {}
          }
        }
        if (!imageUrl && imgEl.src && !imgEl.src.startsWith('data:')) imageUrl = imgEl.src;
      }

      // Se a imagem principal não estiver visível (ex: vídeo ativo), busca nas miniaturas
      if (!imageUrl) {
        const altImgs = Array.from(document.querySelectorAll('#altImages ul li img, #imageBlockThumbs img'));
        for (const aImg of altImgs) {
          const src = aImg.src || aImg.getAttribute('data-src') || '';
          if (src && src.startsWith('http') && !src.includes('play-icon') && !src.includes('video') && !src.endsWith('.mp4')) {
            imageUrl = src.replace(/\._[A-Z0-9_,]+_\.jpg$/i, '._AC_SL1500_.jpg');
            break;
          }
        }
      }

      if (!imageUrl) {
        const ogImg = document.querySelector('meta[property="og:image"]');
        if (ogImg && ogImg.content) imageUrl = ogImg.content;
      }

      // Rating
      let rating = 0;
      let reviewsCount = '';
      const rEl = document.querySelector('#acrPopover [title], span.a-icon-alt');
      if (rEl) {
        const rm = (rEl.title || rEl.textContent).replace(',', '.').match(/([345](?:\.\d+)?)/);
        if (rm) rating = parseFloat(rm[1]) || 0;
      }
      const revEl = document.querySelector('#acrCustomerReviewText, span[data-hook="total-review-count"]');
      if (revEl) reviewsCount = revEl.textContent.replace(/[()]/g, '').trim();

      const cleanUrl = asin ? `https://www.amazon.com.br/dp/${asin}` : url.split('?')[0].split('#')[0];

      return {
        title,
        price,
        rawPrice,
        originalPrice,
        rawOriginalPrice,
        discount,
        discountPercent,
        imageUrl: imageUrl || '',
        hasVideo,
        videoUrl,
        url: cleanUrl,
        asin,
        rating,
        reviewsCount: reviewsCount ? `(${reviewsCount})` : '',
        platform: 'amazon',
        platformName: 'Amazon',
        platformIcon: '🔷'
      };
    }

    if (isShp) {
      let title = '';
      const titleEl = document.querySelector('.WBVL_7, div[class*="WBVL_7"], span[class*="WBVL_7"], .attM6q, h1, div[class*="product-briefing"] h1');
      if (titleEl) title = titleEl.textContent.trim();
      if (!title) {
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle && ogTitle.content) title = ogTitle.content.split('|')[0].trim();
      }
      if (!title || title.length < 3) return null;

      let price = 'Consulte';
      let rawPrice = 0;
      const priceEl = document.querySelector('.flex.items-center .G27Shq, .pqTWkA, div[class*="price"], span[class*="price"]');
      if (priceEl) {
        const p = parsePrice(priceEl.textContent);
        if (p.raw > 0) {
          price = p.formatted;
          rawPrice = p.raw;
        }
      }

      // Mídia Robusta Shopee
      let imageUrl = '';
      let videoUrl = '';
      let videoPoster = '';
      let hasVideo = false;

      const shpVideo = document.querySelector('video, div[class*="video"] video, ._12-video video');
      if (shpVideo) {
        hasVideo = true;
        videoUrl = shpVideo.src || shpVideo.querySelector('source')?.src || '';
        videoPoster = shpVideo.getAttribute('poster') || shpVideo.poster || '';
      } else if (document.querySelector('div[class*="video"], ._12-video, [class*="play-button"]')) {
        hasVideo = true;
      }

      // JSON-LD
      try {
        const jsonLds = document.querySelectorAll('script[type="application/ld+json"]');
        for (const s of jsonLds) {
          const data = JSON.parse(s.textContent);
          const items = Array.isArray(data) ? data : [data];
          for (const item of items) {
            if (item['@type'] === 'Product' && item.image) {
              const imgs = Array.isArray(item.image) ? item.image : [item.image];
              imageUrl = imgs.find(u => u && typeof u === 'string' && u.startsWith('http') && !u.endsWith('.mp4')) || '';
              if (imageUrl) break;
            }
          }
          if (imageUrl) break;
        }
      } catch (e) {}

      if (!imageUrl && videoPoster && videoPoster.startsWith('http')) imageUrl = videoPoster;

      if (!imageUrl) {
        const shpImgs = Array.from(document.querySelectorAll('picture img, div[style*="background-image"], ._2J7tDe img, img[class*="product-image"], div[class*="gallery"] img, div[class*="product-briefing"] img'));
        for (const imgEl of shpImgs) {
          let u = '';
          if (imgEl.tagName === 'IMG' && imgEl.src && !imgEl.src.startsWith('data:')) {
            u = imgEl.src;
          } else if (imgEl.style && imgEl.style.backgroundImage) {
            const bgM = imgEl.style.backgroundImage.match(/url\(["']?([^"']+)["']?\)/);
            if (bgM) u = bgM[1];
          }
          if (u && u.startsWith('http') && !u.includes('logo') && !u.endsWith('.mp4')) {
            imageUrl = u;
            break;
          }
        }
      }

      if (!imageUrl) {
        const ogImg = document.querySelector('meta[property="og:image"]');
        if (ogImg && ogImg.content && ogImg.content.startsWith('http') && !ogImg.content.includes('logo') && !ogImg.content.endsWith('.mp4')) {
          imageUrl = ogImg.content;
        }
      }

      const m = url.match(/-i\.(\d+)\.(\d+)/) || url.match(/\/product\/(\d+)\/(\d+)/);
      if (!m) return null;
      const cleanUrl = `https://shopee.com.br/product/${m[1]}/${m[2]}`;

      return {
        title,
        price,
        rawPrice,
        imageUrl: imageUrl || videoPoster || '',
        hasVideo,
        videoUrl,
        videoPoster,
        url: cleanUrl,
        pageUrl: url.split('?')[0].split('#')[0],
        platform: 'shopee',
        platformName: 'Shopee',
        platformIcon: '🟠'
      };
    }

    if (isML) {
      if (!url.includes('/p/MLB') && !url.includes('MLB-') && !url.includes('produto.mercadolivre.com.br')) return null;

      let title = '';
      const titleEl = document.querySelector('h1.ui-pdp-title, h1');
      if (titleEl) title = titleEl.textContent.trim();
      if (!title || title.length < 3) return null;

      let price = 'Consulte';
      let rawPrice = 0;
      const priceFractionEl = document.querySelector('.ui-pdp-price__second-line .andes-money-amount__fraction, .andes-money-amount__fraction');
      if (priceFractionEl) {
        const intPart = priceFractionEl.textContent.replace(/\./g, '');
        const centsEl = priceFractionEl.parentElement?.querySelector('.andes-money-amount__cents');
        const cents = centsEl ? centsEl.textContent : '00';
        rawPrice = parseFloat(`${intPart}.${cents}`) || 0;
        price = `R$ ${priceFractionEl.textContent}${centsEl ? ',' + cents : ''}`;
      }

      // Mídia Robusta Mercado Livre (resiliente a vídeos na 1ª posição da galeria)
      let imageUrl = '';
      let videoUrl = '';
      let videoPoster = '';
      let hasVideo = false;

      // Detecta vídeo na galeria
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

      // Prioridade 1: Schema.org JSON-LD (catálogo oficial)
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

      // Prioridade 2: Video poster
      if (!imageUrl && videoPoster && videoPoster.startsWith('http') && !videoPoster.includes('logo_') && !videoPoster.startsWith('data:')) {
        imageUrl = videoPoster.trim();
      }

      // Prioridade 3: Galeria do Mercado Livre (todas as fotos e miniaturas)
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
            // Converte miniatura do ML (-I.webp, -R.webp, etc.) para Original (-O.webp)
            imageUrl = candidate.trim().replace(/-[A-Z]\.(webp|jpg|jpeg|png)$/i, '-O.$1');
            break;
          }
        }
      }

      // Prioridade 4: Metatags OpenGraph e Twitter
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

      // Comissão nativa ML
      let extractedCommissionRate = undefined;
      let commissionPercent = '';
      let commissionLabel = '';
      const barEl = document.querySelector('.affiliate-toolbar, .meli-affiliate-bar, [class*="affiliate-bar" i]');
      if (barEl) {
        const bt = barEl.textContent;
        const rm = bt.match(/(\d+(?:[.,]\d+)?)\s*%/);
        if (rm) {
          extractedCommissionRate = parseFloat(rm[1].replace(',', '.'));
          commissionPercent = `${extractedCommissionRate}%`;
          commissionLabel = 'Barra Afiliado ML';
        }
      }

      return {
        title,
        price,
        rawPrice,
        imageUrl: imageUrl || videoPoster || '',
        hasVideo,
        videoUrl,
        videoPoster,
        url: url.split('?')[0].split('#')[0],
        extractedCommissionRate,
        commissionPercent,
        commissionLabel,
        platform: 'mercadolivre',
        platformName: 'Mercado Livre',
        platformIcon: '🟡'
      };
    }

    return null;
  }

  function renderCurrentProductBanner(product) {
    if (!product || !product.title) return;
    currentPageProductData = product;

    const plat = product.platform || (product.url && product.url.includes('amazon') ? 'amazon' : (product.url && product.url.includes('shopee') ? 'shopee' : 'mercadolivre'));
    if (currentProductPlatformBadge) {
      if (plat === 'amazon') {
        currentProductPlatformBadge.className = 'platform-chip-badge badge-amazon';
        currentProductPlatformBadge.textContent = '🔷 Amazon';
      } else if (plat === 'shopee') {
        currentProductPlatformBadge.className = 'platform-chip-badge badge-shopee';
        currentProductPlatformBadge.textContent = '🟠 Shopee';
      } else {
        currentProductPlatformBadge.className = 'platform-chip-badge badge-ml';
        currentProductPlatformBadge.textContent = '🟡 Mercado Livre';
      }
      currentProductPlatformBadge.style.display = 'inline-block';
    }

    currentProductTitle.textContent = product.title;
    currentProductTitle.title = product.title;
    if (product.originalPrice && product.originalPrice !== product.price) {
      if (currentProductOriginalPrice) {
        currentProductOriginalPrice.textContent = product.originalPrice;
        currentProductOriginalPrice.style.display = 'inline-block';
      }
    } else if (currentProductOriginalPrice) {
      currentProductOriginalPrice.style.display = 'none';
    }

    currentProductPrice.textContent = product.price;
    currentProductImg.src = product.imageUrl || product.videoPoster || 'icons/icon128.png';
    currentProductImg.onerror = () => { 
      if (product.videoPoster && currentProductImg.src !== product.videoPoster) {
        currentProductImg.src = product.videoPoster;
      } else {
        currentProductImg.src = 'icons/icon128.png'; 
      }
    };

    // Badge de Vídeo se o produto possui mídia de vídeo
    const vidBadge = document.getElementById('currentProductVideoBadge');
    if (vidBadge) {
      if (product.hasVideo || product.videoUrl) {
        vidBadge.style.display = 'flex';
      } else {
        vidBadge.style.display = 'none';
      }
    }

    if (product.discount) {
      currentProductDiscount.textContent = product.discount;
      currentProductDiscount.style.display = 'inline-block';
    } else {
      currentProductDiscount.style.display = 'none';
    }

    // Metadados do Produto Aberto: Avaliação (⭐) e Vendas (🔥)
    let hasMeta = false;
    const numRating = typeof product.rating === 'number' ? product.rating : parseFloat(product.rating);
    if (currentProductRatingBadge) {
      if (numRating && numRating > 0) {
        const revText = product.reviewsCount ? ` <span class="reviews-count">(${escapeHtml(product.reviewsCount)})</span>` : '';
        currentProductRatingBadge.innerHTML = `⭐ ${numRating}${revText}`;
        currentProductRatingBadge.style.display = 'inline-flex';
        hasMeta = true;
      } else {
        currentProductRatingBadge.style.display = 'none';
      }
    }
    if (currentProductSalesBadge) {
      if (product.sales) {
        currentProductSalesBadge.innerHTML = `🔥 ${escapeHtml(product.sales)}`;
        currentProductSalesBadge.style.display = 'inline-flex';
        hasMeta = true;
      } else {
        currentProductSalesBadge.style.display = 'none';
      }
    }
    if (currentProductMetaRow) {
      currentProductMetaRow.style.display = hasMeta ? 'flex' : 'none';
    }

    // Comissão do Produto Aberto: Calculada/informada
    if (currentCommissionRow) {
      const commInfo = getProductCommissionInfo(product);
      if (commInfo) {
        currentCommissionRow.style.display = 'flex';
        if (currentProductCommission) {
          const valDisplay = commInfo.valText ? ` (${escapeHtml(commInfo.valText)})` : '';
          currentProductCommission.innerHTML = `💰 Comissão: <b>${escapeHtml(commInfo.rateText)}</b>${valDisplay}${escapeHtml(commInfo.labelPart)}`;
          currentProductCommission.title = `Taxa e comissão calculada para esta oferta.`;
        }
        if (currentProductCategory) {
          currentProductCategory.textContent = commInfo.categoryName ? `${commInfo.categoryIcon || '🏷️'} ${commInfo.categoryName}` : '';
        }
      } else {
        currentCommissionRow.style.display = 'none';
      }
    }



    updateCurrentProductFavStar();
    currentPageSection.style.display = 'flex';
  }

  // =========================================================================
  // CONFIGURAÇÕES & ARMAZENAMENTO LOCAL
  // =========================================================================

  async function saveAffiliateTag() {
    const tag = affiliateTagInput.value.trim();
    affiliateTag = tag;
    try {
      await chrome.storage.local.set({ ml_affiliate_tag: tag });
      if (typeof supabase !== 'undefined') supabase.syncLocalToCloud({ ml_affiliate_tag: tag });
      showToast(tag ? 'Etiqueta Mercado Livre salva com sucesso!' : 'Etiqueta removida.', '✅');
    } catch (err) {
      showToast('Erro ao salvar Etiqueta de Afiliado.', '❌');
    }
  }

  async function saveAmazonTag() {
    if (!amazonTagInput) return;
    const tag = amazonTagInput.value.trim();
    amazonAffiliateTag = tag;
    try {
      await chrome.storage.local.set({ amazon_affiliate_tag: tag });
      if (typeof supabase !== 'undefined') supabase.syncLocalToCloud({ amazon_affiliate_tag: tag });
      showToast(tag ? `Tag Amazon "${tag}" salva com sucesso!` : 'Tag Amazon removida.', '🔷');
    } catch (err) {
      showToast('Erro ao salvar Tag Amazon.', '❌');
    }
  }

  async function saveShopeeTag() {
    if (!shopeeTagInput) return;
    const tag = shopeeTagInput.value.trim();
    if (tag.includes('careers.shopee') || tag.includes('help.shopee') || tag.includes('/legal/')) {
      showToast('⚠️ A tag de afiliado não pode ser um link institucional.', '⚠️');
      shopeeTagInput.value = '';
      shopeeAffiliateTag = '';
      await chrome.storage.local.set({ shopee_affiliate_tag: '' });
      if (typeof supabase !== 'undefined') supabase.syncLocalToCloud({ shopee_affiliate_tag: '' });
      return;
    }
    shopeeAffiliateTag = tag;
    try {
      await chrome.storage.local.set({ shopee_affiliate_tag: tag });
      if (typeof supabase !== 'undefined') supabase.syncLocalToCloud({ shopee_affiliate_tag: tag });
      showToast(tag ? `Tag Shopee "${tag}" salva com sucesso!` : 'Tag Shopee removida.', '🟠');
    } catch (err) {
      showToast('Erro ao salvar Tag Shopee.', '❌');
    }
  }

  async function saveGroqKey() {
    const key = groqApiKeyInput.value.trim();
    groqApiKey = key;
    try {
      await chrome.storage.local.set({ groq_api_key: key });
      if (typeof supabase !== 'undefined') supabase.syncLocalToCloud({ groq_api_key: key });
      showToast('Chave de API do Groq salva com sucesso!', '🤖');
    } catch (err) {
      showToast('Erro ao salvar chave do Groq.', '❌');
    }
  }

  async function handleRemoveGroup(index) {
    if (index >= 0 && index < groups.length) {
      const removedName = groups[index];
      groups.splice(index, 1);
      selectedDispatchGroups.delete(removedName);
      if (removedName === pinnedGroup) {
        pinnedGroup = groups[0] || '';
        await chrome.storage.local.set({ ml_pinned_group: pinnedGroup });
      }
      await chrome.storage.local.set({
        ml_whatsapp_groups: groups,
        ml_selected_dispatch_groups: Array.from(selectedDispatchGroups)
      });
      if (typeof supabase !== 'undefined' && supabase.session) {
        try {
          await supabase.updateProfile({ ml_whatsapp_groups: groups });
        } catch (_) {}
      }
      renderGroupsUI();
      renderTargetGroupsSelector();
      showToast(`Grupo "${removedName}" removido dos cadastrados.`, '🗑️');
    }
  }

  async function persistGroups() {
    try {
      await chrome.storage.local.set({
        ml_whatsapp_groups: groups,
        ml_selected_dispatch_groups: Array.from(selectedDispatchGroups)
      });
      if (typeof supabase !== 'undefined' && supabase.session) {
        await supabase.updateProfile({ ml_whatsapp_groups: groups });
      }
    } catch (err) {
      showToast('Erro ao salvar grupos no storage.', '❌');
    }
  }

  function updatePinButtonUI() {
    if (!btnPinTargetGroup) return;
    const current = Array.from(selectedDispatchGroups)[0] || '';
    const isPinned = !!(current && current === pinnedGroup);
    if (isPinned) {
      btnPinTargetGroup.classList.add('active');
      if (btnPinTargetGroupText) btnPinTargetGroupText.textContent = 'Padrão Fixado';
      btnPinTargetGroup.title = `"${current}" está fixado como padrão. Clique para desfixar.`;
    } else {
      btnPinTargetGroup.classList.remove('active');
      if (btnPinTargetGroupText) btnPinTargetGroupText.textContent = 'Fixar Padrão';
      btnPinTargetGroup.title = 'Fixar este grupo como padrão para não ter que selecionar toda hora.';
    }
  }

  function renderGroupsUI() {
    const status = (typeof supabase !== 'undefined' && supabase.getPlanStatus)
      ? supabase.getPlanStatus()
      : { isSuperAdmin: false, maxAllowedGroups: 1, planName: 'STARTER' };
    const maxGroups = status.isSuperAdmin ? 9999 : (status.maxAllowedGroups || 1);

    const activeCount = Math.min(groups.length, maxGroups);
    if (groupsCount) {
      groupsCount.textContent = maxGroups >= 9999 ? groups.length : `${activeCount} de ${maxGroups} permitido(s)`;
    }
    if (planGroupsLimitBadge) {
      planGroupsLimitBadge.textContent = maxGroups >= 9999
        ? `${groups.length} cadastrado(s) (Ilimitado)`
        : `${activeCount} / ${maxGroups} no plano`;
    }

    if (!groupsList) return;
    groupsList.innerHTML = '';

    if (groups.length === 0) {
      const emptyLi = document.createElement('li');
      emptyLi.className = 'groups-empty-hint';
      emptyLi.textContent = 'Nenhum grupo cadastrado. Clique em "Puxar do WhatsApp" ou "+ Cadastrar Grupos"!';
      groupsList.appendChild(emptyLi);
      return;
    }

    groups.forEach((groupName, index) => {
      const isLocked = !status.isSuperAdmin && index >= maxGroups;
      const li = document.createElement('li');
      li.className = `group-item ${isLocked ? 'group-item-locked' : ''}`;

      const left = document.createElement('div');
      left.className = 'group-item-left';

      const isPinned = (groupName === pinnedGroup);

      const icon = document.createElement('span');
      icon.className = 'group-item-icon';
      icon.textContent = isLocked ? '🔒' : (isPinned ? '📌' : '💬');

      const nameSpan = document.createElement('span');
      nameSpan.className = 'group-item-name';
      nameSpan.textContent = groupName;
      nameSpan.title = groupName;

      left.appendChild(icon);
      left.appendChild(nameSpan);

      if (isLocked) {
        const lockBadge = document.createElement('span');
        lockBadge.className = 'group-pin-badge';
        lockBadge.style.background = '#fef2f2';
        lockBadge.style.color = '#dc2626';
        lockBadge.style.borderColor = '#fecaca';
        lockBadge.textContent = '🔒 Requer Pro/Ultra';
        left.appendChild(lockBadge);
      } else if (isPinned) {
        const pinBadge = document.createElement('span');
        pinBadge.className = 'group-pin-badge';
        pinBadge.textContent = '📌 Padrão';
        left.appendChild(pinBadge);
      }

      const removeBtn = document.createElement('button');
      removeBtn.className = 'group-item-remove';
      removeBtn.innerHTML = '&times;';
      removeBtn.title = `Remover grupo "${groupName}"`;
      removeBtn.addEventListener('click', () => handleRemoveGroup(index));

      li.appendChild(left);
      li.appendChild(removeBtn);

      if (isLocked) {
        li.style.opacity = '0.65';
        li.style.cursor = 'pointer';
        li.addEventListener('click', (e) => {
          if (e.target !== removeBtn) {
            showUpgradeModal(
              'Limite de Grupos do Plano',
              `O seu plano permite cadastrar até ${maxGroups} grupo(s). Faça upgrade para o Plano Pro (5 grupos) ou Ultra (10 grupos) para liberar todos!`
            );
          }
        });
      }

      groupsList.appendChild(li);
    });
  }

  function renderTargetGroupsSelector() {
    if (!targetGroupsContainer) return;
    targetGroupsContainer.innerHTML = '';

    const status = (typeof supabase !== 'undefined' && supabase.getPlanStatus)
      ? supabase.getPlanStatus()
      : { isSuperAdmin: false, maxAllowedGroups: 1, planName: 'STARTER' };
    const maxAllowed = status.isSuperAdmin ? 9999 : (status.maxAllowedGroups || 1);

    // Grupos ativos respeitando rigorosamente o limite do plano
    const activeGroups = status.isSuperAdmin ? groups : groups.slice(0, maxAllowed);

    if (activeGroups.length === 0) {
      const emptyBox = document.createElement('div');
      emptyBox.className = 'target-groups-empty-box';
      emptyBox.innerHTML = `
        <div class="empty-hint-text">
          <span>⚠️ Nenhum grupo cadastrado para disparo</span>
          <small>Cadastre até ${maxAllowed} grupo(s) do seu plano para disparar.</small>
        </div>
        <button type="button" class="btn-empty-register" id="btnEmptyRegisterGroups">
          Cadastrar Grupos
        </button>
      `;
      const btnReg = emptyBox.querySelector('#btnEmptyRegisterGroups');
      if (btnReg) {
        btnReg.addEventListener('click', openGroupRegisterModal);
      }
      targetGroupsContainer.appendChild(emptyBox);
      updateTargetSelectedCountBadge();
      return;
    }

    // Se nenhum grupo estiver selecionado, auto-seleciona
    if (selectedDispatchGroups.size === 0) {
      if (pinnedGroup && activeGroups.includes(pinnedGroup)) {
        selectedDispatchGroups.add(pinnedGroup);
      } else {
        selectedDispatchGroups.add(activeGroups[0]);
      }
      chrome.storage.local.set({ ml_selected_dispatch_groups: Array.from(selectedDispatchGroups) });
    }

    // Limpa seleções de grupos que não existem mais entre os ativos
    Array.from(selectedDispatchGroups).forEach(g => {
      if (!activeGroups.includes(g)) {
        selectedDispatchGroups.delete(g);
      }
    });

    // Renderiza cada grupo cadastrado como pill interativo com checkbox
    activeGroups.forEach(groupName => {
      const isSelected = selectedDispatchGroups.has(groupName);
      const isPinned = (groupName === pinnedGroup);

      const pill = document.createElement('div');
      pill.className = `target-group-pill ${isSelected ? 'selected' : ''}`;
      pill.dataset.group = groupName;

      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.className = 'target-group-checkbox';
      chk.checked = isSelected;

      const waIcon = document.createElement('span');
      waIcon.className = 'target-pill-icon';
      waIcon.textContent = isPinned ? '📌' : '💬';

      const label = document.createElement('span');
      label.className = 'target-pill-name';
      label.textContent = groupName;
      label.title = groupName;

      pill.appendChild(chk);
      pill.appendChild(waIcon);
      pill.appendChild(label);

      pill.addEventListener('click', (e) => {
        if (e.target !== chk) {
          chk.checked = !chk.checked;
        }
        if (chk.checked) {
          selectedDispatchGroups.add(groupName);
          pill.classList.add('selected');
        } else {
          selectedDispatchGroups.delete(groupName);
          pill.classList.remove('selected');
        }
        chrome.storage.local.set({ ml_selected_dispatch_groups: Array.from(selectedDispatchGroups) });
        updateTargetSelectedCountBadge();
      });

      chk.addEventListener('change', (e) => {
        e.stopPropagation();
        if (chk.checked) {
          selectedDispatchGroups.add(groupName);
          pill.classList.add('selected');
        } else {
          selectedDispatchGroups.delete(groupName);
          pill.classList.remove('selected');
        }
        chrome.storage.local.set({ ml_selected_dispatch_groups: Array.from(selectedDispatchGroups) });
        updateTargetSelectedCountBadge();
      });

      targetGroupsContainer.appendChild(pill);
    });

    updateTargetSelectedCountBadge();
  }

  function updateTargetSelectedCountBadge() {
    if (!targetSelectedCountBadge) return;
    const count = selectedDispatchGroups.size;
    targetSelectedCountBadge.textContent = `${count} selecionado(s)`;
    if (count > 0) {
      targetSelectedCountBadge.classList.add('has-selection');
    } else {
      targetSelectedCountBadge.classList.remove('has-selection');
    }
  }

  function openGroupRegisterModal() {
    if (!groupRegisterModal) return;
    const status = (typeof supabase !== 'undefined' && supabase.getPlanStatus)
      ? supabase.getPlanStatus()
      : { isSuperAdmin: false, maxAllowedGroups: 1, planName: 'STARTER' };
    const maxAllowed = status.isSuperAdmin ? 9999 : (status.maxAllowedGroups || 1);

    if (modalPlanName) {
      modalPlanName.textContent = `Plano: ${status.planName || 'STARTER'}`;
    }
    if (modalQuotaText) {
      modalQuotaText.textContent = status.isSuperAdmin
        ? 'Super Admin: Grupos Ilimitados'
        : `Limite: até ${maxAllowed} grupo(s) cadastrado(s)`;
    }

    // Inicializa seleção temporária com os grupos já cadastrados
    modalTempSelectedGroups = new Set(groups.slice(0, maxAllowed));

    if (groupSearchInput) groupSearchInput.value = '';
    renderAllDetectedGroupsList();
    updateModalQuotaBadge();

    groupRegisterModal.classList.remove('hidden');
  }

  function closeGroupRegisterModal() {
    if (groupRegisterModal) {
      groupRegisterModal.classList.add('hidden');
    }
  }

  function updateModalQuotaBadge() {
    if (!modalQuotaCounterBadge) return;
    const status = (typeof supabase !== 'undefined' && supabase.getPlanStatus)
      ? supabase.getPlanStatus()
      : { isSuperAdmin: false, maxAllowedGroups: 1 };
    const maxAllowed = status.isSuperAdmin ? 9999 : (status.maxAllowedGroups || 1);
    const count = modalTempSelectedGroups.size;

    modalQuotaCounterBadge.textContent = maxAllowed >= 9999
      ? `${count} selecionado(s)`
      : `${count} / ${maxAllowed} selecionados`;

    if (count >= maxAllowed && !status.isSuperAdmin) {
      modalQuotaCounterBadge.classList.add('limit-reached');
    } else {
      modalQuotaCounterBadge.classList.remove('limit-reached');
    }
  }

  function renderAllDetectedGroupsList() {
    if (!allDetectedGroupsList) return;
    allDetectedGroupsList.innerHTML = '';

    const filterText = (groupSearchInput ? groupSearchInput.value : '').toLowerCase().trim();

    // Combina todos os grupos detectados + quaisquer grupos já cadastrados
    const combinedSet = new Set([...groups, ...allDetectedGroups]);
    let list = Array.from(combinedSet);

    if (filterText) {
      list = list.filter(g => g.toLowerCase().includes(filterText));
    }

    if (list.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'detected-groups-empty';
      empty.innerHTML = `
        <span>Nenhum grupo encontrado ${filterText ? 'com essa busca' : 'no WhatsApp'}.</span>
        <small>Clique em "Puxar do WhatsApp" ou adicione pelo nome acima.</small>
      `;
      allDetectedGroupsList.appendChild(empty);
      return;
    }

    const status = (typeof supabase !== 'undefined' && supabase.getPlanStatus)
      ? supabase.getPlanStatus()
      : { isSuperAdmin: false, maxAllowedGroups: 1, planName: 'STARTER' };
    const maxAllowed = status.isSuperAdmin ? 9999 : (status.maxAllowedGroups || 1);

    list.forEach(groupName => {
      const isChecked = modalTempSelectedGroups.has(groupName);

      const item = document.createElement('div');
      item.className = `detected-group-item ${isChecked ? 'checked' : ''}`;

      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.className = 'detected-chk';
      chk.checked = isChecked;

      const name = document.createElement('span');
      name.className = 'detected-name';
      name.textContent = groupName;
      name.title = groupName;

      item.appendChild(chk);
      item.appendChild(name);

      const toggleCheck = () => {
        if (!chk.checked) {
          // Usuário quer marcar
          if (modalTempSelectedGroups.size >= maxAllowed && !status.isSuperAdmin) {
            showToast(`Limite atingido! O Plano ${status.planName} permite até ${maxAllowed} grupo(s). Faça upgrade para adicionar mais!`, '⚠️');
            showUpgradeModal(
              'Limite de Grupos do Plano',
              `O seu plano (${status.planName}) permite até ${maxAllowed} grupo(s) cadastrado(s). Desmarque um grupo para selecionar outro, ou faça upgrade para o Plano Pro (5 grupos) ou Ultra (10 grupos)!`
            );
            chk.checked = false;
            return;
          }
          modalTempSelectedGroups.add(groupName);
          chk.checked = true;
          item.classList.add('checked');
        } else {
          modalTempSelectedGroups.delete(groupName);
          chk.checked = false;
          item.classList.remove('checked');
        }
        updateModalQuotaBadge();
      };

      item.addEventListener('click', (e) => {
        if (e.target !== chk) {
          toggleCheck();
        }
      });

      chk.addEventListener('change', () => {
        chk.checked = !chk.checked;
        toggleCheck();
      });

      allDetectedGroupsList.appendChild(item);
    });
  }

  async function handleSaveRegisteredGroups() {
    const status = (typeof supabase !== 'undefined' && supabase.getPlanStatus)
      ? supabase.getPlanStatus()
      : { isSuperAdmin: false, maxAllowedGroups: 1 };
    const maxAllowed = status.isSuperAdmin ? 9999 : (status.maxAllowedGroups || 1);

    if (modalTempSelectedGroups.size > maxAllowed && !status.isSuperAdmin) {
      showToast(`Você selecionou ${modalTempSelectedGroups.size} grupos, mas seu plano permite no máximo ${maxAllowed}!`, '⚠️');
      return;
    }

    groups = Array.from(modalTempSelectedGroups);
    await chrome.storage.local.set({ ml_whatsapp_groups: groups });

    if (typeof supabase !== 'undefined' && supabase.session) {
      try {
        await supabase.updateProfile({ ml_whatsapp_groups: groups });
      } catch (e) {
        console.warn('[Supabase] Falha ao sincronizar grupos na nuvem:', e);
      }
    }

    renderGroupsUI();
    renderTargetGroupsSelector();
    closeGroupRegisterModal();
    showToast(`✅ ${groups.length} grupo(s) cadastrado(s) com sucesso!`, '🚀');
  }

  function handleAddManualGroup() {
    if (!manualGroupNameInput) return;
    const name = manualGroupNameInput.value.trim();
    if (!name) {
      showToast('Digite o nome do grupo.', '⚠️');
      return;
    }
    const status = (typeof supabase !== 'undefined' && supabase.getPlanStatus)
      ? supabase.getPlanStatus()
      : { isSuperAdmin: false, maxAllowedGroups: 1, planName: 'STARTER' };
    const maxAllowed = status.isSuperAdmin ? 9999 : (status.maxAllowedGroups || 1);

    if (modalTempSelectedGroups.size >= maxAllowed && !status.isSuperAdmin) {
      showToast(`Limite do plano atingido (${maxAllowed} grupo(s)).`, '⚠️');
      showUpgradeModal(
        'Limite de Grupos do Plano',
        `O seu plano permite até ${maxAllowed} grupo(s) cadastrado(s). Faça upgrade para o Plano Pro (5 grupos) ou Ultra (10 grupos)!`
      );
      return;
    }

    modalTempSelectedGroups.add(name);
    if (!allDetectedGroups.includes(name)) {
      allDetectedGroups.unshift(name);
      chrome.storage.local.set({ all_detected_whatsapp_groups: allDetectedGroups });
    }
    manualGroupNameInput.value = '';
    renderAllDetectedGroupsList();
    updateModalQuotaBadge();
    showToast(`Grupo "${name}" adicionado à seleção!`, '✅');
  }

  function populateTargetGroupDropdown(selectValue = null) {
    renderTargetGroupsSelector();
  }

  // =========================================================================
  // BUSCA DE OFERTAS & INTEGRAÇÃO COM BACKGROUND
  // =========================================================================

  async function handleSearch(forcedQuery = null) {
    const query = (forcedQuery || nicheInput.value).trim();
    if (!query) {
      showToast('Digite um nicho para buscar ofertas.', '⚠️');
      nicheInput.focus();
      return;
    }

    // Se o usuário digitou ou colou a URL de afiliados ou o termo 'afiliados'
    if (query.includes('mercadolivre.com.br/afiliados') || query.toLowerCase() === 'afiliados') {
      try {
        const mlTabs = await chrome.tabs.query({ url: ['*://*.mercadolivre.com.br/afiliados*'] });
        if (mlTabs && mlTabs.length > 0) {
          const afTab = mlTabs[0];
          try {
            await chrome.scripting.executeScript({
              target: { tabId: afTab.id },
              files: ['commission.js', 'content_ml.js']
            });
          } catch(e) {}
          const res = await new Promise(resolve => {
            chrome.tabs.sendMessage(afTab.id, { action: 'get_search_page_products' }, resolve);
          });
          if (res && res.success && Array.isArray(res.products) && res.products.length > 0) {
            allProducts = res.products;
            selectedProductUrls = new Set(allProducts.map(p => p.url));
            applyFiltersAndSorting();
            showToast(`⚡ ${allProducts.length} ofertas carregadas do Portal de Afiliados!`, '✨');
            return;
          }
        }
      } catch (afErr) {
        console.warn('[Afiliado ML] Erro ao puxar da aba de afiliados:', afErr);
      }
    }

    // Se o usuário digitou ou colou URL da Amazon
    if (query.includes('amazon.com.br') || query.includes('amzn.to')) {
      try {
        const amzTabs = await chrome.tabs.query({ url: ['*://*.amazon.com.br/*', '*://*.amzn.to/*'] });
        if (amzTabs && amzTabs.length > 0) {
          const amzTab = amzTabs[0];
          try {
            await chrome.scripting.executeScript({
              target: { tabId: amzTab.id },
              files: ['content_amazon.js']
            });
          } catch(e) {}
          const res = await new Promise(resolve => {
            chrome.tabs.sendMessage(amzTab.id, { action: 'get_search_page_products' }, resolve);
          });
          if (res && res.success && Array.isArray(res.products) && res.products.length > 0) {
            allProducts = res.products;
            selectedProductUrls = new Set(allProducts.map(p => p.url));
            applyFiltersAndSorting();
            showToast(`⚡ ${allProducts.length} ofertas carregadas da Amazon!`, '✨');
            return;
          }
        }
      } catch (e) {}
    }

    // Se o usuário digitou ou colou URL da Shopee
    if (query.includes('shopee.com.br') || query.includes('s.shopee.com.br')) {
      try {
        const shpTabs = await chrome.tabs.query({ url: ['*://*.shopee.com.br/*', '*://*.s.shopee.com.br/*'] });
        if (shpTabs && shpTabs.length > 0) {
          const shpTab = shpTabs[0];
          try {
            await chrome.scripting.executeScript({
              target: { tabId: shpTab.id },
              files: ['content_shopee.js']
            });
          } catch(e) {}
          const res = await new Promise(resolve => {
            chrome.tabs.sendMessage(shpTab.id, { action: 'get_search_page_products' }, resolve);
          });
          if (res && res.success && Array.isArray(res.products) && res.products.length > 0) {
            allProducts = res.products;
            selectedProductUrls = new Set(allProducts.map(p => p.url));
            applyFiltersAndSorting();
            showToast(`⚡ ${allProducts.length} ofertas carregadas da Shopee!`, '✨');
            return;
          }
        }
      } catch (e) {}
    }

    renderLoadingState(query);
    resultsCountBadge.style.display = 'none';
    if (filterSortToolbar) filterSortToolbar.classList.add('hidden');

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'search_offers',
        query: query
      });

      if (response && response.success && Array.isArray(response.products) && response.products.length > 0) {
        allProducts = response.products;
        // Marca todos os produtos encontrados inicialmente
        selectedProductUrls = new Set(allProducts.map(p => p.url));
        applyFiltersAndSorting();
      } else {
        const errorMsg = (response && response.error) || 'Nenhuma oferta encontrada para este nicho.';
        renderEmptyState(errorMsg, query);
      }
    } catch (err) {
      console.warn('[Afiliado ML] Erro na comunicação de busca:', err);
      renderErrorState('Falha ao comunicar com o motor de busca da extensão.');
    }
  }

  // =========================================================================
  // DISPARO DE OFERTA INDIVIDUAL COM IA GROQ PARA O WHATSAPP WEB
  // =========================================================================

  async function handleDispatchOffer(product, btnElement) {
    if (typeof supabase !== 'undefined') {
      if (!supabase.session) {
        showAuthModal(false);
        showToast('Faça login na sua conta para disparar ofertas.', '⚠️');
        return;
      }

      const status = supabase.getPlanStatus();
      if (status.isLocked) {
        showUpgradeModal('Seu Período de Teste Expirou!', 'Para continuar disparando ofertas com IA para o WhatsApp, assine um plano:');
        showToast('Seu período de teste expirou. Assine um plano para continuar!', '⚠️');
        return;
      }

      // Validação de plataforma para Plano Starter (apenas 1 permitida)
      if (status.plan === 'starter' && status.allowedPlatform && status.allowedPlatform !== 'all') {
        const prodPlat = (product.platform || (product.url?.includes('amazon') ? 'amazon' : (product.url?.includes('shopee') ? 'shopee' : 'mercadolivre'))).toLowerCase();
        if (prodPlat !== status.allowedPlatform.toLowerCase()) {
          showToast(`O seu Plano Starter dá acesso apenas à plataforma ${status.allowedPlatform.toUpperCase()}. Faça upgrade para o Pro ou Ultra!`, '⚠️');
          showUpgradeModal('Plataforma Bloqueada no Plano Starter', `Seu plano atual permite apenas ofertas da plataforma ${status.allowedPlatform.toUpperCase()}. Faça upgrade para o Pro ou Ultra para usar todas simultaneamente!`);
          return;
        }
      }
    }

    const selectedGroups = Array.from(selectedDispatchGroups);
    if (selectedGroups.length === 0) {
      if (targetGroupsContainer) {
        targetGroupsContainer.classList.add('highlight-error');
        setTimeout(() => targetGroupsContainer.classList.remove('highlight-error'), 800);
      }
      showToast('Selecione pelo menos um grupo cadastrado para o disparo!', '⚠️');
      return;
    }

    if (typeof supabase !== 'undefined') {
      const status = supabase.getPlanStatus();
      if (!status.isSuperAdmin) {
        const maxGroups = status.maxAllowedGroups || 1;
        const invalidGroup = selectedGroups.find(g => groups.indexOf(g) >= maxGroups || !groups.includes(g));
        if (invalidGroup) {
          showToast(`O seu plano permite disparar para até ${maxGroups} grupo(s). Faça upgrade para o Pro ou Ultra!`, '⚠️');
          showUpgradeModal('Limite de Grupos do Plano', `O grupo "${invalidGroup}" ultrapassa a cota de ${maxGroups} grupo(s) do seu plano atual (${status.planName}). Faça upgrade para o Plano Pro (5 grupos) ou Ultra (10 grupos) para disparar para este grupo!`);
          return;
        }
      }
    }

    const platTag = product.platform === 'amazon' 
      ? (amazonAffiliateTag || (amazonTagInput ? amazonTagInput.value.trim() : ''))
      : (product.platform === 'shopee' 
          ? (shopeeAffiliateTag || (shopeeTagInput ? shopeeTagInput.value.trim() : ''))
          : (affiliateTag || ''));
    const affiliateLink = buildAffiliateLink(product, platTag);

    // Se o usuário editou a copy na prévia, usa-a; se não, a IA gera automaticamente
    let customText = '';
    if (activeMainTab === 'favorites') {
      if (favAiPreviewBox && !favAiPreviewBox.classList.contains('hidden') && favAiCustomCopyTextarea && favAiCustomCopyTextarea.value.trim()) {
        customText = favAiCustomCopyTextarea.value.trim();
      }
    } else {
      if (aiPreviewBox && !aiPreviewBox.classList.contains('hidden') && aiCustomCopyTextarea && aiCustomCopyTextarea.value.trim()) {
        customText = aiCustomCopyTextarea.value.trim();
      }
    }

    const originalContent = btnElement.innerHTML;
    btnElement.classList.add('loading');
    btnElement.disabled = true;

    delete product.coupon;

    try {
      const currentTag = affiliateTagInput.value.trim() || affiliateTag;
      let successCount = 0;
      let errors = [];

      for (let i = 0; i < selectedGroups.length; i++) {
        const gName = selectedGroups[i];
        const shortName = gName.length > 12 ? gName.substring(0, 10) + '...' : gName;

        btnElement.innerHTML = `
          <div class="spinner" style="width:11px;height:11px;border-width:2px;border-top-color:#fff;"></div>
          <span>(${i + 1}/${selectedGroups.length}) ${escapeHtml(shortName)}...</span>
        `;

        try {
          const response = await chrome.runtime.sendMessage({
            action: 'send_offer',
            productData: product,
            affiliateLink: affiliateLink,
            affiliateTag: currentTag,
            groupName: gName,
            messageText: customText,
            copyStyle: currentCopyStyle
          });

          if (response && response.success) {
            successCount++;
            showToast(`✅ Enviado para "${gName}" (${i + 1}/${selectedGroups.length})`, '🚀');
          } else {
            errors.push(response?.error || `Erro ao enviar para ${gName}`);
          }
        } catch (errGroup) {
          errors.push(errGroup.message || `Erro no grupo ${gName}`);
        }

        // Intervalo de segurança anti-bloqueio entre grupos diferentes
        if (i < selectedGroups.length - 1) {
          await new Promise(r => setTimeout(r, 3500));
        }
      }

      if (successCount > 0) {
        btnElement.classList.remove('loading');
        btnElement.classList.add('success');
        btnElement.innerHTML = `<span>✅ Enviado (${successCount}/${selectedGroups.length})</span>`;

        showToast(`🚀 Oferta disparada para ${successCount} grupo(s) com sucesso!`, '✅');

        // Atualiza contador de disparos na UI
        if (typeof supabase !== 'undefined' && supabase.profile) {
          if (supabase.profile.daily_dispatches_count !== undefined) {
            supabase.profile.daily_dispatches_count += successCount;
            renderUserPlanUI();
          }
        }

        setTimeout(() => {
          btnElement.classList.remove('success');
          btnElement.disabled = false;
          btnElement.innerHTML = originalContent;
        }, 3000);
      } else {
        throw new Error(errors.join(', ') || 'Erro desconhecido ao disparar para os grupos selecionados.');
      }
    } catch (err) {
      console.warn('Falha ao disparar oferta:', err);
      btnElement.classList.remove('loading');
      btnElement.disabled = false;
      btnElement.innerHTML = originalContent;

      const errMsg = err.message || 'Erro ao disparar';
      if (errMsg.includes('expirou') || errMsg.includes('limite diário') || errMsg.includes('Starter') || errMsg.includes('Assine um plano')) {
        showUpgradeModal('Atenção: Limite ou Assinatura', errMsg);
      }
      showToast(`Falha no envio: ${errMsg}`, '❌');
    }
  }

  function buildAffiliateLink(productOrUrl, overrideTag) {
    const rawUrl = typeof productOrUrl === 'object' ? (productOrUrl.url || '') : (productOrUrl || '');
    if (!rawUrl) return '';

    const plat = typeof productOrUrl === 'object' && productOrUrl.platform
      ? productOrUrl.platform
      : (rawUrl.includes('amazon.com.br') || rawUrl.includes('amzn.to') ? 'amazon' : (rawUrl.includes('shopee.com.br') || rawUrl.includes('s.shopee.com.br') ? 'shopee' : 'mercadolivre'));

    const cleanBase = rawUrl.split('?')[0].split('#')[0];

    // Se o produto já possui um shortlink oficial extraído diretamente da página
    if (typeof productOrUrl === 'object' && productOrUrl.affiliateShortLink) {
      return productOrUrl.affiliateShortLink;
    }

    if (plat === 'amazon') {
      if (rawUrl.includes('amzn.to/') || rawUrl.includes('link.amazon/') || rawUrl.includes('a.co/')) return rawUrl;
      const amzTag = (overrideTag || amazonAffiliateTag || (amazonTagInput ? amazonTagInput.value.trim() : '')).trim();
      const asinMatch = (typeof productOrUrl === 'object' && productOrUrl.asin ? productOrUrl.asin : rawUrl).match(/(?:\/dp\/|\/gp\/product\/|\/ASIN\/|^)([A-Z0-9]{10})/i);
      const asin = asinMatch ? asinMatch[1].toUpperCase() : null;
      if (asin) {
        return amzTag ? `https://www.amazon.com.br/dp/${asin}?tag=${encodeURIComponent(amzTag)}` : `https://www.amazon.com.br/dp/${asin}`;
      }
      if (!amzTag) return cleanBase;
      const sep = cleanBase.includes('?') ? '&' : '?';
      return `${cleanBase}${sep}tag=${encodeURIComponent(amzTag)}`;
    }

    if (plat === 'shopee') {
      if (rawUrl.includes('s.shopee.com.br/')) return rawUrl;
      const m = rawUrl.match(/-i\.(\d+)\.(\d+)/) || rawUrl.match(/\/product\/(\d+)\/(\d+)/);
      const cleanProd = m ? `https://shopee.com.br/product/${m[1]}/${m[2]}` : cleanBase;
      let shpTag = (overrideTag || shopeeAffiliateTag || (shopeeTagInput ? shopeeTagInput.value.trim() : '')).trim();
      if (shpTag.includes('careers.') || shpTag.includes('help.') || shpTag.includes('/legal/')) {
        shpTag = '';
      }
      if (!shpTag) return cleanProd;
      const affiliateId = !shpTag.startsWith('http') ? shpTag : '';
      if (shpTag && shpTag.startsWith('http')) {
        return shpTag.includes('{url}') ? shpTag.replace('{url}', encodeURIComponent(cleanProd)) : `${shpTag}${encodeURIComponent(cleanProd)}`;
      }
      const sep = cleanProd.includes('?') ? '&' : '?';
      return `${cleanProd}${sep}utm_source=${encodeURIComponent(affiliateId)}&utm_medium=affiliates&utm_campaign=whatsapp&mmp_pid=${encodeURIComponent(affiliateId)}`;
    }

    // Mercado Livre
    const mlTag = (overrideTag || (affiliateTagInput ? affiliateTagInput.value.trim() : '') || affiliateTag || '').trim();
    if (!mlTag) return cleanBase;
    if (mlTag.includes('{url}')) {
      return mlTag.replace('{url}', encodeURIComponent(cleanBase));
    }
    if (mlTag.startsWith('http://') || mlTag.startsWith('https://')) {
      return `${mlTag}${encodeURIComponent(cleanBase)}`;
    }

    try {
      const urlObj = new URL(cleanBase);
      urlObj.searchParams.set('matt_tool', mlTag);
      urlObj.searchParams.set('matt_word', mlTag);
      urlObj.searchParams.set('afiliado', mlTag);
      return urlObj.toString();
    } catch (e) {
      return `${cleanBase}?matt_tool=${encodeURIComponent(mlTag)}&afiliado=${encodeURIComponent(mlTag)}`;
    }
  }

  // =========================================================================
  // ESTADOS DE TELA & TOAST NOTIFICATION
  // =========================================================================

  function renderLoadingState(query) {
    resultsContainer.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <span class="loading-text">Buscando ofertas com desconto...</span>
        <span class="loading-subtext">Nicho: "${escapeHtml(query)}"</span>
      </div>
    `;
  }

  function renderEmptyState(message, query) {
    resultsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <h3>Nenhum produto encontrado</h3>
        <p>${escapeHtml(message)}</p>
        <p style="font-size: 11px; color: #475569; margin-top: 8px; line-height: 1.4;">
          💡 <strong>Dica Ninja:</strong> você pode navegar no Mercado Livre normalmente! A extensão detecta todos os produtos na sua aba ou na busca e permite disparar em 1 clique ou em massa.
        </p>
        <button class="btn-retry" id="retryBtn">Tentar Novamente</button>
      </div>
    `;

    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => handleSearch(query));
    }
  }

  function renderErrorState(message) {
    resultsContainer.innerHTML = `
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>Ocorreu um Erro</h3>
        <p>${escapeHtml(message)}</p>
        <button class="btn-retry" id="retryErrorBtn">Tentar Novamente</button>
      </div>
    `;

    const retryErrorBtn = document.getElementById('retryErrorBtn');
    if (retryErrorBtn) {
      retryErrorBtn.addEventListener('click', () => handleSearch());
    }
  }

  // =========================================================================
  // SISTEMA DE FAVORITOS & LINHA DO TEMPO POR DIA
  // =========================================================================

  function cleanProductUrl(url) {
    if (!url) return '';
    return String(url).split('?')[0].split('#')[0].trim();
  }

  function switchMainTab(tabName) {
    activeMainTab = tabName;
    if (tabName === 'search') {
      if (tabBtnSearch) tabBtnSearch.classList.add('active');
      if (tabBtnFavorites) tabBtnFavorites.classList.remove('active');
      if (searchControlsSection) searchControlsSection.style.display = 'block';
      if (searchResultsSection) searchResultsSection.style.display = 'block';
      if (favoritesTabPane) favoritesTabPane.classList.add('hidden');
    } else if (tabName === 'favorites') {
      if (tabBtnFavorites) tabBtnFavorites.classList.add('active');
      if (tabBtnSearch) tabBtnSearch.classList.remove('active');
      if (searchControlsSection) searchControlsSection.style.display = 'none';
      if (searchResultsSection) searchResultsSection.style.display = 'none';
      if (favoritesTabPane) favoritesTabPane.classList.remove('hidden');
      renderFavoritesUI();
    }
  }

  async function loadFavorites() {
    try {
      const resp = await chrome.runtime.sendMessage({ action: 'get_favorites' });
      if (resp && resp.success && Array.isArray(resp.favorites)) {
        favoriteOffers = resp.favorites;
      } else {
        const stored = await chrome.storage.local.get(['ml_favorite_offers']);
        favoriteOffers = Array.isArray(stored.ml_favorite_offers) ? stored.ml_favorite_offers : [];
      }
    } catch (e) {
      const stored = await chrome.storage.local.get(['ml_favorite_offers']);
      favoriteOffers = Array.isArray(stored.ml_favorite_offers) ? stored.ml_favorite_offers : [];
    }

    // Se autenticado no Supabase, mescla de forma inteligente e garante persistência na nuvem
    if (typeof supabase !== 'undefined') {
      try {
        await supabase.ensureSession();
        if (!supabase.profile) {
          await supabase.fetchProfile();
        }
        const cloudFavs = (supabase.profile && Array.isArray(supabase.profile.favorite_offers))
          ? supabase.profile.favorite_offers
          : [];

        const allFavs = [...favoriteOffers, ...cloudFavs];
        const mergedList = (typeof deduplicateFavoritesList === 'function')
          ? deduplicateFavoritesList(allFavs)
          : allFavs;

        favoriteOffers = mergedList;
        await chrome.storage.local.set({ ml_favorite_offers: favoriteOffers });

        // Se houve itens desduplicados ou itens locais adicionais, persiste a lista limpa
        if (mergedList.length !== cloudFavs.length) {
          await supabase.syncLocalToCloud({ favorite_offers: favoriteOffers });
        }
      } catch (err) {
        console.warn('[Afiliado ML] Erro ao sincronizar favoritos com nuvem:', err);
      }
    }

    // Carregamento e sincronização de Pastas
    try {
      const storedFolders = await chrome.storage.local.get(['ml_favorite_folders']);
      const authFolders = (typeof supabase !== 'undefined' && supabase.session?.user?.user_metadata?.favorite_folders)
        ? supabase.session.user.user_metadata.favorite_folders
        : null;
      const profileFolders = (typeof supabase !== 'undefined' && supabase.profile?.favorite_folders)
        ? supabase.profile.favorite_folders
        : null;
      const cloudFolders = (profileFolders && Array.isArray(profileFolders) && profileFolders.length > 0)
        ? profileFolders
        : (authFolders && Array.isArray(authFolders) && authFolders.length > 0 ? authFolders : null);

      if (cloudFolders && cloudFolders.length > 0) {
        favoriteFolders = cloudFolders;
        chrome.storage.local.set({ ml_favorite_folders: favoriteFolders });
      } else if (Array.isArray(storedFolders.ml_favorite_folders) && storedFolders.ml_favorite_folders.length > 0) {
        favoriteFolders = storedFolders.ml_favorite_folders;
        if (typeof supabase !== 'undefined' && supabase.session) {
          supabase.syncLocalToCloud({ favorite_folders: favoriteFolders });
        }
      } else {
        favoriteFolders = [
          { id: 'fld_tech', name: 'Tecnologia' },
          { id: 'fld_casa', name: 'Casa & Cozinha' },
          { id: 'fld_achados', name: 'Achadinhos' }
        ];
        chrome.storage.local.set({ ml_favorite_folders: favoriteFolders });
        if (typeof supabase !== 'undefined' && supabase.session) {
          supabase.syncLocalToCloud({ favorite_folders: favoriteFolders });
        }
      }
    } catch (e) {}

    // Filtra ofertas corrompidas ou institucionais e sincroniza o armazenamento
    const validFavorites = favoriteOffers.filter(item => {
      if (!item || !item.url) return false;
      if (item.url.includes('careers.shopee') || item.url.includes('help.shopee') || item.url.includes('/legal/')) return false;
      return true;
    });
    if (validFavorites.length !== favoriteOffers.length) {
      favoriteOffers = validFavorites;
      chrome.storage.local.set({ ml_favorite_offers: favoriteOffers });
    }

    // Garante que todo item tenha imageUrl e image preenchidos
    favoriteOffers.forEach(item => {
      const img = item.imageUrl || item.image || item.thumbnail || '';
      if (img) {
        item.imageUrl = img;
        item.image = img;
      }
    });

    updateFavoritesBadge();
    return favoriteOffers;
  }

  async function toggleFavorite(product) {
    if (!product || !product.url) return;
    try {
      // Garante cálculo completo de comissão antes de salvar no storage e nuvem
      getProductCommissionInfo(product);
      const resp = await chrome.runtime.sendMessage({ action: 'toggle_favorite', product });
      if (resp && resp.success) {
        favoriteOffers = resp.favorites || [];
        updateFavoritesBadge();
        if (typeof supabase !== 'undefined') {
          await supabase.syncLocalToCloud({ favorite_offers: favoriteOffers });
        }
        if (resp.isFavorite) {
          showToast('Oferta favoritada com sucesso! ⭐', '⭐');
        } else {
          showToast('Oferta removida dos favoritos.', 'ℹ️');
          selectedFavoriteUrls.delete(product.url);
        }
        if (activeMainTab === 'favorites') {
          renderFavoritesUI();
        }
      }
    } catch (err) {
      showToast(`Erro ao atualizar favoritos: ${err.message}`, '⚠️');
    }
  }

  async function handleRemoveFavorite(item) {
    try {
      const resp = await chrome.runtime.sendMessage({ action: 'delete_favorite', id: item.id, url: item.url });
      if (resp && resp.success) {
        favoriteOffers = resp.favorites || [];
        selectedFavoriteUrls.delete(item.url);
        updateFavoritesBadge();
        if (typeof supabase !== 'undefined') {
          await supabase.syncLocalToCloud({ favorite_offers: favoriteOffers });
        }
        renderFavoritesUI();
        showToast('Oferta removida dos favoritos.', '🗑️');
      }
    } catch (e) {
      showToast('Erro ao remover dos favoritos.', '⚠️');
    }
  }

  async function handleClearAllFavorites() {
    if (favoriteOffers.length === 0) {
      showToast('Nenhuma oferta nos favoritos para remover.', 'ℹ️');
      return;
    }
    const confirmClear = confirm('Tem certeza que deseja apagar todas as ofertas dos favoritos?');
    if (!confirmClear) return;

    try {
      const resp = await chrome.runtime.sendMessage({ action: 'clear_favorites' });
      if (resp && resp.success) {
        favoriteOffers = [];
        selectedFavoriteUrls.clear();
        updateFavoritesBadge();
        if (typeof supabase !== 'undefined') {
          await supabase.syncLocalToCloud({ favorite_offers: [] });
        }
        renderFavoritesUI();
        showToast('Todos os favoritos foram removidos.', '🗑️');
      }
    } catch (e) {
      showToast('Erro ao limpar favoritos.', '⚠️');
    }
  }

  function updateFavoritesBadge() {
    const count = favoriteOffers.length;
    if (favoritesBadge) {
      favoritesBadge.textContent = count;
      favoritesBadge.style.display = count > 0 ? 'inline-block' : 'none';
    }
    if (favTotalSavedCount) {
      favTotalSavedCount.textContent = `${count} ${count === 1 ? 'salva' : 'salvas'}`;
    }
    updateCurrentProductFavStar();
  }

  function updateCurrentProductFavStar() {
    if (!btnFavCurrentProduct) return;
    if (!currentPageProductData || !currentPageProductData.url) {
      btnFavCurrentProduct.classList.remove('active');
      if (btnFavCurrentIcon) btnFavCurrentIcon.textContent = '⭐';
      btnFavCurrentProduct.title = 'Salvar nos Favoritos';
      return;
    }
    const cleanCurrentUrl = cleanProductUrl(currentPageProductData.url);
    const isFav = favoriteOffers.some(f => cleanProductUrl(f.url) === cleanCurrentUrl);
    if (isFav) {
      btnFavCurrentProduct.classList.add('active');
      if (btnFavCurrentIcon) btnFavCurrentIcon.textContent = '★';
      btnFavCurrentProduct.title = 'Remover dos Favoritos';
    } else {
      btnFavCurrentProduct.classList.remove('active');
      if (btnFavCurrentIcon) btnFavCurrentIcon.textContent = '⭐';
      btnFavCurrentProduct.title = 'Salvar nos Favoritos';
    }
  }

  function groupFavoritesByDay(favorites) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const yesterdayStart = todayStart - oneDayMs;

    const groupsMap = new Map();

    favorites.forEach(item => {
      const timestamp = item.savedAt || Date.now();
      const itemDate = new Date(timestamp);
      const itemDayStart = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate()).getTime();

      let dayType = 'other';
      let dayLabel = '';
      let dayKey = '';

      if (itemDayStart === todayStart) {
        dayType = 'today';
        const formattedDate = itemDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        dayLabel = `📅 Hoje (${formattedDate})`;
        dayKey = 'today';
      } else if (itemDayStart === yesterdayStart) {
        dayType = 'yesterday';
        const formattedDate = itemDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        dayLabel = `📅 Ontem (${formattedDate})`;
        dayKey = 'yesterday';
      } else {
        dayType = 'other';
        dayKey = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}-${String(itemDate.getDate()).padStart(2, '0')}`;
        dayLabel = `📅 ${itemDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`;
      }

      if (!groupsMap.has(dayKey)) {
        groupsMap.set(dayKey, {
          key: dayKey,
          type: dayType,
          label: dayLabel,
          dateMs: itemDayStart,
          items: []
        });
      }
      groupsMap.get(dayKey).items.push(item);
    });

    return Array.from(groupsMap.values()).sort((a, b) => b.dateMs - a.dateMs);
  }

  function renderFavFoldersBar() {
    if (!favFoldersBar) return;
    favFoldersBar.innerHTML = '';

    // Pill Todas
    const allPill = document.createElement('button');
    allPill.type = 'button';
    allPill.className = `fav-folder-pill ${activeFavoriteFolder === 'all' ? 'active' : ''}`;
    allPill.style.cssText = `padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; cursor: pointer; white-space: nowrap; border: 1px solid ${activeFavoriteFolder === 'all' ? '#2D3277' : '#e2e8f0'}; background: ${activeFavoriteFolder === 'all' ? '#2D3277' : '#f8fafc'}; color: ${activeFavoriteFolder === 'all' ? '#fff' : '#475569'}; transition: all 0.15s ease;`;
    allPill.innerHTML = `📁 Todas (${favoriteOffers.length})`;
    allPill.onclick = () => {
      activeFavoriteFolder = 'all';
      renderFavoritesUI();
    };
    favFoldersBar.appendChild(allPill);

    // Pills de cada pasta
    favoriteFolders.forEach(fld => {
      const count = favoriteOffers.filter(f => f.folder_id === fld.id).length;
      const isAct = activeFavoriteFolder === fld.id;
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = `fav-folder-pill ${isAct ? 'active' : ''}`;
      pill.style.cssText = `padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; cursor: pointer; white-space: nowrap; border: 1px solid ${isAct ? '#2D3277' : '#e2e8f0'}; background: ${isAct ? '#2D3277' : '#f8fafc'}; color: ${isAct ? '#fff' : '#475569'}; display: inline-flex; align-items: center; gap: 4px; transition: all 0.15s ease;`;
      pill.innerHTML = `<span>📁 ${escapeHtml(fld.name)} (${count})</span>`;
      pill.onclick = () => {
        activeFavoriteFolder = fld.id;
        renderFavoritesUI();
      };
      favFoldersBar.appendChild(pill);
    });

    // Pill Sem Pasta (quando houver)
    const unorganizedCount = favoriteOffers.filter(f => !f.folder_id).length;
    if (unorganizedCount > 0) {
      const isAct = activeFavoriteFolder === 'unorganized';
      const unorgPill = document.createElement('button');
      unorgPill.type = 'button';
      unorgPill.className = `fav-folder-pill ${isAct ? 'active' : ''}`;
      unorgPill.style.cssText = `padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; cursor: pointer; white-space: nowrap; border: 1px solid ${isAct ? '#2D3277' : '#e2e8f0'}; background: ${isAct ? '#2D3277' : '#f8fafc'}; color: ${isAct ? '#fff' : '#64748b'}; transition: all 0.15s ease;`;
      unorgPill.innerHTML = `📁 Sem Pasta (${unorganizedCount})`;
      unorgPill.onclick = () => {
        activeFavoriteFolder = 'unorganized';
        renderFavoritesUI();
      };
      favFoldersBar.appendChild(unorgPill);
    }

    // Botão + Nova Pasta
    const newFldBtn = document.createElement('button');
    newFldBtn.type = 'button';
    newFldBtn.style.cssText = 'padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; cursor: pointer; white-space: nowrap; border: 1px dashed #2D3277; background: #fff; color: #2D3277; transition: all 0.15s ease;';
    newFldBtn.innerHTML = '➕ Nova Pasta';
    newFldBtn.onclick = handleCreateNewFolderPrompt;
    favFoldersBar.appendChild(newFldBtn);
  }

  async function handleCreateNewFolderPrompt() {
    const name = prompt('Digite o nome da nova pasta para organizar seus favoritos:');
    if (!name || !name.trim()) return;

    const newFld = {
      id: 'fld_' + Date.now(),
      name: name.trim(),
      createdAt: new Date().toISOString()
    };
    favoriteFolders.push(newFld);
    await chrome.storage.local.set({ ml_favorite_folders: favoriteFolders });
    if (typeof supabase !== 'undefined' && supabase.session) {
      supabase.syncLocalToCloud({ favorite_folders: favoriteFolders });
    }
    activeFavoriteFolder = newFld.id;
    renderFavoritesUI();
    showToast(`Pasta "${newFld.name}" criada com sucesso! 📁`, '📁');
  }

  function renderFavoritesUI() {
    renderFavFoldersBar();

    if (!favoritesTimelineContainer) return;
    favoritesTimelineContainer.innerHTML = '';

    const itemsToRender = activeFavoriteFolder === 'all'
      ? favoriteOffers
      : (activeFavoriteFolder === 'unorganized'
          ? favoriteOffers.filter(f => !f.folder_id)
          : favoriteOffers.filter(f => f.folder_id === activeFavoriteFolder));

    if (itemsToRender.length === 0) {
      favoritesTimelineContainer.innerHTML = `
        <div class="fav-empty-state">
          <div style="font-size:32px;margin-bottom:8px;">📁</div>
          <h4>${activeFavoriteFolder === 'all' ? 'Sua Lista de Favoritos está Vazia' : 'Nenhuma oferta nesta pasta'}</h4>
          <p>${activeFavoriteFolder === 'all' ? 'Clique no ícone de estrela nas ofertas ou no produto aberto para criar sua lista!' : 'Mova produtos favoritos para esta pasta ou selecione "Todas" acima.'}</p>
        </div>
      `;
      updateFavoritesSelectionCounters();
      return;
    }

    const dayGroups = groupFavoritesByDay(itemsToRender);

    dayGroups.forEach(group => {
      const dayGroupEl = document.createElement('div');
      dayGroupEl.className = 'fav-day-group';

      const dayHeaderEl = document.createElement('div');
      dayHeaderEl.className = `fav-day-header ${group.type === 'today' ? 'today' : (group.type === 'yesterday' ? 'yesterday' : '')}`;
      dayHeaderEl.innerHTML = `
        <span class="fav-day-title">${escapeHtml(group.label)}</span>
        <span class="fav-day-count">${group.items.length} ${group.items.length === 1 ? 'oferta' : 'ofertas'}</span>
      `;
      dayGroupEl.appendChild(dayHeaderEl);

      const itemsContainer = document.createElement('div');
      itemsContainer.className = 'fav-day-items';

      group.items.forEach(item => {
        const isSelected = selectedFavoriteUrls.has(item.url);
        const card = document.createElement('div');
        card.className = `product-card ${isSelected ? 'selected' : ''}`;
        card.dataset.url = item.url;

        // 1. Coluna Esquerda: Checkbox customizado + Imagem do Produto
        const leftCol = document.createElement('div');
        leftCol.className = 'card-left-col';

        const checkLabel = document.createElement('label');
        checkLabel.className = 'card-select-checkbox';
        checkLabel.title = 'Marcar para disparo';

        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.className = 'product-item-checkbox';
        chk.checked = isSelected;
        chk.addEventListener('change', (e) => {
          e.stopPropagation();
          if (chk.checked) {
            selectedFavoriteUrls.add(item.url);
            card.classList.add('selected');
          } else {
            selectedFavoriteUrls.delete(item.url);
            card.classList.remove('selected');
          }
          updateFavoritesSelectionCounters();
        });

        const chkSpan = document.createElement('span');
        chkSpan.className = 'custom-chk-box';
        checkLabel.appendChild(chk);
        checkLabel.appendChild(chkSpan);

        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'card-img-wrapper';

        const img = document.createElement('img');
        img.className = 'card-img';
        const resolvedImg = item.imageUrl || item.image || item.thumbnail || '';
        img.src = resolvedImg || 'icons/icon128.png';
        img.alt = '';
        img.loading = 'lazy';
        img.onerror = () => { img.src = 'icons/icon128.png'; };
        imgWrapper.appendChild(img);

        leftCol.appendChild(checkLabel);
        leftCol.appendChild(imgWrapper);

        // 2. Coluna Central: Dados do Produto (Título, Preço, Desconto e Badges)
        const info = document.createElement('div');
        info.className = 'card-info';

        const plat = (item.platform || (item.url && item.url.includes('amazon') ? 'amazon' : (item.url && item.url.includes('shopee') ? 'shopee' : 'mercadolivre')));
        const platBadge = document.createElement('span');
        if (plat === 'amazon') {
          platBadge.className = 'card-platform-badge badge-amazon';
          platBadge.textContent = '🔷 Amazon';
        } else if (plat === 'shopee') {
          platBadge.className = 'card-platform-badge badge-shopee';
          platBadge.textContent = '🟠 Shopee';
        } else {
          platBadge.className = 'card-platform-badge badge-ml';
          platBadge.textContent = '🟡 Mercado Livre';
        }
        info.appendChild(platBadge);

        // Seletor interativo de pasta diretamente no card
        const folderSelect = document.createElement('select');
        folderSelect.className = 'card-folder-select';
        folderSelect.style.cssText = 'background:#EEF2FF; color:#4338CA; border:1px solid #C7D2FE; border-radius:12px; padding:2px 8px; font-size:10px; font-weight:700; cursor:pointer; outline:none; margin-left:4px; max-width:130px;';
        
        const optNone = document.createElement('option');
        optNone.value = '';
        optNone.textContent = '📁 Sem Pasta';
        folderSelect.appendChild(optNone);

        favoriteFolders.forEach(f => {
          const opt = document.createElement('option');
          opt.value = f.id;
          opt.textContent = `📁 ${f.name}`;
          folderSelect.appendChild(opt);
        });

        const optNew = document.createElement('option');
        optNew.value = '__new__';
        optNew.textContent = '➕ Nova Pasta...';
        folderSelect.appendChild(optNew);

        folderSelect.value = item.folder_id || '';

        folderSelect.addEventListener('change', async (e) => {
          e.stopPropagation();
          const chosen = folderSelect.value;
          if (chosen === '__new__') {
            const name = prompt('Nome da nova pasta:');
            if (name && name.trim()) {
              const newFld = {
                id: 'fld_' + Date.now(),
                name: name.trim(),
                createdAt: new Date().toISOString()
              };
              favoriteFolders.push(newFld);
              item.folder_id = newFld.id;
              await chrome.storage.local.set({ ml_favorite_folders: favoriteFolders, ml_favorite_offers: favoriteOffers });
              if (typeof supabase !== 'undefined') {
                await supabase.syncLocalToCloud({ favorite_folders: favoriteFolders, favorite_offers: favoriteOffers });
              }
              renderFavoritesUI();
              showToast(`Pasta "${newFld.name}" criada e produto movido! 📁`, '📁');
            } else {
              folderSelect.value = item.folder_id || '';
            }
            return;
          }

          item.folder_id = chosen || null;
          await chrome.storage.local.set({ ml_favorite_offers: favoriteOffers });
          if (typeof supabase !== 'undefined') {
            await supabase.syncLocalToCloud({ favorite_offers: favoriteOffers });
          }
          renderFavoritesUI();
          showToast('Pasta do produto atualizada! 📁', '📁');
        });

        info.appendChild(folderSelect);

        const title = document.createElement('a');
        title.className = 'card-title';
        title.href = item.url;
        title.target = '_blank';
        title.rel = 'noopener noreferrer';
        title.textContent = item.title || 'Oferta Favorita';
        title.title = item.title || '';

        // Linha de Preço & Desconto
        const priceRow = document.createElement('div');
        priceRow.className = 'card-price-row';

        if (item.originalPrice && item.originalPrice !== item.price) {
          const origPrice = document.createElement('span');
          origPrice.className = 'card-original-price';
          origPrice.textContent = item.originalPrice;
          priceRow.appendChild(origPrice);
        }

        const price = document.createElement('span');
        price.className = 'card-price';
        price.textContent = item.price || 'Consulte';
        priceRow.appendChild(price);

        if (item.discount) {
          const discountBadge = document.createElement('span');
          discountBadge.className = 'card-discount-badge';
          discountBadge.textContent = item.discount;
          priceRow.appendChild(discountBadge);
        }

        // Linha de Metadados: Avaliação, Vendas, Cupom e Horário Salvo
        const metaRow = document.createElement('div');
        metaRow.className = 'card-metadata-row';

        if (item.savedAt) {
          const timeBadge = document.createElement('span');
          timeBadge.className = 'card-sales-badge';
          timeBadge.style.background = '#F1F5F9';
          timeBadge.style.color = '#475569';
          timeBadge.style.borderColor = '#E2E8F0';
          const savedTime = new Date(item.savedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          timeBadge.innerHTML = `🕒 ${savedTime}`;
          metaRow.appendChild(timeBadge);
        }

        const numRating = typeof item.rating === 'number' ? item.rating : parseFloat(item.rating);
        if (numRating && numRating > 0) {
          const ratingBadge = document.createElement('span');
          ratingBadge.className = 'card-rating-badge';
          const reviewsText = item.reviewsCount ? ` <span class="reviews-count">(${item.reviewsCount})</span>` : '';
          ratingBadge.innerHTML = `⭐ ${numRating}${reviewsText}`;
          metaRow.appendChild(ratingBadge);
        }

        if (item.sales) {
          const salesBadge = document.createElement('span');
          salesBadge.className = 'card-sales-badge';
          salesBadge.innerHTML = `🔥 ${escapeHtml(item.sales)}`;
          metaRow.appendChild(salesBadge);
        }



        // Linha de Comissão (% e R$) calculada/informada
        const commInfo = getProductCommissionInfo(item);
        if (commInfo) {
          const commRow = document.createElement('div');
          commRow.className = 'card-commission-row';
          commRow.innerHTML = `
            <span class="card-commission-badge ${commInfo.isBonus ? 'is-bonus' : ''}" title="Comissão para esta oferta">
              💰 Comissão: <b>${escapeHtml(commInfo.rateText)}</b> (${escapeHtml(commInfo.valText)})${escapeHtml(commInfo.labelPart)}
            </span>
            ${commInfo.categoryName ? `<span class="card-category-tag">${commInfo.categoryIcon || '🏷️'} ${escapeHtml(commInfo.categoryName)}</span>` : ''}
          `;
          info.appendChild(commRow);
        }

        info.appendChild(title);
        info.appendChild(priceRow);
        if (metaRow.children.length > 0) {
          info.appendChild(metaRow);
        }

        // 3. Coluna Direita: Ações Rápidas (Link Externo + Disparo + Lixeira)
        const actions = document.createElement('div');
        actions.className = 'card-actions-col';

        const previewLinkBtn = document.createElement('a');
        previewLinkBtn.className = 'btn-preview-link-mini';
        previewLinkBtn.href = item.url;
        previewLinkBtn.target = '_blank';
        previewLinkBtn.rel = 'noopener noreferrer';
        const favPlat = item.platform || (item.url && item.url.includes('amazon') ? 'amazon' : (item.url && item.url.includes('shopee') ? 'shopee' : 'mercadolivre'));
        previewLinkBtn.title = `Visualizar na ${favPlat === 'amazon' ? 'Amazon' : (favPlat === 'shopee' ? 'Shopee' : 'Mercado Livre')}`;
        previewLinkBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        `;

        const dispatchBtn = document.createElement('button');
        dispatchBtn.className = 'btn-dispatch-compact';
        dispatchBtn.title = 'Disparar esta oferta para o WhatsApp';
        dispatchBtn.innerHTML = `
          <svg viewBox="0 0 24 24">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z"/>
          </svg>
          <span>Disparar</span>
        `;
        dispatchBtn.addEventListener('click', () => handleDispatchOffer(item, dispatchBtn));

        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn-fav-remove';
        removeBtn.title = 'Remover dos Favoritos';
        removeBtn.innerHTML = '🗑️';
        removeBtn.style.padding = '2px 4px';
        removeBtn.style.fontSize = '12px';
        removeBtn.addEventListener('click', () => handleRemoveFavorite(item));

        actions.appendChild(previewLinkBtn);
        actions.appendChild(dispatchBtn);
        actions.appendChild(removeBtn);

        // Estrela de favorito ativa (ao clicar, desfavorita)
        const cardFavBtn = document.createElement('button');
        cardFavBtn.className = 'card-fav-btn active';
        cardFavBtn.type = 'button';
        cardFavBtn.title = 'Remover dos Favoritos';
        cardFavBtn.innerHTML = '★';
        cardFavBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          await handleRemoveFavorite(item);
        });

        card.appendChild(cardFavBtn);
        card.appendChild(leftCol);
        card.appendChild(info);
        card.appendChild(actions);

        itemsContainer.appendChild(card);
      });

      dayGroupEl.appendChild(itemsContainer);
      favoritesTimelineContainer.appendChild(dayGroupEl);
    });

    updateFavoritesSelectionCounters();
  }

  function updateFavoritesSelectionCounters() {
    const selectedCount = selectedFavoriteUrls.size;
    if (favBatchCount) favBatchCount.textContent = selectedCount;
    if (btnDispatchSelectedFavorites) btnDispatchSelectedFavorites.disabled = (selectedCount === 0);

    if (favSelectedCountLabel) {
      favSelectedCountLabel.textContent = selectedCount > 0
        ? `${selectedCount} selecionadas`
        : 'Selecionar Todas';
    }

    if (favSelectAllCheckbox) {
      if (favoriteOffers.length === 0) {
        favSelectAllCheckbox.checked = false;
        favSelectAllCheckbox.indeterminate = false;
      } else {
        const visibleSelectedCount = favoriteOffers.filter(f => selectedFavoriteUrls.has(f.url)).length;
        if (visibleSelectedCount === favoriteOffers.length) {
          favSelectAllCheckbox.checked = true;
          favSelectAllCheckbox.indeterminate = false;
        } else if (visibleSelectedCount > 0) {
          favSelectAllCheckbox.checked = false;
          favSelectAllCheckbox.indeterminate = true;
        } else {
          favSelectAllCheckbox.checked = false;
          favSelectAllCheckbox.indeterminate = false;
        }
      }
    }
  }

  function handleFavSelectAllToggle() {
    const isChecked = favSelectAllCheckbox.checked;
    favoriteOffers.forEach(item => {
      if (isChecked) {
        selectedFavoriteUrls.add(item.url);
      } else {
        selectedFavoriteUrls.delete(item.url);
      }
    });

    if (favoritesTimelineContainer) {
      const cards = favoritesTimelineContainer.querySelectorAll('.product-card');
      cards.forEach(card => {
        const chk = card.querySelector('.product-item-checkbox');
        if (chk) chk.checked = isChecked;
        if (isChecked) {
          card.classList.add('selected');
        } else {
          card.classList.remove('selected');
        }
      });
    }

    updateFavoritesSelectionCounters();
  }

  async function handleDispatchSelectedFavorites() {
    if (typeof supabase !== 'undefined') {
      if (!supabase.session) {
        showAuthModal(false);
        showToast('Faça login na sua conta para disparar ofertas.', '⚠️');
        return;
      }

      const status = supabase.getPlanStatus();
      if (status.isLocked) {
        showUpgradeModal('Seu Período de Teste Expirou!', 'Para continuar disparando ofertas com IA para o WhatsApp, assine um plano:');
        showToast('Seu período de teste expirou. Assine um plano para continuar!', '⚠️');
        return;
      }
    }

    const selectedGroups = Array.from(selectedDispatchGroups);
    if (selectedGroups.length === 0) {
      if (targetGroupsContainer) {
        targetGroupsContainer.classList.add('highlight-error');
        setTimeout(() => targetGroupsContainer.classList.remove('highlight-error'), 800);
      }
      showToast('Selecione pelo menos um grupo cadastrado para o disparo!', '⚠️');
      return;
    }

    const selectedItems = favoriteOffers.filter(f => selectedFavoriteUrls.has(f.url));
    if (selectedItems.length === 0) {
      showToast('Selecione pelo menos uma oferta favorita para disparar.', '⚠️');
      return;
    }

    if (typeof supabase !== 'undefined') {
      const status = supabase.getPlanStatus();
      if (status.plan === 'starter' && !status.isSuperAdmin && status.allowedPlatform && status.allowedPlatform !== 'all') {
        const hasOtherPlatform = selectedItems.some(f => {
          const prodPlat = (f.platform || (f.url?.includes('amazon') ? 'amazon' : (f.url?.includes('shopee') ? 'shopee' : 'mercadolivre'))).toLowerCase();
          return prodPlat !== status.allowedPlatform.toLowerCase();
        });
        if (hasOtherPlatform) {
          showToast(`O Plano Starter permite disparar apenas ofertas de ${status.allowedPlatform.toUpperCase()}. Faça upgrade para o Pro ou Ultra!`, '⚠️');
          showUpgradeModal('Plataforma Bloqueada no Plano Starter', `Seu plano atual permite apenas ofertas da plataforma ${status.allowedPlatform.toUpperCase()}. Faça upgrade para o Pro ou Ultra para usar todas simultaneamente!`);
          return;
        }
      }
    }

    selectedItems.forEach(p => { delete p.coupon; });

    btnDispatchSelectedFavorites.disabled = true;

    try {
      const resp = await chrome.runtime.sendMessage({
        action: 'start_mass_dispatch',
        products: selectedItems,
        targetGroups: selectedGroups,
        groupName: selectedGroups.join(', '),
        targetGroup: selectedGroups.join(', '),
        affiliateTag: affiliateTagInput.value.trim() || affiliateTag,
        copyStyle: currentCopyStyle,
        minIntervalMinutes: 60,
        maxIntervalMinutes: 180,
        minInterval: 60,
        maxInterval: 180,
        randomInterval: true,
        isRandom: true
      });

      if (resp && resp.success) {
        showToast(`🚀 Disparo de ${selectedItems.length} favoritos iniciado!`, '🎉');
        switchMainTab('search');
        await refreshQueueStatus();
      } else {
        throw new Error(resp?.error || 'Erro ao iniciar disparo');
      }
    } catch (err) {
      showToast(`Erro ao iniciar disparo: ${err.message}`, '❌');
    } finally {
      btnDispatchSelectedFavorites.disabled = false;
    }
  }

  // =========================================================================
  // GERENCIAMENTO DE AUTENTICAÇÃO E PLANOS SAAS
  // =========================================================================

  let isRegisterMode = false;

  async function checkAuthStatus() {
    if (typeof supabase === 'undefined') return;
    try {
      await supabase.initSession();

      // Se ainda não houver sessão ativa e o usuário não tiver clicado em "Sair" voluntariamente,
      // autentica automaticamente a conta Super Admin jsnevesme@gmail.com
      if (!supabase.session) {
        const stored = await chrome.storage.local.get(['sb_has_logged_out']);
        if (!stored.sb_has_logged_out) {
          try {
            await supabase.signIn('jsnevesme@gmail.com', 'Admin123456!');
            console.log('[Supabase] Auto-login Super Admin ativado!');
          } catch (autoErr) {
            console.warn('[Supabase] Tentativa de auto-login:', autoErr.message);
          }
        }
      }

      if (!supabase.session) {
        showAuthModal(false);
      } else {
        hideAuthModal();
        renderUserPlanUI();
        await loadFavorites();
        if (activeMainTab === 'favorites') {
          renderFavoritesUI();
        }
        const status = supabase.getPlanStatus();
        if (status.isLocked && !status.isSuperAdmin) {
          showUpgradeModal('Seu Período de Teste Expirou!', 'Para continuar disparando ofertas com IA e comissões automáticas no WhatsApp, assine um de nossos planos:');
        }
      }
    } catch (e) {
      console.warn('[Supabase] Erro ao verificar sessão:', e);
    }
  }

  function showAuthModal(registerMode = false) {
    if (!authModal) return;
    isRegisterMode = registerMode;
    if (authErrorMessage) {
      authErrorMessage.classList.add('hidden');
      authErrorMessage.textContent = '';
    }
    
    if (registerMode) {
      if (tabAuthRegister) tabAuthRegister.classList.add('active');
      if (tabAuthLogin) tabAuthLogin.classList.remove('active');
      if (authSubtitle) authSubtitle.textContent = 'Crie sua conta agora e ganhe 3 dias de acesso grátis completo!';
      if (authTrialNotice) authTrialNotice.classList.remove('hidden');
      if (btnAuthSubmitText) btnAuthSubmitText.textContent = 'Criar Conta e Ativar 3 Dias Grátis';
    } else {
      if (tabAuthLogin) tabAuthLogin.classList.add('active');
      if (tabAuthRegister) tabAuthRegister.classList.remove('active');
      if (authSubtitle) authSubtitle.textContent = 'Entre na sua conta para sincronizar dados e disparar ofertas';
      if (authTrialNotice) authTrialNotice.classList.add('hidden');
      if (btnAuthSubmitText) btnAuthSubmitText.textContent = 'Entrar no Sistema';
    }
    authModal.classList.remove('hidden');
  }

  function hideAuthModal() {
    if (authModal) authModal.classList.add('hidden');
  }

  function showUpgradeModal(title, subtitle) {
    if (!upgradeModal) return;
    if (title && upgradeTitle) upgradeTitle.textContent = title;
    if (subtitle && upgradeSubtitle) upgradeSubtitle.textContent = subtitle;
    upgradeModal.classList.remove('hidden');
  }

  function hideUpgradeModal() {
    if (!upgradeModal) return;
    const status = typeof supabase !== 'undefined' ? supabase.getPlanStatus() : null;
    if (status && status.isLocked && !status.isSuperAdmin) {
      showToast('Aviso: Os disparos permanecerão bloqueados até a assinatura de um plano.', '⚠️');
    }
    upgradeModal.classList.add('hidden');
  }

  function renderUserPlanUI() {
    if (typeof supabase === 'undefined') return;
    const status = supabase.getPlanStatus();

    // 0. Subbar com e-mail da conta ativa
    const subbarUserEmail = document.getElementById('subbarUserEmail');
    const subbarAccountPill = document.getElementById('subbarAccountPill');
    const userDot = document.querySelector('.user-active-dot');

    if (subbarUserEmail) {
      if (status.isAuthenticated) {
        subbarUserEmail.textContent = status.email || 'jsnevesme@gmail.com';
        if (userDot) userDot.className = 'user-active-dot';
        if (subbarAccountPill) subbarAccountPill.title = `Conectado como ${status.email}. Clique para abrir configurações.`;
      } else {
        subbarUserEmail.textContent = 'Clique para Entrar';
        if (userDot) userDot.className = 'user-active-dot inactive';
        if (subbarAccountPill) subbarAccountPill.title = 'Nenhuma conta conectada. Clique para fazer login ou cadastrar.';
      }
    }

    // 1. Badge no cabeçalho
    if (userPlanBadgeBtn && headerPlanBadgeText) {
      headerPlanBadgeText.textContent = status.planBadge;
      userPlanBadgeBtn.className = 'plan-badge-pill ' + (status.badgeClass || 'badge-trial');
    }

    // 2. Contador de disparos hoje
    if (dailyDispatchCounter) {
      if (status.isSuperAdmin || status.plan === 'ultra') {
        dailyDispatchCounter.textContent = '🎯 Ilimitado';
      } else {
        dailyDispatchCounter.textContent = `🎯 ${status.dispatchesToday}/${status.dispatchLimit}`;
      }
    }

    // 3. Card nas configurações
    if (userEmailDisplay) {
      userEmailDisplay.textContent = supabase.profile ? supabase.profile.email : (supabase.session?.user?.email || 'Sem conta');
    }
    if (userPlanDisplay) {
      userPlanDisplay.textContent = `Plano: ${status.planBadge}`;
    }
    if (userPlanExpiryDisplay) {
      if (status.isSuperAdmin) {
        userPlanExpiryDisplay.textContent = 'Acesso Vitalício';
      } else if (status.daysRemaining !== undefined && status.plan === 'free_trial') {
        userPlanExpiryDisplay.textContent = status.isLocked ? 'Teste expirado' : `${status.daysRemaining} dias restantes`;
      } else if (supabase.profile?.plan_expires_at) {
        const d = new Date(supabase.profile.plan_expires_at);
        userPlanExpiryDisplay.textContent = `Válido até: ${d.toLocaleDateString('pt-BR')}`;
      } else {
        userPlanExpiryDisplay.textContent = 'Ativo';
      }
    }

    // 4. Seletor de plataforma para Starter com Bloqueio de 1 Mês (Exclusivo Starter e NUNCA Superadmin)
    if (starterPlatformSection) {
      if (status.plan === 'starter' && !status.isSuperAdmin) {
        starterPlatformSection.classList.remove('hidden');
        starterPlatformSection.style.display = 'block';

        if (starterPlatformSelect) {
          starterPlatformSelect.value = status.allowedPlatform || 'mercadolivre';
        }

        const platformLabels = {
          mercadolivre: 'Mercado Livre',
          amazon: 'Amazon',
          shopee: 'Shopee'
        };
        const currentPlatformLabel = platformLabels[status.allowedPlatform] || (status.allowedPlatform ? status.allowedPlatform.toUpperCase() : 'Mercado Livre');

        if (status.isPlatformLocked) {
          // Bloqueada por 1 mês
          if (starterPlatformSelect) starterPlatformSelect.disabled = true;

          const lockBadge = document.getElementById('starterLockBadge');
          if (lockBadge) {
            lockBadge.textContent = '🔒 Bloqueada por 1 Mês';
            lockBadge.className = 'starter-lock-pill locked';
          }

          const unlockDateStr = status.platformLockedUntil ? new Date(status.platformLockedUntil).toLocaleDateString('pt-BR') : '';
          const notice = document.getElementById('starterLockNotice');
          if (notice) {
            notice.innerHTML = `Sua plataforma <strong>${currentPlatformLabel}</strong> está bloqueada até <strong>${unlockDateStr}</strong> (${status.daysUntilPlatformUnlock} dia${status.daysUntilPlatformUnlock > 1 ? 's' : ''} restantes). Você só poderá alterar quando o mês virar ou fazendo upgrade para o Pro/Ultra.`;
          }

          const actionRow = document.getElementById('starterLockActionRow');
          if (actionRow) {
            actionRow.innerHTML = `
              <button id="btnUpgradeFromStarter" type="button" class="btn-upgrade-from-starter">
                🚀 Fazer Upgrade para Pro (Liberar Todas as Plataformas)
              </button>
            `;
            const btnUpgrade = document.getElementById('btnUpgradeFromStarter');
            if (btnUpgrade) {
              btnUpgrade.addEventListener('click', () => {
                showUpgradeModal('Faça Upgrade para o Pro ou Ultra', 'Desbloqueie Mercado Livre, Amazon e Shopee ao mesmo tempo, sem restrições ou bloqueios:');
              });
            }
          }
        } else {
          // Escolha aberta (ainda não bloqueou este mês)
          if (starterPlatformSelect) starterPlatformSelect.disabled = false;

          const lockBadge = document.getElementById('starterLockBadge');
          if (lockBadge) {
            lockBadge.textContent = '🔓 Escolha Aberta';
            lockBadge.className = 'starter-lock-pill open';
          }

          const notice = document.getElementById('starterLockNotice');
          if (notice) {
            notice.innerHTML = `No plano Starter você tem direito a 1 plataforma à sua escolha. Ao confirmar, a plataforma escolhida ficará <strong>bloqueada por 1 mês</strong> até a virada do mês.`;
          }

          const actionRow = document.getElementById('starterLockActionRow');
          if (actionRow) {
            actionRow.innerHTML = `
              <button id="btnLockStarterPlatform" type="button" class="btn-lock-starter">
                🔒 Bloquear Escolha por 1 Mês
              </button>
            `;
            const btnLock = document.getElementById('btnLockStarterPlatform');
            if (btnLock) {
              btnLock.addEventListener('click', handleConfirmStarterPlatformLock);
            }
          }
        }
      } else {
        // Superadmin, Pro, Ultra, Free Trial, ou sem conta -> esconder totalmente
        starterPlatformSection.classList.add('hidden');
        starterPlatformSection.style.display = 'none';
      }
    }
  }

  async function handleAuthSubmit(e) {
    if (e) e.preventDefault();
    if (!authEmailInput || !authPasswordInput) return;

    const email = authEmailInput.value.trim();
    const password = authPasswordInput.value;

    if (!email || !password) {
      showAuthError('Preencha seu e-mail e senha.');
      return;
    }

    if (password.length < 6) {
      showAuthError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    const submitBtn = document.getElementById('btnAuthSubmit');
    if (submitBtn) submitBtn.disabled = true;
    if (btnAuthSubmitText) btnAuthSubmitText.textContent = isRegisterMode ? 'Criando conta...' : 'Entrando...';

    try {
      if (isRegisterMode) {
        await supabase.signUp(email, password);
        showToast('🎉 Conta criada com sucesso! 3 dias de acesso grátis liberados!', '🎁');
      } else {
        await supabase.signIn(email, password);
        showToast('✅ Login realizado com sucesso!', '👋');
      }

      hideAuthModal();
      await loadStoredData();
      renderUserPlanUI();

      const status = supabase.getPlanStatus();
      if (status.isLocked) {
        showUpgradeModal('Seu Período de Teste Expirou!', 'Para continuar disparando ofertas com IA e comissões automáticas no WhatsApp, assine um de nossos planos:');
      }
    } catch (err) {
      console.warn('Erro de autenticação:', err);
      showAuthError(err.message || 'Erro ao processar autenticação.');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (btnAuthSubmitText) btnAuthSubmitText.textContent = isRegisterMode ? 'Criar Conta e Ativar 3 Dias Grátis' : 'Entrar no Sistema';
    }
  }

  function showAuthError(msg) {
    if (!authErrorMessage) return;
    authErrorMessage.textContent = msg;
    authErrorMessage.classList.remove('hidden');
  }

  async function handleLogout() {
    if (confirm('Deseja realmente sair da sua conta?')) {
      try {
        if (typeof supabase !== 'undefined') {
          await supabase.signOut();
        }
        showToast('Você saiu da sua conta.', 'ℹ️');
        showAuthModal(false);
        renderUserPlanUI();
      } catch (e) {
        console.warn('Erro no logout:', e);
      }
    }
  }

  async function handleCheckSubscriptionStatus() {
    if (!btnCheckSubscriptionStatus) return;
    btnCheckSubscriptionStatus.disabled = true;
    btnCheckSubscriptionStatus.textContent = '🔄 Verificando assinatura...';

    try {
      if (typeof supabase !== 'undefined') {
        const profile = await supabase.fetchProfile();
        renderUserPlanUI();
        const status = supabase.getPlanStatus();
        if (!status.isLocked && status.plan !== 'free_trial') {
          showToast(`🎉 Parabéns! Plano ${status.planBadge} ativado com sucesso!`, '🚀');
          hideUpgradeModal();
        } else if (status.plan === 'free_trial' && !status.isLocked) {
          showToast(`Você ainda está no período de teste grátis (${status.daysRemaining} dias restantes).`, '🟢');
          hideUpgradeModal();
        } else {
          showToast('Nenhum pagamento identificado ainda. Se acabou de pagar, aguarde 1 minuto e clique novamente.', 'ℹ️');
        }
      }
    } catch (e) {
      showToast('Erro ao atualizar status do plano.', '❌');
    } finally {
      btnCheckSubscriptionStatus.disabled = false;
      btnCheckSubscriptionStatus.textContent = '🔄 Já assinei / Atualizar Acesso';
    }
  }

  function handleStarterPlatformChange() {
    if (!starterPlatformSelect) return;
    const chosen = starterPlatformSelect.value;
    const platformNames = { mercadolivre: 'Mercado Livre', amazon: 'Amazon', shopee: 'Shopee' };
    const name = platformNames[chosen] || chosen;
    showToast(`Selecionado: ${name}. Clique em "Bloquear Escolha por 1 Mês" para fixar sua plataforma por 30 dias.`, 'ℹ️');
  }

  async function handleConfirmStarterPlatformLock() {
    if (!starterPlatformSelect || typeof supabase === 'undefined') return;
    const chosenPlatform = starterPlatformSelect.value;
    const platformNames = {
      mercadolivre: 'Mercado Livre',
      amazon: 'Amazon',
      shopee: 'Shopee'
    };
    const platformName = platformNames[chosenPlatform] || chosenPlatform;

    const confirmed = confirm(
      `⚠️ ATENÇÃO: Tem certeza que deseja fixar a plataforma ${platformName}?\n\n` +
      `Ela ficará bloqueada na sua conta por 1 MÊS (30 dias) e você NÃO poderá alterar para outra plataforma até que o período termine (quando o mês virar).\n\n` +
      `Deseja prosseguir e bloquear?`
    );

    if (!confirmed) return;

    const btn = document.getElementById('btnLockStarterPlatform');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Bloqueando plataforma...';
    }

    try {
      const res = await supabase.setStarterPlatform(chosenPlatform);
      if (res.success) {
        showToast(`Plataforma ${platformName} bloqueada por 1 mês com sucesso!`, '🔒');
        await supabase.fetchProfile();
        renderUserPlanUI();
      } else {
        showToast(res.message || 'Não foi possível bloquear a plataforma.', '❌');
      }
    } catch (err) {
      showToast('Erro de conexão ao bloquear plataforma.', '❌');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '🔒 Bloquear Escolha por 1 Mês';
      }
    }
  }


  function showToast(message, icon = 'ℹ️') {
    if (toastTimeout) clearTimeout(toastTimeout);

    toastIcon.textContent = icon;
    toastMessage.textContent = message;
    toastNotification.classList.remove('hidden');

    toastTimeout = setTimeout(() => {
      toastNotification.classList.add('hidden');
    }, 3500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
});
