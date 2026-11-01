import React, { useState, useEffect } from 'react'
import { supabase } from './supabase'
import TopHeader from './components/TopHeader'
import Sidebar from './components/Sidebar'
import AnalyticsView from './components/AnalyticsView'
import FavoritesView from './components/FavoritesView'
import RadarView from './components/RadarView'
import DailySalesView from './components/DailySalesView'
import AiConsultantView from './components/AiConsultantView'
import DispatchesHistoryView from './components/DispatchesHistoryView'
import CopyStudioView from './components/CopyStudioView'
import SettingsView from './components/SettingsView'
import SuperAdminView from './components/SuperAdminView'
import ExtensionDownloadView from './components/ExtensionDownloadView'
import AuthModal from './components/AuthModal'
import ProfileEditModal from './components/ProfileEditModal'
import LandingPageView from './components/LandingPage/LandingPageView'
import { Sparkles, Lock, ArrowRight, ShieldCheck } from 'lucide-react'
import { deduplicateFavorites } from './lib/favoritesDeduplicator'


export default function App() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [dispatches, setDispatches] = useState([])
  const [sales, setSales] = useState([])
  const [favorites, setFavorites] = useState([])
  const [folders, setFolders] = useState([])
  const [prefilledProduct, setPrefilledProduct] = useState(null)
  const [currentTab, setTab] = useState('analytics')
  const [showRadar, setShowRadar] = useState(() => {
    try {
      return localStorage.getItem('hide_radar_tab') !== 'true'
    } catch (e) {
      return true
    }
  })
  const [loading, setLoading] = useState(true)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState('login')
  const [syncing, setSyncing] = useState(false)
  const [viewMode, setViewMode] = useState(() => {
    try {
      if (window.location.hash === '#dashboard' || window.location.hash === '#app') return 'dashboard'
      if (window.location.hash === '#landing') return 'landing'
      const saved = localStorage.getItem('last_view_mode')
      if (saved) return saved
    } catch (e) {}
    return 'landing'
  })
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('theme')
      if (saved) return saved === 'dark'
    } catch (e) {}
    return true // Padrão escuro ativado
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Sincroniza hash do navegador
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash
      if (hash === '#dashboard' || hash === '#app') {
        setViewMode('dashboard')
      } else if (hash === '#landing') {
        setViewMode('landing')
      }
    }
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  const handleSetViewMode = (mode) => {
    setViewMode(mode)
    try {
      localStorage.setItem('last_view_mode', mode)
      if (mode === 'dashboard') {
        window.location.hash = '#dashboard'
      } else {
        window.location.hash = '#landing'
      }
    } catch (e) {}
  }

  // Sincroniza classe .dark no HTML e no Body
  useEffect(() => {
    if (viewMode === 'landing') {
      document.documentElement.classList.remove('dark')
      document.body.classList.remove('dark')
      return
    }
    if (darkMode) {
      document.documentElement.classList.add('dark')
      document.body.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.body.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode, viewMode])

  // 1. Monitora estado de autenticação real (sem auto-login inseguro)
  useEffect(() => {
    let isMounted = true

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const activeUser = session?.user

        if (activeUser && isMounted) {
          setUser(activeUser)
          await fetchAllUserData(activeUser)
        } else if (isMounted) {
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      } catch (err) {
        console.warn('[Dashboard] Erro na inicialização da autenticação:', err)
        if (isMounted) {
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      }
    }

    initAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        await fetchAllUserData(session.user)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setDispatches([])
        setSales([])
        setFavorites([])
        setFolders([])
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  // 2. Busca perfil, histórico de disparos, vendas e favoritos
  const fetchAllUserData = async (currentUser) => {
    if (!currentUser) return
    const userId = currentUser.id
    try {
      // 1. Perfil na nuvem
      let prof = null
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle()
        if (!error && data) {
          prof = data
        } else if (error) {
          console.warn('[Dashboard] Aviso ao buscar profile:', error)
        }
      } catch (e) {
        console.warn('[Dashboard] Exceção ao consultar profiles:', e)
      }

      // Se falhou carregar o profile mas o usuário é jsnevesme@gmail.com, tenta renovar sessão
      if (!prof && currentUser.email?.toLowerCase() === 'jsnevesme@gmail.com') {
        try {
          const { data: refreshed } = await supabase.auth.refreshSession()
          if (refreshed?.session?.user) {
            const { data: retryProf } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .maybeSingle()
            if (retryProf) prof = retryProf
          }
        } catch (e) {}
      }

      let localMeta = {}
      let localFavs = []
      let localFolders = []

      try {
        const savedMeta = localStorage.getItem('user_meta_' + userId)
        if (savedMeta) localMeta = JSON.parse(savedMeta)

        const savedFavs = localStorage.getItem('user_favs_' + userId)
        if (savedFavs) localFavs = JSON.parse(savedFavs)

        const savedFolders = localStorage.getItem('user_folders_' + userId)
        if (savedFolders) localFolders = JSON.parse(savedFolders)
      } catch (e) {}

      // Busca metadata mais recente do Auth
      let authMeta = currentUser.user_metadata || {}
      try {
        const { data: freshAuth } = await supabase.auth.getUser()
        if (freshAuth?.user?.user_metadata) {
          authMeta = { ...authMeta, ...freshAuth.user.user_metadata }
        }
      } catch (e) {}

      const isSuperAdminEmail = currentUser.email?.toLowerCase() === 'jsnevesme@gmail.com'
      const sanitizedMlTag = isSuperAdminEmail
        ? (prof?.ml_affiliate_tag || 'jonathansneves')
        : (prof?.ml_affiliate_tag === 'jonathansneves' ? '' : (prof?.ml_affiliate_tag || ''))
      const sanitizedGroqKey = isSuperAdminEmail ? (prof?.groq_api_key || '') : (prof?.groq_api_key || '')

      const mergedProfile = {
        ...(prof || {}),
        role: prof?.role || (isSuperAdminEmail ? 'superadmin' : 'user'),
        full_name: prof?.full_name || authMeta.full_name || localMeta.full_name || (isSuperAdminEmail ? 'Jonathan Neves' : currentUser.email?.split('@')[0] || 'Afiliado'),
        avatar_url: prof?.avatar_url || authMeta.avatar_url || localMeta.avatar_url || '',
        ml_affiliate_tag: sanitizedMlTag,
        groq_api_key: sanitizedGroqKey
      }

      setProfile(mergedProfile)

      // Carrega favoritos: prioridade absoluta para a nuvem profiles.favorite_offers com desduplicação automática
      const cloudFavs = (prof?.favorite_offers && Array.isArray(prof.favorite_offers)) ? prof.favorite_offers : []
      const rawFavs = cloudFavs.length > 0 ? cloudFavs : (localFavs.length > 0 ? localFavs : [])
      const loadedFavs = deduplicateFavorites(rawFavs)
      setFavorites(loadedFavs)

      try {
        localStorage.setItem('user_favs_' + userId, JSON.stringify(loadedFavs))
        // Se havia itens duplicados na nuvem ou localmente, persiste a lista limpa e unificada
        if (rawFavs.length > loadedFavs.length) {
          supabase.from('profiles').update({ favorite_offers: loadedFavs }).eq('id', userId)
        }
      } catch (e) {}

      // Carrega pastas: nuvem > auth user_metadata > local > padrão idêntico à extensão
      const authFolders = authMeta?.favorite_folders
      const cloudFolders = (prof?.favorite_folders && Array.isArray(prof.favorite_folders) && prof.favorite_folders.length > 0)
        ? prof.favorite_folders
        : (authFolders && Array.isArray(authFolders) && authFolders.length > 0 ? authFolders : null)

      const defaultFolders = [
        { id: 'fld_tech', name: 'Tecnologia', color: 'blue', createdAt: new Date().toISOString() },
        { id: 'fld_casa', name: 'Casa & Cozinha', color: 'emerald', createdAt: new Date().toISOString() },
        { id: 'fld_achados', name: 'Achadinhos', color: 'amber', createdAt: new Date().toISOString() }
      ]

      const loadedFolders = cloudFolders || (localFolders.length > 0 ? localFolders : defaultFolders)
      setFolders(loadedFolders)

      try {
        localStorage.setItem('user_folders_' + userId, JSON.stringify(loadedFolders))
      } catch (e) {}

      // Carrega disparos da conta
      const { data: disps } = await supabase
        .from('dispatches_log')
        .select('*')
        .eq('user_id', userId)
        .order('dispatched_at', { ascending: false })
        .limit(200)

      if (disps) setDispatches(disps)

      // Carrega vendas da conta
      const { data: sls } = await supabase
        .from('affiliate_sales')
        .select('*')
        .eq('user_id', userId)
        .order('sale_date', { ascending: false })
        .limit(200)

      if (sls) setSales(sls)
    } catch (err) {
      console.warn('[Dashboard] Erro ao carregar dados:', err)
    } finally {
      setLoading(false)
    }
  }

  // 3. Ouvinte Realtime para novos disparos e alterações de perfil/favoritos da extensão
  useEffect(() => {
    if (!user) return

    const dispatchesChannel = supabase
      .channel('dispatches_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dispatches_log',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setDispatches((prev) => [payload.new, ...prev])
          setProfile((prev) => ({
            ...prev,
            daily_dispatches_count: (prev?.daily_dispatches_count || 0) + 1,
          }))
        }
      )
      .subscribe()

    const profileChannel = supabase
      .channel('profiles_realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            if (Array.isArray(payload.new.favorite_offers)) {
              const cleaned = deduplicateFavorites(payload.new.favorite_offers)
              setFavorites(cleaned)
              try {
                localStorage.setItem('user_favs_' + user.id, JSON.stringify(cleaned))
              } catch (e) {}
            }
            if (Array.isArray(payload.new.favorite_folders)) {
              setFolders(payload.new.favorite_folders)
              try {
                localStorage.setItem('user_folders_' + user.id, JSON.stringify(payload.new.favorite_folders))
              } catch (e) {}
            }
          }
        }
      )
      .subscribe()

    // 4. Sincronização automática ao focar na janela (quando o usuário volta da extensão para o painel)
    const handleWindowFocus = () => {
      handleRefresh()
    }
    window.addEventListener('focus', handleWindowFocus)

    return () => {
      supabase.removeChannel(dispatchesChannel)
      supabase.removeChannel(profileChannel)
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [user])

  // 4. Salvar atualização de perfil (Nome e Foto)
  const handleSaveProfile = async ({ full_name, avatar_url }) => {
    if (!user) return

    const { data: updatedAuth } = await supabase.auth.updateUser({
      data: { full_name, avatar_url }
    })

    if (updatedAuth?.user) {
      setUser(updatedAuth.user)
    }

    try {
      await supabase
        .from('profiles')
        .update({ full_name, avatar_url })
        .eq('id', user.id)
    } catch (e) {
      console.warn('Atualizando profiles com fallback:', e)
    }

    try {
      localStorage.setItem('user_meta_' + user.id, JSON.stringify({ full_name, avatar_url }))
    } catch (e) {}

    setProfile((prev) => ({
      ...prev,
      full_name,
      avatar_url
    }))
  }

  // 5. Atualizar Favoritos
  const handleUpdateFavorites = async (newFavs) => {
    const cleanedFavs = deduplicateFavorites(newFavs)
    setFavorites(cleanedFavs)
    if (user) {
      try {
        localStorage.setItem('user_favs_' + user.id, JSON.stringify(cleanedFavs))
        await supabase.from('profiles').update({ favorite_offers: cleanedFavs }).eq('id', user.id)
      } catch (e) {
        console.warn('Erro ao atualizar favoritos:', e)
      }
    }
  }

  // 6. Atualizar Pastas
  const handleUpdateFolders = async (newFolders) => {
    setFolders(newFolders)
    if (user) {
      try {
        localStorage.setItem('user_folders_' + user.id, JSON.stringify(newFolders))
        await supabase.auth.updateUser({ data: { favorite_folders: newFolders } })
        await supabase.from('profiles').update({ favorite_folders: newFolders }).eq('id', user.id)
      } catch (e) {
        console.warn('Tentativa de salvar pastas em profiles:', e)
      }
    }
  }

  // 7. Lançar venda a partir de um produto favorito
  const handleLaunchSaleWithProduct = (product) => {
    setPrefilledProduct(product)
    setTab('dailysales')
  }

  // 8. Salvar ou remover oferta favoritada diretamente do Radar
  const handleSaveFavoriteFromRadar = (product) => {
    const exists = favorites.some((f) => f.url === product.url || f.title === product.title)
    if (exists) {
      const updated = favorites.filter((f) => f.url !== product.url && f.title !== product.title)
      handleUpdateFavorites(updated)
      return
    }

    const newFav = {
      id: 'fav_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: product.title,
      price: product.price,
      originalPrice: product.originalPrice,
      discount: product.discount,
      imageUrl: product.imageUrl,
      url: product.url,
      platform: product.platform,
      folderId: 'fld_achados',
      createdAt: new Date().toISOString()
    }
    const updated = [newFav, ...favorites]
    handleUpdateFavorites(updated)
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.warn('Erro ao deslogar:', e)
    }
    setUser(null)
    setProfile(null)
    setDispatches([])
    setSales([])
    setFavorites([])
    setFolders([])
    handleSetViewMode('landing')
  }

  const handleRefresh = async () => {
    setSyncing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const activeUser = session?.user || user

      if (activeUser) {
        const { data: freshUser } = await supabase.auth.getUser()
        const userToUse = freshUser?.user || activeUser
        setUser(userToUse)
        await fetchAllUserData(userToUse)
      }
    } catch (err) {
      console.error('[Dashboard] Erro ao sincronizar:', err)
    } finally {
      setTimeout(() => setSyncing(false), 500)
    }
  }

  const isSuperAdmin =
    profile?.role === 'superadmin' ||
    user?.email?.toLowerCase() === 'jsnevesme@gmail.com'

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-[#0c1017]">
        <div className="text-center">
          <img src="/logo.png" alt="Afiliado Automático" className="h-8 w-auto mx-auto mb-4 block dark:hidden animate-pulse" />
          <img src="/logo-dark.png" alt="Afiliado Automático" className="h-8 w-auto mx-auto mb-4 hidden dark:block animate-pulse" />
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-400">Carregando painel...</p>
        </div>
      </div>
    )
  }

  // Se o modo de visualização for Landing Page (Inspirada no Promptwatch)
  if (viewMode === 'landing') {
    return (
      <div className="min-h-screen w-full bg-[#FAFAF9] text-stone-900 transition-colors">
        {authModalOpen && (
          <AuthModal
            initialMode={authModalMode}
            onClose={() => setAuthModalOpen(false)}
            onAuthSuccess={async (u) => {
              setUser(u)
              setAuthModalOpen(false)
              await fetchAllUserData(u)
              handleSetViewMode('dashboard')
            }}
          />
        )}

        <LandingPageView
          user={user}
          onLogout={handleLogout}
          onGoToDashboard={() => {
            if (user) {
              handleSetViewMode('dashboard')
            } else {
              setAuthModalMode('login')
              setAuthModalOpen(true)
            }
          }}
          onOpenAuth={(mode = 'login') => {
            setAuthModalMode(mode)
            setAuthModalOpen(true)
          }}
        />
      </div>
    )
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-[#EAEFF5] via-[#F2F5F8] to-[#E5EBF2] dark:from-[#06090E] dark:via-[#090D15] dark:to-[#05070B] p-0 sm:p-2 md:p-3 lg:p-4 flex items-center justify-center font-sans text-slate-900 dark:text-slate-100 transition-colors">
      {!user && (
        <AuthModal
          initialMode="login"
          onClose={() => handleSetViewMode('landing')}
          onAuthSuccess={async (u) => {
            setUser(u)
            await fetchAllUserData(u)
          }}
        />
      )}

      <ProfileEditModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={user}
        profile={profile}
        onSaveProfile={handleSaveProfile}
      />

      {/* Container Flutuante com Bordas Arredondadas (Estilo SETO / Healthy) */}
      <div className="w-full h-full rounded-none sm:rounded-[24px] md:rounded-[28px] lg:rounded-[32px] bg-[#F7F8FA] dark:bg-[#0E131F] border-0 sm:border border-white/80 dark:border-slate-800/80 shadow-none sm:shadow-2xl flex overflow-hidden relative">
        <Sidebar
          currentTab={currentTab}
          setTab={setTab}
          isSuperAdmin={isSuperAdmin}
          user={user}
          profile={profile}
          onLogout={handleLogout}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((prev) => !prev)}
          onOpenProfile={() => setProfileModalOpen(true)}
          favoritesCount={favorites.length}
          mobileMenuOpen={mobileMenuOpen}
          onCloseMobileMenu={() => setMobileMenuOpen(false)}
          showRadar={showRadar}
        />

        <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
          <TopHeader
            currentTab={currentTab}
            onRefresh={handleRefresh}
            syncing={syncing}
            profile={profile}
            user={user}
            onLogout={handleLogout}
            isSuperAdmin={isSuperAdmin}
            onOpenNewSale={() => {
              setPrefilledProduct(null)
              setTab('dailysales')
            }}
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode((prev) => !prev)}
            onGoToLanding={() => handleSetViewMode('landing')}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
          />

          <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 bg-[#F7F8FA] dark:bg-[#0E131F]">
            {currentTab === 'analytics' && (
              <AnalyticsView
                profile={profile}
                user={user}
                dispatches={dispatches}
                sales={sales}
                isSuperAdmin={isSuperAdmin}
                onGoToSales={() => {
                  setPrefilledProduct(null)
                  setTab('dailysales')
                }}
              />
            )}

            {currentTab === 'radar' && (
              <RadarView
                profile={profile}
                user={user}
                favorites={favorites}
                onSaveFavorite={handleSaveFavoriteFromRadar}
                onLaunchSale={handleLaunchSaleWithProduct}
                onHideRadar={() => {
                  setShowRadar(false)
                  try { localStorage.setItem('hide_radar_tab', 'true') } catch (e) {}
                  setTab('analytics')
                }}
              />
            )}

            {currentTab === 'favorites' && (
              <FavoritesView
                favorites={favorites}
                folders={folders}
                onUpdateFavorites={handleUpdateFavorites}
                onUpdateFolders={handleUpdateFolders}
                onLaunchSaleWithProduct={handleLaunchSaleWithProduct}
                user={user}
              />
            )}

            {currentTab === 'dailysales' && (
              <DailySalesView
                sales={sales}
                dispatches={dispatches}
                favorites={favorites}
                onSalesUpdate={(newSales) => setSales(newSales)}
                user={user}
                prefilledProduct={prefilledProduct}
              />
            )}

            {currentTab === 'aiconsultant' && (
              (!isSuperAdmin && (profile?.plan === 'starter' || profile?.plan === 'free_trial' || !profile?.plan)) ? (
                <div className="max-w-2xl mx-auto my-10 p-8 sm:p-10 bg-white dark:bg-[#121724] border border-slate-200/80 dark:border-slate-800 rounded-3xl text-center space-y-6 shadow-xl">
                  <div className="h-16 w-16 mx-auto rounded-3xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                      <Lock className="h-3 w-3" />
                      Exclusivo Planos Pro & Ultra
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                      Consultor Estratégico de IA
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                      O Consultor Estratégico de IA analisa nichos de mercado em alta, indica produtos com grande margem de comissão e orienta seu crescimento diário no piloto automático.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 text-left space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Plano Atual: {profile?.plan === 'free_trial' ? 'Starter (3 Dias de Teste Grátis)' : 'Starter'}</span>
                    </div>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400">
                      O plano Starter inclui 1 plataforma fixa, 1 grupo de WhatsApp e a ferramenta CopyStudio. O Consultor de IA é desbloqueado no Plano Pro ou Ultra.
                    </p>
                  </div>
                  <div className="pt-2">
                    <a
                      href="https://pay.cakto.com.br/x3whytm"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:opacity-95 text-white font-extrabold text-xs shadow-lg shadow-blue-500/25 transition-all"
                    >
                      <span>Desbloquear no Plano Pro (R$ 69,90/mês)</span>
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              ) : (
                <AiConsultantView
                  profile={profile}
                  sales={sales}
                  dispatches={dispatches}
                  user={user}
                />
              )
            )}

            {currentTab === 'history' && (
              <DispatchesHistoryView dispatches={dispatches} />
            )}

            {currentTab === 'copystudio' && (
              <CopyStudioView
                profile={profile}
                onProfileUpdate={(updates) => setProfile((p) => ({ ...p, ...updates }))}
              />
            )}

            {currentTab === 'extension' && (
              <ExtensionDownloadView
                profile={profile}
                user={user}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsView
                profile={profile}
                onProfileUpdate={(updates) => setProfile((p) => ({ ...p, ...updates }))}
                isSuperAdmin={isSuperAdmin}
                user={user}
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                showRadar={showRadar}
                setShowRadar={setShowRadar}
              />
            )}

            {currentTab === 'superadmin' && isSuperAdmin && (
              <SuperAdminView />
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
