'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

interface MarkdownProps {
  content: string
  className?: string
}

export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div className={cn('markdown-content', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        // Headings
        h1: ({ children }) => (
          <h1 className="text-xl font-bold text-text-primary mt-4 mb-2">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-semibold text-text-primary mt-3 mb-2">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-semibold text-text-primary mt-2 mb-1">{children}</h3>
        ),

        // Paragraphs
        p: ({ children }) => (
          <p className="text-sm text-text-primary leading-relaxed mb-2">{children}</p>
        ),

        // Lists
        ul: ({ children }) => (
          <ul className="list-disc list-inside space-y-1 mb-2 ml-2">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside space-y-1 mb-2 ml-2">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-sm text-text-primary">{children}</li>
        ),

        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            {children}
          </a>
        ),

        // Code
        code: ({ className, children }) => {
          const isInline = !className
          if (isInline) {
            return (
              <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-sm font-mono text-text-primary">
                {children}
              </code>
            )
          }
          return (
            <code className={cn('block', className)}>{children}</code>
          )
        },
        pre: ({ children }) => (
          <pre className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-x-auto mb-2">
            {children}
          </pre>
        ),

        // Tables
        table: ({ children }) => (
          <div className="overflow-x-auto mb-2">
            <table className="min-w-full border-collapse text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-gray-50 dark:bg-gray-800">{children}</thead>
        ),
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => (
          <tr className="border-b border-border">{children}</tr>
        ),
        th: ({ children }) => (
          <th className="px-3 py-2 text-left font-semibold text-text-primary">{children}</th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 text-text-primary">{children}</td>
        ),

        // Blockquotes
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-accent pl-4 italic text-text-secondary mb-2">
            {children}
          </blockquote>
        ),

        // Horizontal rule
        hr: () => <hr className="border-border my-4" />,

        // Strong and emphasis
        strong: ({ children }) => (
          <strong className="font-semibold text-text-primary">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
