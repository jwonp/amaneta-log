import SwtichInput from "@/src/05_shared/input/ui/SwtichInput"
import { Field, FieldLabel } from "@packages/ui/src/components/field"
import { useId } from "react"
import { EDITOR_FORM_NAME } from "../../model/EditorForm.const"
interface EditorVisibilityFieldProps {
  initVisibility?: boolean
  value?: boolean
  onChange?: (value: boolean) => void
}
const EditorVisibilityField = ({
  initVisibility,
  value,
  onChange,
}: EditorVisibilityFieldProps) => {
  const id = useId()
  return (
    <Field>
      <FieldLabel htmlFor={`${EDITOR_FORM_NAME.VISIBILITY}-${id}`}>
        {"공개 설정"}
      </FieldLabel>
      <SwtichInput
        id={`${EDITOR_FORM_NAME.VISIBILITY}-${id}`}
        name={EDITOR_FORM_NAME.VISIBILITY}
        label={{
          on: "전체 공개",
          off: "비공개",
        }}
        defaultValue={!!initVisibility}
        value={value}
        onChange={onChange}
      />
    </Field>
  )
}
export default EditorVisibilityField
