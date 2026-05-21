import TextInput from "@/src/05_shared/input/ui/TextInput"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@packages/ui/src/components/field"
import { useId } from "react"
import { EDITOR_FORM_NAME } from "../../model/EditorForm.const"
interface EditorTitleFieldProps {
  value?: string
  onChange?: (value: string) => void
}
const EditorTitleField = ({ value, onChange }: EditorTitleFieldProps) => {
  const id = useId()
  return (
    <Field className="mb-4 gap-1.5">
      <FieldLabel htmlFor={`${EDITOR_FORM_NAME.TITLE}-${id}`}>제목</FieldLabel>
      <FieldDescription>목록과 본문 상단에 표시되는 제목입니다.</FieldDescription>
      <TextInput
        id={`${EDITOR_FORM_NAME.TITLE}-${id}`}
        name={EDITOR_FORM_NAME.TITLE}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </Field>
  )
}
export default EditorTitleField
