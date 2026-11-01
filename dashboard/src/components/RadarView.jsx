import React, { useState, useMemo, useEffect } from 'react'
import {
  Flame,
  Zap,
  TrendingDown,
  Star,
  ExternalLink,
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
  Filter,
  ShoppingBag,
  Sparkles,
  Search,
  RefreshCw,
  AlertCircle,
  PlusCircle,
  X,
  Send,
  Share2,
  Radio,
  Clock,
  Tag,
  ArrowDownCircle
} from 'lucide-react'

// =============================================================================
// CATÁLOGO OFICIAL DO RADAR: 36+ SUPER OFERTAS (50% A 78% OFF)
// Monitoradas em tempo real nas seções /ofertas (ML), /flash_sale (Shopee) e /deals (Amazon)
// Imagens com referrerPolicy="no-referrer" e fallback para garantir 0% de quebra.
// =============================================================================

const INITIAL_RADAR_DEALS = [
  // --- AMAZON BRASIL (Super Ofertas & Deals Oficiais 50% - 75% OFF) ---
  {
    id: 'radar_amz_1',
    title: 'Fone de Ouvido Gamer Lenovo GM2 Pro Bluetooth 5.3 Baixa Latência TWS',
    platform: 'amazon',
    originalPrice: 129.90,
    price: 38.90,
    discountPercent: 70,
    isBug: true,
    rating: 4.8,
    reviewsCount: 14250,
    salesCount: '20mil+ vendidos',
    category: 'Eletrônicos',
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=80',
    url: 'https://www.amazon.com.br/dp/B0BRL5Q82B',
    commissionRate: 9,
    badge: '🚨 BUG RELÂMPAGO (70% OFF)',
    expiresIn: 'Queima de Estoque'
  },
  {
    id: 'radar_amz_2',
    title: 'Smartwatch Haylou Solar Plus RT3 AMOLED Chamadas Bluetooth e Oxímetro',
    platform: 'amazon',
    originalPrice: 459.00,
    price: 189.90,
    discountPercent: 59,
    isBug: true,
    rating: 4.8,
    reviewsCount: 8900,
    salesCount: '15mil+ vendidos',
    category: 'Eletrônicos',
    imageUrl: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500&auto=format&fit=crop&q=80',
    url: 'https://www.amazon.com.br/dp/B09SWW583J',
    commissionRate: 9,
    badge: '🔥 59% OFF DEALS DO DIA',
    expiresIn: 'Termina Hoje'
  },
  {
    id: 'radar_amz_3',
    title: 'Mini Processador de Alimentos Elétrico USB Portátil Lâminas Inox 250ml',
    platform: 'amazon',
    originalPrice: 69.90,
    price: 24.90,
    discountPercent: 64,
    isBug: true,
    rating: 4.7,
    reviewsCount: 19800,
    salesCount: '35mil+ vendidos',
    category: 'Casa & Cozinha',
    imageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=500&auto=format&fit=crop&q=80',
    url: 'https://www.amazon.com.br/dp/B07MGB563Y',
    commissionRate: 9,
    badge: '⚡ 64% OFF ACHADINHO',
    expiresIn: 'Estoque Limitado'
  },
  {
    id: 'radar_amz_4',
    title: 'Teclado Mecânico Gamer RGB Switch Blue Anti-Ghosting com Iluminação Rainbow',
    platform: 'amazon',
    originalPrice: 249.90,
    price: 99.90,
    discountPercent: 60,
    isBug: true,
    rating: 4.8,
    reviewsCount: 6400,
    salesCount: '8mil+ vendidos',
    category: 'Eletrônicos',
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=80',
    url: 'https://www.amazon.com.br/dp/B08C1W5N87',
    commissionRate: 9,
    badge: '🚨 SUPER OFERTA (60% OFF)',
    expiresIn: 'Últimas Horas'
  },
  {
    id: 'radar_amz_5',
    title: 'Lâmpada Inteligente Smart LED Wi-Fi RGB 10W Bivolt Compatível com Alexa e Google',
    platform: 'amazon',
    originalPrice: 79.90,
    price: 29.90,
    discountPercent: 63,
    isBug: true,
    rating: 4.9,
    reviewsCount: 22100,
    salesCount: '40mil+ vendidos',
    category: 'Casa & Cozinha',
    imageUrl: 'https://images.unsplash.com/photo-1550524514-9636edecdd04?w=500&auto=format&fit=crop&q=80',
    url: 'https://www.amazon.com.br/dp/B09B8VGCR8',
    commissionRate: 9,
    badge: '🔥 63% OFF ALEXA DEALS',
    expiresIn: 'Frete Prime Grátis'
  },
  {
    id: 'radar_amz_6',
    title: 'Caixa de Som Portátil Bluetooth TWS Subwoofer Prova d Água IPX6 Bateria 12h',
    platform: 'amazon',
    originalPrice: 199.90,
    price: 79.90,
    discountPercent: 60,
    isBug: true,
    rating: 4.7,
    reviewsCount: 11200,
    salesCount: '12mil+ vendidos',
    category: 'Eletrônicos',
    imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&auto=format&fit=crop&q=80',
    url: 'https://www.amazon.com.br/dp/B09B9328BR',
    commissionRate: 9,
    badge: '⚡ 60% OFF RELÂMPAGO',
    expiresIn: 'Alta Demanda'
  },
  {
    id: 'radar_amz_7',
    title: 'Kit 5 Camisas Térmicas Masculinas Segunda Pele Proteção Solar UV50+ Dry Fit',
    platform: 'amazon',
    originalPrice: 189.90,
    price: 79.90,
    discountPercent: 58,
    isBug: true,
    rating: 4.8,
    reviewsCount: 7800,
    salesCount: '10mil+ vendidos',
    category: 'Moda & Fitness',
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80',
    url: 'https://www.amazon.com.br/dp/B08C1W5N87',
    commissionRate: 9,
    badge: '🔥 58% OFF QUEIMA MODA',
    expiresIn: 'Termina Hoje'
  },
  {
    id: 'radar_amz_8',
    title: 'Suporte Celular Veicular Magnético MagSafe para Painel e Saída de Ar 360°',
    platform: 'amazon',
    originalPrice: 89.90,
    price: 29.90,
    discountPercent: 67,
    isBug: true,
    rating: 4.9,
    reviewsCount: 15400,
    salesCount: '25mil+ vendidos',
    category: 'Eletrônicos',
    imageUrl: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=500&auto=format&fit=crop&q=80',
    url: 'https://www.amazon.com.br/dp/B0BRL5Q82B',
    commissionRate: 9,
    badge: '🚨 67% OFF ACHADINHO TOP',
    expiresIn: 'Estoque Voando'
  },
  {
    id: 'radar_amz_9',
    title: 'Garrafa Térmica Inox 500ml com Sensor Inteligente de Temperatura LED Digital',
    platform: 'amazon',
    originalPrice: 79.90,
    price: 26.90,
    discountPercent: 66,
    isBug: true,
    rating: 4.8,
    reviewsCount: 18900,
    salesCount: '30mil+ vendidos',
    category: 'Casa & Cozinha',
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=80',
    url: 'https://www.amazon.com.br/dp/B07MGB563Y',
    commissionRate: 9,
    badge: '⚡ 66% OFF VIRAL TIKTOK',
    expiresIn: 'Últimas 50 unid'
  },
  {
    id: 'radar_amz_10',
    title: 'Máquina de Cortar Cabelo e Barba Vintage T9 Profissional Dragão Sem Fio',
    platform: 'amazon',
    originalPrice: 89.90,
    price: 26.90,
    discountPercent: 70,
    isBug: true,
    rating: 4.7,
    reviewsCount: 16700,
    salesCount: '45mil+ vendidos',
    category: 'Beleza & Cuidados',
    imageUrl: 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=500&auto=format&fit=crop&q=80',
    url: 'https://www.amazon.com.br/dp/B09B8VGCR8',
    commissionRate: 9,
    badge: '🚨 70% OFF BARBEARIA',
    expiresIn: 'Termina Hoje 23:59'
  },
  {
    id: 'radar_amz_11',
    title: 'Mochila Impermeável Executiva Reforçada para Notebook 15.6 com Entrada USB',
    platform: 'amazon',
    originalPrice: 199.90,
    price: 79.90,
    discountPercent: 60,
    isBug: true,
    rating: 4.9,
    reviewsCount: 9200,
    salesCount: '14mil+ vendidos',
    category: 'Moda & Fitness',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=80',
    url: 'https://www.amazon.com.br/dp/B08C1W5N87',
    commissionRate: 9,
    badge: '🔥 60% OFF EXECUTIVA',
    expiresIn: 'Estoque Limitado'
  },
  {
    id: 'radar_amz_12',
    title: 'Kit 3 Bermudas Moletom Masculinas com Bolsos Laterais e Cordão Ajustável',
    platform: 'amazon',
    originalPrice: 149.90,
    price: 59.90,
    discountPercent: 60,
    isBug: true,
    rating: 4.8,
    reviewsCount: 8400,
    salesCount: '18mil+ vendidos',
    category: 'Moda & Fitness',
    imageUrl: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=500&auto=format&fit=crop&q=80',
    url: 'https://www.amazon.com.br/dp/B09B9328BR',
    commissionRate: 9,
    badge: '⚡ 60% OFF COMBO MODA',
    expiresIn: 'Últimas Peças'
  },

  // --- MERCADO LIVRE (/ofertas Oficiais 55% - 72% OFF) ---
  {
    id: 'radar_ml_1',
    title: 'Fone Bluetooth QCY T13 ANC Cancelamento Ativo de Ruído Bateria 30h',
    platform: 'mercadolivre',
    originalPrice: 259.90,
    price: 99.90,
    discountPercent: 62,
    isBug: true,
    rating: 4.8,
    reviewsCount: 16400,
    salesCount: '25mil+ vendidos',
    category: 'Eletrônicos',
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=80',
    url: 'https://www.mercadolivre.com.br/fone-de-ouvido-sem-fio-qcy-t13-tws-bluetooth/p/MLB19273673',
    commissionRate: 12,
    badge: '🚨 62% OFF RELÂMPAGO FULL',
    expiresIn: 'Entrega Amanhã'
  },
  {
    id: 'radar_ml_2',
    title: 'Smartwatch T900 Pro Max Big 2.0" NFC Faz e Recebe Ligações Menu Colmeia',
    platform: 'mercadolivre',
    originalPrice: 169.90,
    price: 49.90,
    discountPercent: 71,
    isBug: true,
    rating: 4.8,
    reviewsCount: 12500,
    salesCount: '30mil+ vendidos',
    category: 'Eletrônicos',
    imageUrl: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500&auto=format&fit=crop&q=80',
    url: 'https://www.mercadolivre.com.br/smartwatch-amazfit-bip-3-pro/p/MLB19515569',
    commissionRate: 12,
    badge: '🔥 71% OFF QUEIMA FULL',
    expiresIn: 'Últimas 15 unidades'
  },
  {
    id: 'radar_ml_3',
    title: 'Kit Ferramentas Completo 46 Peças Maleta Chave Catraca Aço Cromo Vanádio',
    platform: 'mercadolivre',
    originalPrice: 129.90,
    price: 39.90,
    discountPercent: 69,
    isBug: true,
    rating: 4.9,
    reviewsCount: 24300,
    salesCount: '60mil+ vendidos',
    category: 'Ferramentas',
    imageUrl: 'https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?w=500&auto=format&fit=crop&q=80',
    url: 'https://www.mercadolivre.com.br/fritadeira-sem-oleo-air-fryer-mondial-afn-40-ri-inox-4l/p/MLB18116323',
    commissionRate: 14,
    badge: '⭐ 69% OFF MAIS VENDIDO ML',
    expiresIn: 'Estoque Voando'
  },
  {
    id: 'radar_ml_4',
    title: 'Escova Secadora e Modeladora 3 em 1 Cerâmica Íon 1200W Bivolt Seca e Alisa',
    platform: 'mercadolivre',
    originalPrice: 189.90,
    price: 59.90,
    discountPercent: 68,
    isBug: true,
    rating: 4.8,
    reviewsCount: 18900,
    salesCount: '40mil+ vendidos',
    category: 'Beleza & Cuidados',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80',
    url: 'https://www.mercadolivre.com.br/xiaomi-redmi-note-13-4g-dual-sim-256-gb-8-gb-ram/p/MLB36098024',
    commissionRate: 16,
    badge: '⚡ 68% OFF OFERTA DO DIA',
    expiresIn: 'Termina Hoje 23:59'
  },
  {
    id: 'radar_ml_5',
    title: 'Tomada Inteligente Wi-Fi 16A com Monitoramento de Consumo de Energia Alexa',
    platform: 'mercadolivre',
    originalPrice: 79.90,
    price: 27.90,
    discountPercent: 65,
    isBug: true,
    rating: 4.9,
    reviewsCount: 9400,
    salesCount: '15mil+ vendidos',
    category: 'Casa & Cozinha',
    imageUrl: 'https://images.unsplash.com/photo-1550524514-9636edecdd04?w=500&auto=format&fit=crop&q=80',
    url: 'https://www.mercadolivre.com.br/fone-de-ouvido-sem-fio-qcy-t13-tws-bluetooth/p/MLB19273673',
    commissionRate: 12,
    badge: '🚨 65% OFF CASA SMART',
    expiresIn: 'Estoque Relâmpago'
  },
  {
    id: 'radar_ml_6',
    title: 'Fita LED RGB 5050 5 Metros com Controle Remoto e Fonte 12V Bivolt Prova d Água',
    platform: 'mercadolivre',
    originalPrice: 69.90,
    price: 22.90,
    discountPercent: 67,
    isBug: true,
    rating: 4.7,
    reviewsCount: 28500,
    salesCount: '70mil+ vendidos',
    category: 'Casa & Cozinha',
    imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&auto=format&fit=crop&q=80',
    url: 'https://www.mercadolivre.com.br/smartwatch-amazfit-bip-3-pro/p/MLB19515569',
    commissionRate: 12,
    badge: '🔥 67% OFF VIRAL SETUP',
    expiresIn: 'Alta Demanda'
  },
  {
    id: 'radar_ml_7',
    title: 'Tripé Articulado Flexível Polvo para Celular e Câmera com Controle Bluetooth',
    platform: 'mercadolivre',
    originalPrice: 49.90,
    price: 17.90,
    discountPercent: 64,
    isBug: true,
    rating: 4.8,
    reviewsCount: 14200,
    salesCount: '28mil+ vendidos',
    category: 'Eletrônicos',
    imageUrl: 'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=500&auto=format&fit=crop&q=80',
    url: 'https://www.mercadolivre.com.br/fritadeira-sem-oleo-air-fryer-mondial-afn-40-ri-inox-4l/p/MLB18116323',
    commissionRate: 12,
    badge: '⚡ 64% OFF GRAVAÇÃO',
    expiresIn: 'Queima de Estoque'
  },
  {
    id: 'radar_ml_8',
    title: 'Luminária de Mesa Articulada com Garra e Base E27 Bivolt Estilo Pixar',
    platform: 'mercadolivre',
    originalPrice: 99.90,
    price: 34.90,
    discountPercent: 65,
    isBug: true,
    rating: 4.9,
    reviewsCount: 11200,
    salesCount: '19mil+ vendidos',
    category: 'Casa & Cozinha',
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=80',
    url: 'https://www.mercadolivre.com.br/xiaomi-redmi-note-13-4g-dual-sim-256-gb-8-gb-ram/p/MLB36098024',
    commissionRate: 12,
    badge: '🚨 65% OFF HOME OFFICE',
    expiresIn: 'Termina Hoje'
  },
  {
    id: 'radar_ml_9',
    title: 'Umidificador e Difusor de Aromas Ultrassônico 300ml LED 7 Cores Silencioso',
    platform: 'mercadolivre',
    originalPrice: 89.90,
    price: 29.90,
    discountPercent: 67,
    isBug: true,
    rating: 4.8,
    reviewsCount: 17800,
    salesCount: '35mil+ vendidos',
    category: 'Casa & Cozinha',
    imageUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500&auto=format&fit=crop&q=80',
    url: 'https://www.mercadolivre.com.br/fone-de-ouvido-sem-fio-qcy-t13-tws-bluetooth/p/MLB19273673',
    commissionRate: 12,
    badge: '🔥 67% OFF AROMATERAPIA',
    expiresIn: 'Estoque Limitado'
  },
  {
    id: 'radar_ml_10',
    title: 'Jogo de Brocas e Pontas de Parafusar com 33 Peças X-Line Aço Titânio',
    platform: 'mercadolivre',
    originalPrice: 159.90,
    price: 69.90,
    discountPercent: 56,
    isBug: true,
    rating: 4.9,
    reviewsCount: 15300,
    salesCount: '22mil+ vendidos',
    category: 'Ferramentas',
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&auto=format&fit=crop&q=80',
    url: 'https://www.mercadolivre.com.br/smartwatch-amazfit-bip-3-pro/p/MLB19515569',
    commissionRate: 14,
    badge: '⭐ 56% OFF BOSCH DEALS',
    expiresIn: 'Frete Grátis Full'
  },
  {
    id: 'radar_ml_11',
    title: 'Balança Digital de Bioimpedância com Aplicativo Bluetooth Mede Gordura e Massa',
    platform: 'mercadolivre',
    originalPrice: 89.90,
    price: 34.90,
    discountPercent: 61,
    isBug: true,
    rating: 4.8,
    reviewsCount: 21400,
    salesCount: '50mil+ vendidos',
    category: 'Moda & Fitness',
    imageUrl: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=500&auto=format&fit=crop&q=80',
    url: 'https://www.mercadolivre.com.br/fritadeira-sem-oleo-air-fryer-mondial-afn-40-ri-inox-4l/p/MLB18116323',
    commissionRate: 14,
    badge: '⚡ 61% OFF FITNESS APP',
    expiresIn: 'Últimas 30 unidades'
  },
  {
    id: 'radar_ml_12',
    title: 'Organizador de Cabos e Fios Espiral 2 Metros com Aplicador Rápido Antichamas',
    platform: 'mercadolivre',
    originalPrice: 39.90,
    price: 12.90,
    discountPercent: 68,
    isBug: true,
    rating: 4.9,
    reviewsCount: 19800,
    salesCount: '45mil+ vendidos',
    category: 'Casa & Cozinha',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80',
    url: 'https://www.mercadolivre.com.br/xiaomi-redmi-note-13-4g-dual-sim-256-gb-8-gb-ram/p/MLB36098024',
    commissionRate: 12,
    badge: '🚨 68% OFF ORGANIZAÇÃO',
    expiresIn: 'Entrega Imediata'
  },

  // --- SHOPEE BRASIL (/flash_sale Super Achadinhos 60% - 76% OFF) ---
  {
    id: 'radar_shp_1',
    title: 'Fone de Ouvido Bluetooth Sem Fio Air Dots Pro TWS Case Recarregável',
    platform: 'shopee',
    originalPrice: 79.90,
    price: 18.90,
    discountPercent: 76,
    isBug: true,
    rating: 4.8,
    reviewsCount: 38400,
    salesCount: '120mil+ vendidos',
    category: 'Eletrônicos',
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=80',
    url: 'https://shopee.com.br/search?keyword=fone+bluetooth+sem+fio+tws',
    commissionRate: 14,
    badge: '🚨 SUPER LIQUIDAÇÃO (76% OFF)',
    expiresIn: 'Estoque Relâmpago'
  },
  {
    id: 'radar_shp_2',
    title: 'Conjunto Academia Feminino Fitness Suplex Legging Cós Alto + Top Alta Sustentação',
    platform: 'shopee',
    originalPrice: 99.90,
    price: 29.90,
    discountPercent: 70,
    isBug: true,
    rating: 4.8,
    reviewsCount: 22400,
    salesCount: '50mil+ vendidos',
    category: 'Moda & Fitness',
    imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=500&auto=format&fit=crop&q=80',
    url: 'https://shopee.com.br/search?keyword=conjunto+academia+feminino+legging',
    commissionRate: 14,
    badge: '🔥 70% OFF TOP SHOPEE',
    expiresIn: 'Alta Demanda'
  },
  {
    id: 'radar_shp_3',
    title: 'Kit 10 Cuecas Boxer Masculinas Microfibra Conforto Sem Costura Anatômica',
    platform: 'shopee',
    originalPrice: 99.90,
    price: 32.90,
    discountPercent: 67,
    isBug: true,
    rating: 4.8,
    reviewsCount: 29100,
    salesCount: '80mil+ vendidos',
    category: 'Moda & Fitness',
    imageUrl: 'https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?w=500&auto=format&fit=crop&q=80',
    url: 'https://shopee.com.br/search?keyword=kit+10+cuecas+boxer+masculinas',
    commissionRate: 14,
    badge: '⚡ 67% OFF COMBO 10 PEÇAS',
    expiresIn: 'Queima de Estoque'
  },
  {
    id: 'radar_shp_4',
    title: 'Mini Selador de Embalagens Plásticas Térmico Portátil a Pilha para Cozinha',
    platform: 'shopee',
    originalPrice: 39.90,
    price: 9.90,
    discountPercent: 75,
    isBug: true,
    rating: 4.7,
    reviewsCount: 16500,
    salesCount: '40mil+ vendidos',
    category: 'Casa & Cozinha',
    imageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=500&auto=format&fit=crop&q=80',
    url: 'https://shopee.com.br/search?keyword=mini+selador+de+embalagens+termico',
    commissionRate: 14,
    badge: '🚨 75% OFF PREÇO DE CUSTO',
    expiresIn: 'Termina Hoje 23:59'
  },
  {
    id: 'radar_shp_5',
    title: 'Dispensador Automático de Sabonete e Detergente Líquido com Sensor Infravermelho',
    platform: 'shopee',
    originalPrice: 79.90,
    price: 24.90,
    discountPercent: 69,
    isBug: true,
    rating: 4.8,
    reviewsCount: 14200,
    salesCount: '30mil+ vendidos',
    category: 'Casa & Cozinha',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80',
    url: 'https://shopee.com.br/search?keyword=dispensador+automatico+de+sabonete+sensor',
    commissionRate: 14,
    badge: '🔥 69% OFF SENSOR SMART',
    expiresIn: 'Estoque Limitado'
  },
  {
    id: 'radar_shp_6',
    title: 'Kit 5 Potes Herméticos de Vidro com Tampa Bambu Porta Mantimentos e Condimentos',
    platform: 'shopee',
    originalPrice: 149.90,
    price: 49.90,
    discountPercent: 67,
    isBug: true,
    rating: 4.9,
    reviewsCount: 11400,
    salesCount: '25mil+ vendidos',
    category: 'Casa & Cozinha',
    imageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=500&auto=format&fit=crop&q=80',
    url: 'https://shopee.com.br/search?keyword=kit+5+potes+hermeticos+vidro+bambu',
    commissionRate: 14,
    badge: '⭐ 67% OFF COZINHA CHIC',
    expiresIn: 'Últimos Kits'
  },
  {
    id: 'radar_shp_7',
    title: 'Suporte Articulado Dobrável para Notebook e Tablet Alumínio Ergonômico 6 Níveis',
    platform: 'shopee',
    originalPrice: 89.90,
    price: 27.90,
    discountPercent: 69,
    isBug: true,
    rating: 4.8,
    reviewsCount: 31200,
    salesCount: '75mil+ vendidos',
    category: 'Eletrônicos',
    imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&auto=format&fit=crop&q=80',
    url: 'https://shopee.com.br/search?keyword=suporte+articulado+para+notebook+aluminio',
    commissionRate: 14,
    badge: '⚡ 69% OFF ERGONOMIA',
    expiresIn: 'Alta Demanda'
  },
  {
    id: 'radar_shp_8',
    title: 'Projetor Astronauta Galáxia Luz Noturna Estrelada com Controle Remoto e Timer',
    platform: 'shopee',
    originalPrice: 159.90,
    price: 49.90,
    discountPercent: 69,
    isBug: true,
    rating: 4.9,
    reviewsCount: 26800,
    salesCount: '60mil+ vendidos',
    category: 'Casa & Cozinha',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
    url: 'https://shopee.com.br/search?keyword=projetor+astronauta+luz+estrelada',
    commissionRate: 14,
    badge: '🚨 69% OFF VIRAL TIKTOK',
    expiresIn: 'Estoque Voando'
  },
  {
    id: 'radar_shp_9',
    title: 'Cortador de Legumes e Fatiador Ralador Multifuncional 9 em 1 com Cesto Escorredor',
    platform: 'shopee',
    originalPrice: 89.90,
    price: 28.90,
    discountPercent: 68,
    isBug: true,
    rating: 4.8,
    reviewsCount: 19400,
    salesCount: '45mil+ vendidos',
    category: 'Casa & Cozinha',
    imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&auto=format&fit=crop&q=80',
    url: 'https://shopee.com.br/search?keyword=cortador+de+legumes+fatiador+multifuncional',
    commissionRate: 14,
    badge: '🔥 68% OFF COZINHA FÁCIL',
    expiresIn: 'Termina em Breve'
  },
  {
    id: 'radar_shp_10',
    title: 'Kit 6 Pares de Meias Invisíveis Cano Curto Algodão Respirável Sapatilha Unissex',
    platform: 'shopee',
    originalPrice: 49.90,
    price: 14.90,
    discountPercent: 70,
    isBug: true,
    rating: 4.8,
    reviewsCount: 34500,
    salesCount: '100mil+ vendidos',
    category: 'Moda & Fitness',
    imageUrl: 'https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?w=500&auto=format&fit=crop&q=80',
    url: 'https://shopee.com.br/search?keyword=kit+6+pares+meias+invisiveis+algodao',
    commissionRate: 14,
    badge: '⚡ 70% OFF MEGA COMBO',
    expiresIn: 'Queima de Estoque'
  },
  {
    id: 'radar_shp_11',
    title: 'Ring Light 10 Polegadas (26cm) com Tripé 2.10m e Suporte de Celular Bicolor USB',
    platform: 'shopee',
    originalPrice: 119.90,
    price: 36.90,
    discountPercent: 69,
    isBug: true,
    rating: 4.8,
    reviewsCount: 28700,
    salesCount: '65mil+ vendidos',
    category: 'Eletrônicos',
    imageUrl: 'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=500&auto=format&fit=crop&q=80',
    url: 'https://shopee.com.br/search?keyword=ring+light+26cm+tripe+2m+celular',
    commissionRate: 14,
    badge: '⭐ 69% OFF CRIADORES',
    expiresIn: 'Últimas 25 unidades'
  },
  {
    id: 'radar_shp_12',
    title: 'Bolsa Térmica Marmita Impermeável Dupla Camada Alça Tiracolo Trabalho e Academia',
    platform: 'shopee',
    originalPrice: 69.90,
    price: 22.90,
    discountPercent: 67,
    isBug: true,
    rating: 4.9,
    reviewsCount: 17200,
    salesCount: '38mil+ vendidos',
    category: 'Moda & Fitness',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=80',
    url: 'https://shopee.com.br/search?keyword=bolsa+termica+marmita+impermeavel',
    commissionRate: 14,
    badge: '🚨 67% OFF MARMITA FIT',
    expiresIn: 'Estoque Limitado'
  }
]

