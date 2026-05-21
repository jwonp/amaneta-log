import { unstable_cache } from "next/cache"
import axios from "axios"
import { GetPostListQuery, GetPostListResponse } from "@/src/05_shared/api/post/model/post.dto.type"
import {
  createPostListSearchParams,
  DEFAULT_POST_LIST_LIMIT,
} from "./postList.shared"

const getBackendUrl = () => {
  const backendUrl = process.env.BACKEND_URL

  if (!backendUrl) {
    throw new Error("BACKEND_URL is not configured")
  }

  return backendUrl
}

export const getPostList = async (
  filters: GetPostListQuery = {},
  cursor?: string | null
) => {
  const searchParams = createPostListSearchParams(filters, cursor)
  const endpoint = searchParams.toString() ? `/posts?${searchParams}` : "/posts"
  const response = await axios.get<GetPostListResponse>(endpoint, {
    baseURL: getBackendUrl(),
  })

  return response.data
}

const getCachedInitialPostListInternal = unstable_cache(
  async () => getPostList({ limit: String(DEFAULT_POST_LIST_LIMIT) }),
  ["public-post-list-initial-page"],
  {
    revalidate: 300,
  }
)

export const getCachedInitialPostList = async () =>
  getCachedInitialPostListInternal()
