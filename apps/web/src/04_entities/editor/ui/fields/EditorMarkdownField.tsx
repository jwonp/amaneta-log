"use client"

import { type RefObject, useLayoutEffect, useState } from "react"
import LayoutSeparator from "@/src/05_shared/separator/ui/LayoutSeparator"
import { Field } from "@packages/ui/src/components/field"
import MarkDownPreview from "../../../markdown/ui/MarkDownPreview"
import { EDITOR_FORM_NAME } from "../../model/EditorForm.const"
import { EditorMarkdownSelection } from "../../model/editorField.type"

interface EditorMarkdownFieldProps {
  markdown: string
  textareaRef: RefObject<HTMLTextAreaElement | null>
  onMarkdownChange: (markdown: string) => void
  onSelectionChange: (selection: EditorMarkdownSelection) => void
}

const EditorMarkdownField = ({
  markdown,
  textareaRef,
  onMarkdownChange,
  onSelectionChange,
}: EditorMarkdownFieldProps) => {
  const [textareaHeight, setTextareaHeight] = useState<number>(0)

  useLayoutEffect(() => {
    const textarea = textareaRef.current

    if (!textarea) {
      return
    }

    textarea.style.height = "auto"

    const nextHeight = textarea.scrollHeight

    textarea.style.height = `${nextHeight}px`
    setTextareaHeight(nextHeight)
  }, [markdown, textareaRef])

  const syncSelection = () => {
    const textarea = textareaRef.current

    if (!textarea) {
      return
    }

    onSelectionChange({
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
    })
  }

  return (
    <Field className="min-w-0">
      <div className="flex w-full max-w-full min-w-0 flex-col gap-2 md:grid md:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] md:flex-row">
        <section className="w-full min-w-0">
          <textarea
            ref={textareaRef}
            className="min-h-130 w-full min-w-0 resize-none overflow-hidden rounded-lg border border-input bg-[var(--surface-raised)] px-4 py-3 text-sm leading-6 text-[var(--text)] outline-none placeholder:text-[var(--text-subtle)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            value={markdown}
            onChange={(event) => onMarkdownChange(event.target.value)}
            onSelect={syncSelection}
            onClick={syncSelection}
            onKeyUp={syncSelection}
            aria-label="Markdown editor"
          />
          <input
            type="hidden"
            value={markdown}
            name={EDITOR_FORM_NAME.MARKDOWN}
            readOnly
          />
        </section>
        <>
          <LayoutSeparator orientation={"horizontal"} className="md:hidden" />
          <LayoutSeparator
            orientation={"vertical"}
            className="hidden md:block"
          />
        </>
        <MarkDownPreview previewHeight={textareaHeight} markdown={markdown} />
      </div>
    </Field>
  )
}

export default EditorMarkdownField
