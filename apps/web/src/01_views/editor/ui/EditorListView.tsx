import EditorList from "@/src/02_widgets/editor/ui/EditorList"

import { Button } from "@packages/ui/src/components/button"
import { IconPlus } from "@tabler/icons-react"
import Link from "next/link"

const EditorListView = () => {
  return (
    <div className="min-h-[calc(100svh-54px)] p-6">
      <div className="flex justify-end">
        <Link href={"/editor/edit"}>
          <Button variant={"default"} className="rounded-xs">
            <IconPlus />
            <p>새 게시물 작성</p>
          </Button>
        </Link>
      </div>
      <EditorList />
    </div>
  )
}
export default EditorListView
