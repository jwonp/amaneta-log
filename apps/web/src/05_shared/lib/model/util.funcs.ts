import { FormatDateInput, FormatDateOptions } from "./util.funcs.type"

export const formatDate = (
  input: FormatDateInput,
  options: FormatDateOptions = {}
): string => {
  if (!input) return "-"

  const date = input instanceof Date ? input : new Date(input)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  const now = options.now ?? new Date()
  const dateOnlyThresholdDays = options.dateOnlyThresholdDays ?? 7
  const sameDayFormat = options.sameDayFormat ?? "time"

  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)

  if (diffSeconds < 0) {
    return formatDateOnly(date)
  }

  if (sameDayFormat === "time" && isSameLocalDate(date, now)) {
    return formatTimeOnly(date)
  }

  if (diffSeconds < 10) {
    return "방금 전"
  }

  if (diffSeconds < 60) {
    return `${diffSeconds}초 전`
  }

  const diffMinutes = Math.floor(diffSeconds / 60)

  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`
  }

  const diffHours = Math.floor(diffMinutes / 60)

  if (diffHours < 24) {
    return `${diffHours}시간 전`
  }

  const diffDays = Math.floor(diffHours / 24)

  if (diffDays < dateOnlyThresholdDays) {
    return `${diffDays}일 전`
  }

  return formatDateOnly(date)
}

const isSameLocalDate = (date: Date, targetDate: Date): boolean => {
  return (
    date.getFullYear() === targetDate.getFullYear() &&
    date.getMonth() === targetDate.getMonth() &&
    date.getDate() === targetDate.getDate()
  )
}

const formatTimeOnly = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")

  return `${hours}:${minutes}`
}

const formatDateOnly = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}.${month}.${day}`
}
