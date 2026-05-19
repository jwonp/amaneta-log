import { AppHttpError, normalizeAppError } from "@/lib/errors/app-error"

export const toPostDetailError = (error: unknown) => {
  const appError = normalizeAppError(error)

  if (appError.status === 404) {
    return new AppHttpError({
      status: 404,
      code: "POST_NOT_FOUND",
      message: "게시글을 찾을 수 없습니다.",
    })
  }

  if (appError.status === 400) {
    return new AppHttpError({
      status: 400,
      code: appError.code,
      message: "게시글 요청이 올바르지 않습니다.",
    })
  }

  if (appError.status >= 500) {
    return new AppHttpError({
      status: appError.status,
      code: appError.code,
      message: "게시글을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
    })
  }

  return appError
}
