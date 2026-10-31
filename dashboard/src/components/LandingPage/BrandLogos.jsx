import React from 'react'
import ChromeLogo from '../ChromeLogo'

export { ChromeLogo }

// 1. MERCADO LIVRE (Logotipo Oficial enviado pelo usuário, fundo transparente, livre)
export function MercadoLivreLogo({ className = 'h-10 sm:h-12 w-auto' }) {
  return (
    <img
      src="/brands/mercadolivre.png"
      alt="Mercado Livre"
      className={`${className} object-contain transition-transform hover:scale-105 duration-200 select-none flex-shrink-0`}
      loading="eager"
    />
  )
}

// 2. SHOPEE (Logotipo Oficial enviado pelo usuário, fundo transparente, livre)
export function ShopeeLogo({ className = 'h-10 sm:h-12 w-auto' }) {
  return (
    <img
      src="/brands/shopee.png"
      alt="Shopee"
      className={`${className} object-contain transition-transform hover:scale-105 duration-200 select-none flex-shrink-0`}
      loading="eager"
    />
  )
}

// 3. AMAZON (Logotipo Oficial enviado pelo usuário, fundo transparente, livre)
export function AmazonLogo({ className = 'h-10 sm:h-12 w-auto' }) {
  return (
    <img
      src="/brands/amazon.png"
      alt="Amazon"
      className={`${className} object-contain transition-transform hover:scale-105 duration-200 select-none flex-shrink-0 dark:brightness-0 dark:invert`}
      loading="eager"
    />
  )
}

// 4. WHATSAPP (Logotipo Oficial enviado pelo usuário, fundo transparente, livre)
export function WhatsAppLogo({ className = 'h-10 sm:h-12 w-auto' }) {
  return (
    <img
      src="/brands/whatsapp.png"
      alt="WhatsApp"
      className={`${className} object-contain transition-transform hover:scale-105 duration-200 select-none flex-shrink-0 dark:brightness-110`}
      loading="eager"
    />
  )
}

// 5. GOOGLE CHROME (Logotipo Oficial Google Chrome)
export function GoogleChromeWordmark({ className = 'h-10 sm:h-12 w-auto' }) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className} transition-transform hover:scale-105 duration-200 select-none flex-shrink-0`}>
      <ChromeLogo className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0" />
      <span className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight whitespace-nowrap">
        Google Chrome
      </span>
    </div>
  )
}
