import { describe, expect, it, vi } from "vitest"
import { JWT } from "next-auth/jwt"
import {
  createRefreshSingleFlightManager,
  executeWithTokenRecovery,
} from "./requestApi"
import { API_AUTH_ERROR_CODE } from "@/src/05_shared/api/common/model/auth-error"

const createToken = (overrides: Partial<JWT> = {}): JWT => {
  return {
    sub: "user:CREDENTIALS",
    username: "user",
    accessToken: "access-token",
    refreshToken: "refresh-token",
    accessTokenExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    ...overrides,
  }
}

describe("createRefreshSingleFlightManager", () => {
  it("reuses the same refresh promise for concurrent calls", async () => {
    const refreshExecutor = vi.fn(async (refreshToken: string) => {
      await Promise.resolve()

      return {
        accessToken: `${refreshToken}-new-access`,
        refreshToken: `${refreshToken}-new-refresh`,
        accessTokenExpiresAt: new Date(Date.now() + 60_000).toISOString(),
      }
    })
    const manager = createRefreshSingleFlightManager(refreshExecutor)

    const [first, second] = await Promise.all([
      manager.refresh("refresh-token"),
      manager.refresh("refresh-token"),
    ])

    expect(refreshExecutor).toHaveBeenCalledTimes(1)
    expect(first).toEqual(second)
  })
})

describe("executeWithTokenRecovery", () => {
  it("retries the original request exactly once after refresh", async () => {
    const refreshedToken = createToken({
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
    })
    const execute = vi
      .fn<(accessToken?: string) => Promise<string>>()
      .mockImplementationOnce(async () => {
        const error = new Error("expired token") as Error & {
          response?: { status: number }
        }
        error.response = { status: 401 }
        throw error
      })
      .mockImplementationOnce(async (accessToken) => accessToken ?? "missing")
    const refreshToken = vi.fn(async () => refreshedToken)

    const result = await executeWithTokenRecovery({
      token: createToken(),
      execute,
      refreshToken,
      isUnauthorizedError: (error) =>
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (error as { response?: { status?: number } }).response?.status === 401,
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe("new-access-token")
      expect(result.didRefreshSession).toBe(true)
      expect(result.token?.accessToken).toBe("new-access-token")
    }
    expect(refreshToken).toHaveBeenCalledTimes(1)
    expect(execute).toHaveBeenCalledTimes(2)
  })

  it("returns a session refresh failure when refresh cannot recover a 401", async () => {
    const execute = vi.fn(async () => {
      const error = new Error("expired token") as Error & {
        response?: { status: number }
      }
      error.response = { status: 401 }
      throw error
    })
    const refreshToken = vi.fn(async () => {
      throw new Error("refresh failed")
    })

    const result = await executeWithTokenRecovery({
      token: createToken(),
      execute,
      refreshToken,
      isUnauthorizedError: (error) =>
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (error as { response?: { status?: number } }).response?.status === 401,
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.status).toBe(401)
      expect(result.error.code).toBe(API_AUTH_ERROR_CODE.SESSION_REFRESH_FAILED)
      expect(result.shouldClearSession).toBe(true)
    }
    expect(refreshToken).toHaveBeenCalledTimes(1)
  })
})
