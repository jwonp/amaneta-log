import { FieldGroup } from "@workspace/ui/components/field"
import { Button } from "@packages/ui/src/components/button"

import EditorMarkdownField from "@/src/04_entities/editor/ui/EditorMarkdownField"
import EditorThumbnailField from "@/src/04_entities/editor/ui/EditorThumbnailField"

import LayoutSeparator from "@/src/05_shared/separator/ui/LayoutSeparator"

import { MouseEventHandler } from "react"
import EditorTagField from "@/src/04_entities/editor/ui/EditorTagField"
import EditorVisibilityField from "@/src/04_entities/editor/ui/EditorVisibilityField"
import EditorDescriptionField from "@/src/04_entities/editor/ui/EditorDescriptionField"
import EditorTitleField from "@/src/04_entities/editor/ui/EditorTitleField"
import { EDITOR_FORM_NAME } from "@/src/04_entities/editor/model/EditorForm.const"
import {
  IconSend2,
  IconDeviceFloppy,
  IconPhoto,
  IconVideo,
} from "@tabler/icons-react"
const EditorForm = () => {
  const handleClickSaveAsDraftButton: MouseEventHandler<
    HTMLButtonElement
  > = () => {}
  const handleClickSaveButton: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault()

    const form = e.currentTarget.form

    if (!form) return

    const formData = new FormData(form)

    const title = String(formData.get(EDITOR_FORM_NAME.TITLE) ?? "")
    const markdown = String(formData.get(EDITOR_FORM_NAME.MARKDOWN) ?? "")
    const tags = JSON.parse(
      String(formData.get(EDITOR_FORM_NAME.TAG) ?? "[]")
    ) as string[]
    const isPublic = formData.get(EDITOR_FORM_NAME.VISIBILITY) === "true"
    const description = String(formData.get(EDITOR_FORM_NAME.DESCRIPTION) ?? "")
    const thumbnailId = formData.get(EDITOR_FORM_NAME.THUMBNAIL)

    console.log({
      title,
      markdown,
      tags,
      isPublic,
      description,
      thumbnailId,
    })
  }

  return (
    <form className="w-full max-w-full min-w-0 overflow-x-clip">
      <div className="mb-16 w-full max-w-full min-w-0">
        <EditorTitleField />
        <EditorMarkdownField />
        <LayoutSeparator />
        <div className="min-w-0">
          <section className="min-w-0 px-0 py-6 md:p-6">
            <FieldGroup>
              <section className="flex min-w-0 flex-col gap-10 md:flex-row">
                <div className="w-full min-w-0">
                  <EditorThumbnailField />
                </div>
                <div className="flex w-full min-w-0 flex-col gap-6">
                  <EditorTagField />
                  <EditorVisibilityField />
                  <EditorDescriptionField />
                </div>
              </section>
            </FieldGroup>
          </section>
        </div>
        <div className="fixed inset-x-0 bottom-0 flex h-16 max-w-full border border-foreground/20 bg-background">
          <section className="flex min-w-0 flex-1 items-center gap-4 px-4 md:px-8">
            <Button variant="outline" size="icon" aria-label="Submit">
              <IconPhoto />
            </Button>
            <Button variant="outline" size="icon" aria-label="Submit">
              <IconVideo />
            </Button>
            <LayoutSeparator orientation="vertical" />
          </section>

          <section className="flex h-full shrink-0 items-center px-4 md:px-6">
            <div className="flex gap-2 md:gap-4">
              <Button
                className="w-10 rounded-xs text-sm font-medium md:w-24"
                variant={"ghost"}
                onClick={handleClickSaveAsDraftButton}
              >
                <p className="hidden md:block">{"임시저장"}</p>
                <IconDeviceFloppy className="md:hidden" />
              </Button>
              <Button
                className="w-10 rounded-xs font-bold md:w-24"
                type="submit"
                onClick={handleClickSaveButton}
              >
                <p className="hidden md:block">{"저장"}</p>
                <IconSend2 className="md:hidden" />
              </Button>
            </div>
          </section>
        </div>
      </div>
    </form>
  )
}
export default EditorForm
