"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import axios, { AxiosError } from "axios"
import { useRouter } from "next/navigation"
import { Button } from "@packages/ui/src/components/button"
import { FieldGroup } from "@workspace/ui/components/field"
import { IconPhoto, IconVideo } from "@tabler/icons-react"
import EditorMarkdownField from "@/src/04_entities/editor/ui/fields/EditorMarkdownField"
import EditorThumbnailField from "@/src/04_entities/editor/ui/fields/EditorThumbnailField"
import LayoutSeparator from "@/src/05_shared/separator/ui/LayoutSeparator"
import EditorTagField from "@/src/04_entities/editor/ui/fields/EditorTagField"
import EditorVisibilityField from "@/src/04_entities/editor/ui/fields/EditorVisibilityField"
import EditorDescriptionField from "@/src/04_entities/editor/ui/fields/EditorDescriptionField"
import EditorTitleField from "@/src/04_entities/editor/ui/fields/EditorTitleField"
import { StorageFile } from "@/src/05_shared/api/storage/model/storage.type"
import { Post } from "@/src/05_shared/api/post/model/post.type"
import { STORAGE_FILE_USAGE } from "@/src/05_shared/api/storage/model/storage.const"
import EditorSaveAsDraftButton from "@/src/04_entities/editor/ui/button/EditorSaveAsDraftButton"
import EditorSaveButton from "@/src/04_entities/editor/ui/button/EditorSaveButton"
import {
  SavePostRequset,
  SavePostResponse,
} from "@/src/05_shared/api/post/model/post.dto.type"
import {
  EditorMarkdownSelection,
  EditorSaveState,
} from "@/src/04_entities/editor/model/editorField.type"
import { HttpStatus } from "@/src/05_shared/api/common/model/api.const"
import { UploadPostFileResponse } from "@/src/05_shared/api/storage/model/storage.dto.type"

const AUTOSAVE_DEBOUNCE_MS = 3000
const CONTENT_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]
const THUMBNAIL_ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"]
const CONTENT_MAX_BYTES = 10 * 1024 * 1024
const THUMBNAIL_MAX_BYTES = 5 * 1024 * 1024

type EditorFormState = {
  title: string
  description: string
  markdown: string
  tags: string[]
  isPublic: boolean
  thumbnailId: number | null
}

type EditorFormProps = {
  post: Post
  files: StorageFile[]
  onSaveStateChange?: (saveState: EditorSaveState) => void
}

