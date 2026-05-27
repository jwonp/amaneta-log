"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@packages/ui/src/components/select"
import { SORT_OPTIONS, SORT_LABELS, type SortOrder } from "../model/sort.type"

interface PostSortSelectProps {
  sort: SortOrder
  onSortChange: (sort: SortOrder) => void
}

const PostSortSelect = ({ sort, onSortChange }: PostSortSelectProps) => {
  return (
    <Select
      value={sort}
      onValueChange={(v) => onSortChange(v as SortOrder)}
    >
      <SelectTrigger
        size="sm"
        className="h-7 w-auto gap-1 rounded-full border-input text-xs"
        aria-label="정렬 기준 선택"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {SORT_OPTIONS.map((option) => (
          <SelectItem key={option} value={option} className="text-sm">
            {SORT_LABELS[option]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default PostSortSelect
