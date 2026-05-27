"use client"

import { useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import PostList from "./PostList"
import PostTagFilterBar from "@/src/03_features/post/filter/ui/PostTagFilterBar"
import PostSortSelect from "@/src/03_features/post/filter/ui/PostSortSelect"
import ActiveTagFilters from "@/src/03_features/post/filter/ui/ActiveTagFilters"
import {
  parseTagsFromQuery,
  stringifyTagsToQuery,
} from "@/src/03_features/post/filter/lib/postFilter.utils"
import { useTagListApi } from "@/src/03_features/post/filter/api/tagList.api"
import {
  DEFAULT_SORT,
  SORT_OPTIONS,
  type SortOrder,
} from "@/src/03_features/post/filter/model/sort.type"
import type { GetPostListResponse } from "@/src/05_shared/api/post/model/post.dto.type"

const TAGS_PARAM = "tags"
const SORT_PARAM = "sort"

interface PostListClientProps {
  initialPage: GetPostListResponse
}

const PostListClient = ({ initialPage }: PostListClientProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const selectedTags = parseTagsFromQuery(searchParams.get(TAGS_PARAM))
  const rawSort = searchParams.get(SORT_PARAM)
  const sort: SortOrder =
    rawSort && (SORT_OPTIONS as readonly string[]).includes(rawSort)
      ? (rawSort as SortOrder)
      : DEFAULT_SORT

  const { data: tags = [] } = useTagListApi()

  const buildParams = useCallback(
    (updates: Partial<{ tags: string[]; sort: SortOrder }>) => {
      const params = new URLSearchParams(searchParams.toString())

      if ("tags" in updates) {
        const next = updates.tags ?? []
        if (next.length > 0) {
          params.set(TAGS_PARAM, stringifyTagsToQuery(next))
        } else {
          params.delete(TAGS_PARAM)
        }
      }

      if ("sort" in updates) {
        const nextSort = updates.sort ?? DEFAULT_SORT
        if (nextSort === DEFAULT_SORT) {
          params.delete(SORT_PARAM)
        } else {
          params.set(SORT_PARAM, nextSort)
        }
      }

      return params.toString()
    },
    [searchParams]
  )

  const updateTags = useCallback(
    (next: string[]) => {
      router.replace(`/posts?${buildParams({ tags: next })}`, { scroll: false })
    },
    [router, buildParams]
  )

  const updateSort = useCallback(
    (next: SortOrder) => {
      router.replace(`/posts?${buildParams({ sort: next })}`, { scroll: false })
    },
    [router, buildParams]
  )

  const removeTag = useCallback(
    (slug: string) => updateTags(selectedTags.filter((t) => t !== slug)),
    [selectedTags, updateTags]
  )

  const clearAll = useCallback(() => updateTags([]), [updateTags])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Extension 1 wire-up: tags passed to PostList → /api/posts?tag=slug1,slug2
            Backend must split comma-separated tag param for full OR semantics. */}
        <PostTagFilterBar
          tags={tags}
          selectedTags={selectedTags}
          onTagsChange={updateTags}
        />
        {/* Extension 3: sort */}
        <PostSortSelect sort={sort} onSortChange={updateSort} />
      </div>

      {selectedTags.length > 0 && (
        <ActiveTagFilters
          selectedTags={selectedTags}
          tags={tags}
          onRemoveTag={removeTag}
          onClearAll={clearAll}
        />
      )}

      {/* Extension 1: PostList handles all modes (filtered + sorted) via backend */}
      <PostList
        initialPage={initialPage}
        selectedTags={selectedTags}
        sort={sort}
        onClearFilters={clearAll}
      />
    </div>
  )
}

export default PostListClient
