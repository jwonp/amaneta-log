import PostDetailView from "@/src/01_views/post/ui/PostDetailView"
import { isAppHttpError } from "@/lib/errors/app-error"
import { getPostDetail } from "@/src/03_features/post/api/postDetail.server"
import { forbidden, notFound, redirect, unauthorized } from "next/navigation"

const PostDetailPage = async ({
  params,
}: {
  params: Promise<{
    postId: string
  }>
}) => {
  const { postId } = await params

  if (!/^\d+$/.test(postId)) {
    redirect("/errors/400?reason=invalid-post-id")
  }

  try {
    const postDetail = await getPostDetail(postId)
    return <PostDetailView postDetail={postDetail} />
  } catch (error) {
    if (isAppHttpError(error)) {
      if (error.status === 401) {
        unauthorized()
      }

      if (error.status === 403) {
        forbidden()
      }

      if (error.status === 404) {
        notFound()
      }
    }

    throw error
  }
}

export default PostDetailPage
