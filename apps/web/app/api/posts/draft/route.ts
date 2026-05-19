import { createServerRequestApi } from "@/lib/api/requestApi"
import { normalizeAppError, serializeAppError } from "@/lib/errors/app-error"
import { NextRequest, NextResponse } from "next/server"

export const POST = async (request: NextRequest) => {
  const requestApi = await createServerRequestApi(request)

  try {
    const { data, status } = await requestApi.post("/posts/draft")
    const response = NextResponse.json(data, { status })
    return requestApi.applyAuthToResponse(response)
  } catch (error) {
    const appError = normalizeAppError(error, {
      message: "초안 생성을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.",
    })
    const response = NextResponse.json(serializeAppError(appError), {
      status: appError.status,
    })

    return requestApi.applyAuthToResponse(response)
  }
}
