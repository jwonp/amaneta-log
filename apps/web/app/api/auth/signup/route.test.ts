import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const post = vi.fn()

vi.mock("axios", () => {
  return {
    default: {
      post,
      isAxiosError: (error: unknown) =>
        typeof error === "object" && error !== null && "isAxiosError" in error,
    },
    post,
    isAxiosError: (error: unknown) =>
      typeof error === "object" && error !== null && "isAxiosError" in error,
    AxiosError: class AxiosError extends Error {},
  }
})

describe("signup route", () => {
  const testPassword = "secure-password-123"

  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv("BACKEND_URL", "http://api.test")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it("does not expose raw AxiosError data to clients", async () => {
    post.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 500,
        data: {
          message: "SQLSTATE[42P01] relation does not exist",
          config: {
            url: "http://api.test/auth/signup",
          },
        },
      },
    })

    const { POST } = await import("./route")
    const response = await POST(
      new Request("http://localhost/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          username: "alice",
          password: testPassword,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      })
    )

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      status: 500,
      code: "INTERNAL_SERVER_ERROR",
      message: "회원가입을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.",
    })
  })
})
