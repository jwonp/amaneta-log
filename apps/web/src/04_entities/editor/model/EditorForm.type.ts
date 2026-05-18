export interface BlogForm {
  title: string
  markdown: string
  tags: string[]
  isPublic: boolean
  description: string
  thumbnailSrc?: File
}
