import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const patch = vi.fn()
const applyAuthToResponse = vi.fn((response: Response) => response)
const revalidatePath = vi.fn()

vi.mock("@/lib/api/requestApi", () => ({
  createServerRequestApi: vi.fn(async () => ({
    patch,
    applyAuthToResponse,
  })),
}))

vi.mock("next/cache", () => ({
  revalidatePath,
}))

describe("post detail route", () => {
  beforeEach(() => {
    vi.resetModules()
    patch.mockResolvedValue({
      data: { id: "post-1" },
      status: 200,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("revalidates the posts pages after publishing", async () => {
    const { PATCH } = await import("./route")

    const response = await PATCH(
      new Request("http://localhost/api/posts/post-1", {
        method: "PATCH",
        body: JSON.stringify({ saveMode: "PUBLISH" }),
        headers: {
          "Content-Type": "application/json",
        },
      }) as never,
      {
        params: Promise.resolve({ postId: "post-1" }),
      }
    )

    expect(response.status).toBe(200)
    expect(patch).toHaveBeenCalledWith("/posts/post-1", {
      saveMode: "PUBLISH",
    })
    expect(revalidatePath).toHaveBeenCalledTimes(2)
    expect(revalidatePath).toHaveBeenNthCalledWith(1, "/posts")
    expect(revalidatePath).toHaveBeenNthCalledWith(2, "/posts/post-1")
  })

  it("does not revalidate the posts page after saving a draft", async () => {
    const { PATCH } = await import("./route")

    await PATCH(
      new Request("http://localhost/api/posts/post-1", {
        method: "PATCH",
        body: JSON.stringify({ saveMode: "DRAFT" }),
        headers: {
          "Content-Type": "application/json",
        },
      }) as never,
      {
        params: Promise.resolve({ postId: "post-1" }),
      }
    )

    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it("does not revalidate the posts page after autosaving", async () => {
    const { PATCH } = await import("./route")

    await PATCH(
      new Request("http://localhost/api/posts/post-1", {
        method: "PATCH",
        body: JSON.stringify({ saveMode: "AUTO" }),
        headers: {
          "Content-Type": "application/json",
        },
      }) as never,
      {
        params: Promise.resolve({ postId: "post-1" }),
      }
    )

    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
