"use client"

import { Button } from "@packages/ui/src/components/button"
import { IconDeviceFloppy } from "@tabler/icons-react"

interface EditorSaveAsDraftButtonProps {
  disabled?: boolean
  onClick: () => void
}

const EditorSaveAsDraftButton = ({
  disabled = false,
  onClick,
}: EditorSaveAsDraftButtonProps) => {
  return (
    <Button
      className="w-10 rounded-xs text-sm font-medium md:w-24"
      variant={"ghost"}
      type="button"
      disabled={disabled}
      onClick={onClick}
    >
      <p className="hidden md:block">{"임시저장"}</p>
      <IconDeviceFloppy className="md:hidden" />
    </Button>
  )
}

export default EditorSaveAsDraftButton
