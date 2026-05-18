"use client"

import { useState } from "react"
import EditorForm from "@/src/02_widgets/editor/ui/EditorForm"
import LayoutSeparator from "@/src/05_shared/separator/ui/LayoutSeparator"
import {
  EditorSaveState,
} from "@/src/04_entities/editor/model/editorField.type"
import { GetEditablePostByIdResponse } from "@/src/05_shared/api/post/model/post.dto.type"

const EditorEditClientView = ({
  data,
}: {
  data: GetEditablePostByIdResponse
}) => {
  const [saveState, setSaveState] = useState<EditorSaveState>({
    status: "idle",
    lastSavedAt: data.post.updatedAt
      ? new Date(data.post.updatedAt).toISOString()
      : null,
    pendingUploadsCount: 0,
    isManualSaving: false,
    isAutoSaving: false,
    errorMessage: null,
  })

  return (
    <div className="min-h-[calc(100svh-54px)] w-full max-w-full overflow-x-clip px-4 py-6 md:p-6">
      <div className="mb-6 flex w-full min-w-0 flex-col gap-3 md:flex-row md:justify-between">
        <div className="min-w-0">
          <h1 className="text-base leading-6 font-medium">새 글 작성</h1>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-2 w-2 shrink-0 rounded-full ${
                saveState.status === "error"
                  ? "bg-destructive"
                  : saveState.status === "saved"
                    ? "bg-green-500"
                    : saveState.status === "saving"
                      ? "bg-amber-500"
                      : "bg-foreground/40"
              }`}
            />
            <p className="text-xs leading-4 text-foreground/80">
              {renderSaveStatus(saveState)}
            </p>
          </div>

          {saveState.lastSavedAt ? (
            <>
              <LayoutSeparator orientation="vertical" />
              <div className="flex items-center">
                <p className="text-xs leading-4 text-foreground/80">
                  마지막 저장 : {formatTime(saveState.lastSavedAt)}
                </p>
              </div>
            </>
          ) : null}
        </div>
      </div>

      <LayoutSeparator />

      <div className="my-10 w-full max-w-full min-w-0 gap-8">
        <EditorForm
          post={data.post}
          files={data.files}
          onSaveStateChange={setSaveState}
        />
      </div>
    </div>
  )
}

const renderSaveStatus = (saveState: EditorSaveState) => {
  if (saveState.pendingUploadsCount > 0) {
    return `파일 업로드 중... (${saveState.pendingUploadsCount})`
  }

  if (saveState.status === "saving") {
    return saveState.isAutoSaving ? "자동 저장 중..." : "저장 중..."
  }

  if (saveState.status === "saved") {
    return "자동 저장됨"
  }

  if (saveState.status === "error") {
    return saveState.errorMessage ?? "저장 실패"
  }

  if (saveState.status === "dirty") {
    return "저장되지 않은 변경사항"
  }

  return "편집 준비됨"
}

const formatTime = (value: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value))

export default EditorEditClientView
