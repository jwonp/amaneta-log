import { authOptions } from "@/lib/auth/next-auth.config"
import {
  RefreshedSessionTokens,
  requestTokenRefresh,
  withRefreshedSessionTokens,
} from "@/lib/auth/token-refresh"
import { AppHttpError } from "@/lib/errors/app-error"
import {
  API_AUTH_ERROR_CODE,
  API_AUTH_ERROR_MESSAGE,
} from "@/src/05_shared/api/common/model/auth-error"
import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  RawAxiosRequestHeaders,
} from "axios"
import { encode, getToken } from "next-auth/jwt"
import { JWT } from "next-auth/jwt"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

const SESSION_MAX_AGE = authOptions.session?.maxAge ?? 30 * 24 * 60 * 60
const ALLOWED_COOKIE_SIZE = 4096
const ESTIMATED_EMPTY_COOKIE_SIZE = 163
const SESSION_COOKIE_CHUNK_SIZE = ALLOWED_COOKIE_SIZE - ESTIMATED_EMPTY_COOKIE_SIZE

type RequestApiOptions = {
  requireAuth?: boolean
}

type RouteSessionContext = {
  token: JWT | null
  sessionCookieName: string
  sessionCookieOptions: SessionCookieOptions
  existingSessionCookieNames: string[]
  didRefreshSession: boolean
  shouldClearSession: boolean
}

type SessionCookieOptions = {
  httpOnly: true
  sameSite: "lax"
  path: "/"
  secure: boolean
  expires?: Date
  maxAge?: number
}

type SessionCookie = {
  name: string
  value: string
  options: SessionCookieOptions
}

type RecoverySuccess<T> = {
  ok: true
  value: T
  token: JWT | null
  didRefreshSession: boolean
  shouldClearSession: boolean
}

type RecoveryFailure = {
  ok: false
  error: AppHttpError
  token: JWT | null
  didRefreshSession: boolean
  shouldClearSession: boolean
}

type RecoveryResult<T> = RecoverySuccess<T> | RecoveryFailure

type RefreshTokenExecutor = (
  refreshToken: string
) => Promise<RefreshedSessionTokens>

type ExecuteWithTokenRecoveryOptions<T> = {
  token: JWT | null
  requireAuth?: boolean
  execute: (accessToken?: string) => Promise<T>
  refreshToken: (token: JWT) => Promise<JWT>
  isUnauthorizedError?: (error: unknown) => boolean
}

type ServerRequestApi = {
  request<T = unknown, D = unknown>(
    config: AxiosRequestConfig<D>
  ): Promise<AxiosResponse<T, D>>
  get<T = unknown, D = unknown>(
    url: string,
    config?: AxiosRequestConfig<D>
  ): Promise<AxiosResponse<T, D>>
  post<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>
  ): Promise<AxiosResponse<T, D>>
  patch<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>
  ): Promise<AxiosResponse<T, D>>
  applyAuthToResponse(response: NextResponse): Promise<NextResponse>
}

const createUnauthorizedError = () =>
  new AppHttpError({
    status: 401,
    code: API_AUTH_ERROR_CODE.UNAUTHORIZED,
    message: API_AUTH_ERROR_MESSAGE.UNAUTHORIZED,
  })

const createSessionRefreshFailedError = () =>
  new AppHttpError({
    status: 401,
    code: API_AUTH_ERROR_CODE.SESSION_REFRESH_FAILED,
    message: API_AUTH_ERROR_MESSAGE.SESSION_REFRESH_FAILED,
  })

const isUnauthorizedAxiosError = (error: unknown) => {
  return axios.isAxiosError(error) && error.response?.status === 401
}

const getBackendUrl = () => {
  const resolvedBackendUrl = process.env.BACKEND_URL

  if (!resolvedBackendUrl) {
    throw new Error("BACKEND_URL is not configured")
  }

  return resolvedBackendUrl
}

const getAuthSecret = () => {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET

  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is not configured")
  }

  return secret
}

export const createRefreshSingleFlightManager = (
  refreshExecutor: RefreshTokenExecutor
) => {
  const inFlightRefreshes = new Map<string, Promise<RefreshedSessionTokens>>()

  return {
    async refresh(refreshToken: string) {
      const existingRefresh = inFlightRefreshes.get(refreshToken)

      if (existingRefresh) {
        return existingRefresh
      }

      const refreshPromise = refreshExecutor(refreshToken).finally(() => {
        inFlightRefreshes.delete(refreshToken)
      })

      inFlightRefreshes.set(refreshToken, refreshPromise)

      return refreshPromise
    },
  }
}

