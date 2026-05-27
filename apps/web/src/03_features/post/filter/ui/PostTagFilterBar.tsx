"use client"

import { useState } from "react"
import { Toggle } from "@packages/ui/src/components/toggle"
import { Button } from "@packages/ui/src/components/button"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@packages/ui/src/components/popover"
import { IconChevronDown, IconCheck } from "@tabler/icons-react"
import type { Tag } from "../model/tag.type"
import { QUICK_TAG_LIMIT } from "../model/tag.data"

interface PostTagFilterBarProps {
  tags: Tag[]
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
}

const PostTagFilterBar = ({
  tags,
  selectedTags,
  onTagsChange,
}: PostTagFilterBarProps) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const quickTags = tags.slice(0, QUICK_TAG_LIMIT)
  const moreTags = tags.slice(QUICK_TAG_LIMIT)
  const hasMore = moreTags.length > 0

  const toggle = (slug: string) => {
    if (selectedTags.includes(slug)) {
      onTagsChange(selectedTags.filter((t) => t !== slug))
    } else {
      onTagsChange([...selectedTags, slug])
    }
  }

  const filteredMore = moreTags.filter((t) =>
    t.label.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div
      role="group"
      aria-label="태그 필터"
      className="flex flex-wrap items-center gap-2"
    >
      {quickTags.map((tag) => (
        <Toggle
          key={tag.slug}
          variant="outline"
          size="sm"
          pressed={selectedTags.includes(tag.slug)}
          onPressedChange={() => toggle(tag.slug)}
          aria-label={`${tag.label} 태그 필터 ${selectedTags.includes(tag.slug) ? "해제" : "선택"}`}
          className="h-7 rounded-full px-3 text-xs"
        >
          {tag.label}
          <span className="ml-1 text-foreground/50">{tag.count}</span>
        </Toggle>
      ))}

      {hasMore && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 rounded-full px-3 text-xs"
              aria-label="더 많은 태그 보기"
              aria-expanded={open}
              aria-haspopup="listbox"
            >
              더 보기
              <IconChevronDown
                className="ml-1 size-3 transition-transform data-[state=open]:rotate-180"
                data-state={open ? "open" : "closed"}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-64 p-2"
            onInteractOutside={() => setSearch("")}
          >
            <input
              type="search"
              placeholder="태그 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-2 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
              aria-label="태그 검색"
            />
            <ul
              role="listbox"
              aria-multiselectable="true"
              aria-label="추가 태그 목록"
              className="max-h-52 overflow-y-auto"
            >
              {filteredMore.length === 0 ? (
                <li className="py-2 text-center text-xs text-foreground/50">
                  태그가 없습니다
                </li>
              ) : (
                filteredMore.map((tag) => {
                  const isSelected = selectedTags.includes(tag.slug)
                  return (
                    <li
                      key={tag.slug}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <button
                        type="button"
                        onClick={() => toggle(tag.slug)}
                        className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent focus:bg-accent focus:outline-none"
                      >
                        <span>
                          {tag.label}
                          <span className="ml-1.5 text-xs text-foreground/50">
                            {tag.count}
                          </span>
                        </span>
                        {isSelected && (
                          <IconCheck className="size-3.5 text-foreground" />
                        )}
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

export default PostTagFilterBar
