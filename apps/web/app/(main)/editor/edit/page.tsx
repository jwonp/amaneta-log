import EditorNewEditView from "@/src/01_views/editor/ui/EditorNewEditView"
import { requireSession } from "@/lib/auth/guards"

const EditorNewEditPage = async () => {
  await requireSession()
  return <EditorNewEditView />
}
export default EditorNewEditPage
