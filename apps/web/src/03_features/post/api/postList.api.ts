"use client"

import {
  GetPostListQuery,
  GetPostListResponse,
} from "@/src/05_shared/api/post/model/post.dto.type"
import { useInfiniteQuery } from "@tanstack/react-query"
import axios from "axios"
import {
  createPostListSearchParams,
  DEFAULT_POST_LIST_LIMIT,
  mapPostListItem,
} from "./postList.shared"

export const usePostListApi = ({
  filters = {},
  initialPage,
}: {
  filters?: GetPostListQuery
  initialPage?: GetPostListResponse
} = {}) => {
  const editorListQuery = useInfiniteQuery({
    queryKey: [
      "post-list",
      filters.limit ?? DEFAULT_POST_LIST_LIMIT,
      filters.query ?? null,
      filters.tag ?? null,
    ],
    initialPageParam: null as string | null,
    initialData: initialPage
      ? {
          pages: [initialPage],
          pageParams: [null],
        }
      : undefined,
    queryFn: async ({ pageParam }): Promise<GetPostListResponse> => {
      const searchParams = createPostListSearchParams(filters, pageParam)
      const response = await axios
        .get<GetPostListResponse>(`/api/posts?${searchParams}`)
        .then((res) => ({ data: res.data }))
        .catch(() => ({ data: undefined }))

      if (!response?.data) {
        throw new Error("failed to fetch posts")
      }

      return response.data
    },
    getNextPageParam: (lastPage) => lastPage.pageInfo.nextCursor,
  })

  const items = editorListQuery.data?.pages.flatMap((page) =>
    page.items.map(mapPostListItem)
  )

  return {
    ...editorListQuery,
    items: items ?? [],
  }
}
