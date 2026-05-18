"use client"

import { usePostDetailApi } from "@/src/03_features/post/api/postDetail.api"

import MarkDownPreview from "@/src/04_entities/markdown/ui/MarkDownPreview"
import { Skeleton } from "@packages/ui/src/components/skeleton"

const PostDetailSkeleton = () => {
  return (
    <div className="w-full">
      <div className="mx-auto flex w-full md:w-3xl">
        <div className="w-full space-y-4 px-4 py-6 md:px-0">
          <Skeleton className="h-10 w-3/4 rounded-xs" />
          <Skeleton className="h-6 w-1/3 rounded-xs" />
          <div className="space-y-3 pt-6">
            <Skeleton className="h-5 w-full rounded-xs" />
            <Skeleton className="h-5 w-full rounded-xs" />
            <Skeleton className="h-5 w-5/6 rounded-xs" />
            <Skeleton className="h-48 w-full rounded-xs" />
            <Skeleton className="h-5 w-full rounded-xs" />
            <Skeleton className="h-5 w-11/12 rounded-xs" />
            <Skeleton className="h-5 w-4/5 rounded-xs" />
          </div>
        </div>
      </div>
    </div>
  )
}

const PostDetail = ({ postId }: { postId: string }) => {
  const { postDetail, isLoading, isError } = usePostDetailApi(postId)

  if (isLoading) {
    return <PostDetailSkeleton />
  }

  if (isError) {
    return (
      <div className="w-full">
        <div className="mx-auto flex w-full md:w-3xl">
          <div className="px-4 py-6 text-sm text-destructive md:px-0">
            게시글을 불러오지 못했습니다.
          </div>
        </div>
      </div>
    )
  }

  if (!postDetail) {
    return <></>
  }
  return (
    <div className="w-full">
      <div className="mx-auto flex w-full md:w-3xl">
        <MarkDownPreview markdown={postDetail.post.markdown} />
      </div>
    </div>
  )
}
export default PostDetail
