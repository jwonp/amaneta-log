"use client"

import { Button } from "@packages/ui/src/components/button"
import { Badge } from "@packages/ui/src/components/badge"
import { IconX } from "@tabler/icons-react"
import type { Tag } from "../model/tag.type"

interface ActiveTagFiltersProps {
  selectedTags: string[]
  tags: Tag[]
  resultCount?: number
  onRemoveTag: (slug: string) => void
  onClearAll: () => void
}

const ActiveTagFilters = ({
  selectedTags,
  tags,
  resultCount,
  onRemoveTag,
  onClearAll,
}: ActiveTagFiltersProps) => {
  if (selectedTags.length === 0) return null

  const tagMap = new Map(tags.map((t) => [t.slug, t.label]))

  return (
    <div
      role="region"
      aria-label="활성 필터"
      className="flex flex-wrap items-center gap-2"
    >
      {resultCount !== undefined && (
        <>
          <span className="text-sm text-foreground/60" aria-live="polite">
            <span className="font-medium text-foreground">{resultCount}</span>
            {" "}posts
          </span>
          <div className="h-4 w-px bg-border" aria-hidden="true" />
        </>
      )}

      {selectedTags.map((slug) => (
        <Badge
          key={slug}
          variant="secondary"
          className="flex items-center gap-1 pl-2 pr-1"
        >
          <span>{tagMap.get(slug) ?? slug}</span>
          <button
            type="button"
            onClick={() => onRemoveTag(slug)}
            aria-label={`${tagMap.get(slug) ?? slug} 필터 해제`}
            className="rounded-full p-0.5 hover:bg-foreground/10 focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <IconX className="size-3" />
          </button>
        </Badge>
      ))}

      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="h-6 px-2 text-xs text-foreground/60 hover:text-foreground"
        aria-label="모든 태그 필터 해제"
      >
        전체 해제
      </Button>
    </div>
  )
}

export default ActiveTagFilters
