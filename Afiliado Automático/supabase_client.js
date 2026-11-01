/**
 * Supabase Client & SaaS Cloud Sync Manager
 * Manifest V3 compatible REST client for Supabase Auth, Database & RPC
 */

const SUPABASE_CONFIG = {
  url: 'https://pbatxljxcnkogcqfhomc.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiYXR4bGp4Y25rb2djcWZob21jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzNDc4OTUsImV4cCI6MjEwODkyMzg5NX0.jdxHvK_dYjNxW6DL3FXQQLXm56U1A6nTseHsXFWedsQ',
  checkoutLinks: {
    starter: {
      monthly: 'https://pay.cakto.com.br/fajichq_1260860',
      yearly: 'https://pay.cakto.com.br/bi9dwyf'
    },
    pro: {
      monthly: 'https://pay.cakto.com.br/x3whytm',
      yearly: 'https://pay.cakto.com.br/685h3or'
    },
    ultra: {
      monthly: 'https://pay.cakto.com.br/3anjzu2',
      yearly: 'https://pay.cakto.com.br/rfxsekm'
    }
  }
};

class SupabaseClient {
  constructor() {
    this.url = SUPABASE_CONFIG.url;
    this.anonKey = SUPABASE_CONFIG.anonKey;
    this.session = null;
    this.profile = null;
  }

