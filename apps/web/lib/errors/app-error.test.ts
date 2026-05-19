import { describe, expect, it } from "vitest"
import { normalizeAppError } from "./app-error"

describe("normalizeAppError", () => {
  it("preserves trusted app error payloads", () => {
    const error = normalizeAppError({
      isAxiosError: true,
      response: {
        status: 404,
        data: {
          status: 404,
          code: "POST_NOT_FOUND",
          message: "게시글을 찾을 수 없습니다.",
        },
      },
    })

    expect(error.status).toBe(404)
    expect(error.code).toBe("POST_NOT_FOUND")
    expect(error.message).toBe("게시글을 찾을 수 없습니다.")
  })

  it("replaces unsafe backend messages with safe defaults", () => {
    const error = normalizeAppError({
      isAxiosError: true,
      response: {
        status: 500,
        data: {
          message: "SQLSTATE[42P01] relation does not exist",
        },
      },
    })

    expect(error.status).toBe(500)
    expect(error.code).toBe("INTERNAL_SERVER_ERROR")
    expect(error.message).toBe("서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.")
  })
})
