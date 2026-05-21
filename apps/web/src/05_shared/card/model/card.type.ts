import { Post } from "../../api/post/model/post.type"

export interface EditorListItemCardProps extends Pick<
  Post,
  "id" | "isPublic" | "tags" | "title" | "description" | "updatedAt"
> {
  thumbnailSrc?: string
  author: string
}
export interface PostListItemCardProps extends Pick<
  Post,
  "id" | "tags" | "title" | "description" | "updatedAt"
> {
  thumbnailSrc?: string
  author: string
  prioritizeImage?: boolean
}
