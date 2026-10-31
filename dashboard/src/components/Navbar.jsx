import React, { useState, useRef, useEffect } from 'react'
import {
  LogOut,
  RefreshCw,
  Sun,
  Moon,
  User,
  Settings,
  ShieldCheck,
  Zap,
  Sparkles,
  Layers,
  Clock,
  ChevronDown
} from 'lucide-react'

export default function Navbar({
  user,
  profile,
  onLogout,
  onRefresh,
  isSuperAdmin,
  darkMode,
  onToggleDarkMode,
  onOpenProfile,
  onNavigateTab
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Badges profissionais B2B (sem emojis infantis)
  const planBadges = {
    superadmin: {
      label: 'Super Admin',
      icon: ShieldCheck,
      bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800'
    },
    ultra: {
      label: 'Plano Ultra',
      icon: Zap,
      bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800'
    },
    pro: {
      label: 'Plano Pro',
      icon: Sparkles,
      bg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800'
    },
    starter: {
      label: 'Plano Starter',
      icon: Layers,
      bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800'
    },
    free_trial: {
      label: 'Avaliação Grátis',
      icon: Clock,
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800'
    },
  }

  const currentPlan = isSuperAdmin ? 'superadmin' : (profile?.plan || 'free_trial')
  const badge = planBadges[currentPlan] || planBadges.free_trial
  const BadgeIcon = badge.icon

  // Nome e foto de exibição
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Afiliado'
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url
  const initialLetter = displayName.charAt(0).toUpperCase()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md px-6 shadow-2xs transition-colors">
      {/* Logotipo Oficial Adaptativo (Claro / Escuro) */}
      <div className="flex items-center gap-3">
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

      {/* Ações do Topo */}
      <div className="flex items-center gap-2.5">
        {/* Botão de Tema Escuro / Claro */}
        <button
          onClick={onToggleDarkMode}
          title={darkMode ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 text-slate-600 dark:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-2xs"
        >
          {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
        </button>

        <button
          onClick={onRefresh}
          title="Sincronizar dados em tempo real"
          className="flex items-center gap-1.5 rounded-lg border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sincronizar</span>
        </button>

        {/* Badge do Plano com Ícone Fino */}
        <div className={`hidden sm:flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${badge.bg}`}>
          <BadgeIcon className="h-3.5 w-3.5" />
          <span>{badge.label}</span>
        </div>

        {/* Perfil Interativo com Dropdown */}
        <div className="relative pl-1 border-l border-slate-200/80 dark:border-slate-800" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-8 w-8 rounded-full object-cover ring-2 ring-blue-500/20 shadow-2xs"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-2xs ring-2 ring-blue-500/20">
                {initialLetter}
              </div>
            )}

            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                {displayName}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                {isSuperAdmin ? 'Fundador' : (profile?.plan_status === 'active' ? 'Ativo' : 'Avaliação')}
              </div>
            </div>

            <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden md:block" />
          </button>

          {/* Menu Dropdown Suspenso */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150 z-50">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {displayName}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                  {user?.email}
                </p>
                <div className={`mt-2 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold ${badge.bg}`}>
                  <BadgeIcon className="h-3 w-3" />
                  <span>{badge.label}</span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false)
                    onOpenProfile()
                  }}
                  className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span>Editar Perfil & Foto</span>
                </button>

                <button
                  onClick={() => {
                    setDropdownOpen(false)
                    if (onNavigateTab) onNavigateTab('settings')
                  }}
                  className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Settings className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <span>Configurações</span>
                </button>
              </div>

              <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    setDropdownOpen(false)
                    onLogout()
                  }}
                  className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sair da Conta</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
