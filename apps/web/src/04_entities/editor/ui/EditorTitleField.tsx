import TextInput from "@/src/05_shared/input/ui/TextInput"
import { useId } from "react"
import { EDITOR_FORM_NAME } from "../model/EditorForm.const"

const EditorTitleField = () => {
  const id = useId()
  return (
    <div className="mb-4">
      <TextInput
        id={`${EDITOR_FORM_NAME.TITLE}-${id}`}
        name={EDITOR_FORM_NAME.TITLE}
      />
    </div>
  )
}
export default EditorTitleField
