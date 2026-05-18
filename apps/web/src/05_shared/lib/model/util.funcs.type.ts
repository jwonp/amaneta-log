export type FormatDateInput = Date | string | null | undefined

export type FormatDateOptions = {
  now?: Date
  dateOnlyThresholdDays?: number
  sameDayFormat?: "time" | "relative"
}
