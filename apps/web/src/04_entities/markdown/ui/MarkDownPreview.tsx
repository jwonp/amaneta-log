"use client"

import { type CSSProperties } from "react"
import MarkdownRenderer from "./MarkdownRenderer"

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
      <MarkdownRenderer markdown={markdown} />
    </section>
  )
}
export default MarkDownPreview
