import { StorageFile, StorageFileKind, StorageFileStatus, StorageFileUsage } from "./storage.type"

export interface UploadPostFileResponse {
  id: number
  postId: number
  usage: StorageFileUsage
  kind: StorageFileKind
  status: StorageFileStatus
  originalName: string
  storedName: string
  mimeType: string
  size: number
  attachedAt: StorageFile["attachedAt"]
  orphanedAt: StorageFile["orphanedAt"]
  deletedAt: StorageFile["deletedAt"]
}
