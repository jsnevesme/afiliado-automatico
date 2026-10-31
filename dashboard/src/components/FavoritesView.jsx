import React, { useState } from 'react'
import {
  BookmarkCheck,
  FolderPlus,
  Folder,
  FolderOpen,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  ShoppingBag,
  DollarSign,
  ArrowRight,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  FolderTree
} from 'lucide-react'
import { supabase } from '../supabase'

export default function FavoritesView({
  favorites = [],
  folders = [],
  onUpdateFavorites,
  onUpdateFolders,
  onLaunchSaleWithProduct,
  user
}) {
  const [selectedFolderId, setSelectedFolderId] = useState('all') // 'all' | 'unorganized' | folderId
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [copiedId, setCopiedId] = useState(null)

  // Modais de Criação de Pasta e Produto
  const [folderModalOpen, setFolderModalOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderColor, setNewFolderColor] = useState('blue')

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [newProdTitle, setNewProdTitle] = useState('')
  const [newProdUrl, setNewProdUrl] = useState('')
  const [newProdPrice, setNewProdPrice] = useState('')
  const [newProdImage, setNewProdImage] = useState('')
  const [newProdPlatform, setNewProdPlatform] = useState('mercadolivre')
  const [newProdFolderId, setNewProdFolderId] = useState('')
  const [saving, setSaving] = useState(false)

  const folderColors = [
    { id: 'blue', label: 'Azul', bg: 'bg-blue-500', text: 'text-blue-500', pill: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
    { id: 'purple', label: 'Roxo', bg: 'bg-purple-500', text: 'text-purple-500', pill: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
    { id: 'emerald', label: 'Verde', bg: 'bg-emerald-500', text: 'text-emerald-500', pill: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
    { id: 'amber', label: 'Âmbar', bg: 'bg-amber-500', text: 'text-amber-500', pill: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
    { id: 'rose', label: 'Rosa', bg: 'bg-rose-500', text: 'text-rose-500', pill: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' }
  ]

  const handleCopy = (text, id) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // 1. Criar nova pasta
  const handleCreateFolder = async (e) => {
    e.preventDefault()
    if (!newFolderName.trim()) return

    const newFolder = {
      id: 'fld_' + Date.now(),
      name: newFolderName.trim(),
      color: newFolderColor,
      createdAt: new Date().toISOString()
    }

    const updatedFolders = [...folders, newFolder]
    onUpdateFolders(updatedFolders)
    setNewFolderName('')
    setFolderModalOpen(false)
  }

  // 2. Excluir pasta
  const handleDeleteFolder = async (folderId, e) => {
    e.stopPropagation()
    if (!confirm('Deseja realmente excluir esta pasta? Os produtos não serão apagados, apenas desvinculados.')) return

    const updatedFolders = folders.filter(f => f.id !== folderId)
    const updatedFavorites = favorites.map(fav => fav.folder_id === folderId ? { ...fav, folder_id: null } : fav)

    onUpdateFolders(updatedFolders)
    onUpdateFavorites(updatedFavorites)
    if (selectedFolderId === folderId) setSelectedFolderId('all')
  }

  // 3. Mover produto para outra pasta
  const handleMoveProductFolder = async (prodId, targetFolderId) => {
    const updatedFavorites = favorites.map(fav => {
      if (fav.id === prodId || fav.url === prodId) {
        return { ...fav, folder_id: targetFolderId || null }
      }
      return fav
    })

    onUpdateFavorites(updatedFavorites)
  }

  // 4. Remover produto dos favoritos
  const handleRemoveFavorite = async (prodId) => {
    if (!confirm('Remover este produto dos favoritos?')) return
    const updatedFavorites = favorites.filter(fav => fav.id !== prodId && fav.url !== prodId)
    onUpdateFavorites(updatedFavorites)
  }

  // 5. Adicionar produto manualmente aos favoritos
  const handleAddManualProduct = async (e) => {
    e.preventDefault()
    if (!newProdTitle.trim() || !newProdUrl.trim()) return

    setSaving(true)
    const numPrice = parseFloat(String(newProdPrice).replace(',', '.')) || 0

    const newProd = {
      id: 'fav_' + Date.now(),
      title: newProdTitle.trim(),
      url: newProdUrl.trim(),
      affiliate_link: newProdUrl.trim(),
      price: numPrice ? `R$ ${numPrice.toFixed(2).replace('.', ',')}` : '',
      rawPrice: numPrice,
      platform: newProdPlatform,
      image: newProdImage.trim(),
      imageUrl: newProdImage.trim(),
      folder_id: newProdFolderId || null,
      savedAt: Date.now()
    }

    const updatedFavorites = [newProd, ...favorites]
    onUpdateFavorites(updatedFavorites)

    setNewProdTitle('')
    setNewProdUrl('')
    setNewProdPrice('')
    setNewProdImage('')
    setNewProdFolderId('')
    setAddModalOpen(false)
    setSaving(false)
  }

  const getPlatform = (item) => {
    if (item.platform) return item.platform.toLowerCase()
    const url = (item.url || item.affiliate_link || '').toLowerCase()
    if (url.includes('mercadolivre') || url.includes('mlstatic') || url.includes('produto.mercadolivre')) return 'mercadolivre'
    if (url.includes('amazon')) return 'amazon'
    if (url.includes('shopee')) return 'shopee'
    return 'mercadolivre'
  }

  // Filtragem
  const filteredFavorites = favorites.filter((item) => {
    const plat = getPlatform(item)
    const matchesSearch =
      (item.title || item.product_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      plat.includes(searchTerm.toLowerCase())

    const matchesPlatform =
      selectedPlatform === 'all' || plat === selectedPlatform.toLowerCase()

    let matchesFolder = true
    if (selectedFolderId === 'unorganized') {
      matchesFolder = !item.folder_id
    } else if (selectedFolderId !== 'all') {
      matchesFolder = item.folder_id === selectedFolderId
    }

    return matchesSearch && matchesPlatform && matchesFolder
  })

  const getFolderById = (id) => folders.find(f => f.id === id)

  const platformBadge = (plat) => {
    switch ((plat || '').toLowerCase()) {
      case 'amazon':
        return <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">Amazon</span>
      case 'shopee':
        return <span className="inline-flex items-center rounded-full bg-orange-50 dark:bg-orange-950/60 px-2.5 py-0.5 text-[10px] font-bold text-orange-700 dark:text-orange-300">Shopee</span>
      default:
        return <span className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">Mercado Livre</span>
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header com Botões de Ação */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Favoritos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Organize os melhores produtos garimpados na extensão em pastas personalizadas com sincronização em nuvem.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setFolderModalOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs transition-all"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            <span>+ Nova Pasta</span>
          </button>

          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 shadow-xs transition-all"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Adicionar Produto</span>
          </button>
        </div>
      </div>

      {/* Barra de Pastas em Pílula (Estilo SETO / Healthy) */}
      <div className="rounded-[26px] bg-white dark:bg-[#121724] border border-slate-200/70 dark:border-slate-800 p-3 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {/* Todas as Pastas */}
          <button
            onClick={() => setSelectedFolderId('all')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
              selectedFolderId === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FolderOpen className="h-3.5 w-3.5" />
            <span>Todas as Pastas</span>
            <span className="rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-0.2 text-[10px]">
              {favorites.length}
            </span>
          </button>

          {/* Pastas Criadas pelo Usuário */}
          {folders.map((fld) => {
            const count = favorites.filter(fav => fav.folder_id === fld.id).length
            const isSelected = selectedFolderId === fld.id
            const col = folderColors.find(c => c.id === fld.color) || folderColors[0]

            return (
              <div
                key={fld.id}
                onClick={() => setSelectedFolderId(fld.id)}
                className={`group flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${col.bg}`} />
                <span>{fld.name}</span>
                <span className={`rounded-full px-2 py-0.2 text-[10px] ${
                  isSelected
                    ? 'bg-white/20 text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {count}
                </span>

                <button
                  onClick={(e) => handleDeleteFolder(fld.id, e)}
                  title="Excluir pasta"
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-500 transition-opacity ml-1"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )
          })}

          {/* Sem Pasta (Desorganizados) */}
          {favorites.some(fav => !fav.folder_id) && (
            <button
              onClick={() => setSelectedFolderId('unorganized')}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                selectedFolderId === 'unorganized'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>Sem Pasta</span>
              <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.2 text-[10px]">
                {favorites.filter(fav => !fav.folder_id).length}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por produto ou loja..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 pl-9 pr-4 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-4 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none shadow-2xs"
          >
            <option value="all">Todas as Lojas</option>
            <option value="mercadolivre">Mercado Livre</option>
            <option value="amazon">Amazon</option>
            <option value="shopee">Shopee</option>
          </select>
        </div>
      </div>

      {/* Grid de Produtos Favoritos */}
      {filteredFavorites.length === 0 ? (
        <div className="rounded-[28px] border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#121724] p-16 text-center shadow-xs">
          <BookmarkCheck className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Nenhum produto favorito nesta visualização
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-5">
            Favorite produtos na extensão do navegador pelo botão ⭐ ou clique em "Adicionar Produto" para cadastrar links manualmente em suas pastas.
          </p>
          <button
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2 text-xs font-bold shadow-xs hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Adicionar Primeiro Produto</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredFavorites.map((item) => {
            const currentFolder = getFolderById(item.folder_id)
            const prodImg = item.imageUrl || item.image || item.product_image || ''
            const prodPrice = item.price || (item.rawPrice ? `R$ ${item.rawPrice.toFixed(2).replace('.', ',')}` : '')

            return (
              <div
                key={item.id || item.url}
                className="group rounded-[26px] bg-white dark:bg-[#121724] border border-slate-200/70 dark:border-slate-800 p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Foto do Produto */}
                  <div className="relative h-44 w-full rounded-2xl bg-slate-50 dark:bg-slate-900/60 p-2 flex items-center justify-center overflow-hidden mb-3 border border-slate-100 dark:border-slate-800">
                    {prodImg ? (
                      <img
                        src={prodImg}
                        alt={item.title || item.product_title}
                        className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <ShoppingBag className="h-10 w-10 text-slate-300 dark:text-slate-700" />
                    )}

                    {/* Badge da Loja */}
                    <div className="absolute top-2.5 left-2.5">
                      {platformBadge(getPlatform(item))}
                    </div>

                    {/* Botão de Excluir */}
                    <button
                      onClick={() => handleRemoveFavorite(item.id || item.url)}
                      title="Remover dos favoritos"
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-xs"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Informações */}
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-relaxed mb-1.5" title={item.title || item.product_title}>
                    {item.title || item.product_title || 'Oferta sem título'}
                  </h3>

                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                        {prodPrice || 'Ver na loja'}
                      </span>
                      {/* Badge de comissão oficial/estimada */}
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                        💰 Comiss: {item.commissionPercent || (item.commissionRate ? `${item.commissionRate}%` : (getPlatform(item) === 'amazon' ? '8%' : (getPlatform(item) === 'shopee' ? '9%' : '11%')))}
                        {item.commissionPrice && ` (${item.commissionPrice})`}
                      </span>
                    </div>

                    {item.discount && (
                      <span className="rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 px-2 py-0.5 text-[10px] font-bold self-start">
                        {item.discount}
                      </span>
                    )}
                  </div>

                  {/* Seletor de Pasta */}
                  <div className="mb-3">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Pasta:
                    </label>
                    <select
                      value={item.folder_id || ''}
                      onChange={(e) => handleMoveProductFolder(item.id || item.url, e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="">Sem Pasta (Geral)</option>
                      {folders.map(fld => (
                        <option key={fld.id} value={fld.id}>
                          📁 {fld.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Ações Inferiores */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => handleCopy(item.affiliate_link || item.url, item.id || item.url)}
                    title="Copiar link"
                    className="p-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    {copiedId === (item.id || item.url) ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>

                  <a
                    href={item.affiliate_link || item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Abrir página oficial"
                    className="p-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  {/* Lançar Venda Direto */}
                  <button
                    onClick={() => onLaunchSaleWithProduct && onLaunchSaleWithProduct(item)}
                    className="flex-1 flex items-center justify-center gap-1 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-1.5 px-3 text-[11px] font-bold hover:opacity-90 transition-all shadow-xs"
                  >
                    <span>Lançar Venda</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* =========================================================================
          MODAL DE CRIAR NOVA PASTA
          ========================================================================= */}
      {folderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-[28px] bg-white dark:bg-[#121724] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <FolderPlus className="h-5 w-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Criar Nova Pasta</h2>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nome da Pasta
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Tecnologia, Casa & Cozinha, Ofertas Relâmpago..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Cor da Tag
                </label>
                <div className="flex items-center gap-2">
                  {folderColors.map((col) => (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setNewFolderColor(col.id)}
                      className={`h-7 w-7 rounded-full ${col.bg} flex items-center justify-center transition-transform ${
                        newFolderColor === col.id ? 'scale-125 ring-2 ring-slate-900 dark:ring-white' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {newFolderColor === col.id && <Check className="h-3.5 w-3.5 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setFolderModalOpen(false)}
                  className="rounded-full px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2 text-xs font-bold shadow-xs hover:opacity-90"
                >
                  Criar Pasta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DE ADICIONAR PRODUTO MANUALMENTE
          ========================================================================= */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-[28px] bg-white dark:bg-[#121724] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="h-5 w-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Adicionar Produto aos Favoritos</h2>
            </div>

            <form onSubmit={handleAddManualProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Título do Produto
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fone Bluetooth Sem Fio QCY T13"
                  value={newProdTitle}
                  onChange={(e) => setNewProdTitle(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Plataforma
                  </label>
                  <select
                    value={newProdPlatform}
                    onChange={(e) => setNewProdPlatform(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="mercadolivre">Mercado Livre</option>
                    <option value="amazon">Amazon</option>
                    <option value="shopee">Shopee</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Preço (R$)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 89.90"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Link de Afiliado ou URL do Produto
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://meli.la/... ou https://amzn.to/..."
                  value={newProdUrl}
                  onChange={(e) => setNewProdUrl(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  URL da Foto do Produto (Opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://http2.mlstatic.com/..."
                  value={newProdImage}
                  onChange={(e) => setNewProdImage(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Salvar na Pasta:
                </label>
                <select
                  value={newProdFolderId}
                  onChange={(e) => setNewProdFolderId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="">Sem Pasta (Geral)</option>
                  {folders.map(fld => (
                    <option key={fld.id} value={fld.id}>
                      📁 {fld.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="rounded-full px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2 text-xs font-bold shadow-xs hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar nos Favoritos'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