const EditorForm = ({ post, files, onSaveStateChange }: EditorFormProps) => {
  const router = useRouter()
  const thumbnail = files.find(
    (file) => file.usage === STORAGE_FILE_USAGE.THUMBNAIL
  )
  const initialState: EditorFormState = {
    title: post.title,
    description: post.description ?? "",
    markdown: post.markdown,
    tags: [...post.tags],
    isPublic: post.isPublic,
    thumbnailId: thumbnail?.id ?? null,
  }

  const [formState, setFormState] = useState<EditorFormState>(initialState)
  const [thumbnailPreviewSrc, setThumbnailPreviewSrc] = useState<
    string | undefined
  >(thumbnail ? `/api/storage/${post.id}/files/${thumbnail.id}` : undefined)
  const [saveState, setSaveState] = useState<EditorSaveState>({
    status: "idle",
    lastSavedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : null,
    pendingUploadsCount: 0,
    isManualSaving: false,
    isAutoSaving: false,
    errorMessage: null,
  })

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const contentImageInputRef = useRef<HTMLInputElement | null>(null)
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const formStateRef = useRef(formState)
  const pendingUploadsCountRef = useRef(0)
  const saveInFlightRef = useRef(false)
  const saveQueueRef = useRef(Promise.resolve())
  const enqueueSaveRef = useRef<
    (mode: "auto" | "draft" | "manual") => Promise<void>
  >(async () => undefined)
  const dirtyAfterSaveRef = useRef(false)
  const latestQueuedRequestIdRef = useRef(0)
  const latestAppliedRequestIdRef = useRef(0)
  const savedDraftFingerprintRef = useRef(createDraftFingerprint(initialState))
  const isReadyRef = useRef(false)
  const selectionRef = useRef<EditorMarkdownSelection>({
    start: formState.markdown.length,
    end: formState.markdown.length,
  })

  useEffect(() => {
    formStateRef.current = formState
  }, [formState])

  useEffect(() => {
    pendingUploadsCountRef.current = saveState.pendingUploadsCount
    onSaveStateChange?.(saveState)
  }, [onSaveStateChange, saveState])

  useEffect(() => {
    isReadyRef.current = true

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (
        !isDraftDirty(formStateRef.current, savedDraftFingerprintRef.current)
      ) {
        return
      }

      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [])

  const updateFormState = <Key extends keyof EditorFormState>(
    key: Key,
    value: EditorFormState[Key]
  ) => {
    setFormState((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const scheduleAutosave = useCallback((delay = AUTOSAVE_DEBOUNCE_MS) => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current)
    }

    if (pendingUploadsCountRef.current > 0) {
      return
    }

    autosaveTimerRef.current = setTimeout(() => {
      if (pendingUploadsCountRef.current > 0) {
        return
      }

      if (
        !isDraftDirty(formStateRef.current, savedDraftFingerprintRef.current)
      ) {
        return
      }

      if (saveInFlightRef.current) {
        dirtyAfterSaveRef.current = true
        return
      }

      void enqueueSaveRef.current("auto")
    }, delay)
  }, [])

  useEffect(() => {
    if (!isReadyRef.current) {
      return
    }

    if (!isDraftDirty(formState, savedDraftFingerprintRef.current)) {
      return
    }

    setSaveState((prev) => ({
      ...prev,
      status: prev.pendingUploadsCount > 0 ? prev.status : "dirty",
      errorMessage: null,
    }))
    scheduleAutosave()
  }, [formState, scheduleAutosave])

  const enqueueSave = async (mode: "auto" | "draft" | "manual") => {
    if (mode === "auto" && pendingUploadsCountRef.current > 0) {
      return
    }

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current)
      autosaveTimerRef.current = null
    }

    const requestId = ++latestQueuedRequestIdRef.current

    saveQueueRef.current = saveQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        const snapshot = formStateRef.current

        if (
          mode === "auto" &&
          !isDraftDirty(snapshot, savedDraftFingerprintRef.current)
        ) {
          return
        }

        if (mode === "auto" && pendingUploadsCountRef.current > 0) {
          dirtyAfterSaveRef.current = true
          return
        }

        saveInFlightRef.current = true
        setSaveState((prev) => ({
          ...prev,
          status: "saving",
          isAutoSaving: mode === "auto",
          isManualSaving: mode !== "auto",
          errorMessage: null,
        }))

        const payload = createPayload(snapshot, mode)

        try {
          const response = await axios.patch<SavePostResponse>(
            `/api/posts/${post.id}`,
            payload
          )

          if (latestAppliedRequestIdRef.current > requestId) {
            return
          }

          latestAppliedRequestIdRef.current = requestId
          savedDraftFingerprintRef.current = createDraftFingerprint(snapshot)

          setSaveState((prev) => ({
            ...prev,
            status: "saved",
            lastSavedAt: response.data.updatedAt,
            isAutoSaving: false,
            isManualSaving: false,
            errorMessage: null,
          }))

          if (mode === "manual") {
            router.push("/editor")
          }
        } catch (error) {
          const message =
            error instanceof AxiosError &&
            typeof error.response?.data === "object"
              ? "저장에 실패했습니다."
              : "저장에 실패했습니다."

          setSaveState((prev) => ({
            ...prev,
            status: "error",
            isAutoSaving: false,
            isManualSaving: false,
            errorMessage: message,
          }))
        } finally {
          saveInFlightRef.current = false
          let shouldScheduleFollowUpAutosave = false

          if (
            dirtyAfterSaveRef.current &&
            pendingUploadsCountRef.current === 0 &&
            isDraftDirty(formStateRef.current, savedDraftFingerprintRef.current)
          ) {
            dirtyAfterSaveRef.current = false
            shouldScheduleFollowUpAutosave = true
          } else {
            dirtyAfterSaveRef.current = false
          }

          setSaveState((prev) => ({
            ...prev,
            isAutoSaving: false,
            isManualSaving: false,
          }))

          if (shouldScheduleFollowUpAutosave) {
            scheduleAutosave(400)
          }
        }
      })

    await saveQueueRef.current
  }

  enqueueSaveRef.current = enqueueSave

  const handleChangeThumbnail = async (file: File | null) => {
    if (!file) {
      setThumbnailPreviewSrc(undefined)
      updateFormState("thumbnailId", null)
      return
    }

    const validationError = validateUpload(file, "THUMBNAIL")

    if (validationError) {
      setSaveState((prev) => ({
        ...prev,
        status: "error",
        errorMessage: validationError,
      }))
      return
    }

    incrementPendingUploads()

    try {
      const formData = new FormData()

      formData.append("file", file)
      formData.append("usage", "THUMBNAIL")

      const { data, status } = await axios.post<UploadPostFileResponse>(
        `/api/storage/${post.id}/files`,
        formData
      )

      if (status !== HttpStatus.CREATED && status !== HttpStatus.OK) {
        throw new Error("failed to upload thumbnail")
      }

      setThumbnailPreviewSrc(URL.createObjectURL(file))
      updateFormState("thumbnailId", data.id)
      setSaveState((prev) => ({
        ...prev,
        errorMessage: null,
      }))
    } catch {
      setSaveState((prev) => ({
        ...prev,
        status: "error",
        errorMessage: "썸네일 업로드에 실패했습니다.",
      }))
    } finally {
      decrementPendingUploads()
    }
  }

  const handleClickImageButton = () => {
    const textarea = textareaRef.current

    if (textarea) {
      selectionRef.current = {
        start: textarea.selectionStart,
        end: textarea.selectionEnd,
      }
    }

    contentImageInputRef.current?.click()
  }

  const handleChangeContentImage = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]

    event.target.value = ""

    if (!file) {
      return
    }

    const validationError = validateUpload(file, "CONTENT")

    if (validationError) {
      setSaveState((prev) => ({
        ...prev,
        status: "error",
        errorMessage: validationError,
      }))
      return
    }

    incrementPendingUploads()

    try {
      const formData = new FormData()

      formData.append("file", file)
      formData.append("usage", "CONTENT")

      const { data } = await axios.post<UploadPostFileResponse>(
        `/api/storage/${post.id}/files`,
        formData
      )
      const altText = createAltText(file.name)
      const imageMarkdown = `![${altText}](/api/storage/${post.id}/files/${data.id})`
      const insertion = insertTextAtSelection({
        source: formStateRef.current.markdown,
        insertText: imageMarkdown,
        selectionStart: selectionRef.current.start,
        selectionEnd: selectionRef.current.end,
      })

      setFormState((prev) => ({
        ...prev,
        markdown: insertion.value,
      }))
      selectionRef.current = {
        start: insertion.cursor,
        end: insertion.cursor,
      }
      setSaveState((prev) => ({
        ...prev,
        errorMessage: null,
      }))

      requestAnimationFrame(() => {
        const textarea = textareaRef.current

        if (!textarea) {
          return
        }

        textarea.focus()
        textarea.setSelectionRange(insertion.cursor, insertion.cursor)
      })
    } catch {
      setSaveState((prev) => ({
        ...prev,
        status: "error",
        errorMessage: "본문 이미지 업로드에 실패했습니다.",
      }))
    } finally {
      decrementPendingUploads()
    }
  }

  const incrementPendingUploads = () => {
    setSaveState((prev) => ({
      ...prev,
      pendingUploadsCount: prev.pendingUploadsCount + 1,
    }))
  }

  const decrementPendingUploads = () => {
    setSaveState((prev) => ({
      ...prev,
      pendingUploadsCount: Math.max(prev.pendingUploadsCount - 1, 0),
    }))
  }

  const isBusy = saveState.pendingUploadsCount > 0 || saveState.isManualSaving

  return (
    <form className="w-full max-w-full min-w-0 overflow-x-clip">
      <div className="mb-16 w-full max-w-full min-w-0">
        <EditorTitleField
          value={formState.title}
          onChange={(value) => updateFormState("title", value)}
        />
        <EditorMarkdownField
          markdown={formState.markdown}
          textareaRef={textareaRef}
          onMarkdownChange={(value) => updateFormState("markdown", value)}
          onSelectionChange={(selection) => {
            selectionRef.current = selection
          }}
        />
        <LayoutSeparator />
        <div className="min-w-0">
          <section className="min-w-0 px-0 py-6 md:p-6">
            <FieldGroup>
              <section className="flex min-w-0 flex-col gap-10 md:flex-row">
                <div className="w-full min-w-0">
                  <EditorThumbnailField
                    initThumbnail={thumbnailPreviewSrc}
                    thumbnailId={formState.thumbnailId}
                    onChange={handleChangeThumbnail}
                  />
                </div>
                <div className="flex w-full min-w-0 flex-col gap-6">
                  <EditorTagField
                    initTags={post.tags}
                    value={formState.tags}
                    onChange={(value) => updateFormState("tags", value)}
                  />
                  <EditorVisibilityField
                    initVisibility={post.isPublic}
                    value={formState.isPublic}
                    onChange={(value) => updateFormState("isPublic", value)}
                  />
                  <EditorDescriptionField
                    initDescription={post.description ?? undefined}
                    value={formState.description}
                    onChange={(value) => updateFormState("description", value)}
                  />
                </div>
              </section>
            </FieldGroup>
          </section>
        </div>
        <div className="fixed inset-x-0 bottom-0 flex h-16 max-w-full border border-foreground/20 bg-background">
          <section className="flex min-w-0 flex-1 items-center gap-4 px-4 md:px-8">
            <input
              ref={contentImageInputRef}
              type="file"
              accept={CONTENT_ALLOWED_MIME_TYPES.join(",")}
              className="hidden"
              onChange={handleChangeContentImage}
            />
            <Button
              variant="outline"
              size="icon"
              aria-label="이미지 업로드"
              type="button"
              disabled={isBusy}
              onClick={handleClickImageButton}
            >
              <IconPhoto />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="비디오 업로드"
              disabled
            >
              <IconVideo />
            </Button>
            <LayoutSeparator orientation="vertical" />
          </section>

          <section className="flex h-full shrink-0 items-center px-4 md:px-6">
            <div className="flex gap-2 md:gap-4">
              <EditorSaveAsDraftButton
                disabled={isBusy}
                onClick={() => {
                  void enqueueSave("draft")
                }}
              />
              <EditorSaveButton
                disabled={isBusy}
                onClick={() => {
                  void enqueueSave("manual")
                }}
              />
            </div>
          </section>
        </div>
      </div>
    </form>
  )
}

