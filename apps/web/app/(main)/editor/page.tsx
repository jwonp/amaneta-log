import EditorListView from "@/src/01_views/editor/ui/EditorListView"
import { requireSession } from "@/lib/auth/guards"
import type { Metadata } from "next"
import { getNoIndexMetadata } from "@/src/05_shared/seo/lib/seo"

export const metadata: Metadata = getNoIndexMetadata(
  "에디터",
  "Amaneta Log 게시물 편집 목록입니다."
)

const EditorPage = async () => {
  await requireSession()
  return <EditorListView />
}
export default EditorPage
