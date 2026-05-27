export const SORT_OPTIONS = ["newest", "oldest"] as const
export type SortOrder = (typeof SORT_OPTIONS)[number]

export const SORT_LABELS: Record<SortOrder, string> = {
  newest: "최신순",
  oldest: "오래된순",
}

export const DEFAULT_SORT: SortOrder = "newest"
