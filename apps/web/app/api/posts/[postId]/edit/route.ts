import { createServerRequestApi } from "@/lib/api/requestApi"
import { normalizeAppError, serializeAppError } from "@/lib/errors/app-error"
import { NextRequest, NextResponse } from "next/server"

type RouteContext = {
  params: Promise<{
    postId: string
  }>
}

export const GET = async (request: NextRequest, context: RouteContext) => {
  const requestApi = await createServerRequestApi(request)
  const { postId } = await context.params

  try {
    const { data, status } = await requestApi.get(`/posts/${postId}/edit`)
    const response = NextResponse.json(data, { status })
    return requestApi.applyAuthToResponse(response)
  } catch (error) {
    const appError = normalizeAppError(error, {
      message: "편집용 게시글을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
    })
    const response = NextResponse.json(serializeAppError(appError), {
      status: appError.status,
    })

    return requestApi.applyAuthToResponse(response)
  }
}
