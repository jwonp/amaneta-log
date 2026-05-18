"use client"

import { Button } from "@packages/ui/src/components/button"
import { IconDeviceFloppy } from "@tabler/icons-react"
import { MouseEventHandler } from "react"

const EditorSaveAsDraftButton = () => {
  const handleClickSaveAsDraftButton: MouseEventHandler<
    HTMLButtonElement
  > = () => {}
  return (
    <Button
      className="w-10 rounded-xs text-sm font-medium md:w-24"
      variant={"ghost"}
      onClick={handleClickSaveAsDraftButton}
    >
      <p className="hidden md:block">{"임시저장"}</p>
      <IconDeviceFloppy className="md:hidden" />
    </Button>
  )
}
export default EditorSaveAsDraftButton
