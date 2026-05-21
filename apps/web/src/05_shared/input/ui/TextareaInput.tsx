"use client"

import { type Ref, useRef, useState } from "react"
import { Textarea } from "@packages/ui/src/components/textarea"

interface TextareaInputProps {
  id: string
  name: string
  placeholder?: string
  defaultValue?: string
  value?: string
  onChange?: (value: string) => void
  rows?: number
  ref?: Ref<HTMLInputElement>
}

const TextareaInput = ({
  id,
  name,

  placeholder = "내용을 입력하세요...",
  defaultValue = "",
  value,
  onChange,

  rows = 6,
  ref,
}: TextareaInputProps) => {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const textareaValue = value ?? internalValue

  const hiddenInputRef = useRef<HTMLInputElement | null>(null)

  const setHiddenInputRef = (element: HTMLInputElement | null) => {
    hiddenInputRef.current = element

    if (typeof ref === "function") {
      ref(element)
      return
    }

    if (ref) {
      ref.current = element
    }
  }

  return (
    <>
      <Textarea
        id={id}
        rows={rows}
        value={textareaValue}
        placeholder={placeholder}
        onChange={(event) => {
          const nextValue = event.target.value

          if (value === undefined) {
            setInternalValue(nextValue)
          }

          onChange?.(nextValue)
        }}
        className="min-h-36 resize-none px-4 py-3 text-sm leading-6"
      />

      <input
        ref={setHiddenInputRef}
        type="hidden"
        value={textareaValue}
        name={name}
        readOnly
      />
    </>
  )
}

export default TextareaInput
