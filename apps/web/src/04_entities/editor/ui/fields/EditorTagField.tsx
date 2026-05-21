import TagInput from "@/src/05_shared/input/ui/TagInput"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@packages/ui/src/components/field"
import { useId } from "react"
import { EDITOR_FORM_NAME } from "../../model/EditorForm.const"
interface EditorTagFieldProps {
  initTags?: string[]
  value?: string[]
  onChange?: (value: string[]) => void
}
const EditorTagField = ({ initTags, value, onChange }: EditorTagFieldProps) => {
  const id = useId()
  return (
    <Field>
      <FieldLabel htmlFor={`${EDITOR_FORM_NAME.TAG}-${id}`}>
        {"태그"}
      </FieldLabel>
      <FieldDescription>
        Enter 또는 쉼표로 태그를 추가하고 중복 태그는 자동으로 막습니다.
      </FieldDescription>
      <TagInput
        id={`${EDITOR_FORM_NAME.TAG}-${id}`}
        name={EDITOR_FORM_NAME.TAG}
        defaultValue={initTags}
        value={value}
        onChange={onChange}
      />
    </Field>
  )
}
export default EditorTagField
