"use client"

import { Button } from "@packages/ui/src/components/button"
import type { PostFilterItem } from "../model/tag.type"

interface FilteredPostListProps {
  posts: PostFilterItem[]
  onClearAll: () => void
}

const FilteredPostList = ({ posts, onClearAll }: FilteredPostListProps) => {
  if (posts.length === 0) {
    return (
      <div className="flex min-h-60 flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-foreground/60">
          선택한 태그에 해당하는 게시물이 없습니다.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearAll}
          aria-label="모든 태그 필터 해제"
        >
          전체 해제
        </Button>
      </div>
    )
  }

  return (
    <ol className="grid w-full list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <li key={post.id} className="rounded-md border p-4">
          <div className="flex flex-wrap gap-1.5 pb-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-2 py-0.5 text-xs text-foreground/70"
              >
                {tag}
              </span>
            ))}
          </div>
          <h3 className="mb-1 text-sm font-medium leading-5">{post.title}</h3>
          <p className="line-clamp-2 text-xs text-foreground/60">
            {post.excerpt}
          </p>
          <p className="mt-3 text-xs text-foreground/40">{post.publishedAt}</p>
        </li>
      ))}
    </ol>
  )
}

export default FilteredPostList
