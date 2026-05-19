export const API_AUTH_ERROR_CODE = {
  SESSION_REFRESH_FAILED: "SESSION_REFRESH_FAILED",
  UNAUTHORIZED: "UNAUTHORIZED",
} as const

export type ApiAuthErrorCode =
  (typeof API_AUTH_ERROR_CODE)[keyof typeof API_AUTH_ERROR_CODE]

export const API_AUTH_ERROR_MESSAGE: Record<ApiAuthErrorCode, string> = {
  [API_AUTH_ERROR_CODE.SESSION_REFRESH_FAILED]:
    "세션이 만료되었습니다. 다시 로그인해주세요.",
  [API_AUTH_ERROR_CODE.UNAUTHORIZED]: "로그인이 필요합니다.",
}

export const isApiAuthErrorCode = (
  code: string | null | undefined
): code is ApiAuthErrorCode => {
  return Boolean(
    code &&
      Object.values(API_AUTH_ERROR_CODE).includes(code as ApiAuthErrorCode)
  )
}

export const isSessionRecoveryErrorCode = (
  code: string | null | undefined
) => {
  return (
    code === API_AUTH_ERROR_CODE.SESSION_REFRESH_FAILED ||
    code === API_AUTH_ERROR_CODE.UNAUTHORIZED
  )
}
