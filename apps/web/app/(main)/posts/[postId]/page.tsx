import PostDetailView from "@/src/01_views/post/ui/PostDetailView"

const PostDetailPage = async ({
  params,
}: {
  params: Promise<{
    postId: string
  }>
}) => {
  const { postId } = await params
  return <PostDetailView postId={postId} />
}

export default PostDetailPage
