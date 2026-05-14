import EditorListItemCard from "@/src/05_shared/card/ui/EditorListItemCard"
import { Button } from "@packages/ui/src/components/button"
import { IconPlus } from "@tabler/icons-react"
import Link from "next/link"
const EditorPage = () => {
  return (
    <div className="min-h-[calc(100svh-54px)] p-6">
      {/* <div className="mb-4 flex h-9 w-full">
        <div className="flex w-full justify-between">
          <div className="flex h-8 gap-2">
            <HeaderMenuButton label={"전체"} isSelected />
            <HeaderMenuButton label={"프로토콜"} />
            <HeaderMenuButton label={"보안"} />
            <HeaderMenuButton label={"전체"} />
          </div>
          <FilterSelect />
        </div>
      </div>
      <LayoutSeparator /> */}
      <div className="flex justify-end">
        <Link href={"/editor/edit"}>
          <Button variant={"default"} className="rounded-xs">
            <IconPlus />
            <p>새 게시물 작성</p>
          </Button>
        </Link>
      </div>
      <div className="my-6 min-h-[calc(100svh-81px)]">
        <div className="grid w-full grid-cols-[repeat(auto-fit,384px)] justify-center gap-4">
          <EditorListItemCard />
          <EditorListItemCard />
          <EditorListItemCard />
          <EditorListItemCard />
          <EditorListItemCard />
          <EditorListItemCard />
          <EditorListItemCard />
          <EditorListItemCard />
        </div>
      </div>
    </div>
  )
}
export default EditorPage
