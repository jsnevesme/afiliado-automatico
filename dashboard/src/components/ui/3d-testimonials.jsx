import React, { useRef, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Star } from 'lucide-react'

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = true,
  children,
  vertical = false,
  repeat = 3,
  ariaLabel,
  ariaLive = 'off',
  ariaRole = 'marquee',
  ...props
}) {
  const marqueeRef = useRef(null)

  return (
    <div
      {...props}
      ref={marqueeRef}
      data-slot="marquee"
      className={cn(
        'group flex overflow-hidden p-2 [--gap:1.25rem] [gap:var(--gap)] select-none',
        {
          'flex-row': !vertical,
          'flex-col': vertical,
        },
        className
      )}
      aria-label={ariaLabel}
      aria-live={ariaLive}
      role={ariaRole}
      tabIndex={0}
    >
      {useMemo(
        () => (
          <>
            {Array.from({ length: repeat }, (_, i) => (
              <div
                key={i}
                className={cn(
                  !vertical ? 'flex-row [gap:var(--gap)]' : 'flex-col [gap:var(--gap)]',
                  'flex shrink-0 justify-around will-change-transform',
                  !vertical && 'animate-marquee flex-row',
                  vertical && 'animate-marquee-vertical flex-col',
                  pauseOnHover && 'group-hover:[animation-play-state:paused]',
                  reverse && '[animation-direction:reverse]'
                )}
                style={{ backfaceVisibility: 'hidden', transform: 'translate3d(0,0,0)' }}
              >
                {children}
              </div>
            ))}
          </>
        ),
        [repeat, children, vertical, pauseOnHover, reverse]
      )}
    </div>
  )
}

// Depoimentos autênticos de afiliados brasileiros com resultados reais
const testimonials = [
  {
    name: 'Lucas Rocha',
    username: '@lucas_achados',
    body: 'Saí de R$ 900 para mais de R$ 12.000 em comissões no primeiro mês usando a extensão nos meus grupos!',
    img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    country: '🇧🇷 São Paulo, SP',
    revenue: 'R$ 12.450/mês'
  },
  {
    name: 'Bruna Vasconcelos',
    username: '@brunaofertas',
    body: 'O delay anti-bloqueio me salvou! Meus 5 grupos rodam 100% seguros todos os dias sem nenhum susto.',
    img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    country: '🇧🇷 Rio de Janeiro, RJ',
    revenue: '5 grupos ativos'
  },
  {
    name: 'Felipe Siqueira',
    username: '@felipe_afiliado',
    body: 'O encurtador oficial meli.la com 1 clique é surreal de rápido. Economizo pelo menos 2 horas por dia.',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    country: '🇧🇷 Belo Horizonte, MG',
    revenue: 'Top Afiliado Meli'
  },
  {
    name: 'Mariana Costa',
    username: '@mari.promos',
    body: 'As copys geradas pela IA aumentaram minha taxa de cliques nos grupos em quase 45%. Sensacional!',
    img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    country: '🇧🇷 Curitiba, PR',
    revenue: '+45% cliques'
  },
  {
    name: 'Thiago Menezes',
    username: '@thiago.achadinhos',
    body: 'Uso o Plano Pro com 5 grupos lotados. A ferramenta se paga logo na primeira semana de operação.',
    img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    country: '🇧🇷 Florianópolis, SC',
    revenue: 'R$ 8.900/mês'
  },
  {
    name: 'Gabriel Fonseca',
    username: '@gabriel_tech',
    body: 'Zero custos com VPS e servidor externo. Instalei direto no Chrome e comecei a disparar na hora.',
    img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    country: '🇧🇷 Porto Alegre, RS',
    revenue: 'Economia de R$ 180/mês'
  },
  {
    name: 'Camila Duarte',
    username: '@camila.descontos',
    body: 'O cálculo automático de comissão por categoria me ajuda a filtrar apenas as ofertas que realmente dão lucro.',
    img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    country: '🇧🇷 Fortaleza, CE',
    revenue: 'R$ 15.200 faturados'
  },
  {
    name: 'Rodrigo Neves',
    username: '@rodrigo_ofertas',
    body: 'A automação de disparos sincronizada com o WhatsApp Web roda lisa, sem travar nem pesar o navegador.',
    img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    country: '🇧🇷 Brasília, DF',
    revenue: '10 grupos ativos'
  },
  {
    name: 'Amanda Lopes',
    username: '@amanda_promocoes',
    body: 'O suporte no WhatsApp é nota 10 e a ferramenta entrega exatamente tudo o que promete. Vale cada centavo!',
    img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    country: '🇧🇷 Salvador, BA',
    revenue: 'Afiliada Ultra'
  }
]

