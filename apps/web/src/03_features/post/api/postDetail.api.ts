"use client"

import { GetPostByIdResponse } from "@/src/05_shared/api/post/model/post.dto.type"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"

export const usePostDetailApi = (postId: string | number) => {
  const postDetailQuery = useQuery({
    queryKey: ["post-detail", postId],
    queryFn: async () => {
      const response = await axios
        .get<GetPostByIdResponse>(`/api/posts/${postId}`)
        .then((res) => ({ data: res.data }))
        .catch(() => ({ data: undefined }))

      if (!response?.data) {
        throw new Error("failed to fetch post")
      }
      return response.data
    },
  })

  const postDetail = postDetailQuery.data

  return {
    postDetail,
    isLoading: postDetailQuery.isLoading,
    isError: postDetailQuery.isError,
  }
}
