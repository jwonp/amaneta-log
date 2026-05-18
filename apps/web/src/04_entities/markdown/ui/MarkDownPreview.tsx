"use client"

import { type CSSProperties } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks"

interface MarkDownPreviewProps {
  previewHeight?: number
  markdown: string
}
const MarkDownPreview = ({ previewHeight, markdown }: MarkDownPreviewProps) => {
  return (
    <section
      style={
        {
          "--preview-height": previewHeight ? `${previewHeight}px` : "auto",
        } as CSSProperties
      }
      className="h-fit min-h-130 w-full max-w-full min-w-0 overflow-x-hidden overflow-y-auto rounded-md bg-background p-6 md:h-(--preview-height)"
    >
      <article className="max-w-full overflow-hidden text-sm leading-7 wrap-break-word">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          components={{
            h1: ({ children }) => (
              <h1 className="mb-5 text-3xl leading-tight font-semibold tracking-tight">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="mt-8 mb-4 text-2xl leading-tight font-semibold tracking-tight">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="mt-6 mb-3 text-xl leading-tight font-semibold">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="my-4 text-sm leading-7 text-foreground/80">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="my-4 list-disc space-y-2 pl-5 text-sm leading-7 text-foreground/80">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="my-4 list-decimal space-y-2 pl-5 text-sm leading-7 text-foreground/80">
                {children}
              </ol>
            ),
            li: ({ children }) => <li>{children}</li>,
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="break-all text-primary underline underline-offset-4"
              >
                {children}
              </a>
            ),
            blockquote: ({ children }) => (
              <blockquote className="my-5 border-l-4 border-border pl-4 text-sm text-muted-foreground italic">
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="my-5 max-w-full overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  {children}
                </table>
              </div>
            ),
            th: ({ children }) => (
              <th className="border border-border bg-muted px-3 py-2 text-left font-medium">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border border-border px-3 py-2 text-foreground/80">
                {children}
              </td>
            ),
            code: ({ children }) => (
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs wrap-break-word">
                {children}
              </code>
            ),
            pre: ({ children }) => (
              <pre className="my-5 max-w-full overflow-x-auto rounded-md bg-muted p-4 text-xs leading-6">
                {children}
              </pre>
            ),
          }}
        >
          {markdown}
        </ReactMarkdown>
      </article>
    </section>
  )
}
export default MarkDownPreview
