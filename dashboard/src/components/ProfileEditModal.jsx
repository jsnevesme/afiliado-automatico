import React, { useState, useRef } from 'react'
import {
  X,
  Upload,
  User,
  Check,
  AlertCircle,
  Camera,
  Sparkles,
  ShieldCheck
} from 'lucide-react'

// Avatares modernos pré-definidos divididos por categoria
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

export default function ProfileEditModal({
  isOpen,
  onClose,
  user,
  profile,
  onSaveProfile
}) {
  const [fullName, setFullName] = useState(
    profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || ''
  )
  const [avatarUrl, setAvatarUrl] = useState(
    profile?.avatar_url || user?.user_metadata?.avatar_url || ''
  )
  const [avatarCategory, setAvatarCategory] = useState('people')
  const [saving, setSaving] = useState(false)
  const [statusMsg, setStatusMsg] = useState(null)
  const fileInputRef = useRef(null)

  if (!isOpen) return null

  // Upload local de imagem direto do computador do usuário
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limite de 5MB
    if (file.size > 5 * 1024 * 1024) {
      setStatusMsg({ type: 'error', text: 'A imagem deve ter no máximo 5MB.' })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setAvatarUrl(event.target.result)
      setStatusMsg({ type: 'success', text: 'Foto carregada! Clique em Salvar para confirmar.' })
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!fullName.trim()) {
      setStatusMsg({ type: 'error', text: 'Por favor, informe seu nome.' })
      return
    }

    setSaving(true)
    setStatusMsg(null)

    try {
      await onSaveProfile({
        full_name: fullName.trim(),
        avatar_url: avatarUrl
      })

      setStatusMsg({ type: 'success', text: 'Perfil atualizado com sucesso!' })
      setTimeout(() => {
        onClose()
      }, 900)
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Erro ao salvar perfil: ' + err.message })
    } finally {
      setSaving(false)
    }
  }

  const initialLetter = (fullName || user?.email || 'A').charAt(0).toUpperCase()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-6 shadow-2xl transition-all">
        {/* Fechar Modal */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Topo */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Editar Meu Perfil
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Personalize seu nome de exibição e foto no painel do Afiliado Automático.
          </p>
        </div>

        {statusMsg && (
          <div className={`mb-4 flex items-center gap-2 rounded-xl p-3 text-xs font-semibold ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}>
            {statusMsg.type === 'success' ? <Check className="h-4 w-4 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Foto de Perfil */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div className="relative group">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName || 'Avatar'}
                  className="h-20 w-20 rounded-full object-cover ring-2 ring-blue-500/30 shadow-xs"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl font-black shadow-xs ring-2 ring-blue-500/20">
                  {initialLetter}
                </div>
              )}

              {/* Botão overlay para upload rápido */}
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
                  Envie uma imagem do seu computador ou escolha uma pré-definida.
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
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Subir do PC</span>
                </button>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-red-500 transition-colors px-2 py-1"
                  >
                    <span>Remover</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Galeria de Avatares Rápidos */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Ou escolha um modelo pronto:
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
                  className={`h-10 w-10 flex-shrink-0 rounded-full overflow-hidden border-2 transition-all ${
                    avatarUrl === preset
                      ? 'border-blue-600 ring-2 ring-blue-500/30 scale-105'
                      : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600 hover:scale-105'
                  }`}
                >
                  <img src={preset} alt={`Avatar preset ${idx}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Campos de Texto */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nome Completo / Como quer ser chamado
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Jonathan Neves"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                E-mail da Conta (Sincronizado)
              </label>
              <input
                type="text"
                disabled
                value={user?.email || ''}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/60 px-3.5 py-2 text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Ações Inferiores */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving || !fullName.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-xs disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Salvar Perfil</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
