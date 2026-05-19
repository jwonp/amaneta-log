import { GetPostByIdResponse } from "@/src/05_shared/api/post/model/post.dto.type"
import PostDetail from "@/src/02_widgets/post/ui/PostDetail"

const PostDetailView = ({ postDetail }: { postDetail: GetPostByIdResponse }) => {
  return <PostDetail postDetail={postDetail} />
}
export default PostDetailView
