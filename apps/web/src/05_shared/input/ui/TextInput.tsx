"use client"

import { type ComponentProps, type Ref } from "react"
import { Input } from "@packages/ui/src/components/input"

interface TextInputProps extends Omit<ComponentProps<typeof Input>, "ref"> {
  ref?: Ref<HTMLInputElement>
}

const TextInput = ({
  ref,
  placeholder = "제목을 입력하세요",
  className,
  ...props
}: TextInputProps) => {
  return (
    <Input
      ref={ref}
      className={
        className ??
        "h-12 w-full min-w-0 rounded-lg border border-input bg-[var(--surface-raised)] px-4 py-3 text-lg text-[var(--text)] shadow-none placeholder:text-[var(--text-subtle)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-lg dark:bg-input/30"
      }
      placeholder={placeholder}
      onBlur={(event) => {
        props.onBlur?.(event)

        if (event.defaultPrevented) return
        if (event.target.value.trim() !== "") return

        event.target.value = ""
      }}
      {...props}
    />
  )
}

export default TextInput
