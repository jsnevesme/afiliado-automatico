import React, { useState, useEffect, useRef } from 'react'
import {
  User,
  Tag,
  Key,
  CreditCard,
  Save,
  Check,
  AlertCircle,
  ExternalLink,
  Camera,
  Upload,
  Sun,
  Moon,
  Palette
} from 'lucide-react'
import { supabase } from '../supabase'

const AVATAR_CATEGORIES = [
  {
    id: 'people',
    name: 'Pessoas',
    icon: '👤',
    avatars: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80'
    ]
  },
  {
    id: 'cartoons',
    name: 'Desenhos',
    icon: '🎨',
    avatars: [
      'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
      'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka',
      'https://api.dicebear.com/7.x/adventurer/svg?seed=Milo',
      'https://api.dicebear.com/7.x/bottts/svg?seed=Buster',
      'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Cool',
      'https://api.dicebear.com/7.x/lorelei/svg?seed=Sasha',
      'https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe',
      'https://api.dicebear.com/7.x/bottts/svg?seed=Sparky'
    ]
  },
  {
    id: 'animals',
    name: 'Animais',
    icon: '🐾',
    avatars: [
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=256&q=80',
      'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=256&q=80',
      'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?auto=format&fit=crop&w=256&q=80',
      'https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=256&q=80',
      'https://images.unsplash.com/photo-1543549790-8b5f4a028cfb?auto=format&fit=crop&w=256&q=80',
      'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?auto=format&fit=crop&w=256&q=80'
    ]
  },
  {
    id: 'food',
    name: 'Comidas',
    icon: '🍕',
    avatars: [
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=256&q=80',
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=256&q=80',
      'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=256&q=80',
      'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=256&q=80',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=256&q=80',
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=256&q=80'
    ]
  }
]

