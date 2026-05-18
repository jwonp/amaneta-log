import { POST_STATUS } from "./post.const"

export type PostStatus = (typeof POST_STATUS)[keyof typeof POST_STATUS]

export interface Post {
  tags: string[]
  id: number
  status: PostStatus
  createdAt: Date
  updatedAt: Date
  title: string
  description: string | null
  markdown: string
  isPublic: boolean
  authorId: number
  publishedAt: Date | null
}
