"use client"

import { type Ref, useRef, useState } from "react"
import { IconX } from "@tabler/icons-react"

interface TagInputProps {
  id: string
  name: string
  defaultValue?: string[]
  value?: string[]
  onChange?: (nextValue: string[]) => void
  placeholder?: string
  ref?: Ref<HTMLInputElement>
}

const normalizeTag = (value: string) => {
  return value.trim().replace(/\s+/g, " ")
}

const TagInput = ({
  id,
  name,
  defaultValue = [],
  value,
  onChange,
  placeholder = "태그를 입력하세요",
  ref,
}: TagInputProps) => {
  const [internalTags, setInternalTags] = useState<string[]>(defaultValue)
  const [inputValue, setInputValue] = useState("")
  const hiddenInputRef = useRef<HTMLInputElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const chipButtonRefs = useRef<Array<HTMLButtonElement | null>>([])
  const tags = value ?? internalTags

  const updateTags = (nextTags: string[]) => {
    if (value === undefined) {
      setInternalTags(nextTags)
    }

    onChange?.(nextTags)
  }

  const setHiddenInputRef = (element: HTMLInputElement | null) => {
    hiddenInputRef.current = element

    if (typeof ref === "function") {
      ref(element)
    } else if (ref) {
      ref.current = element
    }
  }

  const focusInput = () => {
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }

  const addTag = (rawValue: string) => {
    const nextTag = normalizeTag(rawValue)

    if (!nextTag) return
    if (tags.includes(nextTag)) {
      setInputValue("")
      focusInput()
      return
    }

    updateTags([...tags, nextTag])
    setInputValue("")
    focusInput()
  }

  const removeTag = (targetTag: string) => {
    updateTags(tags.filter((tag) => tag !== targetTag))
    focusInput()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault()
      addTag(inputValue)
      return
    }

    if (event.key === "Tab" && inputValue.trim().length > 0) {
      event.preventDefault()
      addTag(inputValue)
      return
    }

    if (
      event.key === "ArrowLeft" &&
      inputValue.length === 0 &&
      tags.length > 0
    ) {
      event.preventDefault()
      chipButtonRefs.current[tags.length - 1]?.focus()
      return
    }

    if (event.key === "Backspace" && inputValue.length === 0) {
      updateTags(tags.slice(0, -1))
    }
  }

  const handleChipKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    tag: string,
    index: number
  ) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault()
      chipButtonRefs.current[index - 1]?.focus()
      return
    }

    if (event.key === "ArrowRight") {
      event.preventDefault()

      const nextChipButton = chipButtonRefs.current[index + 1]

      if (nextChipButton) {
        nextChipButton.focus()
        return
      }

      inputRef.current?.focus()
      return
    }

    if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault()
      removeTag(tag)

      requestAnimationFrame(() => {
        const nextChipButton = chipButtonRefs.current[index]
        const prevChipButton = chipButtonRefs.current[index - 1]

        if (nextChipButton) {
          nextChipButton.focus()
          return
        }

        if (prevChipButton) {
          prevChipButton.focus()
          return
        }

        inputRef.current?.focus()
      })
    }
  }

  return (
    <div className="flex min-h-10 w-full min-w-0 flex-wrap items-center gap-2 rounded-lg border border-input bg-[var(--surface-raised)] px-3 py-2 transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
      <input
        ref={setHiddenInputRef}
        type="hidden"
        value={JSON.stringify(tags)}
        id={id}
        name={name}
        readOnly
      />
      {tags.map((tag, index) => (
        <span
          key={tag}
          className="inline-flex max-w-full min-w-0 items-center gap-1 rounded-md border border-transparent bg-[var(--surface-muted)] px-2.5 py-1 text-xs font-medium text-[var(--text)]"
        >
          <span className="min-w-0 truncate">{`#${tag}`}</span>
          <button
            type="button"
            ref={(element) => {
              chipButtonRefs.current[index] = element
            }}
            onKeyDown={(event) => handleChipKeyDown(event, tag, index)}
            onMouseDown={(event) => {
              event.preventDefault()
            }}
            onClick={() => removeTag(tag)}
            className="rounded-sm text-[var(--text-muted)] hover:text-[var(--text)]"
            aria-label={`${tag} 태그 제거`}
          >
            <IconX className="size-3" />
          </button>
        </span>
      ))}

      <input
        ref={inputRef}
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addTag(inputValue)}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="min-w-0 flex-1 basis-24 bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-subtle)]"
      />
    </div>
  )
}

export default TagInput
