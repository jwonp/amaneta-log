import { ErrorAction } from "@/src/05_shared/error/model/error-action"

type AuthErrorViewModel = {
  statusCode: 401 | 403 | 500
  title: string
  description: string
  actions: ErrorAction[]
}

const DEFAULT_AUTH_ERROR: AuthErrorViewModel = {
  statusCode: 500,
  title: "인증 처리 중 문제가 발생했습니다.",
  description: "잠시 후 다시 시도해주세요. 문제가 계속되면 다시 로그인해 주세요.",
  actions: ["login", "home"],
}

const AUTH_ERROR_MESSAGE_MAP: Record<string, AuthErrorViewModel> = {
  CredentialsSignin: {
    statusCode: 401,
    title: "로그인에 실패했습니다.",
    description: "이메일 또는 비밀번호를 다시 확인한 뒤 다시 시도해주세요.",
    actions: ["login", "back"],
  },
  "Credentials login failed": {
    statusCode: 401,
    title: "로그인에 실패했습니다.",
    description: "입력한 로그인 정보를 다시 확인해주세요.",
    actions: ["login", "back"],
  },
  AccessDenied: {
    statusCode: 403,
    title: "접근 권한이 없습니다.",
    description: "현재 계정으로는 이 요청을 처리할 수 없습니다.",
    actions: ["home", "login"],
  },
  SessionRequired: {
    statusCode: 401,
    title: "로그인이 필요합니다.",
    description: "이 작업을 계속하려면 다시 로그인해주세요.",
    actions: ["login", "home"],
  },
  RefreshAccessTokenError: {
    statusCode: 401,
    title: "세션이 만료되었습니다.",
    description: "보안을 위해 다시 로그인한 뒤 이용해주세요.",
    actions: ["login", "home"],
  },
  Configuration: {
    statusCode: 500,
    title: "로그인 구성이 올바르지 않습니다.",
    description: "잠시 후 다시 시도해주세요. 문제가 계속되면 관리자에게 문의해주세요.",
    actions: ["home"],
  },
  Verification: {
    statusCode: 500,
    title: "인증 확인에 실패했습니다.",
    description: "인증 요청을 검증하지 못했습니다. 다시 시도해주세요.",
    actions: ["login", "home"],
  },
  Default: DEFAULT_AUTH_ERROR,
}

export const getAuthErrorViewModel = (error?: string | null): AuthErrorViewModel => {
  if (!error) {
    return DEFAULT_AUTH_ERROR
  }

  return AUTH_ERROR_MESSAGE_MAP[error] ?? DEFAULT_AUTH_ERROR
}