export default function SettingsView({ profile, onProfileUpdate, isSuperAdmin, user, darkMode, setDarkMode }) {
  // Dados de Perfil
  const [fullName, setFullName] = useState(
    profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || ''
  )
  const [avatarUrl, setAvatarUrl] = useState(
    profile?.avatar_url || user?.user_metadata?.avatar_url || ''
  )
  const [avatarCategory, setAvatarCategory] = useState('people')

  // Configurações Técnicas
  const [mlTag, setMlTag] = useState(profile?.ml_affiliate_tag || 'jonathansneves')
  const [amzTag, setAmzTag] = useState(profile?.amazon_affiliate_tag || '')
  const [shpTag, setShpTag] = useState(profile?.shopee_affiliate_tag || '')
  const [groqKey, setGroqKey] = useState(profile?.groq_api_key || '')
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '')
      setAvatarUrl(profile.avatar_url || user?.user_metadata?.avatar_url || '')
      setMlTag(profile.ml_affiliate_tag || 'jonathansneves')
      setAmzTag(profile.amazon_affiliate_tag || '')
      setShpTag(profile.shopee_affiliate_tag || '')
      setGroqKey(profile.groq_api_key || '')
    }
  }, [profile, user])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({ type: 'error', text: 'A imagem deve ter no máximo 5MB.' })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setAvatarUrl(event.target.result)
      setStatusMessage({ type: 'success', text: 'Foto carregada! Clique em Salvar Alterações para confirmar.' })
    }
    reader.readAsDataURL(file)
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    setSaving(true)
    setStatusMessage(null)

    try {
      const { data: authData } = await supabase.auth.getUser()
      const currentUser = authData?.user
      if (!currentUser) throw new Error('Usuário não autenticado')

      // 1. Atualiza metadados do Auth
      await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          avatar_url: avatarUrl
        }
      })

      // 2. Atualiza tabela profiles
      const updates = {
        full_name: fullName.trim(),
        avatar_url: avatarUrl,
        ml_affiliate_tag: mlTag.trim(),
        amazon_affiliate_tag: amzTag.trim(),
        shopee_affiliate_tag: shpTag.trim(),
        groq_api_key: groqKey.trim()
      }

      await supabase
        .from('profiles')
        .update(updates)
        .eq('id', currentUser.id)

      setStatusMessage({ type: 'success', text: 'Perfil e configurações salvas com sucesso!' })
      if (onProfileUpdate) onProfileUpdate(updates)
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Erro ao salvar: ' + err.message })
    } finally {
      setSaving(false)
    }
  }

  const checkouts = {
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

  const initialLetter = (fullName || user?.email || 'A').charAt(0).toUpperCase()

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Configurações da Conta & Perfil
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Gerencie suas informações de perfil, tags de afiliado, inteligência artificial e assinatura.
        </p>
      </div>

      {statusMessage && (
        <div className={`flex items-center gap-2.5 rounded-[20px] p-4 text-xs font-semibold ${
          statusMessage.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{statusMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* SEÇÃO 1: MEU PERFIL (FOTO E NOME) */}
        <div className="rounded-[28px] border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#121724] p-6 shadow-xs space-y-5 transition-colors">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Identidade do Usuário
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="relative group">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="h-20 w-20 rounded-full object-cover ring-2 ring-blue-500/20 shadow-xs"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-2xl font-black shadow-xs">
                  {initialLetter}
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-semibold"
                title="Mudar foto"
              >
                <Camera className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Foto de Perfil
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  Sua imagem aparecerá no rodapé da navegação e no consultor de IA.
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Escolher do Computador</span>
                </button>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-red-500 transition-colors px-2 py-1"
                  >
                    <span>Remover foto</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Ou selecione um avatar rápido:
              </label>
              {/* Filtro em pílula por categoria */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-full border border-slate-200/60 dark:border-slate-700/60 self-start sm:self-auto">
                {AVATAR_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setAvatarCategory(cat.id)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                      avatarCategory === cat.id
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-0.5">
              {AVATAR_CATEGORIES.find(c => c.id === avatarCategory)?.avatars.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatarUrl(preset)}
                  className={`h-9 w-9 flex-shrink-0 rounded-full overflow-hidden border-2 transition-all ${
                    avatarUrl === preset
                      ? 'border-blue-600 ring-2 ring-blue-500/30 scale-105'
                      : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600 hover:scale-105'
                  }`}
                >
                  <img src={preset} alt={`Preset ${idx}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Nome de Exibição
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Jonathan Neves"
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                E-mail da Conta (Sincronizado)
              </label>
              <input
                type="text"
                disabled
                value={user?.email || ''}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/60 px-3.5 py-2 text-xs text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* SEÇÃO: TEMA & APARÊNCIA */}
        <div className="rounded-[28px] border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#121724] p-6 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Tema da Interface</h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {darkMode ? 'Modo Escuro Ativo' : 'Modo Claro Ativo'}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Personalize a visualização da plataforma entre os modos Claro e Escuro com paleta otimizada para conforto visual e alto contraste.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setDarkMode && setDarkMode(false)}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left ${
                !darkMode
                  ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-sm ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${!darkMode ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                <Sun className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <span>Modo Claro</span>
                  {!darkMode && <Check className="h-3.5 w-3.5 text-blue-600" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Visual clássico, fundo claro e contrastes nítidos
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDarkMode && setDarkMode(true)}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left ${
                darkMode
                  ? 'border-blue-500 bg-blue-950/40 text-white shadow-sm ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${darkMode ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                <Moon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <span>Modo Escuro</span>
                  {darkMode && <Check className="h-3.5 w-3.5 text-blue-400" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Preto suave (#06090E), foco prolongado e economia de bateria
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* SEÇÃO 2: TAGS DE AFILIADO */}
        <div className="rounded-[28px] border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#121724] p-6 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Tag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Tags de Afiliado Multiplataforma</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Mercado Livre (Tag / Nickname)
              </label>
              <input
                type="text"
                value={mlTag}
                onChange={(e) => setMlTag(e.target.value)}
                placeholder="Ex: jonathansneves"
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Usado no meli.la e matt_tool</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Amazon (Tracking ID)
              </label>
              <input
                type="text"
                value={amzTag}
                onChange={(e) => setAmzTag(e.target.value)}
                placeholder="Ex: casaldosach09-20"
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Seu ID da Amazon Associates</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Shopee (Link Universal / Tag)
              </label>
              <input
                type="text"
                value={shpTag}
                onChange={(e) => setShpTag(e.target.value)}
                placeholder="Ex: s.shopee.com.br/..."
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Link curto ou ID de afiliado</span>
            </div>
          </div>
        </div>

        {/* SEÇÃO 3: CHAVE DE INTELIGÊNCIA ARTIFICIAL */}
        <div className="rounded-[28px] border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#121724] p-6 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Chave da API Groq (LLaMA 3.3 / GPT-120B)</h2>
            </div>
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <span>Gerar Chave no Groq</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Chave da API (gsk_...)
            </label>
            <input
              type="password"
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              placeholder="gsk_..."
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 px-3.5 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Utilizada para criar copys persuasivas e alimentar o consultor de negócios.
            </span>
          </div>
        </div>

        {/* Botão de Salvar Global */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-7 py-2.5 text-xs font-bold shadow-xs hover:opacity-90 transition-all disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Salvando na nuvem...' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </form>

      {/* SEÇÃO 4: PLANO & ASSINATURA CAKTO */}
      <div className="rounded-[28px] border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#121724] p-6 shadow-xs space-y-4 transition-colors">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Meu Plano & Assinatura</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[22px] border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Plano Atual</span>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-1 uppercase">
              {isSuperAdmin ? 'Super Admin' : (profile?.plan || 'Free Trial')}
            </div>
            <span className="text-[11px] text-slate-400">
              {isSuperAdmin ? 'Acesso Vitalício' : (profile?.plan_period === 'yearly' ? 'Cobrança Anual' : 'Cobrança Mensal')}
            </span>
          </div>

          <div className="rounded-[22px] border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Status do Acesso</span>
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {profile?.plan_status === 'active' ? 'Ativo' : 'Pendente'}
            </div>
            <span className="text-[11px] text-slate-400">
              {isSuperAdmin ? 'Perpétuo' : (profile?.plan_expires_at ? `Expira em: ${new Date(profile.plan_expires_at).toLocaleDateString('pt-BR')}` : 'Teste Grátis')}
            </span>
          </div>

          <div className="rounded-[22px] border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Grupos WhatsApp</span>
            <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-1">
              {isSuperAdmin ? 'Ilimitado' : (profile?.plan === 'ultra' ? 'Até 10 Grupos' : (profile?.plan === 'pro' ? 'Até 5 Grupos' : '1 Grupo'))}
            </div>
            <span className="text-[11px] text-slate-400">Cota ativa de grupos</span>
          </div>

          <div className="rounded-[22px] border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Limite Diário</span>
            <div className="text-lg font-black text-blue-600 dark:text-blue-400 mt-1">
              {isSuperAdmin || profile?.plan === 'ultra' ? 'Ilimitado' : (profile?.plan === 'pro' ? '50 / dia' : '20 / dia')}
            </div>
            <span className="text-[11px] text-slate-400">Renovado todo dia à meia-noite</span>
          </div>
        </div>

        {!isSuperAdmin && (
          <div className="pt-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">Deseja mudar ou renovar de plano?</span>
            <div className="flex flex-wrap gap-2">
              <a
                href={checkouts.starter.monthly}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 px-4 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 hover:opacity-90 transition-all"
              >
                <span>Plano Starter (1 Grupo • R$ 39,90/mês)</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href={checkouts.pro.monthly}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 px-4 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:opacity-90 transition-all"
              >
                <span>Plano Pro (5 Grupos • R$ 69,90/mês)</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href={checkouts.ultra.monthly}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 px-4 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 hover:opacity-90 transition-all"
              >
                <span>Plano Ultra (10 Grupos • R$ 89,90/mês)</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
