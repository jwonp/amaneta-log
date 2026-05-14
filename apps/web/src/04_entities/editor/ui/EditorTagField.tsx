import TagInput from "@/src/05_shared/input/ui/TagInput"
import { Field, FieldLabel } from "@packages/ui/src/components/field"
import { useId } from "react"
import { EDITOR_FORM_NAME } from "../model/EditorForm.const"

const EditorTagField = () => {
  const id = useId()
  return (
    <Field>
      <FieldLabel htmlFor={`${EDITOR_FORM_NAME.TAG}-${id}`}>
        {"태그"}
      </FieldLabel>
      <TagInput
        id={`${EDITOR_FORM_NAME.TAG}-${id}`}
        name={EDITOR_FORM_NAME.TAG}
      />
    </Field>
  )
}
export default EditorTagField
