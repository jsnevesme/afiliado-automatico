import React, { useRef, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { TimelineContent } from '@/components/ui/timeline-animation'
import NumberFlow from '@number-flow/react'
import {
  Layers,
  Send,
  Sparkles,
  ShieldCheck,
  Zap,
  BarChart3,
  CheckCheck,
  XCircle,
  ArrowRight,
  CreditCard,
  Lock,
  Clock
} from 'lucide-react'
import { motion } from 'motion/react'

const plans = [
  {
    name: 'Starter',
    badge: 'Iniciante',
    description: 'Ideal para validar suas primeiras ofertas automáticas e faturar comissões no piloto automático.',
    price: 39.90, // R$ 39,90/mês
    yearlyInstallment: 20.65, // 12x de R$ 20,65 no checkout Cakto
    yearlyTotal: 199.90, // R$ 199,90 à vista no checkout Cakto
    discountBadge: 'Economize 58%',
    buttonText: 'Começar no Starter',
    buttonVariant: 'outline',
    checkoutMonthly: 'https://pay.cakto.com.br/fajichq_1260860',
    checkoutYearly: 'https://pay.cakto.com.br/bi9dwyf',
    popular: false,
    features: [
      { text: 'Inclui 3 dias de avaliação gratuita', icon: <Sparkles size={18} className="text-emerald-500" /> },
      { text: '1 Grupo de WhatsApp cadastrado', icon: <Layers size={18} className="text-blue-500" /> },
      { text: 'Disparos de 1 plataforma (ex: Mercado Livre)', icon: <Send size={18} className="text-amber-500" /> },
      { text: 'IA CopyStudio integrada para copys de alta conversão', icon: <Sparkles size={18} className="text-blue-500" /> },
      { text: 'Extensão Oficial do Chrome com 1 clique', icon: <Zap size={18} className="text-emerald-500" /> },
      { text: 'Encurtador oficial com sua tag de afiliado (meli.la)', icon: <ShieldCheck size={18} className="text-blue-500" /> },
    ],
    includes: [
      'O que está incluso:',
      '3 dias de teste grátis sem compromisso',
      '1 grupo de WhatsApp conectado',
      'Disparos de 1 plataforma selecionada',
      'Extrator instantâneo de dados e fotos',
      'Cálculo automático de comissão por categoria',
      'Intervalo anti-bloqueio nativo',
    ],
    limitations: [
      'Limitações do Starter:',
      'Apenas 1 plataforma por vez (ex: só Mercado Livre)',
      'Sem Consultor Estratégico de IA (exclusivo Pro/Ultra)',
      'Limite estrito de 1 grupo cadastrado',
    ],
  },
  {
    name: 'Pro',
    badge: 'MAIS ESCOLHIDO',
    description: 'O plano mais vendido. Potência para gerenciar múltiplos grupos e faturar todos os dias no piloto automático.',
    price: 69.90, // R$ 69,90/mês
    yearlyInstallment: 61.96, // 12x de R$ 61,96 no checkout Cakto
    yearlyTotal: 599.90, // R$ 599,90 à vista no checkout Cakto
    discountBadge: 'Economize 28%',
    buttonText: 'Assinar Plano Pro',
    buttonVariant: 'default',
    checkoutMonthly: 'https://pay.cakto.com.br/x3whytm',
    checkoutYearly: 'https://pay.cakto.com.br/685h3or',
    popular: true,
    features: [
      { text: 'Até 5 Grupos de WhatsApp simultâneos', icon: <Layers size={18} className="text-blue-500" /> },
      { text: 'Todas as 3 plataformas (Mercado Livre + Shopee + Amazon)', icon: <Send size={18} className="text-blue-500" /> },
      { text: 'Consultor Estratégico de IA incluso', icon: <Sparkles size={18} className="text-purple-500" /> },
      { text: 'Simulador Anti-bloqueio inteligente (12s a 25s)', icon: <ShieldCheck size={18} className="text-emerald-500" /> },
      { text: 'IA CopyStudio ilimitada com 4 tons de conversão', icon: <Zap size={18} className="text-blue-500" /> },
      { text: 'Dashboard de Vendas Diárias & Relatórios de ROI', icon: <BarChart3 size={18} className="text-blue-500" /> },
    ],
    includes: [
      'Tudo do Starter, mais:',
      'Até 5 grupos gerenciados simultaneamente',
      'Mercado Livre + Shopee + Amazon liberados',
      'Consultor Estratégico de IA exclusivo',
      'Histórico completo de cliques e conversões',
      'Suporte prioritário direto no WhatsApp',
    ],
    limitations: null,
  },
  {
    name: 'Ultra',
    badge: 'PODER MÁXIMO',
    description: 'Escala total para grandes afiliados, agências e redes profissionais com alto volume de vendas.',
    price: 89.90, // R$ 89,90/mês
    yearlyInstallment: 72.29, // 12x de R$ 72,29 no checkout Cakto
    yearlyTotal: 699.90, // R$ 699,90 à vista no checkout Cakto
    discountBadge: 'Economize 35%',
    buttonText: 'Assinar Plano Ultra',
    buttonVariant: 'outline',
    checkoutMonthly: 'https://pay.cakto.com.br/3anjzu2',
    checkoutYearly: 'https://pay.cakto.com.br/rfxsekm',
    popular: false,
    features: [
      { text: 'Até 10 Grupos de WhatsApp conectados', icon: <Layers size={18} className="text-emerald-500" /> },
      { text: 'Todas as plataformas 100% liberadas', icon: <Send size={18} className="text-emerald-500" /> },
      { text: 'Consultor Estratégico de IA VIP sem limites', icon: <Sparkles size={18} className="text-purple-500" /> },
      { text: 'Fila prioritária máxima de processamento de disparos', icon: <Zap size={18} className="text-amber-500" /> },
      { text: 'Métricas avançadas de conversão por grupo e por hora', icon: <BarChart3 size={18} className="text-emerald-500" /> },
      { text: 'Suporte VIP 24/7 com gerente de conta dedicado', icon: <ShieldCheck size={18} className="text-emerald-500" /> },
    ],
    includes: [
      'Tudo do Pro, mais:',
      'Capacidade de até 10 grupos lotados',
      'Processamento prioritário instantâneo',
      'Acesso antecipado a novas ferramentas e integrações',
      'Consultoria individual de escala de comissões',
    ],
    limitations: null,
  },
]

const PricingSwitch = ({ onSwitch }) => {
  const [selected, setSelected] = useState('0')

  const handleSwitch = (value) => {
    setSelected(value)
    onSwitch(value)
  }

  return (
    <div className="flex justify-center">
      <div className="relative z-20 mx-auto flex w-fit rounded-full bg-stone-100 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 p-1 shadow-inner">
        <button
          type="button"
          onClick={() => handleSwitch('0')}
          className={`relative z-10 w-fit sm:h-11 h-9 rounded-full sm:px-6 px-4 font-bold text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center ${
            selected === '0'
              ? 'text-white'
              : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
          }`}
        >
          {selected === '0' && (
            <motion.span
              layoutId="switch-pricing"
              className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-500/30"
              transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            />
          )}
          <span className="relative">Cobrança Mensal</span>
        </button>

        <button
          type="button"
          onClick={() => handleSwitch('1')}
          className={`relative z-10 w-fit sm:h-11 h-9 flex-shrink-0 rounded-full sm:px-6 px-4 font-bold text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center ${
            selected === '1'
              ? 'text-white'
              : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
          }`}
        >
          {selected === '1' && (
            <motion.span
              layoutId="switch-pricing"
              className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-500/30"
              transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            />
          )}
          <span className="relative flex items-center gap-1.5">
            Cobrança Anual
            <span className="rounded-full bg-emerald-500 text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wide">
              Até 58% OFF
            </span>
          </span>
        </button>
      </div>
    </div>
  )
}

export default function PricingSection() {
  const [isYearly, setIsYearly] = useState(false)
  const pricingRef = useRef(null)

  const togglePricingPeriod = (value) => setIsYearly(Number.parseInt(value, 10) === 1)

  const handleCheckout = (plan) => {
    const url = isYearly ? plan.checkoutYearly : plan.checkoutMonthly
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="px-4 py-16 sm:py-24 mx-auto relative overflow-hidden" ref={pricingRef}>
      {/* Glow suave e otimizado ao fundo */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full blur-3xl opacity-20 dark:opacity-25 bg-gradient-to-b from-blue-500 via-indigo-500 to-transparent"
      />

      <div className="text-center mb-8 max-w-3xl mx-auto space-y-3 relative z-10">
        <TimelineContent
          as="span"
          animationNum={0}
          timelineRef={pricingRef}
          className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block"
        >
          INVESTIMENTO INTELIGENTE & TRANSPARENTE
        </TimelineContent>

        <TimelineContent
          as="h2"
          animationNum={1}
          timelineRef={pricingRef}
          className="text-2xl sm:text-4xl md:text-5xl font-black text-stone-900 dark:text-white tracking-tight"
        >
          Escolha o plano perfeito para o seu{' '}
          <span className="border border-dashed border-blue-500/70 px-2.5 py-0.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 capitalize inline-block">
            faturamento
          </span>
        </TimelineContent>

        <TimelineContent
          as="p"
          animationNum={2}
          timelineRef={pricingRef}
          className="sm:text-sm text-xs text-stone-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed"
        >
          Valores sincronizados diretamente com o checkout oficial da Cakto. Sem taxas ocultas, contratos ou fidelidade. Cancele quando quiser com 1 clique.
        </TimelineContent>
      </div>

      <TimelineContent
        as="div"
        animationNum={3}
        timelineRef={pricingRef}
        className="relative z-10 mb-8"
      >
        <PricingSwitch onSwitch={togglePricingPeriod} />
      </TimelineContent>

      <div className="grid md:grid-cols-3 max-w-6xl gap-6 py-4 mx-auto relative z-10 items-stretch">
        {plans.map((plan, index) => (
          <TimelineContent
            key={plan.name}
            as="div"
            animationNum={4 + index}
            timelineRef={pricingRef}
            className="flex"
          >
            <Card
              className={`relative flex flex-col justify-between w-full rounded-3xl transition-all duration-300 ${
                plan.popular
                  ? 'border-2 border-blue-500 bg-white dark:bg-slate-900 shadow-xl shadow-blue-500/10 md:-translate-y-2'
                  : 'border border-stone-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/80 shadow-md hover:border-stone-300 dark:hover:border-slate-700'
              }`}
            >
              <CardHeader className="text-left p-6 sm:p-7 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-black text-stone-900 dark:text-white">
                    {plan.name}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black tracking-wide ${
                      plan.popular
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                        : 'bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300'
                    }`}
                  >
                    {plan.badge}
                  </span>
                </div>

                <p className="text-xs text-stone-500 dark:text-slate-400 mb-5 leading-relaxed min-h-[36px]">
                  {plan.description}
                </p>

                <div className="flex items-baseline gap-1 pt-2 border-t border-stone-100 dark:border-slate-800/80">
                  <span className="text-xs sm:text-sm font-bold text-stone-500 dark:text-slate-400">
                    {isYearly ? '12x de R$' : 'R$'}
                  </span>
                  <NumberFlow
                    value={isYearly ? plan.yearlyInstallment : plan.price}
                    format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                    className={`text-4xl sm:text-5xl font-black tracking-tight ${
                      plan.popular ? 'text-blue-600 dark:text-blue-400' : 'text-stone-900 dark:text-white'
                    }`}
                  />
                  <span className="text-xs font-bold text-stone-500 dark:text-slate-400 ml-1">
                    {isYearly ? '/mês' : '/mês'}
                  </span>
                </div>

                <div className="mt-1 flex items-center justify-between text-[11px]">
                  <span className="text-stone-500 dark:text-slate-400 font-medium">
                    {isYearly
                      ? `R$ ${plan.yearlyTotal.toFixed(2).replace('.', ',')} à vista no ano`
                      : 'Cobrança mensal recorrente'}
                  </span>
                  {isYearly && (
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full text-[10px]">
                      {plan.discountBadge}
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-6 sm:p-7 pt-2 flex flex-col justify-between flex-1 space-y-6">
                <div>
                  <button
                    type="button"
                    onClick={() => handleCheckout(plan)}
                    className={`w-full py-3.5 px-4 text-xs sm:text-sm font-extrabold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                      plan.popular
                        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-blue-500/25 hover:opacity-95 hover:scale-[1.01]'
                        : 'bg-stone-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white hover:scale-[1.01]'
                    }`}
                  >
                    <span>{plan.buttonText}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <ul className="space-y-3 font-medium py-5 border-b border-stone-100 dark:border-slate-800/80">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start text-xs text-stone-700 dark:text-slate-300">
                        <span className="mt-0.5 mr-2.5 flex-shrink-0">
                          {feature.icon}
                        </span>
                        <span className="leading-snug">{feature.text}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-4 space-y-2.5">
                    <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-stone-900 dark:text-slate-200">
                      {plan.includes[0]}
                    </h4>
                    <ul className="space-y-2">
                      {plan.includes.slice(1).map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center text-xs text-stone-600 dark:text-slate-400">
                          <span className="h-4 w-4 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-500 rounded-full grid place-content-center mr-2.5 flex-shrink-0">
                            <CheckCheck className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                          </span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Limitações claras (Starter) */}
                  {plan.limitations && (
                    <div className="pt-4 mt-4 border-t border-stone-100 dark:border-slate-800/80 space-y-2">
                      <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        {plan.limitations[0]}
                      </h4>
                      <ul className="space-y-1.5">
                        {plan.limitations.slice(1).map((limit, limitIdx) => (
                          <li key={limitIdx} className="flex items-start text-xs text-stone-500 dark:text-slate-400">
                            <XCircle className="h-3.5 w-3.5 text-amber-500 mt-0.5 mr-2.5 flex-shrink-0" />
                            <span>{limit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TimelineContent>
        ))}
      </div>

      {/* Selos de Segurança sob os Planos */}
      <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-stone-500 dark:text-slate-400 relative z-10">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Checkout 100% Criptografado Cakto</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CreditCard className="h-4 w-4 text-blue-500" />
          <span>Pix Instantâneo ou Cartão até 12x</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-amber-500" />
          <span>Liberação Imediata da Conta</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Lock className="h-4 w-4 text-purple-500" />
          <span>Garantia Incondicional de 7 Dias</span>
        </div>
      </div>
    </div>
  )
}
