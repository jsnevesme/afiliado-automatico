import React, { useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  Download,
  ShieldCheck,
  Zap,
  Sparkles,
  TrendingUp,
  Users,
  Send,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Star,
  ExternalLink,
  Lock,
  Sun,
  Moon,
  Check,
  ShoppingBag,
  Layers,
  Clock,
  LayoutDashboard,
  LogOut,
  CheckCheck,
  AlertTriangle,
  CreditCard,
  MessageCircle,
  Headphones
} from 'lucide-react'
import {
  ChromeLogo,
  MercadoLivreLogo,
  ShopeeLogo,
  AmazonLogo,
  WhatsAppLogo,
  GoogleChromeWordmark
} from './BrandLogos'
import InteractiveDemo from './InteractiveDemo'
import ThreeDTestimonials, { Marquee } from '../ui/3d-testimonials'
import PricingSection from '../ui/pricing-section'

export default function LandingPageView({
  user,
  onLogout,
  onGoToDashboard,
  onOpenAuth
}) {
  const [billingCycle, setBillingCycle] = useState('monthly') // 'monthly' | 'annual'
  const [openFaq, setOpenFaq] = useState(0)

  // Links oficiais de checkout na Cakto
  const checkoutLinks = {
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

  const handleCheckout = (planId) => {
    const url = checkoutLinks[planId]?.[billingCycle === 'annual' ? 'yearly' : 'monthly']
    if (url) {
      window.open(url, '_blank')
    }
  }

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? -1 : idx)
  }

  const faqs = [
    {
      q: 'O que é o Afiliado Automático e como ele me ajuda a vender mais?',
      a: 'O Afiliado Automático é uma plataforma completa integrada a uma extensão oficial para o Google Chrome. Ele extrai os dados do produto no Mercado Livre, Shopee e Amazon com 1 clique, calcula a comissão real, encurta o link com a sua tag oficial (meli.la / s.shopee) e dispara mensagens persuasivas formatadas direto para seus grupos do WhatsApp Web.'
    },
    {
      q: 'Corro risco de ter meu número de WhatsApp bloqueado?',
      a: 'Não. Nossa extensão conta com um algoritmo nativo de proteção anti-bloqueio que insere intervalos aleatórios e humanizados (entre 12 e 25 segundos) entre cada disparo, simulando a digitação humana e respeitando os limites operacionais do WhatsApp Web.'
    },
    {
      q: 'Preciso de um computador potente ou pagar uma VPS externa?',
      a: 'Zero necessidade de VPS ou servidores caros! A extensão roda de maneira ultraleve direto no seu Google Chrome ou qualquer navegador Chromium (Brave, Edge, Opera). Você economiza mensalidades pesadas de servidores dedicados.'
    },
    {
      q: 'Como funciona a limitação de grupos por plano?',
      a: 'Para garantir entregabilidade e organização, o Plano Starter permite 1 grupo cadastrado, o Plano Pro até 5 grupos e o Plano Ultra até 10 grupos. Os disparos só são autorizados para os grupos cadastrados e sincronizados com a sua conta ativa.'
    },
    {
      q: 'Como recebo as comissões geradas nas vendas?',
      a: 'As comissões são pagas diretamente pelas plataformas oficiais (Mercado Livre Afiliados, Shopee Afiliados e Amazon Associados) na sua conta bancária cadastrada nelas. A nossa ferramenta garante que todo link enviado contenha a sua tag oficial de comissionamento.'
    },
    {
      q: 'Tem garantia de reembolso se eu não gostar?',
      a: 'Sim! Você conta com 7 dias de garantia incondicional assegurada pela plataforma de pagamento Cakto. Se não gostar, basta solicitar o reembolso com 1 clique e devolvemos 100% do valor.'
    }
  ]

  return (
    <div className="min-h-screen bg-[#FAFAF9] dark:bg-[#0B0F17] text-stone-900 dark:text-slate-100 font-sans transition-colors selection:bg-blue-600 selection:text-white">
      {/* 1. ANNOUNCEMENT TOP BAR */}
      <div className="bg-stone-900 text-white dark:bg-blue-950/80 dark:border-b dark:border-blue-900/40 text-xs py-2 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-2.5 text-center">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-600 text-[10px] font-extrabold uppercase tracking-wider">
            NOVIDADE v2.1
          </span>
          <span className="text-stone-200">
            Extensão oficial do Chrome atualizada com links instantâneos <strong className="text-white">meli.la</strong> e proteção anti-bloqueio.
          </span>
          <a
            href="#pricing"
            className="hidden sm:inline-flex items-center gap-1 font-bold text-blue-400 hover:text-blue-300 underline underline-offset-2 ml-1"
          >
            Ver Planos <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* 2. FLOATING WIREFRAME NAVBAR */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/85 dark:bg-[#0B0F17]/85 border-b border-stone-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo Oficial */}
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Afiliado Automático" className="h-7 w-auto block" />
          </div>

          {/* Links Centrais */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-stone-600">
            <a href="#features" className="hover:text-stone-900 transition-colors">Recursos</a>
            <a href="#demo" className="hover:text-stone-900 transition-colors">Demonstração</a>
            <a href="#pricing" className="hover:text-stone-900 transition-colors">Planos & Preços</a>
            <a href="#testimonials" className="hover:text-stone-900 transition-colors">Depoimentos</a>
            <a href="#faq" className="hover:text-stone-900 transition-colors">Dúvidas</a>
          </nav>

          {/* Ações na Direita */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={onGoToDashboard}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span>Acessar Painel</span>
                </button>

                <button
                  type="button"
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-bold transition-all cursor-pointer"
                  title="Sair da conta"
                >
                  <LogOut className="h-3.5 w-3.5 text-stone-500" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-100 transition-all cursor-pointer"
                >
                  <span>Entrar</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenAuth('register')}
                  className="hidden sm:inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <span>Criar Conta</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-stone-200/80 dark:border-slate-800/80 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-100 dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700 text-xs font-bold text-stone-800 dark:text-slate-200 shadow-2xs">
            <ChromeLogo className="h-4 w-4" />
            <span>Extensão Oficial Chrome com IA Integrada</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-stone-900 dark:text-white leading-[1.12]">
            Transforme grupos de WhatsApp no seu próximo{' '}
            <span className="relative inline-block text-blue-600 dark:text-blue-400">
              canal de receita
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 250 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 5.5C50 2 150 2 249 5.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-stone-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Curadoria inteligente de produtos, geração automática de links de afiliado com sua comissão e disparos com proteção anti-bloqueio direto pelo navegador.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {user ? (
              <button
                type="button"
                onClick={onGoToDashboard}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-xl shadow-blue-500/25 transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Acessar Meu Painel</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-xl shadow-blue-500/25 transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <span>Criar Conta Grátis</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            <a
              href="/afiliado-automatico.zip"
              download="afiliado-automatico.zip"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white border border-stone-300 text-stone-800 font-bold text-sm shadow-xs hover:bg-stone-50 transition-all"
            >
              <ChromeLogo className="h-4 w-4" />
              <span>Baixar Extensão (.ZIP)</span>
            </a>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-stone-500 dark:text-slate-400">
            <div className="flex -space-x-2 overflow-hidden">
              <img className="inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="Afiliado" />
              <img className="inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" alt="Afiliado" />
              <img className="inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover" src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80" alt="Afiliado" />
              <img className="inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover" src="https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=80" alt="Afiliado" />
            </div>
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            </div>
            <span className="font-semibold text-stone-700 dark:text-slate-300">
              4.9/5 estrelas • Mais de 1.840 afiliados ativos no Brasil
            </span>
          </div>
        </div>

        {/* 4. SHOWCASE INTERATIVO FIDEDIGNO À FERRAMENTA REAL */}
        <div id="demo" className="mt-14 max-w-5xl mx-auto px-4 sm:px-6">
          <InteractiveDemo />
        </div>
      </section>

      {/* 5. LOGOTIPOS OFICIAIS MAIORES COM ANIMAÇÃO MARQUEE PASSANDO PARA O LADO */}
      <section className="py-12 border-b border-stone-200/80 dark:border-slate-800/80 bg-stone-100/50 dark:bg-slate-900/40 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-6 text-center">
          <p className="text-xs font-black uppercase tracking-wider text-stone-500 dark:text-slate-400">
            Compatível e integrado com as maiores plataformas de e-commerce do mundo
          </p>
        </div>

        {/* Marquee Horizontal Contínuo com Logos Livres e Sem Caixa Branca */}
        <div className="relative w-full overflow-hidden py-4">
          <Marquee pauseOnHover repeat={4} className="[--duration:28s] [--gap:4rem]">
            <div className="flex items-center gap-14 sm:gap-20 px-6">
              <MercadoLivreLogo className="h-9 sm:h-12 w-auto" />
              <ShopeeLogo className="h-9 sm:h-12 w-auto" />
              <AmazonLogo className="h-9 sm:h-12 w-auto" />
              <WhatsAppLogo className="h-9 sm:h-12 w-auto" />
              <GoogleChromeWordmark className="h-9 sm:h-12 w-auto" />
            </div>
          </Marquee>

          {/* Fade nas bordas laterais do marquee */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-stone-100 dark:from-[#0c111c] to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-stone-100 dark:from-[#0c111c] to-transparent z-10" />
        </div>
      </section>

      {/* 6. BENTO GRID DE RECURSOS */}
      <section id="features" className="py-16 sm:py-24 border-b border-stone-200/80 dark:border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              RECURSOS COMPLETOS
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-stone-900 dark:text-white tracking-tight">
              Tudo o que você precisa para dominar grupos de afiliados
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400">
              Elimine o trabalho manual repetitivo e escale sua comissão em tempo recorde.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-3xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-6 sm:p-7 space-y-4">
              <div className="h-10 w-10 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900 dark:text-white">
                Captura & Encurtador em 1 Clique
              </h3>
              <p className="text-xs text-stone-600 dark:text-slate-400 leading-relaxed">
                Acesse a página do produto no Mercado Livre ou Shopee. A extensão extrai o preço, calcula a comissão e gera o link oficial curto <strong className="text-blue-600 dark:text-blue-400">meli.la</strong> com a sua tag de afiliado automaticamente.
              </p>
            </div>

            <div className="rounded-3xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-6 sm:p-7 space-y-4">
              <div className="h-10 w-10 rounded-2xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900 dark:text-white">
                Inteligência Artificial Persuasiva
              </h3>
              <p className="text-xs text-stone-600 dark:text-slate-400 leading-relaxed">
                Chega de bloqueio criativo. Gere chamadas de alta conversão usando os maiores gatilhos mentais do e-commerce: menor preço do ano, frete grátis, cupons relâmpago e escassez de estoque.
              </p>
            </div>

            <div className="rounded-3xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-6 sm:p-7 space-y-4">
              <div className="h-10 w-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900 dark:text-white">
                Algoritmo Anti-Bloqueio Seguro
              </h3>
              <p className="text-xs text-stone-600 dark:text-slate-400 leading-relaxed">
                Envios com delays aleatórios programados entre mensagens para manter a integridade do seu chip 100% protegida, simulando o ritmo de digitação humana.
              </p>
            </div>

            <div className="rounded-3xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-6 sm:p-7 space-y-4">
              <div className="h-10 w-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900 dark:text-white">
                Controle Rígido de Grupos Cadastrados
              </h3>
              <p className="text-xs text-stone-600 dark:text-slate-400 leading-relaxed">
                Mantenha seus disparos organizados conforme seu plano: Starter (1 grupo), Pro (5 grupos) ou Ultra (10 grupos). Envie apenas para suas comunidades oficiais de forma rápida.
              </p>
            </div>

            <div className="rounded-3xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-6 sm:p-7 space-y-4">
              <div className="h-10 w-10 rounded-2xl bg-red-50 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900 dark:text-white">
                Zero Gastos com Servidor Externo
              </h3>
              <p className="text-xs text-stone-600 dark:text-slate-400 leading-relaxed">
                Esqueça configurações de VPS, servidores Linux ou APIs caras. O pacote roda de forma nativa no seu Chrome, sem custos adicionais de hospedagem.
              </p>
            </div>

            <div className="rounded-3xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-6 sm:p-7 space-y-4">
              <div className="h-10 w-10 rounded-2xl bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900 dark:text-white">
                Dashboard de Vendas & ROI
              </h3>
              <p className="text-xs text-stone-600 dark:text-slate-400 leading-relaxed">
                Tenha clareza absoluta de quais ofertas geraram mais cliques, quais produtos venderam melhor e qual foi o lucro líquido da sua operação em cada dia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PLANOS & PREÇOS (Design do prompt com NumberFlow, Cakto e Switch Otimizado) */}
      <section id="pricing" className="border-b border-stone-200/80 dark:border-slate-800/80 bg-stone-100/40 dark:bg-slate-950/20">
        <PricingSection />
      </section>

      {/* 8. DEPOIMENTOS COM ANIMAÇÃO 3D PERSPECTIVE MARQUEE (Transição Suave & Avaliações do Brasil) */}
      <section id="testimonials" className="relative py-16 sm:py-24 bg-gradient-to-b from-stone-100/60 via-stone-50/50 to-stone-100/60 dark:from-slate-950/40 dark:via-slate-900/30 dark:to-slate-950/50 overflow-hidden border-b border-stone-200/60 dark:border-slate-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6 relative z-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              QUEM USA, APROVA
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-stone-900 dark:text-white tracking-tight">
              Afiliados brasileiros que escalaram seus resultados
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400">
              Veja o que membros reais dizem sobre a extensão e os resultados obtidos em seus grupos de WhatsApp.
            </p>
          </div>

          <ThreeDTestimonials />
        </div>
      </section>

      {/* 9. FAQ COM DESIGN MODERNO E LIMPO */}
      <section id="faq" className="py-16 sm:py-24 border-b border-stone-200/80 dark:border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              CENTRAL DE DÚVIDAS
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-stone-900 dark:text-white tracking-tight">
              Tudo o que você precisa saber antes de assinar
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400">
              Respostas claras e transparentes para você começar com total segurança.
            </p>
          </div>

          <div className="space-y-3.5">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  openFaq === idx
                    ? 'border-blue-500 bg-white dark:bg-slate-900 shadow-md'
                    : 'border-stone-200/90 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:border-stone-300 dark:hover:border-slate-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-5 sm:p-6 text-left text-xs sm:text-sm font-bold text-stone-900 dark:text-white transition-colors cursor-pointer gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex-shrink-0 h-6 w-6 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 font-mono text-xs flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span>{faq.q}</span>
                  </div>
                  {openFaq === idx ? (
                    <ChevronUp className="h-4 w-4 flex-shrink-0 text-blue-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 flex-shrink-0 text-stone-400" />
                  )}
                </button>

                {openFaq === idx && (
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-xs text-stone-600 dark:text-slate-300 leading-relaxed border-t border-stone-100 dark:border-slate-800/80 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Dúvida adicional com Suporte WhatsApp */}
          <div className="p-4 rounded-2xl bg-stone-100 dark:bg-slate-800/60 border border-stone-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <MessageCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              <span className="text-stone-700 dark:text-slate-300">
                Ainda tem alguma dúvida específica? Fale agora mesmo com nossa equipe de suporte.
              </span>
            </div>
            <a
              href="https://wa.me/5511999999999"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-xs flex-shrink-0"
            >
              <WhatsAppLogo className="h-3.5 w-auto" />
              <span>Chamar no WhatsApp</span>
            </a>
          </div>
        </div>
      </section>

      {/* 10. NOVO RODAPÉ PREMIUM (Substitui o rodapé simples, eliminando a sessão duplicada) */}
      <footer className="bg-stone-900 text-stone-300 dark:bg-[#070A10] dark:text-slate-400 text-xs pt-16 pb-12 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          {/* Grid Principal com 5 Colunas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Coluna 1: Marca & Confiança */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <img src="/logo-dark.png" alt="Afiliado Automático" className="h-7 w-auto" />
              </div>
              <p className="text-xs text-stone-400 leading-relaxed max-w-sm">
                A plataforma de automação mais completa para afiliados Mercado Livre, Shopee e Amazon. Curadoria de ofertas, links curtos com tag e disparos no WhatsApp Web sem VPS.
              </p>

              <div className="space-y-2 pt-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-800 dark:bg-slate-900 border border-stone-700 text-[11px] text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Todos os serviços operando 100%</span>
                </div>
                <div className="text-[11px] text-stone-400 block">
                  Segurança e pagamentos assegurados pela Cakto Pagamentos.
                </div>
              </div>
            </div>

            {/* Coluna 2: Produto */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-white">Produto</h4>
              <ul className="space-y-2 text-stone-400">
                <li><a href="#demo" className="hover:text-white transition-colors">Extensão Google Chrome</a></li>
                <li><a href="#demo" className="hover:text-white transition-colors">Encurtador meli.la & s.shopee</a></li>
                <li><a href="#demo" className="hover:text-white transition-colors">Estúdio de Copys (IA)</a></li>
                <li><a href="#demo" className="hover:text-white transition-colors">Disparos WhatsApp Web</a></li>
                <li><a href="#demo" className="hover:text-white transition-colors">Dashboard de Comissões</a></li>
              </ul>
            </div>

            {/* Coluna 3: Planos */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-white">Planos Oficiais</h4>
              <ul className="space-y-2 text-stone-400">
                <li><a href="#pricing" className="hover:text-white transition-colors">Plano Starter (1 Grupo)</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Plano Pro (5 Grupos)</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Plano Ultra (10 Grupos)</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Garantia de 7 Dias</a></li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      if (user) onGoToDashboard()
                      else onOpenAuth('login')
                    }}
                    className="text-blue-400 hover:underline font-bold text-left cursor-pointer"
                  >
                    Área do Assinante →
                  </button>
                </li>
              </ul>
            </div>

            {/* Coluna 4: Suporte & Legal */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-white">Suporte & Legal</h4>
              <ul className="space-y-2 text-stone-400">
                <li><a href="#faq" className="hover:text-white transition-colors">Central de Dúvidas</a></li>
                <li><a href="https://wa.me/5511999999999" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Atendimento WhatsApp</a></li>
                <li><a href="/afiliado-automatico.zip" download="afiliado-automatico.zip" className="hover:text-white transition-colors">Download Extensão (.ZIP)</a></li>
                <li><span className="text-stone-500">Termos de Serviço</span></li>
                <li><span className="text-stone-500">Política de Privacidade</span></li>
              </ul>
            </div>
          </div>

          {/* Formas de Pagamento e Selos */}
          <div className="pt-8 border-t border-stone-800 flex flex-wrap items-center justify-between gap-4 text-xs text-stone-400">
            <div className="flex items-center gap-3">
              <span className="font-bold text-stone-300">Pagamento 100% Seguro:</span>
              <span className="px-2 py-0.5 rounded bg-stone-800 text-[10px] font-bold text-emerald-400 border border-stone-700">PIX Instantâneo</span>
              <span className="px-2 py-0.5 rounded bg-stone-800 text-[10px] font-bold text-blue-400 border border-stone-700">Cartão até 12x</span>
              <span className="px-2 py-0.5 rounded bg-stone-800 text-[10px] font-bold text-stone-300 border border-stone-700">Boleto Bancário</span>
            </div>

            <div className="text-[11px] text-stone-500">
              © 2026 Afiliado Automático. Todos os direitos reservados.
            </div>
          </div>

          {/* Disclaimer Legal Obrigatório */}
          <div className="text-[10px] text-stone-500 leading-relaxed border-t border-stone-800/60 pt-6">
            Aviso legal: O Afiliado Automático é uma plataforma independente de software e automação e não possui vínculo direto, patrocínio ou endosso da Mercado Livre S.R.L., Shopee Pte. Ltd., Amazon.com Inc. ou Meta Platforms Inc. Todas as marcas, logotipos e nomes citados pertencem aos seus respectivos proprietários e são utilizados apenas para fins de identificação de compatibilidade.
          </div>
        </div>
      </footer>
    </div>
  )
}
