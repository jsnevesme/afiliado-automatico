import React from 'react'
import { RefreshCw, Plus, Search, Sun, Moon, Globe, ExternalLink, LogOut } from 'lucide-react'

export default function TopHeader({
  currentTab,
  onRefresh,
  profile,
  user,
  onLogout,
  isSuperAdmin,
  onOpenNewSale,
  darkMode,
  onToggleDarkMode,
  syncing,
  onGoToLanding
}) {
  const tabTitles = {
    analytics: { section: 'Visão Geral', title: 'Dashboard de Operações' },
    favorites: { section: 'Organização', title: 'Favoritos' },
    dailysales: { section: 'Financeiro', title: 'Registro de Vendas & Comissões' },
    aiconsultant: { section: 'IA & Estratégia', title: 'Consultor de IA' },
    copystudio: { section: 'Conversão', title: 'Estúdio de Copys para WhatsApp' },
    history: { section: 'Histórico', title: 'Disparos da Extensão' },
    extension: { section: 'Instalação', title: 'Extensão Oficial do Chrome' },
    settings: { section: 'Conta', title: 'Configurações & Perfil' },
    superadmin: { section: 'Fundador', title: 'Painel Super Admin' }
  }

  const current = tabTitles[currentTab] || { section: 'Painel', title: 'Dashboard' }

  return (
    <header className="h-14 flex-shrink-0 border-b border-slate-200/60 dark:border-slate-800/60 bg-[#F7F8FA]/90 dark:bg-[#0E131F]/90 backdrop-blur-md px-5 sm:px-6 flex items-center justify-between transition-colors z-10">
      {/* Esquerda: Saudação / Breadcrumb estilo SETO & Healthy */}
      <div className="flex items-center gap-2.5">
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
          {current.section}
        </span>
        <span className="text-slate-300 dark:text-slate-700 font-light">/</span>
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
          {current.title}
        </span>
      </div>

      {/* Direita: Campo de busca + Tema Claro/Escuro + Sincronizar + Botão Pílula Preto */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Barra de pesquisa estilo cápsula */}
        <div className="hidden lg:flex items-center gap-2 rounded-full bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 px-3.5 py-1.5 text-xs text-slate-400 shadow-2xs w-48 xl:w-60 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50 transition-all">
          <Search className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Buscar dados..."
            className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none"
          />
        </div>

        {/* Alternador de Tema Escuro / Claro em Pílula Elegante */}
        <button
          onClick={onToggleDarkMode}
          title={darkMode ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
          className="flex items-center gap-1.5 rounded-full border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all shadow-2xs"
        >
          {darkMode ? (
            <>
              <Sun className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline text-[11px] font-bold">Modo Claro</span>
            </>
          ) : (
            <>
              <Moon className="h-3.5 w-3.5 text-indigo-500" />
              <span className="hidden sm:inline text-[11px] font-bold">Modo Escuro</span>
            </>
          )}
        </button>

        {/* Botão Ver Landing Page */}
        {onGoToLanding && (
          <button
            type="button"
            onClick={onGoToLanding}
            title="Visualizar a Landing Page oficial"
            className="flex items-center gap-1.5 rounded-full border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/80 dark:bg-blue-950/60 px-3 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all shadow-2xs cursor-pointer"
          >
            <Globe className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            <span className="hidden md:inline text-[11px]">Ver Landing Page</span>
          </button>
        )}

        {/* Botão Sincronizar em Cápsula */}
        <button
          onClick={onRefresh}
          disabled={syncing}
          title="Sincronizar dados em tempo real"
          className="flex items-center gap-1.5 rounded-full border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all shadow-2xs disabled:opacity-60"
        >
          <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin text-blue-600 dark:text-blue-400' : ''}`} />
          <span className="hidden sm:inline text-[11px] font-bold">{syncing ? 'Sincronizando...' : 'Sincronizar'}</span>
        </button>

        {/* Botão Desconectar da Conta */}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            title="Sair da conta com segurança"
            className="flex items-center gap-1.5 rounded-full border border-red-200/80 dark:border-red-900/60 bg-red-50/80 dark:bg-red-950/50 px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 transition-all shadow-2xs cursor-pointer"
          >
            <LogOut className="h-3 w-3" />
            <span className="hidden sm:inline text-[11px]">Sair</span>
          </button>
        )}

        {/* Botão de Ação Primária Pílula Preto */}
        {currentTab === 'analytics' && (
          <button
            onClick={onOpenNewSale}
            className="flex items-center gap-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-1.5 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Lançar Venda</span>
          </button>
        )}
      </div>
    </header>
  )
}
