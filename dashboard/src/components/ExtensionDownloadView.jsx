import React, { useState } from 'react'
import {
  Download,
  FolderArchive,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Copy,
  Check,
  Layers,
  ArrowRight
} from 'lucide-react'
import ChromeLogo from './ChromeLogo'

export default function ExtensionDownloadView({ profile, user }) {
  const [copiedUrl, setCopiedUrl] = useState(false)

  const handleCopyChromeUrl = () => {
    navigator.clipboard.writeText('chrome://extensions')
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  const steps = [
    {
      num: '01',
      title: 'Baixar e Extrair o Arquivo',
      desc: 'Clique no botão "Baixar Extensão (.ZIP)" acima para baixar o arquivo "afiliado-automatico.zip". Em seguida, clique com o botão direito no arquivo baixado e selecione "Extrair Tudo".',
      tip: 'Mantenha a pasta descompactada em um local fixo no seu computador (por exemplo: Documentos ou em uma pasta dedicada).'
    },
    {
      num: '02',
      title: 'Acessar a Página de Extensões do Chrome',
      desc: 'Abra uma nova aba no seu Google Chrome e acesse o endereço de extensões.',
      action: {
        label: copiedUrl ? 'Copiado: chrome://extensions' : 'Copiar: chrome://extensions',
        onClick: handleCopyChromeUrl
      },
      tip: 'Você também pode clicar no menu de 3 pontinhos do Chrome (canto superior direito) > Extensões > Gerenciar extensões.'
    },
    {
      num: '03',
      title: 'Ativar o "Modo do Desenvolvedor"',
      desc: 'No canto superior direito da página de extensões, ligue a chave seletora com o nome "Modo do desenvolvedor".',
      tip: 'Isso liberará a barra de ações para carregar extensões personalizadas no seu navegador com total segurança.'
    },
    {
      num: '04',
      title: 'Carregar sem Compactação',
      desc: 'No canto superior esquerdo, clique no botão "Carregar sem compactação" e selecione a pasta que você acabou de extrair.',
      tip: 'Pronto! A extensão aparecerá instalada. Clique no ícone do quebra-cabeça 🧩 do Chrome para fixar o Afiliado Automático na barra superior.'
    }
  ]

  const faqs = [
    {
      q: 'Funciona em outros navegadores além do Google Chrome?',
      a: 'Sim! Funciona com total compatibilidade em qualquer navegador moderno baseado no Chromium, como Microsoft Edge, Brave, Opera e Vivaldi.'
    },
    {
      q: 'Como atualizo a extensão para novas versões?',
      a: 'Quando houver atualizações, basta baixar o novo arquivo .ZIP aqui na plataforma, descompactar substituindo os arquivos na mesma pasta e clicar no botão circular de Recarregar (🔄) em chrome://extensions.'
    },
    {
      q: 'Preciso pagar algo adicional para usar a extensão?',
      a: 'Não! A extensão é 100% inclusa para membros da plataforma. O seu plano ativo (Starter, Pro ou Ultra) e seus limites de grupos sincronizam automaticamente com a extensão após você fazer login.'
    }
  ]

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header Superior */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
            <ChromeLogo className="h-3.5 w-3.5" />
            <span>Google Chrome Oficial</span>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Manifest V3</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Extensão Afiliado Automático
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Automatize a curadoria de produtos, links de comissão e disparos para seus grupos do WhatsApp Web diretamente no seu navegador.
        </p>
      </div>

      {/* Hero Card Profissional de Download (Design Clean & Moderno) */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111726] p-6 sm:p-8 shadow-xs relative overflow-hidden transition-colors">
        {/* Barra superior de status */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Versão 2.1.0 Estável
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Pacote de Instalação Verificado
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Assinado e livre de ameaças</span>
          </div>
        </div>

        {/* Corpo principal */}
        <div className="pt-6 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <div className="flex items-start gap-4">
              <div className="relative flex-shrink-0">
                <img
                  src="/extension-icon.png"
                  alt="Extensão Afiliado Automático"
                  className="h-16 w-16 sm:h-18 sm:w-18 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 object-cover"
                />
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xs">
                  <ChromeLogo className="h-3.5 w-3.5" />
                </div>
              </div>

              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Afiliado Automático para Chrome
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Curadoria de produtos em tempo real com cálculo de comissão, encurtador oficial de links e automação de disparos diretamente no WhatsApp Web.
                </p>
              </div>
            </div>

            {/* Destaques Técnicos - Com IA Integrada (sem menção a Groq) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span>Links Oficiais meli.la e s.shopee</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="font-semibold text-slate-900 dark:text-white">IA Integrada</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span>Proteção Anti-Bloqueio no WhatsApp</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                <span>Zero Instalação Externa (100% Local)</span>
              </div>
            </div>
          </div>

          {/* Área de Ação de Download */}
          <div className="flex-shrink-0 flex flex-col items-stretch sm:items-end justify-center gap-3">
            <a
              href="/afiliado-automatico.zip"
              download="afiliado-automatico.zip"
              className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white px-7 py-4 text-sm font-black shadow-lg shadow-blue-600/25 transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <Download className="h-5 w-5" />
              <span>Baixar Extensão (.ZIP)</span>
            </a>

            <div className="space-y-0.5 text-center sm:text-right">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                Arquivo ZIP pronto para Chrome • ~228 KB
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                Compatível com Chrome, Brave, Edge e Opera
              </span>
            </div>
          </div>
        </div>

        {/* Rodapé do Card com Requisitos */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">Requisitos:</span>
            <span>Google Chrome versão 110+ ou qualquer navegador baseado em Chromium</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Sincronização: <strong className="text-slate-700 dark:text-slate-200">Automática via Conta</strong></span>
            <span>•</span>
            <span>Grupos de WhatsApp: <strong className="text-slate-700 dark:text-slate-200">Conforme seu plano</strong></span>
          </div>
        </div>
      </div>

      {/* Tutorial Passo a Passo */}
      <div className="rounded-[28px] border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#121724] p-6 sm:p-7 shadow-xs space-y-6 transition-colors">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-4">
          <FolderArchive className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Guia de Instalação no Google Chrome
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Siga os 4 passos abaixo para ativar a extensão no seu navegador
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {steps.map((s, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 p-5 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                    PASSO {s.num}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {s.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {s.desc}
                </p>

                {s.action && (
                  <button
                    type="button"
                    onClick={s.action.onClick}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 px-3 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 hover:opacity-90 transition-all mt-2"
                  >
                    {copiedUrl ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{s.action.label}</span>
                  </button>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
                <span className="font-bold text-blue-600 dark:text-blue-400">💡</span>
                <span>{s.tip}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dúvidas Frequentes (FAQ) */}
      <div className="rounded-[28px] border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#121724] p-6 shadow-xs space-y-4 transition-colors">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <HelpCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Dúvidas Frequentes</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 p-4 space-y-1.5"
            >
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{faq.q}</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
