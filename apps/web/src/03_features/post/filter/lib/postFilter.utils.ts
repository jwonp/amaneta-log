import type { PostFilterItem } from "../model/tag.type"

export const parseTagsFromQuery = (param: string | null | undefined): string[] => {
  if (!param?.trim()) return []
  return param
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
}

export const stringifyTagsToQuery = (tags: readonly string[]): string =>
  tags.join(",")

export const filterPostsByTags = (
  posts: PostFilterItem[],
  selectedTags: readonly string[]
): PostFilterItem[] => {
  if (selectedTags.length === 0) return posts
  return posts.filter((post) =>
    selectedTags.some((tag) => post.tags.includes(tag))
  )
}

export const toggleTag = (
  selectedTags: readonly string[],
  slug: string
): string[] => {
  if (selectedTags.includes(slug)) {
    return selectedTags.filter((t) => t !== slug)
  }
  return [...selectedTags, slug]
}
