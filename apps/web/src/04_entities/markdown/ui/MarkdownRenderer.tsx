import ReactMarkdown from "react-markdown"
import remarkBreaks from "remark-breaks"
import remarkGfm from "remark-gfm"

const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="mb-5 text-3xl leading-tight font-semibold tracking-tight">
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="mt-8 mb-4 text-2xl leading-tight font-semibold tracking-tight">
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="mt-6 mb-3 text-xl leading-tight font-semibold">{children}</h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="my-4 text-sm leading-7 text-foreground/90">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="my-4 list-disc space-y-2 pl-5 text-sm leading-7 text-foreground/90">
      {children}
    </ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="my-4 list-decimal space-y-2 pl-5 text-sm leading-7 text-foreground/90">
      {children}
    </ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => <li>{children}</li>,
  a: ({
    href,
    children,
  }: {
    href?: string
    children?: React.ReactNode
  }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="break-all text-foreground underline decoration-primary underline-offset-4"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="my-5 border-l-4 border-border pl-4 text-sm text-muted-foreground italic">
      {children}
    </blockquote>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="my-5 max-w-full overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="border border-border bg-muted px-3 py-2 text-left font-medium">
      {children}
    </th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="border border-border px-3 py-2 text-foreground/90">
      {children}
    </td>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="rounded bg-muted px-1.5 py-0.5 text-xs wrap-break-word">
      {children}
    </code>
  ),
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="my-5 max-w-full overflow-x-auto rounded-md bg-muted p-4 text-xs leading-6">
      {children}
    </pre>
  ),
}

const MarkdownRenderer = ({ markdown }: { markdown: string }) => {
  return (
    <article className="max-w-full overflow-hidden text-sm leading-7 wrap-break-word">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={markdownComponents}
      >
        {markdown}
      </ReactMarkdown>
    </article>
  )
}

export default MarkdownRenderer
