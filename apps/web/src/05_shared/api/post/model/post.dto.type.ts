import { StorageFile } from "../../storage/model/storage.type"
import { User } from "../../user/model/user.type"
import { Post, PostStatus } from "./post.type"

export interface GetPostDraftIdResponse {
  id: number
  status: PostStatus
}

export interface GetPostByIdResponse {
  post: Omit<Post, "status" | "publishedAt" | "isPublic" | "authorId"> & {
    thumbnail?: string
  }
  author: Pick<User, "username" | "profileImage">
  files: Pick<StorageFile, "id" | "kind" | "storedName" | "mimeType">[]
}

export interface GetEditablePostByIdResponse {
  post: Post
  files: StorageFile[]
}

export type EditablePostListVisibility = "all" | "public" | "draft"

export interface GetEditablePostListQuery {
  limit?: number
  cursor?: string | null
  query?: string | null
  visibility?: EditablePostListVisibility
  tag?: string | null
}

export interface EditablePostListItemDto {
  id: number
  isPublic: boolean
  tags: string[]
  title: string
  description: string | null
  updatedAt: string
  author: string
  thumbnailFileId: number | null
}

export interface GetEditablePostListResponse {
  items: EditablePostListItemDto[]
  pageInfo: {
    nextCursor: string | null
    hasNextPage: boolean
  }
  appliedFilters: {
    query: string | null
    visibility: EditablePostListVisibility
    tag: string | null
    limit: number
  }
}

export interface GetPostListQuery {
  limit?: string
  cursor?: string
  query?: string
  tag?: string
}
export type PostListItemDto = Omit<EditablePostListItemDto, "isPublic">

export interface GetPostListResponse {
  items: PostListItemDto[]
  pageInfo: {
    nextCursor: string | null
    hasNextPage: boolean
  }
  appliedFilters: {
    query: string | null
    tag: string | null
    limit: number
  }
}

export interface SavePostRequset {
  title: string
  description?: string | null
  markdown: string
  tags: string[]
  isPublic: boolean
  thumbnailId?: number | null
}

export interface SavePostResponse {
  id: number
  status: PostStatus
  isPublic: boolean
  updatedAt: string
  publishedAt: string | null
}
