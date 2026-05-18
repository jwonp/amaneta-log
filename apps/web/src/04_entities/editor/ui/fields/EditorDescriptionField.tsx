import TextareaInput from "@/src/05_shared/input/ui/TextareaInput"
import { Field, FieldLabel } from "@packages/ui/src/components/field"
import { useId } from "react"
import { EDITOR_FORM_NAME } from "../../model/EditorForm.const"
interface EditorDescriptionFieldProps {
  initDescription?: string
  value?: string
  onChange?: (value: string) => void
}
const EditorDescriptionField = ({
  initDescription,
  value,
  onChange,
}: EditorDescriptionFieldProps) => {
  const id = useId()
  return (
    <Field>
      <FieldLabel htmlFor={`${EDITOR_FORM_NAME.DESCRIPTION}-${id}`}>
        {"설명"}
      </FieldLabel>
      <TextareaInput
        id={`editor-description-${id}`}
        name={EDITOR_FORM_NAME.DESCRIPTION}
        placeholder={"이 글에 대해서 간단하게 설명해주세요."}
        defaultValue={initDescription}
        value={value}
        onChange={onChange}
      />
    </Field>
  )
}
export default EditorDescriptionField
