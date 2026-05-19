import EditorListView from "@/src/01_views/editor/ui/EditorListView"
import { requireSession } from "@/lib/auth/guards"

const EditorPage = async () => {
  await requireSession()
  return <EditorListView />
}
export default EditorPage
