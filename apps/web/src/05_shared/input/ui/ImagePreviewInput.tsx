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
  onChange?: (file: File | null) => void
  ref?: Ref<ImagePreviewInputRef>
}

const ImagePreviewInput = ({
  id,
  name,
  label = "대표 이미지",
  defaultPreviewSrc,
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
    setPreviewSrc(defaultPreviewSrc ?? null)

    if (inputRef.current) {
      inputRef.current.value = ""
    }

    onChange?.(null)
  }, [defaultPreviewSrc, onChange, revokeObjectUrl])

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
        className="group relative flex aspect-video w-full cursor-pointer items-center justify-center overflow-hidden rounded-xs border border-input bg-muted"
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
          <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground" />
        )}

        <div className="absolute inset-0 bg-background/55 transition-colors group-hover:bg-background/45" />

        <div className="absolute flex flex-col items-center justify-center rounded-xs bg-background/75 px-6 py-4 text-foreground shadow-sm backdrop-blur-sm">
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

          <span className="text-base font-medium">
            {previewSrc ? "이미지 교체" : "이미지 선택"}
          </span>
        </div>
      </label>

      <Input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleChange}
      />
    </>
  )
}

export default ImagePreviewInput