const refreshSingleFlight = createRefreshSingleFlightManager(requestTokenRefresh)

const createBaseAxiosClient = (accessToken?: string) => {
  const headers: RawAxiosRequestHeaders = {}

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  return axios.create({
    baseURL: getBackendUrl(),
    headers,
  })
}

const buildSessionCookieContext = (request: NextRequest) => {
  const secureCookie =
    process.env.NEXTAUTH_URL?.startsWith("https://") ?? Boolean(process.env.VERCEL)
  const sessionCookieName = `${secureCookie ? "__Secure-" : ""}next-auth.session-token`
  const sessionCookieOptions: SessionCookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: secureCookie,
  }
  const existingSessionCookieNames = request.cookies
    .getAll()
    .filter((cookie) => cookie.name.startsWith(sessionCookieName))
    .map((cookie) => cookie.name)

  return {
    secureCookie,
    sessionCookieName,
    sessionCookieOptions,
    existingSessionCookieNames,
  }
}

const createRouteSessionContext = async (
  request: NextRequest
): Promise<RouteSessionContext> => {
  const {
    secureCookie,
    sessionCookieName,
    sessionCookieOptions,
    existingSessionCookieNames,
  } = buildSessionCookieContext(request)
  const token = await getToken({
    req: request,
    secret: getAuthSecret(),
    secureCookie,
    cookieName: sessionCookieName,
  })

  return {
    token,
    sessionCookieName,
    sessionCookieOptions,
    existingSessionCookieNames,
    didRefreshSession: false,
    shouldClearSession: false,
  }
}

const cleanSessionCookies = (context: RouteSessionContext): SessionCookie[] => {
  return context.existingSessionCookieNames.map((cookieName) => ({
    name: cookieName,
    value: "",
    options: {
      ...context.sessionCookieOptions,
      maxAge: 0,
    },
  }))
}

const chunkSessionCookie = (
  context: RouteSessionContext,
  value: string,
  expires: Date
): SessionCookie[] => {
  const chunkCount = Math.ceil(value.length / SESSION_COOKIE_CHUNK_SIZE)
  const nextCookies: SessionCookie[] = cleanSessionCookies(context)

  if (chunkCount <= 1) {
    nextCookies.push({
      name: context.sessionCookieName,
      value,
      options: {
        ...context.sessionCookieOptions,
        expires,
      },
    })

    return nextCookies
  }

  for (let index = 0; index < chunkCount; index += 1) {
    nextCookies.push({
      name: `${context.sessionCookieName}.${index}`,
      value: value.slice(
        index * SESSION_COOKIE_CHUNK_SIZE,
        (index + 1) * SESSION_COOKIE_CHUNK_SIZE
      ),
      options: {
        ...context.sessionCookieOptions,
        expires,
      },
    })
  }

  return nextCookies
}

const refreshRouteToken = async (token: JWT) => {
  if (!token.refreshToken) {
    throw createSessionRefreshFailedError()
  }

  try {
    const refreshedTokens = await refreshSingleFlight.refresh(token.refreshToken)
    return withRefreshedSessionTokens(token, refreshedTokens)
  } catch {
    throw createSessionRefreshFailedError()
  }
}

export const executeWithTokenRecovery = async <T>({
  token,
  requireAuth = true,
  execute,
  refreshToken,
  isUnauthorizedError = isUnauthorizedAxiosError,
}: ExecuteWithTokenRecoveryOptions<T>): Promise<RecoveryResult<T>> => {
  if (requireAuth && !token) {
    return {
      ok: false,
      error: createUnauthorizedError(),
      token,
      didRefreshSession: false,
      shouldClearSession: false,
    }
  }

  const runRequest = (accessToken?: string) => execute(accessToken)

  if (token?.accessToken || !requireAuth) {
    try {
      const value = await runRequest(token?.accessToken)
      return {
        ok: true,
        value,
        token,
        didRefreshSession: false,
        shouldClearSession: false,
      }
    } catch (error) {
      const canRetryWithRefresh =
        isUnauthorizedError(error) && Boolean(token?.refreshToken)

      if (!canRetryWithRefresh) {
        if (isUnauthorizedError(error) && token) {
          return {
            ok: false,
            error: createSessionRefreshFailedError(),
            token: null,
            didRefreshSession: false,
            shouldClearSession: true,
          }
        }

        throw error
      }
    }
  }

  let refreshedToken: JWT

  try {
    refreshedToken = await refreshToken(token as JWT)
  } catch (error) {
    if (
      error instanceof AppHttpError &&
      error.code === API_AUTH_ERROR_CODE.SESSION_REFRESH_FAILED
    ) {
      return {
        ok: false,
        error,
        token: null,
        didRefreshSession: false,
        shouldClearSession: true,
      }
    }

    return {
      ok: false,
      error: createSessionRefreshFailedError(),
      token: null,
      didRefreshSession: false,
      shouldClearSession: true,
    }
  }

  try {
    const value = await runRequest(refreshedToken.accessToken)

    return {
      ok: true,
      value,
      token: refreshedToken,
      didRefreshSession: true,
      shouldClearSession: false,
    }
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return {
        ok: false,
        error: createSessionRefreshFailedError(),
        token: null,
        didRefreshSession: false,
        shouldClearSession: true,
      }
    }

    throw error
  }
}

