// import FilterSelect from "@/src/05_shared/select/ui/FilterSelect"
// import HeaderMenuButton from "@/src/05_shared/button/ui/HeaderMenuButton"
// import LayoutSeparator from "@/src/05_shared/separator/ui/LayoutSeparator"
import ReactQueryClientProvider from "@/src/04_entities/query/ui/ReactQueryClientProvider"
import PostList from "@/src/02_widgets/post/ui/PostList"
import { GetPostListResponse } from "@/src/05_shared/api/post/model/post.dto.type"

const PostListView = ({ initialPage }: { initialPage: GetPostListResponse }) => {
  return (
    <div className="min-h-[calc(100svh-56px)] p-6">
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
      <ReactQueryClientProvider>
        <PostList initialPage={initialPage} />
      </ReactQueryClientProvider>
    </div>
  )
}
export default PostListView
