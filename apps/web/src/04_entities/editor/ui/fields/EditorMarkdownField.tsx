"use client"
import LayoutSeparator from "@/src/05_shared/separator/ui/LayoutSeparator"
import { Field } from "@packages/ui/src/components/field"

import MarkDownPreview from "../../../markdown/ui/MarkDownPreview"
import { useRef, useState, useLayoutEffect } from "react"
import { EDITOR_FORM_NAME } from "../../model/EditorForm.const"

// const markdownDemo = `# Amaneta-log Markdown Preview

// 에디터에서 작성한 **Markdown 텍스트**를 오른쪽 미리보기 영역에서 UI로 렌더링하는 데모입니다.

// ## 지원 예시

// - 일반 문단
// - **Bold** / *Italic* / ~~Strikethrough~~
// - 링크: https://github.com/remarkjs/react-markdown
// - 체크리스트
// - 표
// - 코드 블록
// - 인용문

// ### 체크리스트

// - [x] 제목 입력
// - [x] Markdown preview
// - [ ] 저장 API 연결
// - [ ] 이미지 업로드 연결

// ### 표

// | 항목 | 상태 |
// | --- | --- |
// | React Markdown | 적용 |
// | remark-gfm | 적용 |
// | Editor API | 예정 |

// ### 코드

// \`\`\`tsx
// const title = "Amaneta-log"

// const savePost = async () => {
//   console.log(title)
// }
// \`\`\`

// > react-markdown은 Markdown 문자열을 React element로 렌더링합니다.
// `
interface EditorMarkdownFieldProps {
  initMarkdown?: string
}
const EditorMarkdownField = ({ initMarkdown }: EditorMarkdownFieldProps) => {
  const markdownTextareaRef = useRef<HTMLTextAreaElement>(null)

  const [markdown, setMarkdown] = useState(initMarkdown || "")
  const [textareaHeight, setTextareaHeight] = useState<number>(0)

  const resizeTextarea = () => {
    const textarea = markdownTextareaRef.current

    if (!textarea) return

    textarea.style.height = "auto"

    const nextHeight = textarea.scrollHeight

    textarea.style.height = `${nextHeight}px`
    setTextareaHeight(nextHeight)
  }

  useLayoutEffect(() => {
    resizeTextarea()
  }, [markdown])
  return (
    <Field className="min-w-0">
      <div className="flex w-full max-w-full min-w-0 flex-col gap-2 md:grid md:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] md:flex-row">
        <section className="w-full min-w-0">
          <textarea
            ref={markdownTextareaRef}
            className="min-h-130 w-full min-w-0 resize-none overflow-hidden rounded-md bg-background p-4 text-sm leading-6 outline-none placeholder:text-muted-foreground focus-visible:border-none focus-visible:ring-0 focus-visible:ring-ring/0"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            aria-label="Markdown editor demo"
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