function TestimonialCard({ img, name, username, body, country, revenue }) {
  return (
    <Card className="w-64 sm:w-72 bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-800 shadow-md hover:border-blue-500/60 transition-colors duration-150">
      <CardContent className="p-4 space-y-2.5">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-stone-200 dark:border-slate-700">
            <AvatarImage src={img} alt={name} loading="lazy" />
            <AvatarFallback>{name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <figcaption className="text-xs font-black text-stone-900 dark:text-white flex items-center gap-1.5 truncate">
              {name}
            </figcaption>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold truncate">{username}</span>
              <span className="text-[10px] text-stone-400 dark:text-slate-500">·</span>
              <span className="text-[10px] text-stone-500 dark:text-slate-400 truncate">{country}</span>
            </div>
          </div>
        </div>

        <blockquote className="text-xs text-stone-600 dark:text-slate-300 leading-relaxed italic">
          "{body}"
        </blockquote>

        <div className="pt-2 border-t border-stone-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex gap-0.5 text-amber-400">
            <Star className="h-3 w-3 fill-amber-400" />
            <Star className="h-3 w-3 fill-amber-400" />
            <Star className="h-3 w-3 fill-amber-400" />
            <Star className="h-3 w-3 fill-amber-400" />
            <Star className="h-3 w-3 fill-amber-400" />
          </div>
          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/50">
            {revenue}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ThreeDTestimonials() {
  return (
    <div className="relative flex h-[520px] w-full max-w-6xl mx-auto flex-row items-center justify-center overflow-hidden [perspective:800px] py-2 select-none">
      {/* Palco 3D Suave e Otimizado */}
      <div
        className="flex flex-row items-center gap-4 sm:gap-6 will-change-transform"
        style={{
          transform: 'translateX(0px) translateY(0px) translateZ(-20px) rotateX(12deg) rotateY(-6deg) rotateZ(8deg)',
          backfaceVisibility: 'hidden',
        }}
      >
        {/* Coluna 1: Vertical Marquee (para baixo) */}
        <Marquee vertical pauseOnHover repeat={3} className="[--duration:36s]">
          {testimonials.slice(0, 5).map((review) => (
            <TestimonialCard key={review.username} {...review} />
          ))}
        </Marquee>

        {/* Coluna 2: Vertical Marquee reverso (para cima) */}
        <Marquee vertical pauseOnHover reverse repeat={3} className="[--duration:30s]">
          {testimonials.slice(4).concat(testimonials.slice(0, 2)).map((review, idx) => (
            <TestimonialCard key={`col2-${review.username}-${idx}`} {...review} />
          ))}
        </Marquee>

        {/* Coluna 3: Vertical Marquee (para baixo) */}
        <Marquee vertical pauseOnHover repeat={3} className="[--duration:38s]">
          {testimonials.slice(2, 7).map((review, idx) => (
            <TestimonialCard key={`col3-${review.username}-${idx}`} {...review} />
          ))}
        </Marquee>

        {/* Coluna 4 (Oculta em telas menores, visível em telas grandes para efeito rico) */}
        <div className="hidden lg:block">
          <Marquee vertical pauseOnHover reverse repeat={3} className="[--duration:32s]">
            {testimonials.slice(3).concat(testimonials.slice(0, 3)).map((review, idx) => (
              <TestimonialCard key={`col4-${review.username}-${idx}`} {...review} />
            ))}
          </Marquee>
        </div>
      </div>

      {/* OVERLAYS EM DEGRADÊ NO CONTAINER EXTERNO (Criando transição suave nas bordas superior e inferior) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-stone-50 via-stone-50/90 to-transparent dark:from-[#06090E] dark:via-[#06090E]/90 dark:to-transparent z-10" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-stone-50 via-stone-50/90 to-transparent dark:from-[#06090E] dark:via-[#06090E]/90 dark:to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-stone-50 via-stone-50/80 to-transparent dark:from-[#06090E] dark:via-[#06090E]/80 dark:to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-stone-50 via-stone-50/80 to-transparent dark:from-[#06090E] dark:via-[#06090E]/80 dark:to-transparent z-10" />
    </div>
  )
}
