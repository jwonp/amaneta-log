"use client"

import { Button } from "@packages/ui/src/components/button"
import { IconSend2 } from "@tabler/icons-react"

interface EditorSaveButtonProps {
  disabled?: boolean
  onClick: () => void
}

const EditorSaveButton = ({ disabled = false, onClick }: EditorSaveButtonProps) => {
  return (
    <Button
      className="w-10 rounded-xs font-bold md:w-24"
      type="button"
      disabled={disabled}
      onClick={onClick}
    >
      <p className="hidden md:block">{"저장"}</p>
      <IconSend2 className="md:hidden" />
    </Button>
  )
}

export default EditorSaveButton
