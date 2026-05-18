"use client"
import EditorThumbnailField from "@/src/04_entities/editor/ui/fields/EditorThumbnailField"
import { EditorThumbnailProps } from "../api/editor.type"
import { useState } from "react"
import axios from "axios"
import { UploadPostFileResponse } from "@/src/05_shared/api/storage/model/storage.dto.type"

const EditorThumbnail = ({
  postId,
  initThumbnail,
  initThumbnailId,
}: EditorThumbnailProps) => {
  const [thumbnailId, setThumbnailId] = useState<number | undefined>(
    initThumbnailId
  )

  const handleChangeThumbnail = async (file: File | null) => {
    if (!file) {
      setThumbnailId(undefined)

      return
    }

    const formData = new FormData()

    formData.append("file", file)
    formData.append("usage", "THUMBNAIL")

    const { data } = await axios.post<UploadPostFileResponse>(
      `/storage/${postId}/files`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    )

    setThumbnailId(data.id)
  }
  return (
    <EditorThumbnailField
      initThumbnail={initThumbnail}
      onChange={handleChangeThumbnail}
      thumbnailId={thumbnailId}
    />
  )
}
export default EditorThumbnail
