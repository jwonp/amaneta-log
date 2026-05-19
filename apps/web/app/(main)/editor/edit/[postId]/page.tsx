import EditorEditView from "@/src/01_views/editor/ui/EditorEditView"
import { requireSession } from "@/lib/auth/guards"

const EditorEditPage = async ({
  params,
}: {
  params: Promise<{ postId: string }>
}) => {
  await requireSession()
  const { postId } = await params
  return <EditorEditView postId={postId} />
}
export default EditorEditPage
