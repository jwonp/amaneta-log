import MarkDownPreview from "@/src/04_entities/markdown/ui/MarkDownPreview"
import { GetPostByIdResponse } from "@/src/05_shared/api/post/model/post.dto.type"

const PostDetail = ({ postDetail }: { postDetail: GetPostByIdResponse }) => {
  return (
    <div className="w-full">
      <div className="mx-auto flex w-full md:w-3xl">
        <MarkDownPreview markdown={postDetail.post.markdown} />
      </div>
    </div>
  )
}

export default PostDetail
