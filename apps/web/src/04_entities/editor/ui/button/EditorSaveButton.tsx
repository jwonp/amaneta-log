"use client"
import { MouseEventHandler } from "react"
import { EDITOR_FORM_NAME } from "../../model/EditorForm.const"
import { Button } from "@packages/ui/src/components/button"
import { IconSend2 } from "@tabler/icons-react"
import axios, { AxiosError } from "axios"
import { SavePostRequset } from "@/src/05_shared/api/post/model/post.dto.type"
import { HttpStatus } from "@/src/05_shared/api/common/model/api.const"
import { useRouter } from "next/navigation"

interface EditorSaveButtonProps {
  postId: number
}
const EditorSaveButton = ({ postId }: EditorSaveButtonProps) => {
  const router = useRouter()

  const handleClickSaveButton: MouseEventHandler<HTMLButtonElement> = async (
    e
  ) => {
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
    const thumbnailIdValue = String(
      formData.get(EDITOR_FORM_NAME.THUMBNAIL) ?? ""
    )
    const thumbnailId = thumbnailIdValue ? Number(thumbnailIdValue) : null

    const payload: SavePostRequset = {
      title,
      markdown,
      tags,
      isPublic,
      description,
      thumbnailId,
    }

    const { status } = await axios
      .patch(`/api/posts/${postId}`, payload)
      .then(({ status }) => ({ status }))
      .catch((err: AxiosError) => ({ status: err?.status || 500 }))

    if (status !== HttpStatus.OK) return

    router.push("/editor")
  }

  return (
    <Button
      className="w-10 rounded-xs font-bold md:w-24"
      type="submit"
      onClick={handleClickSaveButton}
    >
      <p className="hidden md:block">{"저장"}</p>
      <IconSend2 className="md:hidden" />
    </Button>
  )
}

export default EditorSaveButton
