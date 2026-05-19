"use client"

import { toPostDetailError } from "@/src/03_features/post/api/postDetail.error"
import { GetPostByIdResponse } from "@/src/05_shared/api/post/model/post.dto.type"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"

export const usePostDetailApi = (postId: string | number) => {
  const postDetailQuery = useQuery({
    queryKey: ["post-detail", postId],
    queryFn: async () => {
      const response = await axios.get<GetPostByIdResponse>(`/api/posts/${postId}`)
      return response.data
    },
  })

  const postDetail = postDetailQuery.data
  const error = postDetailQuery.error ? toPostDetailError(postDetailQuery.error) : null

  return {
    postDetail,
    error,
    status: error?.status,
    code: error?.code,
    message: error?.message,
    isLoading: postDetailQuery.isLoading,
    isError: postDetailQuery.isError,
  }
}
