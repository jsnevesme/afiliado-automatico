import React, { useState, useRef, useEffect } from 'react'
import {
  LayoutDashboard,
  DollarSign,
  Sparkles,
  History,
  PenTool,
  Settings,
  ShieldCheck,
  LogOut,
  Sun,
  Moon,
  ChevronDown,
  Layers,
  Radio,
  ArrowRight,
  BookmarkCheck,
  Download,
  X
} from 'lucide-react'
import ChromeLogo from './ChromeLogo'

export default function Sidebar({
  currentTab,
  setTab,
  isSuperAdmin,
  user,
  profile,
  onLogout,
  darkMode,
  onToggleDarkMode,
  onOpenProfile,
  favoritesCount = 0,
  mobileMenuOpen = false,
  onCloseMobileMenu
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const handleSelectTab = (id) => {
    setTab(id)
    if (onCloseMobileMenu) onCloseMobileMenu()
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navItems = [
    { id: 'analytics', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'favorites', label: 'Favoritos', icon: BookmarkCheck, badge: favoritesCount > 0 ? String(favoritesCount) : null },
    { id: 'dailysales', label: 'Vendas & Comissões', icon: DollarSign },
    { id: 'history', label: 'Histórico de Envios', icon: History },
  ]

  const aiItems = [
    { id: 'aiconsultant', label: 'Consultor de IA', icon: Sparkles, badge: 'SETO' },
    { id: 'copystudio', label: 'Estúdio de Copys', icon: PenTool },
  ]

  const planLabels = {
    superadmin: 'Super Admin',
    ultra: 'Plano Ultra',
    pro: 'Plano Pro',
    starter: 'Plano Starter',
    free_trial: 'Free Trial'
  }

  const currentPlan = isSuperAdmin ? 'superadmin' : (profile?.plan || 'free_trial')
  const planLabel = planLabels[currentPlan] || 'Plano'

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Afiliado'
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url
  const initialLetter = displayName.charAt(0).toUpperCase()

  return (
    <>
      {/* Backdrop escuro para fechar o menu no mobile */}
      {mobileMenuOpen && (
        <div
          onClick={onCloseMobileMenu}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 md:relative md:z-20 w-72 md:w-60 flex-shrink-0 h-full border-r border-slate-200/70 dark:border-slate-800/70 bg-[#F7F8FA] dark:bg-[#0E131F] flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out select-none shadow-2xl md:shadow-none ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="px-2 pt-1 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="Afiliado Automático"
                className="h-7 w-auto object-contain block dark:hidden"
              />
              <img
                src="/logo-dark.png"
                alt="Afiliado Automático"
                className="h-7 w-auto object-contain hidden dark:block"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={onToggleDarkMode}
                title={darkMode ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors"
              >
                {darkMode ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-slate-600" />}
              </button>

              <button
                onClick={onCloseMobileMenu}
                className="md:hidden flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors"
                title="Fechar menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

        {/* Menu Principal (Estilo Cápsula Branca Flutuante das referências) */}
        <div className="space-y-5">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = currentTab === item.id

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs transition-all ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium hover:bg-white/50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Seção Ferramentas de IA (Igual à referência SETO) */}
          <div className="space-y-1">
            <div className="px-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
              <span>IA & Conversão</span>
            </div>

            <nav className="space-y-1">
              {aiItems.map((item) => {
                const Icon = item.icon
                const isActive = currentTab === item.id

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs transition-all ${
                      isActive
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium hover:bg-white/50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && !isActive && (
                      <span className="rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 px-2 py-0.5 text-[9px] font-bold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}

              <button
                onClick={() => handleSelectTab('settings')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs transition-all ${
                  currentTab === 'settings'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium hover:bg-white/50 dark:hover:bg-slate-800/40'
                }`}
              >
                <Settings className="h-4 w-4 text-slate-400" />
                <span>Configurações</span>
              </button>

              {isSuperAdmin && (
                <button
                  onClick={() => handleSelectTab('superadmin')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs transition-all ${
                    currentTab === 'superadmin'
                      ? 'bg-purple-600 text-white font-bold shadow-xs'
                      : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 font-medium'
                  }`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Super Admin</span>
                </button>
              )}
            </nav>
          </div>
        </div>
      </div>

      {/* Card do Usuário e Extensão no Rodapé */}
      <div className="space-y-2.5 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
        {/* Aba / Card de Destaque: Baixar Extensão do Chrome (Logo acima do nome) */}
        <button
          type="button"
          onClick={() => handleSelectTab('extension')}
          className={`w-full group relative overflow-hidden rounded-2xl p-2.5 border transition-all duration-200 text-left cursor-pointer ${
            currentTab === 'extension'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-md shadow-blue-500/25 ring-2 ring-blue-400/40'
              : 'bg-white dark:bg-slate-800/90 border-blue-200/90 dark:border-blue-900/60 shadow-xs hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md'
          }`}
          title="Baixar e Instalar a Extensão Oficial do Chrome"
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs transition-transform group-hover:scale-105 ${
                currentTab === 'extension'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/70'
              }`}
            >
              <ChromeLogo className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-xs font-black tracking-tight truncate ${
                    currentTab === 'extension' ? 'text-white' : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  Baixar Extensão
                </span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[8px] font-black uppercase tracking-wider ${
                    currentTab === 'extension'
                      ? 'bg-white/25 text-white'
                      : 'bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50'
                  }`}
                >
                  Chrome
                </span>
              </div>
              <p
                className={`text-[10px] truncate leading-tight mt-0.5 ${
                  currentTab === 'extension'
                    ? 'text-blue-100'
                    : 'text-blue-600 dark:text-blue-400 font-semibold'
                }`}
              >
                Disparos no WhatsApp
              </p>
            </div>

            <div
              className={`h-6 w-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:translate-x-0.5 ${
                currentTab === 'extension'
                  ? 'bg-white/20 text-white'
                  : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
              }`}
            >
              <Download className="h-3.5 w-3.5" />
            </div>
          </div>
        </button>

        {/* Card Elevado do Usuário */}
        <div className="relative" ref={dropdownRef}>
          <div className="rounded-2xl bg-white dark:bg-slate-800/80 p-3 shadow-xs border border-slate-200/50 dark:border-slate-700/50 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-9 w-9 rounded-full object-cover shadow-2xs"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold text-xs shadow-2xs">
                    {initialLetter}
                  </div>
                )}
                {/* Ponto verde online igual às referências */}
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-800" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
                  {displayName}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {user?.email || '@afiliado'}
                </p>
              </div>
            </div>

            {/* Botões de Ação do Perfil & Logout */}
            <div className="flex items-center gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={onOpenProfile}
                className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer"
                title="Editar Nome e Foto de Perfil"
              >
                <span>Perfil</span>
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="flex items-center justify-center gap-1 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 px-3 py-1.5 text-[11px] font-bold transition-colors cursor-pointer border border-red-100 dark:border-red-900/40"
                title="Sair da conta com segurança"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
    </>
  )
}