  getHeaders(token = null) {
    const headers = {
      'apikey': this.anonKey,
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  /**
   * Carrega a sessão salva no chrome.storage.local
   */
  async initSession() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['sb_session', 'sb_profile'], async (res) => {
        if (res.sb_session && res.sb_session.access_token) {
          const now = Math.floor(Date.now() / 1000);
          // Se o token expirar em menos de 60 segundos, renova
          if (res.sb_session.expires_at && res.sb_session.expires_at < now + 60) {
            try {
              const refreshed = await this.refreshToken(res.sb_session.refresh_token);
              if (refreshed && refreshed.access_token) {
                this.session = refreshed;
                await this.saveSession(refreshed);
              } else {
                this.session = null;
                await this.clearSession();
              }
            } catch (e) {
              console.warn('[Supabase] Falha ao renovar token:', e);
              this.session = null;
              await this.clearSession();
            }
          } else {
            this.session = res.sb_session;
          }
        } else {
          this.session = null;
        }

        if (res.sb_profile) {
          this.profile = res.sb_profile;
        }

        // Se houver sessão ativa, atualiza perfil em segundo plano
        if (this.session && this.session.access_token) {
          try {
            await this.fetchProfile();
          } catch (e) {
            console.warn('[Supabase] Falha ao atualizar perfil na inicialização:', e);
          }
        }

        resolve(this.session);
      });
    });
  }

  async saveSession(session) {
    if (session) {
      const now = Math.floor(Date.now() / 1000);
      if (!session.expires_at && session.expires_in) {
        session.expires_at = now + session.expires_in;
      }
    }
    this.session = session;
    return new Promise((resolve) => {
      chrome.storage.local.set({ sb_session: session }, resolve);
    });
  }

  async clearSession() {
    this.session = null;
    this.profile = null;
    return new Promise((resolve) => {
      chrome.storage.local.remove(['sb_session', 'sb_profile'], resolve);
    });
  }

  /**
   * Reautentica a sessão de forma segura via refresh token
   */
  async reauthenticate() {
    if (this.session && this.session.refresh_token) {
      try {
        const refreshed = await this.refreshToken(this.session.refresh_token);
        if (refreshed && refreshed.access_token) {
          await this.saveSession(refreshed);
          return refreshed;
        }
      } catch (e) {
        console.log('[Supabase] Refresh token expirado ou inválido.');
      }
    }
    return null;
  }

  /**
   * Garante uma sessão ativa e válida para requisições no Supabase
   * Executa auto-login transparente se o token expirou ou não existe
   */
  async ensureSession() {
    const now = Math.floor(Date.now() / 1000);
    if (this.session && this.session.access_token) {
      if (this.session.expires_at && this.session.expires_at > now + 120) {
        return this.session;
      }
    }

    await this.initSession();
    if (this.session && this.session.access_token) {
      if (this.session.expires_at && this.session.expires_at > now + 120) {
        return this.session;
      }
    }

    return await this.reauthenticate();
  }

  /**
   * Registro de nova conta
   */
  async signUp(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const res = await fetch(`${this.url}/auth/v1/signup`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email: cleanEmail, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error_description || data.msg || data.message || 'Erro ao criar conta.');
    }

    if (data.access_token) {
      await this.saveSession(data);
      await this.fetchProfile();
      await this.syncCloudToLocal();
    }
    return data;
  }

  /**
   * Login com e-mail e senha
   */
  async signIn(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const res = await fetch(`${this.url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email: cleanEmail, password })
    });

    const data = await res.json();
    if (!res.ok) {
      const msg = data.error_description || data.msg || data.message || 'E-mail ou senha incorretos.';
      throw new Error(msg);
    }

    await this.saveSession(data);
    await this.fetchProfile();
    await this.syncCloudToLocal();
    return data;
  }

  /**
   * Renova token expirado
   */
  async refreshToken(refreshToken) {
    if (!refreshToken) return null;
    const res = await fetch(`${this.url}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (!res.ok) return null;
    return await res.json();
  }

  /**
   * Logout
   */
  async signOut() {
    if (this.session && this.session.access_token) {
      try {
        await fetch(`${this.url}/auth/v1/logout`, {
          method: 'POST',
          headers: this.getHeaders(this.session.access_token)
        });
      } catch (e) {
        // silencioso
      }
    }
    await this.clearSession();
  }

  /**
   * Busca perfil atualizado do usuário
   */
  async fetchProfile() {
    await this.ensureSession();
    if (!this.session || !this.session.user || !this.session.access_token) {
      this.profile = null;
      return null;
    }

    let userId = this.session.user.id;
    let res = await fetch(`${this.url}/rest/v1/profiles?id=eq.${userId}&select=*`, {
      method: 'GET',
      headers: this.getHeaders(this.session.access_token)
    });

    // Se receber 401, token expirou no servidor: reautentica e retenta imediatamente!
    if (res.status === 401) {
      const newSession = await this.reauthenticate();
      if (newSession && newSession.access_token) {
        userId = newSession.user.id;
        res = await fetch(`${this.url}/rest/v1/profiles?id=eq.${userId}&select=*`, {
          method: 'GET',
          headers: this.getHeaders(newSession.access_token)
        });
      } else {
        await this.clearSession();
        return null;
      }
    }

    if (!res.ok) {
      if (res.status === 401) {
        await this.clearSession();
        return null;
      }
      console.log('[Supabase] Erro ao buscar perfil:', res.status);
      return null;
    }

    const rows = await res.json();
    if (rows && rows.length > 0) {
      this.profile = rows[0];
      await new Promise((r) => chrome.storage.local.set({ sb_profile: this.profile }, r));

      // Atualiza também os dados do usuário autenticado no Auth (para user_metadata como ml_custom_copy)
      try {
        const userRes = await fetch(`${this.url}/auth/v1/user`, {
          method: 'GET',
          headers: this.getHeaders(this.session.access_token)
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData && userData.id) {
            this.session.user = userData;
            await this.saveSession(this.session);
          }
        }
      } catch (_) {}

      await this.syncCloudToLocal();
      return this.profile;
    }
    return null;
  }

  /**
   * Atualiza campos de configuração ou perfil
   */
  async updateProfile(updates) {
    await this.ensureSession();
    if (!this.session || !this.session.user || !this.session.access_token) {
      return null;
    }
    let userId = this.session.user.id;

    // Se estiver atualizando pastas, salva também no user_metadata do Auth (garante sync mesmo sem coluna SQL)
    if (updates.favorite_folders !== undefined) {
      try {
        await fetch(`${this.url}/auth/v1/user`, {
          method: 'PUT',
          headers: this.getHeaders(this.session.access_token),
          body: JSON.stringify({ data: { favorite_folders: updates.favorite_folders } })
        });
      } catch (e) {
        console.log('[Supabase] Falha ao atualizar auth user_metadata:', e);
      }
    }

    // Se estiver atualizando copy customizada, salva no user_metadata do Auth
    if (updates.ml_custom_copy !== undefined) {
      try {
        await fetch(`${this.url}/auth/v1/user`, {
          method: 'PUT',
          headers: this.getHeaders(this.session.access_token),
          body: JSON.stringify({ data: { ml_custom_copy: updates.ml_custom_copy } })
        });
        await chrome.storage.local.set({ ml_custom_copy: updates.ml_custom_copy });
      } catch (_) {}
    }

    let payload = { ...updates };
    delete payload.ml_custom_copy; // Evita erro caso coluna não exista na tabela profiles
    let res = await fetch(`${this.url}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        ...this.getHeaders(this.session.access_token),
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(payload)
    });

    // Se receber 401, token expirou no servidor: reautentica e retenta o PATCH!
    if (res.status === 401) {
      const newSession = await this.reauthenticate();
      if (newSession && newSession.access_token) {
        userId = newSession.user.id;
        res = await fetch(`${this.url}/rest/v1/profiles?id=eq.${userId}`, {
          method: 'PATCH',
          headers: {
            ...this.getHeaders(newSession.access_token),
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(payload)
        });
      } else {
        await this.clearSession();
        return null;
      }
    }

    // Se a tabela ainda não tiver a coluna favorite_folders, remove o campo e reenvia
    if (!res.ok && payload.favorite_folders !== undefined) {
      delete payload.favorite_folders;
      if (Object.keys(payload).length > 0) {
        res = await fetch(`${this.url}/rest/v1/profiles?id=eq.${userId}`, {
          method: 'PATCH',
          headers: {
            ...this.getHeaders(this.session.access_token),
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(payload)
        });
      }
    }

    if (!res.ok) {
      if (res.status === 401) {
        await this.clearSession();
        return null;
      }
      console.log('[Supabase] Erro ao atualizar perfil:', res.status);
      return null;
    }

    const rows = await res.json();
    if (rows && rows.length > 0) {
      this.profile = rows[0];
      await new Promise((r) => chrome.storage.local.set({ sb_profile: this.profile }, r));
      return this.profile;
    }
    return null;
  }

  /**
   * Sincroniza configurações da nuvem para o armazenamento local do Chrome
   */
  async syncCloudToLocal() {
    if (!this.profile) return;
    const p = this.profile;

    const localUpdates = {};
    if (p.ml_affiliate_tag !== undefined) localUpdates.ml_affiliate_tag = p.ml_affiliate_tag;
    if (p.amazon_affiliate_tag !== undefined) localUpdates.amazon_affiliate_tag = p.amazon_affiliate_tag;
    if (p.shopee_affiliate_tag !== undefined) localUpdates.shopee_affiliate_tag = p.shopee_affiliate_tag;
    if (p.groq_api_key !== undefined) localUpdates.groq_api_key = p.groq_api_key;
    if (p.ml_copy_style !== undefined) localUpdates.ml_copy_style = p.ml_copy_style;
    const authCopy = this.session?.user?.user_metadata?.ml_custom_copy;
    if (authCopy) {
      localUpdates.ml_custom_copy = authCopy;
    }
    const authStyle = this.session?.user?.user_metadata?.ml_copy_style;
    if (authStyle && !p.ml_copy_style) {
      localUpdates.ml_copy_style = authStyle;
    }
    if (p.ml_pinned_group !== undefined) localUpdates.ml_pinned_group = p.ml_pinned_group;
    if (p.ml_whatsapp_groups && Array.isArray(p.ml_whatsapp_groups)) {
      localUpdates.ml_whatsapp_groups = p.ml_whatsapp_groups;
    }

    if (p.allowed_platform !== undefined) {
      localUpdates.starter_platform = p.allowed_platform;
    }
    if (p.starter_platform_locked_until !== undefined || p.platform_locked_until !== undefined) {
      localUpdates.starter_platform_locked_until = p.starter_platform_locked_until || p.platform_locked_until;
    }

    // Pastas de Favoritos
    const authFolders = this.session?.user?.user_metadata?.favorite_folders;
    const cloudFolders = (p.favorite_folders && Array.isArray(p.favorite_folders) && p.favorite_folders.length > 0)
      ? p.favorite_folders
      : (authFolders && Array.isArray(authFolders) && authFolders.length > 0 ? authFolders : null);

    if (cloudFolders) {
      localUpdates.ml_favorite_folders = cloudFolders;
      localUpdates.favorite_folders = cloudFolders;
    }

    // Fusão bidirecional inteligente de ofertas favoritas (preserva itens locais e da nuvem, eliminando duplicatas)
    const stored = await new Promise((r) => chrome.storage.local.get(['ml_favorite_offers'], r));
    const localFavs = Array.isArray(stored.ml_favorite_offers) ? stored.ml_favorite_offers : [];
    const cloudFavs = Array.isArray(p.favorite_offers) ? p.favorite_offers : [];

    const mergedFavs = deduplicateFavoritesList([...localFavs, ...cloudFavs]);
    localUpdates.ml_favorite_offers = mergedFavs;
    localUpdates.favorite_offers = mergedFavs;

    await new Promise((resolve) => {
      chrome.storage.local.set(localUpdates, resolve);
    });

    // Se houve deduplicação ou novos itens locais que faltavam na nuvem, persiste a lista limpa no Supabase
    if (mergedFavs.length !== cloudFavs.length) {
      try {
        await this.updateProfile({ favorite_offers: mergedFavs });
      } catch (e) {
        console.warn('[Supabase] Falha ao enviar favoritos limpos para a nuvem:', e);
      }
    }
  }

  /**
   * Sincroniza configurações locais alteradas para a nuvem
   */
  async syncLocalToCloud(fields) {
    try {
      await this.ensureSession();
      return await this.updateProfile(fields);
    } catch (e) {
      console.warn('[Supabase] Falha ao sincronizar local para nuvem:', e);
      return null;
    }
  }

  /**
   * Define a plataforma do Plano Starter e bloqueia por 1 mês
   */
  async setStarterPlatform(platform) {
    if (!this.session || !this.session.access_token) {
      return { success: false, error: 'unauthenticated', message: 'Você precisa estar autenticado.' };
    }

    try {
      const res = await fetch(`${this.url}/rest/v1/rpc/set_starter_platform`, {
        method: 'POST',
        headers: this.getHeaders(this.session.access_token),
        body: JSON.stringify({ p_platform: platform.toLowerCase() })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (this.profile) {
          this.profile.allowed_platform = data.allowed_platform;
          this.profile.starter_platform_locked_until = data.locked_until;
        }
        await new Promise((r) => chrome.storage.local.set({
          sb_profile: this.profile,
          starter_platform: data.allowed_platform,
          starter_platform_locked_until: data.locked_until
        }, r));
      }
      return data;
    } catch (e) {
      return { success: false, error: 'network_error', message: 'Falha de conexão com o servidor.' };
    }
  }

  /**
   * Valida autorização de disparo e incrementa contador no Supabase (RPC)
   * Respeita estritamente: Superadmin, 3 dias grátis, limites Starter (20/dia, 1 plataforma), Pro (50/dia), Ultra (ilimitado)
   */
  async checkAndIncrementDispatch(platform = 'mercadolivre') {
    if (!this.session || !this.session.access_token) {
      return {
        success: false,
        error: 'unauthenticated',
        message: 'Você precisa estar logado na sua conta para disparar ofertas.'
      };
    }

    try {
      const res = await fetch(`${this.url}/rest/v1/rpc/check_and_increment_dispatch`, {
        method: 'POST',
        headers: this.getHeaders(this.session.access_token),
        body: JSON.stringify({ p_platform: platform.toLowerCase() })
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.code || 'rpc_error',
          message: data.message || 'Erro ao validar autorização de disparo.'
        };
      }

      // Atualiza o perfil em cache se tiver informações atualizadas
      if (this.profile) {
        if (data.dispatchesToday !== undefined) {
          this.profile.daily_dispatches_count = data.dispatchesToday;
        }
        chrome.storage.local.set({ sb_profile: this.profile });
      }

      return data;
    } catch (err) {
      return {
        success: false,
        error: 'network_error',
        message: 'Falha de conexão com o servidor. Verifique sua internet.'
      };
    }
  }

  /**
   * Registra oferta disparada no histórico do Dashboard (dispatches_log)
   */
  async logDispatch(data) {
    if (!this.session || !this.session.user || !this.session.access_token) return;
    try {
      let numPrice = null;
      if (typeof data.price === 'number') {
        numPrice = data.price;
      } else if (data.price) {
        const clean = String(data.price).replace(/[^0-9.,]/g, '').replace(',', '.');
        const parsed = parseFloat(clean);
        if (!isNaN(parsed)) numPrice = parsed;
      }

      await fetch(`${this.url}/rest/v1/dispatches_log`, {
        method: 'POST',
        headers: this.getHeaders(this.session.access_token),
        body: JSON.stringify({
          user_id: this.session.user.id,
          platform: (data.platform || 'mercadolivre').toLowerCase(),
          product_title: data.title || data.name || 'Produto',
          product_price: numPrice,
          product_url: data.url || data.originalUrl || '',
          affiliate_link: data.affiliateLink || data.finalLink || '',
          product_image: data.image || data.imageUrl || '',
          target_group: data.groupName || data.targetGroup || 'WhatsApp',
          copy_text: data.copyText || data.messageText || ''
        })
      });
    } catch (e) {
      console.warn('[Supabase] Falha ao registrar log de disparo:', e);
    }
  }

  /**
   * Calcula o status do plano e dias restantes de teste
   */
  getPlanStatus() {
    const userEmail = (this.profile?.email || this.session?.user?.email || '').toLowerCase();
    const isSuperAdmin = (this.profile?.role === 'superadmin') || userEmail === 'jsnevesme@gmail.com';

    if (isSuperAdmin) {
      return {
        isAuthenticated: true,
        isSuperAdmin: true,
        email: userEmail || 'jsnevesme@gmail.com',
        plan: 'ultra',
        planName: 'Super Admin',
        planBadge: '👑 Super Admin',
        badgeClass: 'badge-superadmin',
        isLocked: false,
        daysRemaining: 9999,
        allowedPlatform: 'all',
        dispatchesToday: this.profile?.daily_dispatches_count || 0,
        dispatchLimit: 999999,
        maxAllowedGroups: 9999
      };
    }

    if (!this.session || !this.session.user) {
      return {
        isAuthenticated: false,
        isSuperAdmin: false,
        email: '',
        plan: 'none',
        planName: 'Sem Conta',
        planBadge: '👤 Entrar',
        badgeClass: 'badge-login',
        isLocked: false,
        isUnauthenticated: true,
        daysRemaining: 0,
        allowedPlatform: 'none',
        dispatchesToday: 0,
        dispatchLimit: 0,
        maxAllowedGroups: 0
      };
    }

    if (!this.profile) {
      // Sessão existe mas perfil ainda está sincronizando
      return {
        isAuthenticated: true,
        isSuperAdmin: false,
        email: userEmail,
        plan: 'loading',
        planName: 'Carregando...',
        planBadge: '⏳ Carregando...',
        badgeClass: 'badge-trial',
        isLocked: false,
        daysRemaining: 3,
        allowedPlatform: 'all',
        dispatchesToday: 0,
        dispatchLimit: 20,
        maxAllowedGroups: 1
      };
    }

    const p = this.profile;
    const now = new Date();
    let isLocked = false;
    let daysRemaining = 0;
    let planBadge = '';
    let badgeClass = '';
    let dispatchLimit = 20;

    if (p.plan === 'free_trial') {
      const trialEnds = p.trial_ends_at ? new Date(p.trial_ends_at) : new Date(0);
      const diffMs = trialEnds.getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      if (diffMs <= 0 || p.plan_status === 'expired') {
        isLocked = true;
        planBadge = '⚠️ Teste Expirado';
        badgeClass = 'badge-expired';
      } else {
        planBadge = `🟢 Teste: ${daysRemaining}d restante${daysRemaining > 1 ? 's' : ''}`;
        badgeClass = 'badge-trial';
      }
      dispatchLimit = 20;
    } else if (p.plan === 'starter') {
      if (p.plan_expires_at && new Date(p.plan_expires_at) < now) {
        isLocked = true;
        planBadge = '⚠️ Starter Expirado';
        badgeClass = 'badge-expired';
      } else {
        planBadge = '🔷 Starter';
        badgeClass = 'badge-starter';
      }
      dispatchLimit = 20;
    } else if (p.plan === 'pro') {
      if (p.plan_expires_at && new Date(p.plan_expires_at) < now) {
        isLocked = true;
        planBadge = '⚠️ Pro Expirado';
        badgeClass = 'badge-expired';
      } else {
        planBadge = '🟣 Pro';
        badgeClass = 'badge-pro';
      }
      dispatchLimit = 50;
    } else if (p.plan === 'ultra') {
      if (p.plan_expires_at && new Date(p.plan_expires_at) < now) {
        isLocked = true;
        planBadge = '⚠️ Ultra Expirado';
        badgeClass = 'badge-expired';
      } else {
        planBadge = '🔥 Ultra';
        badgeClass = 'badge-ultra';
      }
      dispatchLimit = 999999;
    }

    let maxAllowedGroups = 1;
    if (p.plan === 'starter') {
      maxAllowedGroups = 1;
    } else if (p.plan === 'pro') {
      maxAllowedGroups = 5;
    } else if (p.plan === 'ultra') {
      maxAllowedGroups = 10;
    } else if (p.plan === 'free_trial') {
      maxAllowedGroups = 1;
    }

    let isPlatformLocked = false;
    let platformLockedUntil = null;
    let daysUntilPlatformUnlock = 0;

    const lockDateVal = p.starter_platform_locked_until || p.platform_locked_until;
    if ((p.plan === 'starter' || p.plan === 'free_trial' || !p.plan) && lockDateVal) {
      const lockDate = new Date(lockDateVal);
      if (lockDate > now) {
        isPlatformLocked = true;
        platformLockedUntil = lockDate;
        daysUntilPlatformUnlock = Math.max(1, Math.ceil((lockDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      }
    }

    return {
      isAuthenticated: true,
      isSuperAdmin: false,
      email: p.email || userEmail,
      plan: p.plan,
      planPeriod: p.plan_period,
      planName: p.plan.toUpperCase(),
      planBadge,
      badgeClass,
      isLocked,
      daysRemaining,
      allowedPlatform: p.allowed_platform || (p.plan === 'starter' ? 'mercadolivre' : 'all'),
      isPlatformLocked,
      platformLockedUntil,
      daysUntilPlatformUnlock,
      dispatchesToday: p.daily_dispatches_count || 0,
      dispatchLimit,
      maxAllowedGroups
    };
  }
}

// Instância global para uso no popup e background
const supabase = new SupabaseClient();
if (typeof window !== 'undefined') {
  window.supabase = supabase;
}
if (typeof globalThis !== 'undefined') {
  globalThis.supabase = supabase;
}

/**
 * Utilitário de Desduplicação e Sanitização de Favoritos
 * Remove cards duplicados (com links ou variações diferentes do mesmo produto)
 * e prioriza cards com fotos válidas e dados mais completos.
 */
function getCanonicalProductKey(item) {
  if (!item) return '';

  const rawUrl = (item.url || item.affiliate_link || item.pageUrl || '').trim().toLowerCase();
  const rawTitle = (item.title || item.product_title || '').trim().toLowerCase();

  // 1. Amazon: Detecção por ASIN (B0...)
  const amzMatch = rawUrl.match(/\/(?:dp|gp\/product)\/([a-z0-9]{10})/i) ||
                   (item.asin ? [null, item.asin.toLowerCase()] : null);
  if (amzMatch && amzMatch[1]) {
    return `amazon_${amzMatch[1].toLowerCase()}`;
  }

  // 2. Shopee: Detecção por Shop ID + Item ID (-i.SHOP.ITEM ou /product/SHOP/ITEM)
  const shpMatch = rawUrl.match(/-i\.(\d+)\.(\d+)/) || rawUrl.match(/\/product\/(\d+)\/(\d+)/);
  if (shpMatch && shpMatch[1] && shpMatch[2]) {
    return `shopee_${shpMatch[1]}_${shpMatch[2]}`;
  }

  // 3. Mercado Livre: Detecção por MLB ID (/p/MLB... ou MLB-12345 ou MLB12345)
  const mlbMatch = rawUrl.match(/(mlb[-_]?[0-9]{6,14})/i);
  if (mlbMatch && mlbMatch[1]) {
    return `ml_${mlbMatch[1].replace(/[-_]/g, '').toLowerCase()}`;
  }

  // 4. Detecção por Título Normalizado (se tiver pelo menos 8 caracteres)
  if (rawTitle && rawTitle.length >= 8) {
    const cleanTitle = rawTitle
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    let plat = (item.platform || '').toLowerCase();
    if (!plat) {
      if (rawUrl.includes('amazon') || rawUrl.includes('amzn.to')) plat = 'amazon';
      else if (rawUrl.includes('shopee') || rawUrl.includes('s.shopee')) plat = 'shopee';
      else plat = 'mercadolivre';
    }

    const words = cleanTitle.split(' ').filter(w => w.length > 2).slice(0, 7).join('_');
    if (words.length >= 6) {
      return `${plat}_title_${words}`;
    }
  }

  return rawUrl.split('?')[0].split('#')[0];
}

function deduplicateFavoritesList(items = []) {
  if (!Array.isArray(items) || items.length === 0) return [];

  const map = new Map();
  for (const item of items) {
    if (!item) continue;
    const key = getCanonicalProductKey(item);
    if (!key) continue;

    if (!map.has(key)) {
      map.set(key, { ...item });
    } else {
      const existing = map.get(key);

      const existingImg = String(existing.imageUrl || existing.image || existing.product_image || '').trim();
      const itemImg = String(item.imageUrl || item.image || item.product_image || '').trim();

      const isItemImgValid = itemImg.startsWith('http') && !itemImg.includes('placeholder') && !itemImg.includes('logo_') && !itemImg.includes('undefined');
      const isExistingImgValid = existingImg.startsWith('http') && !existingImg.includes('placeholder') && !existingImg.includes('logo_') && !existingImg.includes('undefined');

      let bestImage = existingImg;
      if (!isExistingImgValid && isItemImgValid) {
        bestImage = itemImg;
      } else if (isItemImgValid && isExistingImgValid) {
        if (itemImg.includes('-O.') && !existingImg.includes('-O.')) {
          bestImage = itemImg;
        }
      }

      const bestFolderId = existing.folder_id || item.folder_id || null;

      let bestLink = existing.affiliate_link || existing.url;
      const itemLink = item.affiliate_link || item.url || '';
      if (itemLink.includes('meli.la') || itemLink.includes('s.shopee') || itemLink.includes('amzn.to')) {
        bestLink = itemLink;
      }

      const bestPrice = existing.price || item.price;
      const bestRawPrice = existing.rawPrice || item.rawPrice;
      const bestCommission = existing.commissionPercent || item.commissionPercent || existing.commissionPrice || item.commissionPrice;
      const bestDiscount = existing.discount || item.discount;

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
      });
    }
  }

  return Array.from(map.values());
}

if (typeof window !== 'undefined') {
  window.getCanonicalProductKey = getCanonicalProductKey;
  window.deduplicateFavoritesList = deduplicateFavoritesList;
}
if (typeof globalThis !== 'undefined') {
  globalThis.getCanonicalProductKey = getCanonicalProductKey;
  globalThis.deduplicateFavoritesList = deduplicateFavoritesList;
}
