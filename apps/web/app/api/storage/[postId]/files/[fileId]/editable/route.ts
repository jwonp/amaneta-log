import { createServerRequestApi } from "@/lib/api/requestApi"
import { AxiosError } from "axios"
import { NextRequest, NextResponse } from "next/server"

type RouteContext = {
  params: Promise<{
    postId: string
    fileId: string
  }>
}

export const GET = async (_request: NextRequest, context: RouteContext) => {
  const requestApi = await createServerRequestApi()
  const { postId, fileId } = await context.params

  const response = await requestApi
    .get(`/storage/posts/${postId}/files/${fileId}/editable`, {
      responseType: "stream",
    })
    .then(({ data, headers, status }) => ({ data, headers, status }))
    .catch((error: AxiosError) => ({
      data: error.response?.data,
      headers: error.response?.headers ?? {},
      status: error.status ?? 500,
    }))

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
  }

  if (typeof etag === "string") {
    headers.set("ETag", etag)
  }

  return new NextResponse(response.data as BodyInit | null, {
    status: response.status,
    headers,
  })
}
