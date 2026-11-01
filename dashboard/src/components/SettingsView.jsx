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
  Palette,
  Layers,
  ShieldCheck,
  Lock,
  Plus,
  Trash2,
  ArrowRight,
  Flame
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

export default function SettingsView({ profile, onProfileUpdate, isSuperAdmin, user, darkMode, setDarkMode, showRadar = true, setShowRadar }) {
  // Dados de Perfil
  const [fullName, setFullName] = useState(
    profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || ''
  )
  const [avatarUrl, setAvatarUrl] = useState(
    profile?.avatar_url || user?.user_metadata?.avatar_url || ''
  )
  const [avatarCategory, setAvatarCategory] = useState('people')

  // Configurações Técnicas & Tags de Afiliado
  const [mlTag, setMlTag] = useState(profile?.ml_affiliate_tag || '')
  const [amzTag, setAmzTag] = useState(profile?.amazon_affiliate_tag || '')
  const [shpTag, setShpTag] = useState(profile?.shopee_affiliate_tag || '')
  const [groqKey, setGroqKey] = useState(profile?.groq_api_key || '')

  // Plataforma Fixada & Grupos de WhatsApp
  const [allowedPlatform, setAllowedPlatform] = useState(profile?.allowed_platform || 'mercadolivre')
  const [platformLockedUntil, setPlatformLockedUntil] = useState(profile?.platform_locked_until || null)
  const [whatsappGroups, setWhatsappGroups] = useState(
    Array.isArray(profile?.ml_whatsapp_groups) ? profile.ml_whatsapp_groups : []
  )
  const [detectedWhatsAppGroups, setDetectedWhatsAppGroups] = useState(
    Array.isArray(profile?.all_detected_whatsapp_groups) ? profile.all_detected_whatsapp_groups : []
  )
  const [selectedDetectedGroup, setSelectedDetectedGroup] = useState('')
  const [newGroupName, setNewGroupName] = useState('')

  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState(null)
  const fileInputRef = useRef(null)

  const isStarterOrTrial = !isSuperAdmin && (profile?.plan === 'starter' || profile?.plan === 'free_trial' || !profile?.plan)
  const isPlatformLocked = isStarterOrTrial && platformLockedUntil && new Date(platformLockedUntil) > new Date()

  // Limite estrito de grupos por plano
  const maxGroupsAllowed = isSuperAdmin ? 9999 : (profile?.plan === 'ultra' ? 10 : (profile?.plan === 'pro' ? 5 : 1))

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '')
      setAvatarUrl(profile.avatar_url || user?.user_metadata?.avatar_url || '')
      setMlTag(profile.ml_affiliate_tag || '')
      setAmzTag(profile.amazon_affiliate_tag || '')
      setShpTag(profile.shopee_affiliate_tag || '')
      setGroqKey(profile.groq_api_key || '')
      setAllowedPlatform(profile.allowed_platform || (isStarterOrTrial ? 'mercadolivre' : 'all'))
      setPlatformLockedUntil(profile.platform_locked_until || null)
      if (Array.isArray(profile.ml_whatsapp_groups)) {
        setWhatsappGroups(profile.ml_whatsapp_groups)
      }
      if (Array.isArray(profile.all_detected_whatsapp_groups)) {
        setDetectedWhatsAppGroups(profile.all_detected_whatsapp_groups)
      }
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

  // Trava a plataforma para o ciclo mensal no plano Starter
  const handleLockPlatform = async () => {
    try {
      const lockDate = new Date()
      lockDate.setDate(lockDate.getDate() + 30)
      const lockIso = lockDate.toISOString()

      const { data: authData } = await supabase.auth.getUser()
      const currentUser = authData?.user
      if (!currentUser) throw new Error('Usuário não autenticado')

      const updates = {
        allowed_platform: allowedPlatform,
        platform_locked_until: lockIso
      }

      await supabase
        .from('profiles')
        .update(updates)
        .eq('id', currentUser.id)

      setPlatformLockedUntil(lockIso)
      if (onProfileUpdate) onProfileUpdate(updates)

      setStatusMessage({
        type: 'success',
        text: `Plataforma "${allowedPlatform.toUpperCase()}" fixada com sucesso para este ciclo de 30 dias!`
      })
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Erro ao bloquear plataforma: ' + err.message })
    }
  }

  // Adicionar grupo de WhatsApp com validação estrita de limite
  const handleAddGroup = async (e) => {
    if (e) e.preventDefault()
    const trimmed = newGroupName.trim()
    if (!trimmed) return

    if (whatsappGroups.length >= maxGroupsAllowed) {
      setStatusMessage({
        type: 'error',
        text: `Seu plano permite cadastrar no máximo ${maxGroupsAllowed} grupo(s). Faça upgrade para adicionar mais grupos.`
      })
      return
    }

    if (whatsappGroups.includes(trimmed)) {
      setStatusMessage({ type: 'error', text: 'Este grupo já está cadastrado.' })
      return
    }

    const updatedGroups = [...whatsappGroups, trimmed]
    setWhatsappGroups(updatedGroups)
    setNewGroupName('')

    try {
      const { data: authData } = await supabase.auth.getUser()
      const currentUser = authData?.user
      if (currentUser) {
        await supabase
          .from('profiles')
          .update({ ml_whatsapp_groups: updatedGroups })
          .eq('id', currentUser.id)
      }
      if (onProfileUpdate) onProfileUpdate({ ml_whatsapp_groups: updatedGroups })
      setStatusMessage({ type: 'success', text: `Grupo "${trimmed}" adicionado com sucesso!` })
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Erro ao salvar grupo: ' + err.message })
    }
  }

  // Cadastrar grupo a partir da lista detectada no WhatsApp Web
  const handleAddDetectedGroup = async () => {
    if (!selectedDetectedGroup) return
    if (whatsappGroups.length >= maxGroupsAllowed) {
      setStatusMessage({
        type: 'error',
        text: `Seu plano permite cadastrar no máximo ${maxGroupsAllowed} grupo(s). Faça upgrade para adicionar mais grupos.`
      })
      return
    }
    if (whatsappGroups.includes(selectedDetectedGroup)) {
      setStatusMessage({ type: 'error', text: 'Este grupo já está cadastrado.' })
      return
    }

    const updatedGroups = [...whatsappGroups, selectedDetectedGroup]
    setWhatsappGroups(updatedGroups)
    setSelectedDetectedGroup('')

    try {
      const { data: authData } = await supabase.auth.getUser()
      const currentUser = authData?.user
      if (currentUser) {
        await supabase
          .from('profiles')
          .update({ ml_whatsapp_groups: updatedGroups })
          .eq('id', currentUser.id)
      }
      if (onProfileUpdate) onProfileUpdate({ ml_whatsapp_groups: updatedGroups })
      setStatusMessage({ type: 'success', text: `Grupo "${selectedDetectedGroup}" cadastrado com sucesso!` })
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Erro ao salvar grupo: ' + err.message })
    }
  }

  // Remover grupo de WhatsApp
  const handleRemoveGroup = async (groupToRemove) => {
    const updatedGroups = whatsappGroups.filter((g) => g !== groupToRemove)
    setWhatsappGroups(updatedGroups)

    try {
      const { data: authData } = await supabase.auth.getUser()
      const currentUser = authData?.user
      if (currentUser) {
        await supabase
          .from('profiles')
          .update({ ml_whatsapp_groups: updatedGroups })
          .eq('id', currentUser.id)
      }
      if (onProfileUpdate) onProfileUpdate({ ml_whatsapp_groups: updatedGroups })
      setStatusMessage({ type: 'success', text: `Grupo "${groupToRemove}" removido.` })
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Erro ao remover grupo: ' + err.message })
    }
  }

  // Salvar Configurações Gerais
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
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
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
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="ml-auto text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            &times;
          </button>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* SEÇÃO 1: PERFIL & AVATAR */}
        <div className="rounded-[28px] border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#121724] p-6 shadow-xs space-y-5 transition-colors">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Informações Pessoais & Foto de Perfil</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative group">
              <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl font-bold text-slate-600 dark:text-slate-300 shadow-inner">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span>{initialLetter}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-semibold cursor-pointer"
              >
                <Camera className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Foto de Perfil</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Envie uma imagem do seu computador ou escolha um dos avatares abaixo.
              </p>
              <div className="flex items-center gap-2 pt-1">
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
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Escolher do Computador</span>
                </button>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-red-500 transition-colors px-2 py-1 cursor-pointer"
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
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-full border border-slate-200/60 dark:border-slate-700/60 self-start sm:self-auto">
                {AVATAR_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setAvatarCategory(cat.id)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
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
              {AVATAR_CATEGORIES.find((c) => c.id === avatarCategory)?.avatars.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatarUrl(preset)}
                  className={`h-9 w-9 flex-shrink-0 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
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
                placeholder=""
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setDarkMode && setDarkMode(false)}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left cursor-pointer ${
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
              className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left cursor-pointer ${
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

        {/* SEÇÃO: MÓDULOS & RADAR DE OFERTAS */}
        <div className="rounded-[28px] border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#121724] p-6 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Módulos da Plataforma</h2>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${showRadar ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
              {showRadar ? 'Radar Ativo' : 'Radar Oculto'}
            </span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200">
                <span>Exibir Radar de Ofertas no Menu Lateral</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Exibe a aba do Radar de Ofertas no menu lateral da plataforma. Você pode desativar para trabalhar exclusivamente com ofertas capturadas pela extensão nos sites oficiais.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !showRadar
                if (setShowRadar) setShowRadar(next)
                try {
                  localStorage.setItem('hide_radar_tab', next ? 'false' : 'true')
                } catch (e) {}
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                showRadar ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  showRadar ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* SEÇÃO 2: PLATAFORMA DE OPERAÇÃO & BLOQUEIO DO STARTER */}
        <div className="rounded-[28px] border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#121724] p-6 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Plataforma de Disparo Autorizada
              </h2>
            </div>
            {isStarterOrTrial ? (
              isPlatformLocked ? (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                  <Lock className="h-3 w-3" />
                  Ciclo Bloqueado
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Escolha Disponível
                </span>
              )
            ) : (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <Check className="h-3 w-3" />
                3 Plataformas Desbloqueadas
              </span>
            )}
          </div>

          {isStarterOrTrial ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                No <strong>Plano Starter</strong> e no <strong>Teste Grátis</strong>, você escolhe 1 plataforma para disparar suas ofertas. A escolha permanece fixada por 30 dias (até o final do ciclo mensal), podendo ser alterada no próximo mês.
              </p>

              {isPlatformLocked ? (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                  <div className="font-bold flex items-center gap-2">
                    <Lock className="h-4 w-4 text-amber-600" />
                    <span>Plataforma Fixada para este Ciclo: {allowedPlatform.toUpperCase()}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                    Sua plataforma está travada até <strong>{new Date(platformLockedUntil).toLocaleDateString('pt-BR')}</strong>. Você poderá trocar de plataforma na renovação do próximo ciclo.
                  </p>
                  <div className="pt-1">
                    <a
                      href={checkouts.pro.monthly}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400 hover:underline text-xs"
                    >
                      <span>Fazer upgrade para o Plano Pro para usar todas as 3 plataformas</span>
                      <ArrowRight className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Selecione a plataforma desejada para o ciclo atual:
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <select
                      value={allowedPlatform}
                      onChange={(e) => setAllowedPlatform(e.target.value)}
                      className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="mercadolivre">🟡 Mercado Livre (Recomendado)</option>
                      <option value="shopee">🟠 Shopee</option>
                      <option value="amazon">🔷 Amazon</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleLockPlatform}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      <span>Confirmar e Bloquear por 30 Dias</span>
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400 block">
                    Ao confirmar, a plataforma escolhida ficará ativa na extensão e travada até a virada do ciclo.
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <span>
                Seu plano atual tem acesso total e simultâneo a todas as 3 plataformas: <strong>Mercado Livre</strong>, <strong>Shopee</strong> e <strong>Amazon</strong> sem restrições.
              </span>
            </div>
          )}
        </div>

        {/* SEÇÃO 3: GRUPOS DO WHATSAPP CADASTRADOS & LIMITE */}
        <div className="rounded-[28px] border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#121724] p-6 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Grupos de WhatsApp Cadastrados
              </h2>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {whatsappGroups.length} de {isSuperAdmin ? 'Ilimitados' : maxGroupsAllowed} cadastrado(s)
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cadastre os grupos do seu WhatsApp para os quais a extensão enviará as ofertas, respeitando o limite do seu plano ({isSuperAdmin ? 'Ilimitado' : `${maxGroupsAllowed} grupo(s)`}).
          </p>

          {/* Opção 1: Selecionar dentre os grupos puxados do WhatsApp Web */}
          {detectedWhatsAppGroups.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 space-y-2">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Cadastrar a partir dos grupos do WhatsApp Web ({detectedWhatsAppGroups.length} detectados):
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <select
                  value={selectedDetectedGroup}
                  onChange={(e) => setSelectedDetectedGroup(e.target.value)}
                  disabled={whatsappGroups.length >= maxGroupsAllowed}
                  className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Selecione um grupo da lista...</option>
                  {detectedWhatsAppGroups
                    .filter((g) => !whatsappGroups.includes(g))
                    .map((g, i) => (
                      <option key={i} value={g}>
                        💬 {g}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddDetectedGroup}
                  disabled={whatsappGroups.length >= maxGroupsAllowed || !selectedDetectedGroup}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Cadastrar Selecionado</span>
                </button>
              </div>
            </div>
          )}

          {/* Opção 2: Adicionar Manualmente */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
              {detectedWhatsAppGroups.length > 0 ? 'Ou adicione digitando o nome exato do grupo:' : 'Digite o nome exato do grupo do WhatsApp:'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                disabled={whatsappGroups.length >= maxGroupsAllowed}
                placeholder=""
                className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={handleAddGroup}
                disabled={whatsappGroups.length >= maxGroupsAllowed || !newGroupName.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Adicionar</span>
              </button>
            </div>
          </div>

          {whatsappGroups.length >= maxGroupsAllowed && !isSuperAdmin && (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
              <span>
                Limite de <strong>{maxGroupsAllowed} grupo(s)</strong> atingido para o seu plano atual.
              </span>
              <a
                href={checkouts.pro.monthly}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline text-blue-600 dark:text-blue-400"
              >
                Fazer Upgrade →
              </a>
            </div>
          )}

          {/* Lista de Grupos */}
          <div className="space-y-2 pt-1">
            {whatsappGroups.length === 0 ? (
              <div className="text-xs text-slate-400 italic py-2">
                Nenhum grupo cadastrado ainda. Selecione ou digite o nome do grupo acima e clique em Adicionar.
              </div>
            ) : (
              whatsappGroups.map((group, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs"
                >
                  <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                    <span className="text-slate-400 font-mono text-[11px]">{idx + 1}.</span>
                    <span>{group}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveGroup(group)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                    title="Remover grupo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SEÇÃO 4: TAGS DE AFILIADO */}
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
                placeholder=""
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
                placeholder=""
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
                placeholder=""
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Link curto ou ID de afiliado</span>
            </div>
          </div>
        </div>

        {/* SEÇÃO 5: CHAVE DE INTELIGÊNCIA ARTIFICIAL (GROQ) */}
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
              <span>Gerar Chave Gratuita no Groq</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Chave da API Groq
            </label>
            <input
              type="password"
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              placeholder=""
              autoComplete="new-password"
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 px-3.5 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Cadastre sua chave própria do Groq para alimentar a IA CopyStudio e o consultor de negócios.
            </span>
          </div>
        </div>

        {/* Botão de Salvar Global */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-7 py-2.5 text-xs font-bold shadow-xs hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Salvando na nuvem...' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </form>

      {/* SEÇÃO 6: PLANO & ASSINATURA CAKTO */}
      <div className="rounded-[28px] border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#121724] p-6 shadow-xs space-y-4 transition-colors">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Meu Plano & Assinatura</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[22px] border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Plano Atual</span>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-1 uppercase">
              {isSuperAdmin ? 'Super Admin' : (profile?.plan === 'free_trial' ? 'Starter (3 Dias Grátis)' : (profile?.plan || 'Starter'))}
            </div>
            <span className="text-[11px] text-slate-400">
              {isSuperAdmin ? 'Acesso Vitalício' : (profile?.plan === 'free_trial' ? 'Período de Teste' : (profile?.plan_period === 'yearly' ? 'Cobrança Anual' : 'Cobrança Mensal'))}
            </span>
          </div>

          <div className="rounded-[22px] border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Status do Acesso</span>
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {profile?.plan_status === 'active' ? 'Ativo' : 'Pendente'}
            </div>
            <span className="text-[11px] text-slate-400">
              {isSuperAdmin ? 'Perpétuo' : (profile?.plan === 'free_trial' ? '3 Dias de Teste Grátis' : (profile?.plan_expires_at ? `Expira em: ${new Date(profile.plan_expires_at).toLocaleDateString('pt-BR')}` : 'Ativo'))}
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
