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
        "h-9 w-full min-w-0 rounded-none border-0 bg-background px-2.5 py-1 text-lg shadow-none ring-0 outline-none placeholder:text-muted-foreground focus-visible:border-0 focus-visible:ring-0 focus-visible:ring-ring/0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-lg dark:bg-background"
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