const applyRouteSessionToResponse = async (
  context: RouteSessionContext,
  response: NextResponse
) => {
  if (context.shouldClearSession) {
    const cookiesToClean = cleanSessionCookies(context)

    for (const cookie of cookiesToClean) {
      response.cookies.set(cookie.name, cookie.value, cookie.options)
    }

    return response
  }

  if (!context.didRefreshSession || !context.token) {
    return response
  }

  const encodedToken = await encode({
    token: context.token,
    secret: getAuthSecret(),
    maxAge: SESSION_MAX_AGE,
  })
  const cookieExpires = new Date(Date.now() + SESSION_MAX_AGE * 1000)
  const sessionCookies = chunkSessionCookie(context, encodedToken, cookieExpires)

  for (const cookie of sessionCookies) {
    response.cookies.set(cookie.name, cookie.value, cookie.options)
  }

  return response
}

const createRouteAwareRequestApi = async (
  request: NextRequest,
  options: RequestApiOptions = {}
): Promise<ServerRequestApi> => {
  const context = await createRouteSessionContext(request)
  const requireAuth = options.requireAuth ?? true

  const requestWithRecovery = async <T = unknown, D = unknown>(
    config: AxiosRequestConfig<D>
  ) => {
    const recoveryResult = await executeWithTokenRecovery({
      token: context.token,
      requireAuth,
      execute: (accessToken) => {
        const client = createBaseAxiosClient(accessToken)
        return client.request<T, AxiosResponse<T, D>, D>(config)
      },
      refreshToken: async (token) => {
        const refreshedToken = await refreshRouteToken(token)
        context.token = refreshedToken
        context.didRefreshSession = true
        return refreshedToken
      },
    })

    if (!recoveryResult.ok) {
      context.shouldClearSession = recoveryResult.shouldClearSession
      context.token = recoveryResult.token
      throw recoveryResult.error
    }

    context.token = recoveryResult.token
    context.didRefreshSession =
      context.didRefreshSession || recoveryResult.didRefreshSession

    return recoveryResult.value
  }

  return {
    request: requestWithRecovery,
    get: (url, config) =>
      requestWithRecovery({
        ...config,
        method: "GET",
        url,
      }),
    post: (url, data, config) =>
      requestWithRecovery({
        ...config,
        method: "POST",
        url,
        data,
      }),
    patch: (url, data, config) =>
      requestWithRecovery({
        ...config,
        method: "PATCH",
        url,
        data,
      }),
    applyAuthToResponse: async (response) => {
      return applyRouteSessionToResponse(context, response)
    },
  }
}

const createSessionBackedRequestApi = async (): Promise<ServerRequestApi> => {
  const session = await getServerSession(authOptions)
  const client = createBaseAxiosClient(session?.accessToken)

  return {
    request: (config) => client.request(config),
    get: (url, config) =>
      client.request({
        ...config,
        method: "GET",
        url,
      }),
    post: (url, data, config) =>
      client.request({
        ...config,
        method: "POST",
        url,
        data,
      }),
    patch: (url, data, config) =>
      client.request({
        ...config,
        method: "PATCH",
        url,
        data,
      }),
    applyAuthToResponse: async (response) => response,
  }
}

export const createServerRequestApi = async (
  request?: NextRequest,
  options?: RequestApiOptions
) => {
  if (request) {
    return createRouteAwareRequestApi(request, options)
  }

  return createSessionBackedRequestApi()
}

export const isRouteSessionRecoveryError = (error: unknown) => {
  return (
    error instanceof AppHttpError &&
    error.code === API_AUTH_ERROR_CODE.SESSION_REFRESH_FAILED
  )
}

export const isUnauthorizedRouteError = (error: unknown) => {
  return (
    error instanceof AppHttpError &&
    error.code === API_AUTH_ERROR_CODE.UNAUTHORIZED
  )
}

export const isAxiosUnauthorizedError = (error: unknown) => {
  return error instanceof AxiosError && error.response?.status === 401
}
