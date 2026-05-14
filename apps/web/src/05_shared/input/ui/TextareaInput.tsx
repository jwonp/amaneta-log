"use client"

import { type Ref, useRef, useState } from "react"

interface TextareaInputProps {
  id: string
  name: string
  placeholder?: string
  defaultValue?: string
  rows?: number
  ref?: Ref<HTMLInputElement>
}

const TextareaInput = ({
  id,
  name,

  placeholder = "내용을 입력하세요...",
  defaultValue = "",

  rows = 6,
  ref,
}: TextareaInputProps) => {
  const [value, setValue] = useState(defaultValue)

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
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          setValue(event.target.value)
        }}
        className="min-h-36 w-full min-w-0 resize-none rounded-xs border border-input bg-background px-5 py-4 text-sm leading-6 text-foreground outline-0 outline-none placeholder:text-muted-foreground focus:ring-0 focus-visible:ring-0 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
      />

      <input
        ref={setHiddenInputRef}
        type="hidden"
        value={value}
        name={name}
        readOnly
      />
    </>
  )
}

export default TextareaInput
