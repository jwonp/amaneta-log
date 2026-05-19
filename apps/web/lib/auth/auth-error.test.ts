import { describe, expect, it } from "vitest"
import { getAuthErrorViewModel } from "./auth-error"

describe("getAuthErrorViewModel", () => {
  it("maps known sign-in failures to a safe message", () => {
    const errorViewModel = getAuthErrorViewModel("CredentialsSignin")

    expect(errorViewModel.statusCode).toBe(401)
    expect(errorViewModel.title).toBe("로그인에 실패했습니다.")
    expect(errorViewModel.description).toContain("이메일 또는 비밀번호")
  })

  it("falls back to the default message for unknown errors", () => {
    const errorViewModel = getAuthErrorViewModel("unknown-error")

    expect(errorViewModel.statusCode).toBe(500)
    expect(errorViewModel.actions).toEqual(["login", "home"])
  })
})
