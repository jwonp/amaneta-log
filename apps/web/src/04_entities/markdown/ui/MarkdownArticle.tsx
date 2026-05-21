import MarkdownRenderer from "./MarkdownRenderer"

const MarkdownArticle = ({ markdown }: { markdown: string }) => {
  return (
    <section className="h-fit w-full max-w-full min-w-0 overflow-x-hidden rounded-md bg-background p-6">
      <MarkdownRenderer markdown={markdown} />
    </section>
  )
}

export default MarkdownArticle
