import axios from "axios"
import { JWT } from "next-auth/jwt"

export const REFRESH_ACCESS_TOKEN_ERROR = "RefreshAccessTokenError" as const

export type RefreshedSessionTokens = {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: string
}

const getBackendUrl = () => {
  const backendUrl = process.env.BACKEND_URL

  if (!backendUrl) {
    throw new Error("BACKEND_URL is not configured")
  }

  return backendUrl
}

export const requestTokenRefresh = async (
  refreshToken: string
): Promise<RefreshedSessionTokens> => {
  const backendUrl = getBackendUrl()
  const response = await axios.post<RefreshedSessionTokens>(
    `${backendUrl}/auth/refresh`,
    {
      refreshToken,
    }
  )

  return response.data
}

export const withRefreshedSessionTokens = (
  token: JWT,
  refreshedTokens: RefreshedSessionTokens
): JWT => {
  return {
    ...token,
    accessToken: refreshedTokens.accessToken,
    refreshToken: refreshedTokens.refreshToken,
    accessTokenExpiresAt: refreshedTokens.accessTokenExpiresAt,
    error: undefined,
  }
}

export const clearSessionTokens = (
  token: JWT,
  error: typeof REFRESH_ACCESS_TOKEN_ERROR = REFRESH_ACCESS_TOKEN_ERROR
): JWT => {
  return {
    ...token,
    accessToken: undefined,
    refreshToken: undefined,
    accessTokenExpiresAt: undefined,
    error,
  }
}

export const refreshJwtToken = async (token: JWT): Promise<JWT> => {
  if (!token.refreshToken) {
    return clearSessionTokens(token)
  }

  try {
    const refreshedTokens = await requestTokenRefresh(token.refreshToken)
    return withRefreshedSessionTokens(token, refreshedTokens)
  } catch {
    return clearSessionTokens(token)
  }
}
