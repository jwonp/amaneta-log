import { createServerRequestApi } from "@/lib/api/requestApi"
import { normalizeAppError, serializeAppError } from "@/lib/errors/app-error"
import { NextRequest, NextResponse } from "next/server"

type RouteContext = {
  params: Promise<{
    postId: string
    fileId: string
  }>
}

export const GET = async (_request: NextRequest, context: RouteContext) => {
  const requestApi = await createServerRequestApi(_request, {
    requireAuth: false,
  })
  const { postId, fileId } = await context.params

  try {
    const response = await requestApi.get<ArrayBuffer>(
      `/storage/posts/${postId}/files/${fileId}`,
      {
        responseType: "arraybuffer",
      }
    )
    const headers = new Headers()
    const contentType = response.headers["content-type"]
    const contentLength = response.headers["content-length"]
    const cacheControl = response.headers["cache-control"]
    const etag = response.headers.etag

    if (typeof contentType === "string") {
      headers.set("Content-Type", contentType)
    }

    if (typeof contentLength === "string") {
      headers.set("Content-Length", contentLength)
    }

    if (typeof cacheControl === "string") {
      headers.set("Cache-Control", cacheControl)
    } else if (response.status === 200) {
      headers.set("Cache-Control", "public, max-age=31536000, immutable")
    }

    if (typeof etag === "string") {
      headers.set("ETag", etag)
    }

    headers.set("X-Content-Type-Options", "nosniff")

    const nextResponse = new NextResponse(response.data as BodyInit, {
      status: response.status,
      headers,
    })
    return requestApi.applyAuthToResponse(nextResponse)
  } catch (error) {
    const appError = normalizeAppError(error, {
      message: "파일을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
    })
    const response = NextResponse.json(serializeAppError(appError), {
      status: appError.status,
    })

    return requestApi.applyAuthToResponse(response)
  }
}
