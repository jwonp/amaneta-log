import TextareaInput from "@/src/05_shared/input/ui/TextareaInput"
import { Field, FieldLabel } from "@packages/ui/src/components/field"
import { useId } from "react"
import { EDITOR_FORM_NAME } from "../model/EditorForm.const"

const EditorDescriptionField = () => {
  const id = useId()
  return (
    <Field>
      <FieldLabel htmlFor={`${EDITOR_FORM_NAME.DESCRIPTION}-${id}`}>
        {"설명"}
      </FieldLabel>
      <TextareaInput
        id={`editor-description-${id}`}
        name={"editor-description"}
        placeholder={"이 글에 대해서 간단하게 설명해주세요."}
      />
    </Field>
  )
}
export default EditorDescriptionField
