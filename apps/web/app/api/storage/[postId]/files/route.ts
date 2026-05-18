import { authOptions } from "@/lib/auth/next-auth.config"
import { getServerSession } from "next-auth"
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
  const session = await getServerSession(authOptions)
  const backendUrl =
    process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL

  if (!session?.accessToken) {
    return NextResponse.json(
      { message: "unauthorized" },
      { status: HttpStatus.UNAUTHORIZED }
    )
  }

  if (!backendUrl) {
    return NextResponse.json(
      { message: "BACKEND_URL is not configured" },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    )
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

  const validationError = validateUpload(file, usage)

  if (validationError) {
    return NextResponse.json(validationError.body, {
      status: validationError.status,
    })
  }

  const backendFormData = new FormData()
  backendFormData.append("usage", usage)
  backendFormData.append("file", file)

  const response = await fetch(`${backendUrl}/storage/posts/${postId}/files`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: backendFormData,
  })

  const data = await response.json().catch(() => ({
    message: "failed to upload file",
  }))

  return NextResponse.json(data, {
    status: response.status,
  })
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
