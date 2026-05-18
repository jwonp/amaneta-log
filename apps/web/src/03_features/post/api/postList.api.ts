"use client"

import {
  GetPostListQuery,
  GetPostListResponse,
} from "@/src/05_shared/api/post/model/post.dto.type"
import { PostListItemCardProps } from "@/src/05_shared/card/model/card.type"

import { useInfiniteQuery } from "@tanstack/react-query"

import axios from "axios"

const DEFAULT_LIMIT = 12

const createSearchParams = (
  filters: GetPostListQuery,
  cursor?: string | null
) => {
  const searchParams = new URLSearchParams()

  searchParams.set("limit", String(filters.limit ?? DEFAULT_LIMIT))

  if (cursor) {
    searchParams.set("cursor", cursor)
  }

  if (filters.query?.trim()) {
    searchParams.set("query", filters.query.trim())
  }

  if (filters.tag?.trim()) {
    searchParams.set("tag", filters.tag.trim())
  }

  return searchParams
}

const mapPostListItem = (
  item: GetPostListResponse["items"][number]
): PostListItemCardProps => {
  const thumbnailSrc = item.thumbnailFileId
    ? `/api/storage/${item.id}/files/${item.thumbnailFileId}`
    : undefined

  return {
    id: item.id,
    tags: [...item.tags],
    title: item.title,
    description: item.description,
    updatedAt: new Date(item.updatedAt),
    thumbnailSrc,
    author: item.author,
  }
}

export const usePostListApi = (filters: GetPostListQuery = {}) => {
  const editorListQuery = useInfiniteQuery({
    queryKey: [
      "post-list",
      filters.limit ?? DEFAULT_LIMIT,
      filters.query ?? null,
      filters.tag ?? null,
    ],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }): Promise<GetPostListResponse> => {
      const searchParams = createSearchParams(filters, pageParam)
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
