import {
  STORAGE_FILE_KIND,
  STORAGE_FILE_STATUS,
  STORAGE_FILE_USAGE,
} from "./storage.const"

export type StorageFileStatus =
  (typeof STORAGE_FILE_STATUS)[keyof typeof STORAGE_FILE_STATUS]
export type StorageFileKind =
  (typeof STORAGE_FILE_KIND)[keyof typeof STORAGE_FILE_KIND]
export type StorageFileUsage =
  (typeof STORAGE_FILE_USAGE)[keyof typeof STORAGE_FILE_USAGE]

export interface StorageFile {
  id: number
  status: StorageFileStatus
  createdAt: Date
  updatedAt: Date
  postId: number
  usage: StorageFileUsage
  kind: StorageFileKind
  originalName: string
  storedName: string
  mimeType: string
  size: number
  attachedAt: Date | null
  orphanedAt: Date | null
  deletedAt: Date | null
}
