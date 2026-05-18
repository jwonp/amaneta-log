import { EditorThumbnailFieldProps } from "@/src/04_entities/editor/model/editorField.type"

export interface EditorThumbnailProps extends EditorThumbnailFieldProps {
  postId: number
  initThumbnailId?: number
}
