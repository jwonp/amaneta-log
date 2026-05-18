import { authOptions } from "@/lib/auth/next-auth.config"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

type RouteContext = {
  params: Promise<{
    postId: string
    fileId: string
  }>
}

export const GET = async (_request: NextRequest, context: RouteContext) => {
  const session = await getServerSession(authOptions)
  const { postId, fileId } = await context.params

  const backendUrl =
    process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL

  if (!backendUrl) {
    return NextResponse.json(
      { message: "BACKEND_URL is not configured" },
      { status: 500 }
    )
  }

  const response = await fetch(
    `${backendUrl}/storage/posts/${postId}/files/${fileId}`,
    {
      method: "GET",
      cache: "no-store",
      headers: session?.accessToken
        ? {
            Authorization: `Bearer ${session.accessToken}`,
          }
        : undefined,
    }
  )

  const headers = new Headers()

  const contentType = response.headers.get("content-type")
  const contentLength = response.headers.get("content-length")
  const cacheControl = response.headers.get("cache-control")
  const etag = response.headers.get("etag")

  if (contentType) {
    headers.set("Content-Type", contentType)
  }

  if (contentLength) {
    headers.set("Content-Length", contentLength)
  }

  if (cacheControl) {
    headers.set("Cache-Control", cacheControl)
  }

  if (etag) {
    headers.set("ETag", etag)
  }

  return new NextResponse(response.body, {
    status: response.status,
    headers,
  })
}
