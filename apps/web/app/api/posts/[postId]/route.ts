import { createServerRequestApi } from "@/lib/api/requestApi"
import {
  AppHttpError,
  normalizeAppError,
  serializeAppError,
} from "@/lib/errors/app-error"
import { toPostDetailError } from "@/src/03_features/post/api/postDetail.error"
import { NextRequest, NextResponse } from "next/server"

type RouteContext = {
  params: Promise<{
    postId: string
  }>
}
export const GET = async (_request: NextRequest, context: RouteContext) => {
  const requestApi = await createServerRequestApi()
  const { postId } = await context.params

  try {
    const { data, status } = await requestApi.get(`/posts/${postId}`)
    return NextResponse.json(data, { status })
  } catch (error) {
    const appError = toPostDetailError(error)

    return NextResponse.json(serializeAppError(appError), {
      status: appError.status,
    })
  }
}

export const PATCH = async (request: NextRequest, context: RouteContext) => {
  const requestApi = await createServerRequestApi()
  const { postId } = await context.params

  const payload = await request.json()

  try {
    const { data, status } = await requestApi.patch(`/posts/${postId}`, payload)
    return NextResponse.json(data, { status })
  } catch (error) {
    const appError = normalizeAppError(error)
    const safeError =
      appError.status >= 500
        ? new AppHttpError({
            status: appError.status,
            code: appError.code,
            message: "게시글을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.",
          })
        : appError

    return NextResponse.json(serializeAppError(safeError), {
      status: safeError.status,
    })
  }
}
