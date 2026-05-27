export interface Tag {
  slug: string
  label: string
  count: number
}

export interface PostFilterItem {
  id: number
  title: string
  excerpt: string
  tags: string[]
  publishedAt: string
}
