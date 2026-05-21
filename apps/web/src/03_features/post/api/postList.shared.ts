import {
  GetPostListQuery,
  GetPostListResponse,
} from "@/src/05_shared/api/post/model/post.dto.type"
import { PostListItemCardProps } from "@/src/05_shared/card/model/card.type"

export const DEFAULT_POST_LIST_LIMIT = 12

export const createPostListSearchParams = (
  filters: GetPostListQuery,
  cursor?: string | null
) => {
  const searchParams = new URLSearchParams()

  searchParams.set("limit", String(filters.limit ?? DEFAULT_POST_LIST_LIMIT))

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

export const mapPostListItem = (
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