const createDraftFingerprint = (state: EditorFormState) =>
  JSON.stringify({
    title: state.title,
    description: state.description,
    markdown: state.markdown,
    tags: state.tags,
    thumbnailId: state.thumbnailId,
  })

const isDraftDirty = (state: EditorFormState, savedFingerprint: string) =>
  createDraftFingerprint(state) !== savedFingerprint

const createPayload = (
  state: EditorFormState,
  mode: "auto" | "draft" | "manual"
): SavePostRequset => ({
  title: state.title,
  description: state.description || null,
  markdown: state.markdown,
  tags: [...state.tags],
  isPublic: state.isPublic,
  saveMode:
    mode === "auto" ? "AUTO" : mode === "draft" ? "DRAFT" : state.isPublic ? "PUBLISH" : "DRAFT",
  thumbnailId: state.thumbnailId,
})

const validateUpload = (file: File, usage: "CONTENT" | "THUMBNAIL") => {
  const allowedMimeTypes =
    usage === "THUMBNAIL"
      ? THUMBNAIL_ALLOWED_MIME_TYPES
      : CONTENT_ALLOWED_MIME_TYPES
  const maxBytes =
    usage === "THUMBNAIL" ? THUMBNAIL_MAX_BYTES : CONTENT_MAX_BYTES

  if (!allowedMimeTypes.includes(file.type)) {
    return "허용되지 않은 파일 형식입니다."
  }

  if (file.size > maxBytes) {
    return "파일 크기 제한을 초과했습니다."
  }

  return null
}

const createAltText = (fileName: string) => {
  const normalizedName = fileName.replace(/\.[^.]+$/, "").trim()

  return normalizedName || "image"
}

const insertTextAtSelection = ({
  source,
  insertText,
  selectionStart,
  selectionEnd,
}: {
  source: string
  insertText: string
  selectionStart: number
  selectionEnd: number
}) => {
  const prefix = source.slice(0, selectionStart)
  const suffix = source.slice(selectionEnd)
  const needsLeadingBreak = prefix.length > 0 && !prefix.endsWith("\n")
  const needsTrailingBreak = suffix.length > 0 && !suffix.startsWith("\n")
  const wrappedText = `${needsLeadingBreak ? "\n\n" : ""}${insertText}${
    needsTrailingBreak ? "\n\n" : ""
  }`
  const value = `${prefix}${wrappedText}${suffix}`
  const cursor = prefix.length + wrappedText.length

  return {
    value,
    cursor,
  }
}

export default EditorForm
