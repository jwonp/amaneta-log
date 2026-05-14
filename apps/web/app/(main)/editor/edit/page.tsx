import MarkDownWidget from "@/src/02_widgets/markdown/ui/MarkDownWidget"
import LayoutSeparator from "@/src/05_shared/separator/ui/LayoutSeparator"

const EditorNewEditPage = () => {
  return (
    <div className="min-h-[calc(100svh-54px)] w-full max-w-full overflow-x-clip px-4 py-6 md:p-6">
      <div className="mb-6 flex w-full min-w-0 flex-col gap-3 md:flex-row md:justify-between">
        <div className="min-w-0">
          <h1 className="text-base leading-6 font-medium">새 글 작성</h1>
        </div>

        <div className="flex min-w-0 flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 shrink-0 rounded-full bg-green-500" />
            <p className="text-xs leading-4 text-foreground/80">자동 저장됨</p>
          </div>

          <LayoutSeparator orientation="vertical" />

          <div className="flex items-center">
            <p className="text-xs leading-4 text-foreground/80">
              마지막 저장 : 14:32
            </p>
          </div>
        </div>
      </div>

      <LayoutSeparator />

      <div className="my-10 w-full max-w-full min-w-0 gap-8">
        <MarkDownWidget />
      </div>
    </div>
  )
}
export default EditorNewEditPage
