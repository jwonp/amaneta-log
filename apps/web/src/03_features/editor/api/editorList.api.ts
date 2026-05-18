"use client"

import {
  GetEditablePostListQuery,
  GetEditablePostListResponse,
} from "@/src/05_shared/api/post/model/post.dto.type"

import { useInfiniteQuery } from "@tanstack/react-query"
import axios from "axios"
import { EditorListItemCardProps } from "@/src/05_shared/card/model/card.type"

const DEFAULT_LIMIT = 12

const createSearchParams = (
  filters: GetEditablePostListQuery,
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

  if (filters.visibility && filters.visibility !== "all") {
    searchParams.set("visibility", filters.visibility)
  }

  if (filters.tag?.trim()) {
    searchParams.set("tag", filters.tag.trim())
  }

  return searchParams
}

const mapEditablePostListItem = (
  item: GetEditablePostListResponse["items"][number]
): EditorListItemCardProps => {
  const thumbnailSrc = item.thumbnailFileId
    ? `/api/storage/${item.id}/files/${item.thumbnailFileId}`
    : undefined

  const cardItem: EditorListItemCardProps = {
    id: item.id,
    isPublic: item.isPublic,
    tags: [...item.tags],
    title: item.title,
    description: item.description,
    updatedAt: new Date(item.updatedAt),
    thumbnailSrc,
    author: item.author,
  }

  return cardItem
}

export const useEditorListApi = (filters: GetEditablePostListQuery = {}) => {
  const editorListQuery = useInfiniteQuery({
    queryKey: [
      "editor-list",
      filters.limit ?? DEFAULT_LIMIT,
      filters.query ?? null,
      filters.visibility ?? "all",
      filters.tag ?? null,
    ],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }): Promise<GetEditablePostListResponse> => {
      const searchParams = createSearchParams(filters, pageParam)
      const response = await axios
        .get<GetEditablePostListResponse>(`/api/posts/editable?${searchParams}`)
        .then((res) => ({ data: res.data }))
        .catch(() => ({ data: undefined }))

      if (!response.data) {
        throw new Error("failed to fetch editable posts")
      }

      return response.data
    },
    getNextPageParam: (lastPage) => lastPage.pageInfo.nextCursor,
  })

  const items = editorListQuery.data?.pages.flatMap((page) =>
    page.items.map(mapEditablePostListItem)
  )

  return {
    ...editorListQuery,
    items: items ?? [],
  }
}
