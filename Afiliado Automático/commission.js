/**
 * Afiliado Mercado Livre - Módulo de Cálculo de Comissões
 * Baseado na tabela oficial de comissões do Programa de Afiliados do Mercado Livre.
 * Compatível com Service Worker (background), Content Script e Popup.
 */

(function (global) {
  'use strict';

  // Tabela Oficial de Comissões por Categoria do Mercado Livre
  const DEFAULT_CATEGORIES = {
    beleza: {
      id: 'beleza',
      name: 'Beleza e Cuidado Pessoal',
      defaultRate: 16,
      icon: '💄',
      keywords: [
        'perfume', 'perfumes', 'fragrancia', 'eau de parfum', 'eau de toilette', 'colonia',
        'maquiagem', 'batom', 'base facial', 'corretivo', 'mascara de cilios', 'rimel',
        'shampoo', 'condicionador', 'hidratante', 'protetor solar', 'skincare',
        'creme facial', 'serum', 'anti-idade', 'clareador', 'esmalte', 'cabelo',
        'secador de cabelo', 'prancha de cabelo', 'chapinha', 'barbeador', 'depilador',
        'cosmetico', 'cuidado pessoal', 'beleza', 'dermatologico', 'oleo corporal',
        'tintura de cabelo', 'alisamento', 'mascara capilar'
      ]
    },
    moda: {
      id: 'moda',
      name: 'Moda, Roupas e Calçados',
      defaultRate: 14,
      icon: '👗',
      keywords: [
        'tenis', 'sapato', 'sandalia', 'bota', 'chinelo', 'sapatilha', 'mocassim',
        'camisa', 'camiseta', 'calca', 'bermuda', 'shorts', 'vestido', 'saia',
        'jaqueta', 'casaco', 'moletom', 'sueter', 'blazer', 'lingerie', 'sutia',
        'calcinha', 'cueca', 'meia', 'bolsa', 'mochila escolar', 'mochila feminina',
        'carteira', 'cinto de couro', 'cinto masculino', 'cinto feminino', 'cinto social',
        'oculos de sol', 'bone', 'chapeu', 'relogio de pulso',
        'bijuteria', 'calcados', 'roupas', 'bolsas', 'vestuario', 'acessorios da moda'
      ]
    },
    esportes: {
      id: 'esportes',
      name: 'Esportes e Fitness',
      defaultRate: 14,
      icon: '🏋️',
      keywords: [
        'suplemento', 'whey protein', 'creatina', 'bcaa', 'glutamina', 'pre-treino',
        'halter', 'anilha', 'haltere', 'kettlebell', 'caneleira', 'elastico extensao',
        'esteira', 'bicicleta ergometrica', 'spinning', 'patinete', 'skate',
        'bola de futebol', 'chuteira', 'luva de boxe', 'kimono', 'raquete',
        'camping', 'barraca de camping', 'colchao inflavel', 'mochila trilha', 'pesca',
        'vara de pesca', 'carretilha', 'molinete', 'esporte', 'fitness', 'academia',
        'musculacao', 'crossfit', 'corrida'
      ]
    },
    bebes: {
      id: 'bebes',
      name: 'Bebês e Maternidade',
      defaultRate: 14,
      icon: '👶',
      keywords: [
        'bebe', 'bebes', 'baby', 'maternidade', 'recem-nascido', 'recem nascido',
        'fralda', 'fraldas', 'pampers', 'huggies', 'lenco umedecido', 'lencos umedecidos',
        'pomada assadura', 'bepantol baby', 'desitin', 'mamadeira', 'chupeta',
        'prendedor de chupeta', 'bico de mamadeira', 'copo de transicao', 'babador',
        'kit refeicao bebe', 'kit alimentacao bebe', 'mordedor', 'chocalho', 'naninha',
        'carrinho de bebe', 'carrinho de passeio', 'bebe conforto', 'base veicular',
        'cadeira para automovel', 'cadeira automovel', 'cadeira para auto', 'cadeira auto',
        'cadeirinha para carro', 'cadeirinha auto', 'cadeirinha', 'assento de elevacao',
        'tapete de atividades', 'tapete de atividade', 'tapete infantil', 'tapete educativo',
        'tapete musical', 'piano play', 'centro de atividades', 'andador infantil', 'andador bebe',
        'berco', 'mini berco', 'berco portatil', 'chiqueirinho', 'cercado bebe',
        'ninho redutor', 'almofada de amamentacao', 'bomba tira leite', 'extrator de leite',
        'esterilizador de mamadeiras', 'banheira bebe', 'suporte banheira bebe', 'aspirador nasal',
        'kit higiene bebe', 'roupa de bebe', 'body bebe', 'macacao bebe', 'enxoval bebe',
        'litet', 'styll baby', 'maxi baby', 'burigotto', 'cosco', 'voyage', 'chicco',
        'safety 1st', 'fisher price', 'buba', 'avent', 'philips avent', 'mam', 'mustela', 'granado bebe'
      ]
    },
    supermercado: {
      id: 'supermercado',
      name: 'Supermercado e Bebidas',
      defaultRate: 14,
      icon: '🛒',
      keywords: [
        'cafe em graos', 'capsula cafe', 'nespresso', 'dolce gusto', 'azeite de oliva',
        'vinho', 'cerveja', 'whisky', 'gin', 'vodka', 'espumante', 'chocolate', 'bombom',
        'snacks', 'amendoim', 'castanha', 'alimento', 'mercearia',
        'sabao em po', 'amaciante', 'detergente', 'desinfetante', 'limpeza casa'
      ]
    },
    livros: {
      id: 'livros',
      name: 'Livros e Revistas',
      defaultRate: 11,
      icon: '📚',
      keywords: [
        'livro', 'livros', 'box livros', 'manga', 'quadrinho', 'hq', 'enciclopedia',
        'dicionario', 'didatico', 'best-seller', 'leitura', 'biografia', 'romance',
        'ficcao', 'autoajuda', 'financas'
      ]
    },
    veiculos: {
      id: 'veiculos',
      name: 'Acessórios para Veículos',
      defaultRate: 11,
      icon: '🚗',
      keywords: [
        'pneu aro', 'pneu moto', 'capacete moto', 'oleo motor', 'lampada automotiva',
        'led automotivo', 'som automotivo', 'central multimidia', 'rastreador veicular',
        'alarme carro', 'engate', 'bateria de carro', 'pastilha de freio', 'amortecedor',
        'filtro de oleo', 'acessorios para veiculos', 'automotivo', 'pecas de carro',
        'pecas de moto', 'palheta parabrisa'
      ]
    },
    brinquedos: {
      id: 'brinquedos',
      name: 'Brinquedos e Hobbies',
      defaultRate: 10,
      icon: '🧸',
      keywords: [
        'lego', 'boneco', 'boneca', 'barbie', 'carrinho controle remoto', 'hot wheels',
        'pista hot wheels', 'jogo de tabuleiro', 'jogos de tabuleiro', 'quebra-cabeca', 'puzzle',
        'pelucia', 'nerf', 'drone infantil', 'colecionavel', 'action figure', 'funko pop',
        'brinquedo', 'brinquedos', 'massinha', 'play doh'
      ]
    },
    casa: {
      id: 'casa',
      name: 'Casa, Móveis e Ferramentas',
      defaultRate: 10,
      icon: '🏠',
      keywords: [
        'jogo de cama', 'lencol', 'edredom', 'cobertor', 'travesseiro', 'toalha de banho',
        'cortina', 'tapete sala', 'almofada', 'quadro decorativo', 'luminaria', 'abajur',
        'sofa', 'poltrona', 'cadeira escritorio', 'mesa jantar', 'guarda-roupa', 'cama box',
        'colchao casal', 'furadeira', 'parafusadeira', 'serra circular', 'esmerilhadeira',
        'trena', 'jogo de ferramentas', 'torneira gourmet', 'chuveiro eletrico', 'fechadura digital',
        'panela eletrica', 'jogo de panelas', 'air fryer', 'fritadeira sem oleo',
        'liquidificador', 'batedeira planetaria', 'cafeteira eletrica', 'aspirador de po',
        'aspirador robo', 'ferro de passar', 'utensilio cozinha', 'faqueiro', 'potes hermeticos'
      ]
    },
    games: {
      id: 'games',
      name: 'Games e Consoles',
      defaultRate: 10,
      icon: '🎮',
      keywords: [
        'playstation', 'ps5', 'ps4', 'xbox series', 'xbox one', 'nintendo switch',
        'console', 'controle ps5', 'controle xbox', 'dualsense', 'jogo ps5',
        'jogo ps4', 'jogo switch', 'headset gamer', 'mouse gamer', 'teclado mecanico gamer',
        'cadeira gamer', 'volante gamer'
      ]
    },
    informatica: {
      id: 'informatica',
      name: 'Informática e Tecnologia',
      defaultRate: 9,
      icon: '💻',
      keywords: [
        'notebook', 'laptop', 'computador desktop', 'pc gamer', 'monitor gamer',
        'monitor 24', 'monitor 27', 'placa de video', 'processador ryzen', 'processador intel',
        'memoria ram', 'ssd nvme', 'ssd sata', 'hd externo', 'roteador wifi',
        'impressora multifuncional', 'toner', 'cartucho tinta', 'teclado sem fio',
        'mouse sem fio', 'tablet', 'ipad', 'kindle'
      ]
    },
    celulares: {
      id: 'celulares',
      name: 'Celulares e Telefones',
      defaultRate: 9,
      icon: '📱',
      keywords: [
        'smartphone', 'celular', 'iphone 11', 'iphone 12', 'iphone 13', 'iphone 14',
        'iphone 15', 'iphone 16', 'samsung galaxy', 'xiaomi redmi', 'motorola moto',
        'smartwatch', 'apple watch', 'relogio inteligente', 'carregador rapido',
        'carregador por inducao', 'capinha celular', 'pelicula 3d', 'fone bluetooth',
        'airpods', 'galaxy buds'
      ]
    },
    eletronicos: {
      id: 'eletronicos',
      name: 'Eletrônicos, Áudio e Vídeo',
      defaultRate: 9,
      icon: '📺',
      keywords: [
        'smart tv', 'televisao', 'tv 43', 'tv 50', 'tv 55', 'tv 65', 'tv 4k',
        'soundbar', 'caixa de som jbl', 'caixa jbl', 'home theater', 'amplificador de som',
        'camera fotografica', 'ring light', 'tripe para celular', 'microfone condensador',
        'projetor led'
      ]
    },
    eletrodomesticos: {
      id: 'eletrodomesticos',
      name: 'Eletrodomésticos',
      defaultRate: 9,
      icon: '🧊',
      keywords: [
        'geladeira', 'refrigerador', 'fogao', 'cooktop', 'forno eletrico', 'forno micro-ondas',
        'micro-ondas', 'microondas', 'maquina de lavar', 'lava e seca', 'lavadora',
        'lava-loucas', 'ar-condicionado', 'ar condicionado', 'ventilador', 'climatizador',
        'coifa', 'depurador', 'freezer', 'cervejeira', 'adega'
      ]
    },
    outros: {
      id: 'outros',
      name: 'Geral / Outras Categorias',
      defaultRate: 9,
      icon: '🏷️',
      keywords: []
    }
  };

  // Campanhas com Ganhos Extras patrocinados conhecidos no Mercado Livre
  const BONUS_CAMPAIGNS = [
    {
      keywords: ['litet'],
      rate: 19,
      label: 'Ganhos Extras',
      isBonus: true,
      categoryId: 'bebes'
    }
  ];

  /**
   * Normaliza textos para comparação removendo acentos e pontuação
   */
  function normalizeStr(str) {
    if (!str) return '';
    return String(str)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Converte strings de preço em números de ponto flutuante
   */
  function parsePriceNumber(priceVal) {
    if (typeof priceVal === 'number') return isNaN(priceVal) ? 0 : priceVal;
    if (!priceVal) return 0;
    const cleaned = String(priceVal)
      .replace(/[^\d,\.]/g, '')
      .replace(/\.(?=\d{3})/g, '')
      .replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Formata número no padrão monetário brasileiro (R$ X.XXX,XX)
   */
  function formatBRL(num) {
    const val = typeof num === 'number' && !isNaN(num) ? num : 0;
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * Verifica se o produto ou marca participa de campanha com Ganhos Extras patrocinados
   */
  function checkBonusCampaign(title = '', brand = '') {
    const text = normalizeStr(`${title} ${brand}`);
    for (const camp of BONUS_CAMPAIGNS) {
      for (const kw of camp.keywords) {
        const normKw = normalizeStr(kw);
        const regex = new RegExp(`\\b${normKw}\\b`, 'i');
        if (regex.test(text)) {
          return camp;
        }
      }
    }
    return null;
  }

  /**
   * Detecta a categoria do produto com base no título, breadcrumb, marca ou categoria explícita
   */
  function detectCategory(title, breadcrumb = '', explicitCategory = '', brand = '') {
    const normTitle = normalizeStr(title);
    const normBreadcrumb = normalizeStr(breadcrumb);
    const normExplicit = normalizeStr(explicitCategory);
    const normBrand = normalizeStr(brand);

    // 1. Verificação por Breadcrumbs ou Categoria Explícita do Mercado Livre
    const contextText = `${normExplicit} ${normBreadcrumb}`;
    if (contextText.trim()) {
      if (contextText.includes('beleza') || contextText.includes('cuidado pessoal') || contextText.includes('perfumes')) {
        return DEFAULT_CATEGORIES.beleza;
      }
      if (contextText.includes('calcados') || contextText.includes('roupas') || contextText.includes('bolsas') || contextText.includes('moda')) {
        return DEFAULT_CATEGORIES.moda;
      }
      if (contextText.includes('esporte') || contextText.includes('fitness') || contextText.includes('suplemento')) {
        return DEFAULT_CATEGORIES.esportes;
      }
      if (contextText.includes('bebe') || contextText.includes('maternidade')) {
        return DEFAULT_CATEGORIES.bebes;
      }
      if (contextText.includes('alimento') || contextText.includes('bebida') || contextText.includes('supermercado')) {
        return DEFAULT_CATEGORIES.supermercado;
      }
      if (contextText.includes('livro') || contextText.includes('revistas')) {
        return DEFAULT_CATEGORIES.livros;
      }
      if (contextText.includes('veiculo') || contextText.includes('acessorios para veiculos') || contextText.includes('automotivo')) {
        return DEFAULT_CATEGORIES.veiculos;
      }
      if (contextText.includes('brinquedo') || contextText.includes('hobbies')) {
        return DEFAULT_CATEGORIES.brinquedos;
      }
      if (contextText.includes('casa') || contextText.includes('moveis') || contextText.includes('decoracao') || contextText.includes('ferramentas')) {
        return DEFAULT_CATEGORIES.casa;
      }
      if (contextText.includes('game') || contextText.includes('video game') || contextText.includes('consoles')) {
        return DEFAULT_CATEGORIES.games;
      }
      if (contextText.includes('informatica') || contextText.includes('computador') || contextText.includes('notebook')) {
        return DEFAULT_CATEGORIES.informatica;
      }
      if (contextText.includes('celular') || contextText.includes('telefone') || contextText.includes('smartphone')) {
        return DEFAULT_CATEGORIES.celulares;
      }
      if (contextText.includes('eletronico') || contextText.includes('audio') || contextText.includes('video') || contextText.includes('televisao')) {
        return DEFAULT_CATEGORIES.eletronicos;
      }
      if (contextText.includes('eletrodomestico')) {
        return DEFAULT_CATEGORIES.eletrodomesticos;
      }
    }

    // 2. Pontuação por palavras-chave no título e marca
    const searchTarget = `${normBrand} ${normTitle}`.trim();
    let bestCategory = DEFAULT_CATEGORIES.outros;
    let maxScore = 0;

    for (const key of Object.keys(DEFAULT_CATEGORIES)) {
      if (key === 'outros') continue;
      const cat = DEFAULT_CATEGORIES[key];
      let score = 0;

      for (const kw of cat.keywords) {
        const normKw = normalizeStr(kw);
        if (normKw.length <= 4) {
          // Palavras curtas (ex: bebe, baby, lego) exigem word boundary para evitar falso positivo
          const re = new RegExp(`\\b${normKw}\\b`, 'i');
          if (re.test(searchTarget)) {
            score += 2;
          }
        } else if (searchTarget.includes(normKw)) {
          // Palavras-chave mais longas recebem pontuação maior para desempate
          score += (normKw.length >= 10 ? 4 : normKw.length >= 6 ? 3 : 2);
        }
      }

      if (score > maxScore) {
        maxScore = score;
        bestCategory = cat;
      }
    }

    // 3. Fallback: Se o título não pontuou mas há contexto/breadcrumbs da página, usa o contexto
    if (bestCategory.id === 'outros' && contextText.trim()) {
      for (const key of Object.keys(DEFAULT_CATEGORIES)) {
        if (key === 'outros') continue;
        const cat = DEFAULT_CATEGORIES[key];
        for (const kw of cat.keywords) {
          const normKw = normalizeStr(kw);
          if (contextText.includes(normKw)) {
            return cat;
          }
        }
      }
    }

    return bestCategory;
  }

  /**
   * Calcula o valor da comissão em porcentagem e em reais
   * @param {Object} product - Objeto com os dados do produto (title, rawPrice/price, etc)
   * @param {Object} customRates - Taxas personalizadas por categoria salvas pelo usuário
   * @param {number} defaultRate - Taxa padrão para quando não houver categoria identificada
   * @returns {Object} Dados completos de comissão
   */
  function calculateCommission(product, customRates = null, defaultRate = null) {
    if (!product) {
      return {
        rate: 0,
        ratePercent: '0%',
        value: 0,
        valueFormatted: 'R$ 0,00',
        categoryName: 'Geral',
        categoryIcon: '🏷️',
        label: '',
        isBonus: false
      };
    }

    // Preço numérico: sempre estritamente o promocional de venda
    const rawPrice = (typeof product.rawPrice === 'number' && product.rawPrice > 0)
      ? product.rawPrice
      : parsePriceNumber(product.price);

    const plat = product.platform || (product.url && product.url.includes('amazon') ? 'amazon' : (product.url && product.url.includes('shopee') ? 'shopee' : 'mercadolivre'));

    // Suporte específico para Amazon Associados Brasil
    if (plat === 'amazon') {
      let rate = 8;
      let catName = 'Amazon Geral';
      let catIcon = '🔷';
      const normTitle = normalizeStr(product.title || '');

      if (/kindle|echo|alexa|fire tv|fire stick/i.test(normTitle)) {
        rate = 10;
        catName = 'Dispositivos Amazon';
        catIcon = '📱';
      } else if (/livro|ebook|roupa|vestido|calcado|tenis|sapato|camisa|bolsa|relogio/i.test(normTitle)) {
        rate = 9;
        catName = 'Moda, Calçados e Livros';
        catIcon = '👗';
      } else if (/cozinha|panela|air fryer|cafeteira|casa|decoracao|cama|banho|beleza|maquiagem|perfume|pet/i.test(normTitle)) {
        rate = 8;
        catName = 'Casa, Cozinha e Beleza';
        catIcon = '🏠';
      } else if (/alimento|bebida|cafe|suplemento|vitamina/i.test(normTitle)) {
        rate = 7;
        catName = 'Alimentos e Saúde';
        catIcon = '☕';
      } else if (/esporte|ferramenta|furadeira|automotivo|pneu/i.test(normTitle)) {
        rate = 6;
        catName = 'Esportes e Ferramentas';
        catIcon = '🔧';
      } else if (/notebook|computador|celular|smartphone|tv|smart tv|gamer|placa de video|fone|headset/i.test(normTitle)) {
        rate = 5;
        catName = 'Eletrônicos e Informática';
        catIcon = '💻';
      }

      const value = Math.round((rawPrice * (rate / 100)) * 100) / 100;
      return {
        rate,
        ratePercent: `${Number(rate.toFixed(1))}%`,
        value,
        valueFormatted: formatBRL(value),
        categoryId: 'amazon_' + catName.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        categoryName: catName,
        categoryIcon: catIcon,
        rawPrice,
        label: 'Associados Amazon',
        isBonus: false
      };
    }

    // Suporte específico para Shopee Afiliados Brasil
    if (plat === 'shopee') {
      let rate = 8;
      let catName = 'Shopee Afiliados';
      let catIcon = '🟠';
      const normTitle = normalizeStr(product.title || '');

      if (/oficial|shopee mall|indicado/i.test(normTitle) || product.isOfficial) {
        rate = 10;
        catName = 'Loja Oficial Shopee';
      }

      const value = Math.round((rawPrice * (rate / 100)) * 100) / 100;
      return {
        rate,
        ratePercent: `${Number(rate.toFixed(1))}%`,
        value,
        valueFormatted: formatBRL(value),
        categoryId: 'shopee_' + catName.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        categoryName: catName,
        categoryIcon: catIcon,
        rawPrice,
        label: 'Afiliados Shopee',
        isBonus: false
      };
    }

    // Categoria detectada para Mercado Livre
    const category = detectCategory(
      product.title || '',
      product.breadcrumbs || '',
      product.category || '',
      product.brand || ''
    );

    let rate = category.defaultRate;
    let label = product.commissionLabel || '';
    let isBonus = product.isBonusCommission || false;

    // 1. Taxa explícita da barra de afiliados na página (se houver, como no PDP)
    if (typeof product.commissionRate === 'number' && product.commissionRate > 0) {
      rate = product.commissionRate;
      if (product.isBonusCommission && !label) label = 'Ganhos Extras';
    } else if (typeof product.extractedCommissionRate === 'number' && product.extractedCommissionRate > 0) {
      rate = product.extractedCommissionRate;
      if (product.isBonusCommission && !label) label = 'Ganhos Extras';
    } else {
      // 2. Campanhas de Ganhos Extras patrocinadas conhecidas (ex: Litet -> 19%)
      const bonus = checkBonusCampaign(product.title, product.brand);
      if (bonus) {
        rate = bonus.rate;
        label = bonus.label;
        isBonus = true;
      } else if (customRates && typeof customRates[category.id] === 'number') {
        rate = customRates[category.id];
      } else if (category.id === 'outros' && typeof defaultRate === 'number' && defaultRate > 0) {
        rate = defaultRate;
      }
    }

    const value = Math.round((rawPrice * (rate / 100)) * 100) / 100;
    const valueFormatted = formatBRL(value);
    const ratePercent = `${Number(rate.toFixed(1))}%`;

    return {
      rate,
      ratePercent,
      value,
      valueFormatted,
      categoryId: category.id,
      categoryName: category.name,
      categoryIcon: category.icon || '🏷️',
      rawPrice,
      label,
      isBonus
    };
  }

  /**
   * Retorna a lista de todas as categorias oficiais com suas taxas padrão
   */
  function getAllCategories() {
    return Object.values(DEFAULT_CATEGORIES);
  }

  // Exportação universal
  const MLCommission = {
    CATEGORIES: DEFAULT_CATEGORIES,
    BONUS_CAMPAIGNS,
    getAllCategories,
    detectCategory,
    calculateCommission,
    checkBonusCampaign,
    formatBRL,
    parsePriceNumber,
    normalizeStr
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MLCommission;
  } else {
    global.MLCommission = MLCommission;
  }

})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
