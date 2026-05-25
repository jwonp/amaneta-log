import { describe, expect, it } from "vitest"
import { getEditableStorageFileUrl } from "./storageFileUrl"

describe("getEditableStorageFileUrl", () => {
  it("returns the editable storage route for a file id", () => {
    expect(getEditableStorageFileUrl(42, 7)).toBe(
      "/api/storage/42/files/7/editable"
    )
  })

  it("returns undefined when the file id is missing", () => {
    expect(getEditableStorageFileUrl(42, null)).toBeUndefined()
    expect(getEditableStorageFileUrl(42, undefined)).toBeUndefined()
  })
})
