import TextInput from "@/src/05_shared/input/ui/TextInput"
import { useId } from "react"
import { EDITOR_FORM_NAME } from "../../model/EditorForm.const"
interface EditorTitleFieldProps {
  initTitle?: string
}
const EditorTitleField = ({ initTitle }: EditorTitleFieldProps) => {
  const id = useId()
  return (
    <div className="mb-4">
      <TextInput
        id={`${EDITOR_FORM_NAME.TITLE}-${id}`}
        name={EDITOR_FORM_NAME.TITLE}
        defaultValue={initTitle}
      />
    </div>
  )
}
export default EditorTitleField
