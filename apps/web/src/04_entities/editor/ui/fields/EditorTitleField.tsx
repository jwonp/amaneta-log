import TextInput from "@/src/05_shared/input/ui/TextInput"
import { useId } from "react"
import { EDITOR_FORM_NAME } from "../../model/EditorForm.const"
interface EditorTitleFieldProps {
  value?: string
  onChange?: (value: string) => void
}
const EditorTitleField = ({ value, onChange }: EditorTitleFieldProps) => {
  const id = useId()
  return (
    <div className="mb-4">
      <TextInput
        id={`${EDITOR_FORM_NAME.TITLE}-${id}`}
        name={EDITOR_FORM_NAME.TITLE}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </div>
  )
}
export default EditorTitleField
