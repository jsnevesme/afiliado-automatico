import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function MarkdownRenderer({ content, className = '' }) {
  return (
    <div className={`markdown-content text-slate-800 dark:text-slate-200 text-[13px] leading-relaxed space-y-3 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-1.5 mt-4 mb-2 flex items-center gap-2" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-4 mb-2 flex items-center gap-2" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-3 mb-1 uppercase tracking-wide" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="my-1.5 text-slate-700 dark:text-slate-300 leading-relaxed" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-slate-900 dark:text-white" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-outside ml-4 my-2 space-y-1 text-slate-700 dark:text-slate-300" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-outside ml-4 my-2 space-y-1 text-slate-700 dark:text-slate-300 font-medium" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-relaxed pl-1" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 rounded-r-lg px-3.5 py-2 my-2 text-xs text-blue-900 dark:text-blue-300 italic font-medium" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-3.5 py-2.5 font-bold" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-3.5 py-2.5 text-slate-700 dark:text-slate-300" {...props} />
          ),
          code: ({ node, inline, ...props }) => (
            inline ? (
              <code className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] text-slate-800 dark:text-slate-200 font-semibold border border-slate-200/60 dark:border-slate-700" {...props} />
            ) : (
              <pre className="rounded-xl bg-slate-900 dark:bg-black/80 p-3.5 text-slate-100 font-mono text-xs overflow-x-auto my-2 shadow-inner border border-slate-800 dark:border-slate-800">
                <code {...props} />
              </pre>
            )
          ),
          hr: ({ node, ...props }) => (
            <hr className="my-3 border-slate-200 dark:border-slate-800" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
