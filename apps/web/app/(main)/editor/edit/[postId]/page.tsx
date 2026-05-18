import EditorEditView from "@/src/01_views/editor/ui/EditorEditView"

const EditorEditPage = async ({
  params,
}: {
  params: Promise<{ postId: string }>
}) => {
  const { postId } = await params
  return <EditorEditView postId={postId} />
}
export default EditorEditPage
