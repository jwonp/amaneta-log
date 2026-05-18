export const STORAGE_FILE_STATUS = {
  TEMP: "TEMP",
  ATTACHED: "ATTACHED",
  ORPHANED: "ORPHANED",
  DELETED: "DELETED",
} as const

export const STORAGE_FILE_USAGE = {
  CONTENT: "CONTENT",
  THUMBNAIL: "THUMBNAIL",
} as const

export const STORAGE_FILE_KIND = {
  IMAGE: "IMAGE",
  VIDEO: "VIDEO",
  OTHER: "OTHER",
} as const
