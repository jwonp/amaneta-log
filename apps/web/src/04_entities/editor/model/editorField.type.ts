export interface EditorThumbnailFieldProps {
  initThumbnail?: string
  thumbnailId?: number | null
  onChange?: (file: File | null) => void
}

export interface EditorMarkdownSelection {
  start: number
  end: number
}

export interface EditorSaveState {
  status: "idle" | "dirty" | "saving" | "saved" | "error"
  lastSavedAt: string | null
  pendingUploadsCount: number
  isManualSaving: boolean
  isAutoSaving: boolean
  isSessionExpired: boolean
  errorMessage: string | null
}
