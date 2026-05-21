import ImagePreviewInput from "@/src/05_shared/input/ui/ImagePreviewInput"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@packages/ui/src/components/field"
import { useId } from "react"
import { EDITOR_FORM_NAME } from "../../model/EditorForm.const"
import { EditorThumbnailFieldProps } from "../../model/editorField.type"

const EditorThumbnailField = ({
  onChange: handleChange,
  initThumbnail,
  thumbnailId,
}: EditorThumbnailFieldProps) => {
  const id = useId()
  return (
    <Field>
      <FieldLabel htmlFor={`${EDITOR_FORM_NAME.THUMBNAIL}-${id}`}>
        {"대표 이미지"}
      </FieldLabel>
      <FieldDescription>
        카드와 상세 상단에 표시될 썸네일을 업로드합니다.
      </FieldDescription>
      <ImagePreviewInput
        id={`${EDITOR_FORM_NAME.THUMBNAIL}-${id}`}
        name={EDITOR_FORM_NAME.THUMBNAIL}
        defaultPreviewSrc={initThumbnail}
        value={thumbnailId}
        onChange={handleChange}
      />
    </Field>
  )
}
export default EditorThumbnailField
