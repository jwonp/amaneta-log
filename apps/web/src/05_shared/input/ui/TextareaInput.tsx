"use client"

import { type Ref, useRef, useState } from "react"

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
      <textarea
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
        className="min-h-36 w-full min-w-0 resize-none rounded-xs border border-input bg-background px-5 py-4 text-sm leading-6 text-foreground outline-0 outline-none placeholder:text-muted-foreground focus:ring-0 focus-visible:ring-0 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
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
