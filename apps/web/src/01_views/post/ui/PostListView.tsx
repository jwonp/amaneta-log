import { Suspense } from "react"
import ReactQueryClientProvider from "@/src/04_entities/query/ui/ReactQueryClientProvider"
import PostListClient from "@/src/02_widgets/post/ui/PostListClient"
import { GetPostListResponse } from "@/src/05_shared/api/post/model/post.dto.type"

const PostListView = ({ initialPage }: { initialPage: GetPostListResponse }) => {
  return (
    <div className="min-h-[calc(100svh-56px)] p-6">
      <ReactQueryClientProvider>
        <Suspense>
          <PostListClient initialPage={initialPage} />
        </Suspense>
      </ReactQueryClientProvider>
    </div>
  )
}
export default PostListView