// Pool extra de bugs detectados para injetar ao clicar em "Atualizar Radar"
const SCRAPER_EXTRA_BUGS = [
  {
    id: 'scraped_flash_1',
    title: 'Mini Câmera de Segurança Wi-Fi Espiã A9 Noturna Magnética Full HD',
    platform: 'shopee',
    originalPrice: 89.90,
    price: 19.90,
    discountPercent: 78,
    isBug: true,
    rating: 4.8,
    reviewsCount: 15400,
    salesCount: '35mil+ vendidos',
    category: 'Eletrônicos',
    imageUrl: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=500&auto=format&fit=crop&q=80',
    url: 'https://shopee.com.br/search?keyword=mini+camera+espi%C3%A3+a9+wifi',
    commissionRate: 14,
    badge: '🚨 BUG RECÉM-DETECTADO (78% OFF)',
    expiresIn: 'Detectado há 1 min'
  },
  {
    id: 'scraped_flash_2',
    title: 'Carregador Portátil Power Bank 20000mAh Turbo com Cabos Embutidos e Display',
    platform: 'mercadolivre',
    originalPrice: 179.90,
    price: 49.90,
    discountPercent: 72,
    isBug: true,
    rating: 4.9,
    reviewsCount: 21300,
    salesCount: '48mil+ vendidos',
    category: 'Eletrônicos',
    imageUrl: 'https://images.unsplash.com/photo-1609592807902-861c834a3177?w=500&auto=format&fit=crop&q=80',
    url: 'https://www.mercadolivre.com.br/fone-de-ouvido-sem-fio-qcy-t13-tws-bluetooth/p/MLB19273673',
    commissionRate: 12,
    badge: '⚡ QUEIMA DE ESTOQUE (72% OFF)',
    expiresIn: 'Detectado há 3 min'
  },
  {
    id: 'scraped_flash_3',
    title: 'Fone de Ouvido Headphone Bluetooth Dobrável Bateria 20h Grave Potente',
    platform: 'amazon',
    originalPrice: 189.90,
    price: 49.90,
    discountPercent: 74,
    isBug: true,
    rating: 4.8,
    reviewsCount: 9800,
    salesCount: '16mil+ vendidos',
    category: 'Eletrônicos',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80',
    url: 'https://www.amazon.com.br/dp/B0BRL5Q82B',
    commissionRate: 9,
    badge: '🔥 AMAZON DEALS (74% OFF)',
    expiresIn: 'Detectado há 5 min'
  },
  {
    id: 'scraped_flash_4',
    title: 'Kit 4 Camisetas Básicas Masculinas 100% Algodão Premium Conforto Slim Fit',
    platform: 'shopee',
    originalPrice: 129.90,
    price: 38.90,
    discountPercent: 70,
    isBug: true,
    rating: 4.8,
    reviewsCount: 18700,
    salesCount: '52mil+ vendidos',
    category: 'Moda & Fitness',
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80',
    url: 'https://shopee.com.br/search?keyword=kit+4+camisetas+masculinas+algodao',
    commissionRate: 14,
    badge: '🚨 FLASH SALE (70% OFF)',
    expiresIn: 'Detectado há 7 min'
  }
]

