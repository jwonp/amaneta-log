import { createServerRequestApi } from "@/lib/api/requestApi"
import { normalizeAppError, serializeAppError } from "@/lib/errors/app-error"
import { NextRequest, NextResponse } from "next/server"
import { HttpStatus } from "@/src/05_shared/api/common/model/api.const"

const CONTENT_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]
const THUMBNAIL_ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"]
const CONTENT_MAX_BYTES = 10 * 1024 * 1024
const THUMBNAIL_MAX_BYTES = 5 * 1024 * 1024

type RouteContext = {
  params: Promise<{
    postId: string
  }>
}

export const POST = async (request: NextRequest, context: RouteContext) => {
  const requestApi = await createServerRequestApi(request)

  const { postId } = await context.params
  const formData = await request.formData()
  const file = formData.get("file")
  const usage = String(formData.get("usage") ?? "CONTENT").toUpperCase()

  if (!(file instanceof File)) {
    return NextResponse.json(
      { message: "file is required" },
      { status: HttpStatus.BAD_REQUEST }
    )
  }

  const validationError = validateUpload(file, usage)

  if (validationError) {
    return NextResponse.json(validationError.body, {
      status: validationError.status,
    })
  }

  const backendFormData = new FormData()
  backendFormData.append("usage", usage)
  backendFormData.append("file", file)

  try {
    const { data, status } = await requestApi.post(
      `/storage/posts/${postId}/files`,
      backendFormData
    )
    const response = NextResponse.json(data, { status })
    return requestApi.applyAuthToResponse(response)
  } catch (error) {
    const appError = normalizeAppError(error, {
      message: "파일을 업로드하지 못했습니다. 잠시 후 다시 시도해주세요.",
    })
    const response = NextResponse.json(serializeAppError(appError), {
      status: appError.status,
    })

    return requestApi.applyAuthToResponse(response)
  }
}

const validateUpload = (file: File, usage: string) => {
  const allowedMimeTypes =
    usage === "THUMBNAIL" ? THUMBNAIL_ALLOWED_MIME_TYPES : CONTENT_ALLOWED_MIME_TYPES
  const maxBytes = usage === "THUMBNAIL" ? THUMBNAIL_MAX_BYTES : CONTENT_MAX_BYTES

  if (!allowedMimeTypes.includes(file.type)) {
    return {
      status: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
      body: {
        message: "unsupported file type",
      },
    }
  }

  if (file.size > maxBytes) {
    return {
      status: HttpStatus.PAYLOAD_TOO_LARGE,
      body: {
        message: "file size exceeds upload limit",
      },
    }
  }

  return null
}
