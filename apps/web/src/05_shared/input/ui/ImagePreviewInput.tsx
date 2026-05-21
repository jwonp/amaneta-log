"use client"

import {
  type Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import Image from "next/image"
import { Input } from "@packages/ui/src/components/input"

export interface ImagePreviewInputRef {
  value: File | null
  previewSrc: string | null
  clear: () => void
  focus: () => void
}

interface ImagePreviewInputProps {
  id: string
  name: string
  label?: string
  description?: string
  defaultPreviewSrc?: string
  value?: string | number | null
  onChange?: (file: File | null) => void
  ref?: Ref<ImagePreviewInputRef>
}

const ImagePreviewInput = ({
  id,
  name,
  label = "대표 이미지",
  defaultPreviewSrc,
  value,
  onChange,
  ref,
}: ImagePreviewInputProps) => {
  const [file, setFile] = useState<File | null>(null)
  const [previewSrc, setPreviewSrc] = useState<string | null>(
    defaultPreviewSrc ?? null
  )

  const inputRef = useRef<HTMLInputElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  const revokeObjectUrl = useCallback(() => {
    if (!objectUrlRef.current) return

    URL.revokeObjectURL(objectUrlRef.current)
    objectUrlRef.current = null
  }, [])

  const clear = useCallback(() => {
    revokeObjectUrl()
    setFile(null)
    setPreviewSrc(null)

    if (inputRef.current) {
      inputRef.current.value = ""
    }

    onChange?.(null)
  }, [onChange, revokeObjectUrl])

  useImperativeHandle(
    ref,
    () => ({
      value: file,
      previewSrc,
      clear,
      focus: () => {
        inputRef.current?.focus()
      },
    }),
    [clear, file, previewSrc]
  )

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null

    onChange?.(nextFile)
    setFile(nextFile)

    if (!nextFile) {
      revokeObjectUrl()
      setPreviewSrc(defaultPreviewSrc ?? null)
      return
    }

    revokeObjectUrl()

    const nextObjectUrl = URL.createObjectURL(nextFile)

    objectUrlRef.current = nextObjectUrl
    setPreviewSrc(nextObjectUrl)
  }

  useEffect(() => {
    return () => {
      revokeObjectUrl()
    }
  }, [revokeObjectUrl])

  return (
    <>
      <label
        htmlFor={id}
        className="group relative flex aspect-video w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-input bg-[var(--surface-muted)] transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50"
      >
        {previewSrc ? (
          <Image
            src={previewSrc}
            alt={`${label} 미리보기`}
            fill
            sizes="(max-width: 768px) 100vw, 600px"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[var(--surface-muted)] text-sm text-[var(--text-muted)]" />
        )}

        <div className="absolute inset-0 bg-background/50 transition-colors group-hover:bg-background/40" />

        <div className="absolute flex flex-col items-center justify-center rounded-lg bg-background/78 px-6 py-4 text-[var(--text)] shadow-[var(--shadow-soft)] backdrop-blur-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mb-2 size-8"
            aria-hidden="true"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <path d="M12 18v-6" />
            <path d="m9 15 3-3 3 3" />
          </svg>

          <span className="text-sm font-semibold">
            {previewSrc ? "이미지 교체" : "이미지 선택"}
          </span>
        </div>

        {previewSrc ? (
          <button
            type="button"
            className="absolute top-3 right-3 rounded-md border border-border bg-background/85 px-3 py-1 text-xs font-medium text-[var(--text)] shadow-[var(--shadow-soft)]"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              clear()
            }}
          >
            이미지 제거
          </button>
        ) : null}
      </label>

      <Input type="hidden" name={name} value={value ?? ""} readOnly />

      <Input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleChange}
      />
    </>
  )
}

export default ImagePreviewInput
