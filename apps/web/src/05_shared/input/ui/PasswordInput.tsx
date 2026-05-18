"use client"

import { Input } from "@packages/ui/src/components/input"
import { Toggle } from "@packages/ui/src/components/toggle"
import { IconEyeClosed, IconEye } from "@tabler/icons-react"
import { useState } from "react"

const PasswordInput = ({
  className,
  type,
  ...props
}: React.ComponentProps<"input">) => {
  const [isShowPassword, setShowPassword] = useState<boolean>(false)

  return (
    <div className="relative">
      <Input
        type={isShowPassword ? type || "text" : "password"}
        className={className}
        {...props}
      />
      <Toggle
        aria-label="Toggle Password Visibility"
        size="sm"
        variant="default"
        className="absolute top-0.5 right-2 hover:bg-transparent aria-pressed:bg-transparent"
        onClick={() => {
          setShowPassword((prev) => !prev)
        }}
      >
        <IconEyeClosed className="group-data-[state=on]/toggle:hidden" />
        <IconEye className="group-data-[state=off]/toggle:hidden" />
      </Toggle>
    </div>
  )
}
export default PasswordInput
