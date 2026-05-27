import { describe, expect, it } from "vitest"
import {
  parseTagsFromQuery,
  stringifyTagsToQuery,
  filterPostsByTags,
  toggleTag,
} from "./postFilter.utils"
import type { PostFilterItem } from "../model/tag.type"

const makePosts = (): PostFilterItem[] => [
  { id: 1, title: "Post 1", excerpt: "", tags: ["react", "nextjs"], publishedAt: "2025-01-01" },
  { id: 2, title: "Post 2", excerpt: "", tags: ["typescript"], publishedAt: "2025-01-02" },
  { id: 3, title: "Post 3", excerpt: "", tags: ["nextjs", "typescript"], publishedAt: "2025-01-03" },
  { id: 4, title: "Post 4", excerpt: "", tags: ["security"], publishedAt: "2025-01-04" },
]

describe("parseTagsFromQuery", () => {
  it("parses comma-separated tag string", () => {
    expect(parseTagsFromQuery("react,nextjs")).toEqual(["react", "nextjs"])
  })

  it("trims whitespace from tags", () => {
    expect(parseTagsFromQuery("react, nextjs ")).toEqual(["react", "nextjs"])
  })

  it("returns empty array for null", () => {
    expect(parseTagsFromQuery(null)).toEqual([])
  })

  it("returns empty array for undefined", () => {
    expect(parseTagsFromQuery(undefined)).toEqual([])
  })

  it("returns empty array for empty string", () => {
    expect(parseTagsFromQuery("")).toEqual([])
  })

  it("handles single tag", () => {
    expect(parseTagsFromQuery("react")).toEqual(["react"])
  })
})

describe("stringifyTagsToQuery", () => {
  it("joins tags with comma", () => {
    expect(stringifyTagsToQuery(["react", "nextjs"])).toBe("react,nextjs")
  })

  it("returns empty string for empty array", () => {
    expect(stringifyTagsToQuery([])).toBe("")
  })

  it("handles single tag", () => {
    expect(stringifyTagsToQuery(["react"])).toBe("react")
  })
})

describe("filterPostsByTags (OR logic)", () => {
  it("returns all posts when no tags selected", () => {
    const posts = makePosts()
    expect(filterPostsByTags(posts, [])).toHaveLength(4)
  })

  it("filters posts with single tag", () => {
    const posts = makePosts()
    const result = filterPostsByTags(posts, ["react"])
    expect(result.map((p) => p.id)).toEqual([1])
  })

  it("applies OR logic for multiple tags", () => {
    const posts = makePosts()
    const result = filterPostsByTags(posts, ["react", "typescript"])
    expect(result.map((p) => p.id).sort()).toEqual([1, 2, 3])
  })

  it("returns empty array when no posts match", () => {
    const posts = makePosts()
    expect(filterPostsByTags(posts, ["unknown"])).toHaveLength(0)
  })

  it("does not mutate input array", () => {
    const posts = makePosts()
    const original = [...posts]
    filterPostsByTags(posts, ["react"])
    expect(posts).toEqual(original)
  })
})

describe("toggleTag", () => {
  it("adds tag when not selected", () => {
    expect(toggleTag(["react"], "nextjs")).toEqual(["react", "nextjs"])
  })

  it("removes tag when already selected (clear individual)", () => {
    expect(toggleTag(["react", "nextjs"], "react")).toEqual(["nextjs"])
  })

  it("returns empty array after clearing last tag", () => {
    expect(toggleTag(["react"], "react")).toEqual([])
  })

  it("does not mutate input array", () => {
    const tags = ["react", "nextjs"]
    toggleTag(tags, "react")
    expect(tags).toEqual(["react", "nextjs"])
  })
})

describe("clear all", () => {
  it("empty selectedTags shows all posts", () => {
    const posts = makePosts()
    expect(filterPostsByTags(posts, [])).toHaveLength(posts.length)
  })
})
