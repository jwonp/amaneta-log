import axios from "axios"

export type AppErrorPayload = {
  status: number
  code: string
  message: string
}

const normalizeStatus = (status?: number) => {
  if (!status || status < 400 || status > 599) {
    return 500
  }

  return status
}

export const getDefaultErrorCode = (status: number) => {
  switch (status) {
    case 400:
      return "BAD_REQUEST"
    case 401:
      return "UNAUTHORIZED"
    case 403:
      return "FORBIDDEN"
    case 404:
      return "NOT_FOUND"
    default:
      return status >= 500 ? "INTERNAL_SERVER_ERROR" : "HTTP_ERROR"
  }
}

export const getDefaultErrorMessage = (status: number) => {
  switch (status) {
    case 400:
      return "요청 내용을 다시 확인해주세요."
    case 401:
      return "로그인이 필요합니다."
    case 403:
      return "이 페이지에 접근할 권한이 없습니다."
    case 404:
      return "요청한 정보를 찾을 수 없습니다."
    default:
      return "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요."
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null
}

const isAppErrorPayload = (value: unknown): value is AppErrorPayload => {
  return (
    isRecord(value) &&
    typeof value.status === "number" &&
    typeof value.code === "string" &&
    typeof value.message === "string"
  )
}

export class AppHttpError extends Error {
  status: number
  code: string

  constructor({ status, code, message }: Partial<AppErrorPayload> = {}) {
    const normalizedStatus = normalizeStatus(status)

    super(message ?? getDefaultErrorMessage(normalizedStatus))
    this.name = "AppHttpError"
    this.status = normalizedStatus
    this.code = code ?? getDefaultErrorCode(normalizedStatus)
  }
}

export const isAppHttpError = (error: unknown): error is AppHttpError => {
  return error instanceof AppHttpError
}

export const normalizeAppError = (
  error: unknown,
  fallback: Partial<AppErrorPayload> = {}
) => {
  if (isAppHttpError(error)) {
    return error
  }

  if (axios.isAxiosError(error)) {
    const responseStatus =
      error.response?.status ??
      (typeof error.status === "number" ? error.status : undefined)

    if (isAppErrorPayload(error.response?.data)) {
      return new AppHttpError(error.response.data)
    }

    const status = normalizeStatus(responseStatus ?? fallback.status)
    const code =
      isRecord(error.response?.data) && typeof error.response.data.code === "string"
        ? error.response.data.code
        : fallback.code

    return new AppHttpError({
      status,
      code,
      message: fallback.message ?? getDefaultErrorMessage(status),
    })
  }

  return new AppHttpError(fallback)
}

export const serializeAppError = (error: AppHttpError): AppErrorPayload => {
  return {
    status: error.status,
    code: error.code,
    message: error.message,
  }
}
