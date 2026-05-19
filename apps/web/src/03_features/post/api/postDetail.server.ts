import { createServerRequestApi } from "@/lib/api/requestApi"
import { GetPostByIdResponse } from "@/src/05_shared/api/post/model/post.dto.type"
import { toPostDetailError } from "./postDetail.error"

export const getPostDetail = async (postId: string) => {
  const requestApi = await createServerRequestApi()

  try {
    const response = await requestApi.get<GetPostByIdResponse>(`/posts/${postId}`)
    return response.data
  } catch (error) {
    throw toPostDetailError(error)
  }
}