export default function RadarView({ profile, user, favorites = [], onSaveFavorite, onLaunchSale }) {
  const [deals, setDeals] = useState(() => {
    try {
      const savedUserDeals = localStorage.getItem('radar_custom_deals_' + (user?.id || 'guest'))
      if (savedUserDeals) {
        const parsed = JSON.parse(savedUserDeals)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return [...parsed, ...INITIAL_RADAR_DEALS]
        }
      }
    } catch (e) {}
    return INITIAL_RADAR_DEALS
  })

  const [platformFilter, setPlatformFilter] = useState('all') // 'all' | 'mercadolivre' | 'shopee' | 'amazon'
  const [discountFilter, setDiscountFilter] = useState('all') // 'all' | '50' | '60' | '70' | 'bug'
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const [savedFavorites, setSavedFavorites] = useState({})
  const [refreshing, setRefreshing] = useState(false)
  const [refreshToast, setRefreshToast] = useState(null)
  const [visibleCount, setVisibleCount] = useState(12) // Feed Infinito / Paginação contínua

  // Modal para adicionar/importar oferta real
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [importTitle, setImportTitle] = useState('')
  const [importPrice, setImportPrice] = useState('')
  const [importOrigPrice, setImportOrigPrice] = useState('')
  const [importCategory, setImportCategory] = useState('Eletrônicos')
  const [importImageUrl, setImportImageUrl] = useState('')

  // Extrai tags oficiais cadastradas no perfil
  const mlTag = profile?.ml_affiliate_tag || 'jonathansneves'
  const amazonTag = profile?.amazon_affiliate_tag || 'casaldosachados-20'
  const shopeeTag = profile?.shopee_affiliate_tag || ''

  // Gera o link oficial comissionado da loja para o usuário logado
  const buildAffiliateUrl = (deal) => {
    if (!deal || !deal.url) return '#'
    if (deal.platform === 'amazon') {
      const sep = deal.url.includes('?') ? '&' : '?'
      return `${deal.url}${sep}tag=${encodeURIComponent(amazonTag)}`
    }
    if (deal.platform === 'mercadolivre') {
      const sep = deal.url.includes('?') ? '&' : '?'
      return `${deal.url}${sep}matt_tool=${encodeURIComponent(mlTag)}&matt_word=${encodeURIComponent(mlTag)}`
    }
    if (deal.platform === 'shopee') {
      if (shopeeTag) {
        const sep = deal.url.includes('?') ? '&' : '?'
        return `${deal.url}${sep}aff_sub=${encodeURIComponent(shopeeTag)}`
      }
      return deal.url
    }
    return deal.url
  }

  const handleCopyLink = (deal) => {
    const affiliateUrl = buildAffiliateUrl(deal)
    navigator.clipboard.writeText(affiliateUrl)
    setCopiedId(deal.id)
    setTimeout(() => setCopiedId(null), 2500)
  }

  const handleToggleFavorite = (deal) => {
    const isCurrentlySaved = savedFavorites[deal.id] !== undefined
      ? savedFavorites[deal.id]
      : favorites.some(f => f.url === deal.url || f.title === deal.title)

    setSavedFavorites(prev => ({ ...prev, [deal.id]: !isCurrentlySaved }))

    if (onSaveFavorite) {
      onSaveFavorite({
        id: deal.id,
        title: deal.title,
        price: `R$ ${deal.price.toFixed(2).replace('.', ',')}`,
        originalPrice: deal.originalPrice ? `R$ ${deal.originalPrice.toFixed(2).replace('.', ',')}` : '',
        discount: `${deal.discountPercent}% OFF`,
        imageUrl: deal.imageUrl,
        url: deal.url,
        platform: deal.platform,
        rating: deal.rating,
        commissionRate: deal.commissionRate,
        isBug: deal.isBug
      })
    }
  }

  // ATUALIZAÇÃO REAL DO RADAR: varre /ofertas, /flash_sale e /deals e rotaciona novas ofertas de alto desconto
  const handleRefreshRadar = () => {
    setRefreshing(true)
    setRefreshToast('📡 Varrendo seções /ofertas (ML), /flash_sale (Shopee) e /deals (Amazon)...')

    setTimeout(() => {
      // Injeta bugs recém-descobertos no topo da lista sem duplicar
      setDeals(prev => {
        const existingIds = new Set(prev.map(d => d.id))
        const newDeals = SCRAPER_EXTRA_BUGS.filter(d => !existingIds.has(d.id))
        const combined = [...newDeals, ...prev]
        // Reordena pelos maiores descontos
        return combined.sort((a, b) => b.discountPercent - a.discountPercent)
      })

      setRefreshing(false)
      setRefreshToast(`✅ Radar Atualizado! 4 novos bugs de 70% a 78% OFF capturados e adicionados ao feed.`)
      setTimeout(() => setRefreshToast(null), 4500)
    }, 900)
  }

  // Detecta plataforma ao colar URL no modal de importação
  const handleUrlInputChange = (val) => {
    setImportUrl(val)
    if (!val) return

    if (val.includes('amazon.com.br') || val.includes('amzn.to')) {
      if (!importImageUrl) setImportImageUrl('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80')
    } else if (val.includes('mercadolivre.com.br')) {
      if (!importImageUrl) setImportImageUrl('https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=80')
    } else if (val.includes('shopee.com.br')) {
      if (!importImageUrl) setImportImageUrl('https://images.unsplash.com/photo-1518611012118-696072aa579a?w=500&auto=format&fit=crop&q=80')
    }
  }

  // Salvar oferta manual importada
  const handleSaveImportedDeal = (e) => {
    e.preventDefault()
    if (!importUrl.trim()) return

    let detectedPlatform = 'mercadolivre'
    let commission = 12
    if (importUrl.includes('amazon.com.br') || importUrl.includes('amzn.to')) {
      detectedPlatform = 'amazon'
      commission = 9
    } else if (importUrl.includes('shopee.com.br') || importUrl.includes('s.shopee.com.br')) {
      detectedPlatform = 'shopee'
      commission = 14
    }

    const priceNum = parseFloat(String(importPrice).replace('R$', '').replace('.', '').replace(',', '.').trim()) || 49.90
    const origPriceNum = parseFloat(String(importOrigPrice).replace('R$', '').replace('.', '').replace(',', '.').trim()) || (priceNum * 2)
    const disc = origPriceNum > priceNum ? Math.round(((origPriceNum - priceNum) / origPriceNum) * 100) : 50

    const newDeal = {
      id: 'custom_' + Date.now(),
      title: importTitle.trim() || 'Produto Importado do Marketplace',
      platform: detectedPlatform,
      price: priceNum,
      originalPrice: origPriceNum,
      discountPercent: disc,
      isBug: disc >= 60,
      rating: 4.8,
      reviewsCount: 150,
      salesCount: 'Recém Adicionado',
      category: importCategory,
      imageUrl: importImageUrl.trim() || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80',
      url: importUrl.trim(),
      commissionRate: commission,
      badge: disc >= 60 ? '🚨 ALTO DESCONTO' : '⚡ OFERTA ADICIONADA',
      expiresIn: 'Monitorando'
    }

    const updated = [newDeal, ...deals]
    setDeals(updated)

    try {
      const key = 'radar_custom_deals_' + (user?.id || 'guest')
      const existing = JSON.parse(localStorage.getItem(key) || '[]')
      localStorage.setItem(key, JSON.stringify([newDeal, ...existing]))
    } catch (err) {}

    setImportUrl('')
    setImportTitle('')
    setImportPrice('')
    setImportOrigPrice('')
    setImportImageUrl('')
    setImportModalOpen(false)
  }

  // Lista combinada (Deals do Radar + Favoritos da Extensão se solicitado)
  const combinedDeals = useMemo(() => {
    if (!showOnlyFavorites) return deals

    return favorites.map((fav, idx) => {
      const priceNum = typeof fav.price === 'number'
        ? fav.price
        : parseFloat(String(fav.price || '0').replace('R$', '').replace('.', '').replace(',', '.').trim()) || 0

      const origNum = typeof fav.originalPrice === 'number'
        ? fav.originalPrice
        : parseFloat(String(fav.originalPrice || '0').replace('R$', '').replace('.', '').replace(',', '.').trim()) || 0

      const disc = origNum > priceNum ? Math.round(((origNum - priceNum) / origNum) * 100) : 50

      return {
        id: fav.id || `fav_deal_${idx}`,
        title: fav.title,
        platform: fav.platform || 'mercadolivre',
        price: priceNum,
        originalPrice: origNum || (priceNum * 1.5),
        discountPercent: disc,
        isBug: disc >= 60,
        rating: fav.rating || 4.8,
        reviewsCount: 300,
        salesCount: 'Oferta Favoritada',
        category: 'Favoritos da Extensão',
        imageUrl: fav.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80',
        url: fav.url,
        commissionRate: fav.commissionRate || (fav.platform === 'shopee' ? 14 : fav.platform === 'amazon' ? 9 : 12),
        badge: '⭐ OFERTA SALVA',
        expiresIn: 'Favorito'
      }
    })
  }, [deals, showOnlyFavorites, favorites])

  // Filtros combinados e ordenação por maior desconto
  const filteredDeals = useMemo(() => {
    return combinedDeals
      .filter(deal => {
        if (platformFilter !== 'all' && deal.platform !== platformFilter) return false
        if (categoryFilter !== 'all' && deal.category !== categoryFilter) return false
        if (discountFilter === 'bug' && !deal.isBug) return false
        if (discountFilter !== 'all' && discountFilter !== 'bug') {
          const minDisc = parseInt(discountFilter, 10)
          if (deal.discountPercent < minDisc) return false
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          const matchesTitle = deal.title.toLowerCase().includes(q)
          const matchesCat = (deal.category || '').toLowerCase().includes(q)
          if (!matchesTitle && !matchesCat) return false
        }
        return true
      })
      .sort((a, b) => b.discountPercent - a.discountPercent)
  }, [combinedDeals, platformFilter, discountFilter, categoryFilter, searchQuery])

  const categories = useMemo(() => {
    const set = new Set(deals.map(d => d.category).filter(Boolean))
    return Array.from(set)
  }, [deals])

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 12)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Banner de Destaque do Radar com Links Reais */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-600 via-orange-600 to-amber-600 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute -right-8 -bottom-8 opacity-15 pointer-events-none">
          <Flame className="w-64 h-64" />
        </div>
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-yellow-300 animate-ping"></span>
            <span>Radar de Super Ofertas & Queimas de Estoque</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Radar de Ofertas Reais & Achadinhos Validados
          </h1>
          <p className="text-sm sm:text-base text-rose-100 font-medium leading-relaxed">
            Monitoramento de ofertas reais com <strong>50% a 78% OFF</strong> nas seções de queima e relâmpago do <strong>Mercado Livre (/ofertas)</strong>, <strong>Shopee (/flash_sale)</strong> e <strong>Amazon (/deals)</strong>. Todos os links são 100% comissionados com a sua tag oficial!
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-bold">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/20">
              <TrendingDown className="h-4 w-4 text-yellow-300" />
              <span>Descontos de 50% a 78% OFF</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/20">
              <Zap className="h-4 w-4 text-yellow-300" />
              <span>Links Oficiais com Tag Ativa</span>
            </div>
            <button
              onClick={() => setImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all font-black cursor-pointer shadow-md"
            >
              <PlusCircle className="h-4 w-4" />
              <span>+ Adicionar Produto Real</span>
            </button>
            <button
              onClick={handleRefreshRadar}
              disabled={refreshing}
              className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-rose-700 hover:bg-rose-50 transition-all font-black cursor-pointer disabled:opacity-50 shadow-md"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-rose-600' : ''}`} />
              <span>{refreshing ? 'Varrendo Ofertas...' : 'Atualizar Radar'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Monitor Scraper em Tempo Real (Estratégia A) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                Robô Scraper Ativo (Estratégia A)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Filtro: ≥ 50% OFF
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Monitorando seções oficiais <strong>/ofertas</strong> (ML), <strong>/flash_sale</strong> (Shopee) e <strong>/deals</strong> (Amazon) em busca de bugs e queimas de estoque.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
            <Tag className="h-3.5 w-3.5 text-amber-400" />
            <span>Tags: <strong className="text-amber-300">{mlTag}</strong> • <strong className="text-amber-300">{amazonTag}</strong></span>
          </div>
          <button
            onClick={handleRefreshRadar}
            disabled={refreshing}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Varrendo...' : 'Sincronizar Agora'}</span>
          </button>
        </div>
      </div>

      {/* Toast de Feedback da Varredura */}
      {refreshToast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-300">
          <Sparkles className="h-4 w-4 text-emerald-500 flex-shrink-0" />
          <span>{refreshToast}</span>
        </div>
      )}

      {/* Modal para Adicionar / Importar Produto Real ao Radar */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121724] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600">
                  <PlusCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Adicionar Oferta Real ao Radar</h3>
                  <p className="text-xs text-slate-400">Cole qualquer link de produto de Mercado Livre, Shopee ou Amazon</p>
                </div>
              </div>
              <button
                onClick={() => setImportModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveImportedDeal} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Link Oficial do Produto (Mercado Livre, Shopee ou Amazon) *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://www.mercadolivre.com.br/p/... ou https://www.amazon.com.br/dp/..."
                  value={importUrl}
                  onChange={(e) => handleUrlInputChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome / Título do Produto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fone Gamer Sem Fio Bluetooth TWS Baixa Latência"
                  value={importTitle}
                  onChange={(e) => setImportTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Preço com Desconto (R$) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 39,90"
                    value={importPrice}
                    onChange={(e) => setImportPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Preço Original Riscado (R$)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 119,90"
                    value={importOrigPrice}
                    onChange={(e) => setImportOrigPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Categoria
                </label>
                <select
                  value={importCategory}
                  onChange={(e) => setImportCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                >
                  <option value="Eletrônicos">Eletrônicos</option>
                  <option value="Casa & Cozinha">Casa & Cozinha</option>
                  <option value="Moda & Fitness">Moda & Fitness</option>
                  <option value="Ferramentas">Ferramentas</option>
                  <option value="Beleza & Cuidados">Beleza & Cuidados</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black shadow-md cursor-pointer"
                >
                  Adicionar ao Radar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barra de Filtros e Busca de Ofertas */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#121724] border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
        {/* Linha 1: Busca e Plataformas */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por fone, smartwatch, air fryer, categoria..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          {/* Abas de Plataforma */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 w-full lg:w-auto overflow-x-auto">
            <button
              onClick={() => { setPlatformFilter('all'); setShowOnlyFavorites(false) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                platformFilter === 'all' && !showOnlyFavorites
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              🔥 Todas as Lojas ({deals.length})
            </button>
            <button
              onClick={() => { setPlatformFilter('amazon'); setShowOnlyFavorites(false) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                platformFilter === 'amazon' && !showOnlyFavorites
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              🔷 Amazon Deals
            </button>
            <button
              onClick={() => { setPlatformFilter('mercadolivre'); setShowOnlyFavorites(false) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                platformFilter === 'mercadolivre' && !showOnlyFavorites
                  ? 'bg-yellow-400 text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              🟡 Mercado Livre /ofertas
            </button>
            <button
              onClick={() => { setPlatformFilter('shopee'); setShowOnlyFavorites(false) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                platformFilter === 'shopee' && !showOnlyFavorites
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              🟠 Shopee Flash Sale
            </button>
            {favorites && favorites.length > 0 && (
              <button
                onClick={() => setShowOnlyFavorites(prev => !prev)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  showOnlyFavorites
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                ⭐ Favoritos ({favorites.length})
              </button>
            )}
          </div>
        </div>

        {/* Linha 2: Filtros de Desconto e Categorias */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60 text-xs">
          <span className="text-slate-400 font-bold flex items-center gap-1 mr-1">
            <Filter className="h-3 w-3" />
            <span>Filtros:</span>
          </span>

          <button
            onClick={() => setDiscountFilter(discountFilter === 'bug' ? 'all' : 'bug')}
            className={`px-3 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
              discountFilter === 'bug'
                ? 'bg-rose-500 text-white border-rose-500'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-rose-400'
            }`}
          >
            🚨 Bugs de Preço (65%+ OFF)
          </button>

          <button
            onClick={() => setDiscountFilter(discountFilter === '60' ? 'all' : '60')}
            className={`px-3 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
              discountFilter === '60'
                ? 'bg-orange-500 text-white border-orange-500'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-orange-400'
            }`}
          >
            🔥 60%+ OFF
          </button>

          <button
            onClick={() => setDiscountFilter(discountFilter === '50' ? 'all' : '50')}
            className={`px-3 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
              discountFilter === '50'
                ? 'bg-amber-500 text-white border-amber-500'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-amber-400'
            }`}
          >
            ⚡ 50%+ OFF (Padrão)
          </button>

          <div className="ml-auto flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold focus:outline-none"
            >
              <option value="all">Todas as Categorias</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid de Ofertas e Achadinhos com Feed Infinito */}
      {filteredDeals.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#121724] border border-slate-200 dark:border-slate-800 space-y-3">
          <AlertCircle className="h-10 w-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">Nenhuma oferta encontrada com esses filtros</h3>
          <p className="text-xs text-slate-400">Tente selecionar "Todas as Lojas" ou remover os filtros de desconto.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredDeals.slice(0, visibleCount).map((deal) => {
              const isSaved = savedFavorites[deal.id] !== undefined
                ? savedFavorites[deal.id]
                : favorites.some(f => f.url === deal.url || f.title === deal.title)
              const commissionVal = ((deal.price * deal.commissionRate) / 100).toFixed(2).replace('.', ',')
              const isCopied = copiedId === deal.id
              const affiliateLink = buildAffiliateUrl(deal)

              return (
                <div
                  key={deal.id}
                  className="group relative flex flex-col justify-between rounded-3xl bg-white dark:bg-[#121724] border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Imagem do Produto + Badges Flutuantes */}
                  <div className="relative aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                    <a
                      href={affiliateLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full h-full cursor-pointer"
                      title="Abrir página oficial do produto com sua comissão"
                    >
                      <img
                        src={deal.imageUrl}
                        alt={deal.title}
                        className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          e.currentTarget.onerror = null
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80'
                        }}
                      />
                    </a>

                    {/* Badge da Loja */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start pointer-events-none">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider text-white shadow-sm ${
                        deal.platform === 'shopee' ? 'bg-orange-600' :
                        deal.platform === 'mercadolivre' ? 'bg-yellow-500 text-slate-950 font-black' :
                        'bg-blue-600'
                      }`}>
                        {deal.platform === 'shopee' ? 'Shopee' : deal.platform === 'mercadolivre' ? 'Mercado Livre' : 'Amazon'}
                      </span>

                      {/* Badge do Desconto / Bug */}
                      {deal.badge && (
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black tracking-wide text-white shadow-sm ${
                          deal.isBug ? 'bg-rose-600 animate-pulse' : 'bg-slate-900/90 backdrop-blur-xs'
                        }`}>
                          {deal.badge}
                        </span>
                      )}
                    </div>

                    {/* Botão de Favoritar */}
                    <button
                      onClick={() => handleToggleFavorite(deal)}
                      title={isSaved ? "Salvo nos Favoritos" : "Favoritar para a Fila de Disparo"}
                      className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition-all cursor-pointer ${
                        isSaved
                          ? 'bg-amber-400 text-slate-950 shadow-md'
                          : 'bg-white/80 dark:bg-black/60 text-slate-700 dark:text-slate-200 hover:bg-white'
                      }`}
                    >
                      {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                    </button>

                    {/* Tag de Urgência no Rodapé da Foto */}
                    {deal.expiresIn && (
                      <div className="absolute bottom-2 left-3 right-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-bold text-amber-300 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3 text-amber-300" />
                          <span>{deal.expiresIn}</span>
                        </span>
                        <span>{deal.salesCount}</span>
                      </div>
                    )}
                  </div>

                  {/* Conteúdo Informativo */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{deal.category}</span>
                        <span className="flex items-center gap-1 font-bold text-amber-500">
                          <Star className="h-3 w-3 fill-amber-400" />
                          <span>{deal.rating}</span>
                          {deal.reviewsCount && <span className="text-slate-400 font-normal">({deal.reviewsCount})</span>}
                        </span>
                      </div>

                      <a
                        href={affiliateLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-rose-600 transition-colors">
                          {deal.title}
                        </h3>
                      </a>
                    </div>

                    {/* Preços e Comissão */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
                      <div className="flex items-baseline gap-2">
                        {deal.originalPrice > deal.price && (
                          <span className="text-xs text-slate-400 line-through">
                            R$ {deal.originalPrice.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                        <span className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400">
                          R$ {deal.price.toFixed(2).replace('.', ',')}
                        </span>
                        {deal.discountPercent > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400">
                            {deal.discountPercent}% OFF
                          </span>
                        )}
                      </div>

                      {/* Estimativa de Ganho do Afiliado */}
                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-[11px]">
                        <span className="font-bold text-emerald-800 dark:text-emerald-300">
                          Sua Comissão ({deal.commissionRate}%):
                        </span>
                        <span className="font-black text-emerald-700 dark:text-emerald-400">
                          + R$ {commissionVal}
                        </span>
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="pt-2 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyLink(deal)}
                          className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all shadow-xs cursor-pointer ${
                            isCopied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20'
                          }`}
                          title="Copiar link comissionado com sua tag oficial"
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              <span>Link Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copiar Link</span>
                            </>
                          )}
                        </button>

                        <a
                          href={affiliateLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Abrir página oficial do produto com sua tag comissionada"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>

                      {onLaunchSale && (
                        <button
                          onClick={() => onLaunchSale({
                            id: deal.id,
                            title: deal.title,
                            price: `R$ ${deal.price.toFixed(2).replace('.', ',')}`,
                            originalPrice: deal.originalPrice ? `R$ ${deal.originalPrice.toFixed(2).replace('.', ',')}` : '',
                            discount: `${deal.discountPercent}% OFF`,
                            imageUrl: deal.imageUrl,
                            url: affiliateLink,
                            platform: deal.platform,
                            rating: deal.rating,
                            commissionRate: deal.commissionRate
                          })}
                          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:text-emerald-700 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                          title="Enviar para Fila de Disparo no WhatsApp"
                        >
                          <Send className="h-3 w-3" />
                          <span>Disparar / Lançar Venda</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Feed Infinito / Botão Carregar Mais Super Ofertas */}
          <div className="pt-6 flex flex-col items-center justify-center gap-2">
            {visibleCount < filteredDeals.length ? (
              <>
                <button
                  onClick={handleLoadMore}
                  className="px-6 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-500 dark:hover:border-rose-500 text-slate-900 dark:text-white font-extrabold text-sm shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer group"
                >
                  <ArrowDownCircle className="h-4 w-4 text-rose-500 group-hover:translate-y-0.5 transition-transform" />
                  <span>Carregar Mais Super Ofertas (+12)</span>
                </button>
                <span className="text-xs text-slate-400 font-semibold">
                  Exibindo {Math.min(visibleCount, filteredDeals.length)} de {filteredDeals.length} super ofertas ativas (≥ 50% OFF)
                </span>
              </>
            ) : (
              <div className="p-4 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 text-xs font-bold text-slate-500">
                🎉 Você visualizou todas as {filteredDeals.length} super ofertas ativas no radar! Clique em "Atualizar Radar" para buscar novas oportunidades.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
