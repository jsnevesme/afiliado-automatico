# Afiliado Automático 🚀

Plataforma completa de automação de ofertas e escala de comissões para afiliados **Mercado Livre**, **Shopee** e **Amazon** com disparos inteligentes e humanizados direto para o **WhatsApp Web**.

![Afiliado Automático Open Graph Preview](dashboard/public/og-image.png)

---

## ⚡ Principais Recursos

- **Extensão Google Chrome Oficial**: Captura instantânea de produtos com 1 clique diretamente nas páginas do Mercado Livre, Shopee e Amazon.
- **Links Curtos Oficiais**: Geração automatizada de links encurtados oficiais com tag de afiliado (`meli.la`, `s.shopee`).
- **Estúdio de Copys com IA**: Geração de copies persuasivas e chamadas de alta conversão focadas em escassez, menor preço e frete grátis.
- **Disparos com Proteção Anti-Bloqueio**: Algoritmo humanizado com intervalos randômicos (12-25s) simulando a digitação humana no WhatsApp Web.
- **Gestão de Grupos & Planos**: Limites estruturados por plano (Starter: 1 grupo, Pro: 5 grupos, Ultra: 10 grupos).
- **Sem Custos de Servidor/VPS**: Roda nativamente no navegador Chromium (Chrome, Brave, Edge, Opera).
- **Dashboard de Métricas**: Acompanhamento de cliques, disparos, ranking de produtos e conversões.

---

## 📁 Estrutura do Projeto

```text
├── Afiliado Automático/       # Extensão Manifest V3 para Google Chrome
│   ├── manifest.json
│   ├── popup.html / popup.js  # Interface da extensão no Chrome
│   ├── content.js             # Captura de dados nas páginas de e-commerce
│   ├── background.js          # Service Worker
│   └── whatsapp-injector.js   # Automação e envio seguro no WhatsApp Web
│
├── dashboard/                 # Web App & Landing Page (React + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/        # Componentes do Dashboard e Landing Page
│   │   ├── supabase.js        # Integração Supabase
│   │   └── App.jsx
│   ├── public/
│   │   ├── og-image.png       # Imagem Open Graph 1200x630 para redes sociais
│   │   ├── afiliado-automatico.zip # Pacote ZIP para download direto
│   │   └── brands/            # Logos oficiais transparentes (ML, Shopee, Amazon, WhatsApp)
│   └── vercel.json            # Configuração de rotas SPA no Vercel
│
├── vercel.json                # Configuração raiz para deploy no Vercel
└── package.json               # Scripts de build do monorepo
```

---

## 🌐 Deploy no Vercel

1. Importe este repositório no seu painel da [Vercel](https://vercel.com).
2. O arquivo `vercel.json` na raiz já está pré-configurado:
   - **Framework Preset**: Vite
   - **Build Command**: `cd dashboard && npm install && npm run build`
   - **Output Directory**: `dashboard/dist`
3. Clique em **Deploy**.

---

## 🛠️ Instalação Local da Extensão Chrome

1. Abra o navegador Google Chrome e acesse `chrome://extensions/`.
2. Ative a opção **Modo do desenvolvedor** no canto superior direito.
3. Clique em **Carregar sem compactação** (Load unpacked).
4. Selecione a pasta `Afiliado Automático`.
5. Fixe a extensão na barra de ferramentas e comece a usar!

---

## 💻 Desenvolvimento Local do Dashboard

```bash
cd dashboard
npm install
npm run dev
```

Acesse no navegador: `http://localhost:5173`.
- Landing page: `http://localhost:5173/#landing`
- Dashboard: `http://localhost:5173/#dashboard`

---

## 📄 Licença

Proprietário. Todos os direitos reservados © 2026 Afiliado Automático.
