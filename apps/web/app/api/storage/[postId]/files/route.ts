import { createServerRequestApi } from "@/lib/api/requestApi"
import { normalizeAppError, serializeAppError } from "@/lib/errors/app-error"
import { NextRequest, NextResponse } from "next/server"
import { HttpStatus } from "@/src/05_shared/api/common/model/api.const"
import {
  parseContentLengthHeader,
  validateUpload,
  validateUploadContentLength,
} from "@/src/05_shared/upload/lib/uploadPolicy"

type RouteContext = {
  params: Promise<{
    postId: string
  }>
}

export const POST = async (request: NextRequest, context: RouteContext) => {
  const requestApi = await createServerRequestApi(request)
  const contentLengthValidationError = validateUploadContentLength(
    parseContentLengthHeader(request.headers.get("content-length"))
  )

  if (contentLengthValidationError) {
    return NextResponse.json(contentLengthValidationError.body, {
      status: contentLengthValidationError.status,
    })
  }

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

  const validationError = await validateUpload(file, usage)

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
