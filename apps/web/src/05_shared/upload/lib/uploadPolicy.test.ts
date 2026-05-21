import { describe, expect, it } from "vitest"
import {
  detectImageMimeType,
  MAX_MULTIPART_BODY_BYTES,
  parseContentLengthHeader,
  validateUploadContentLength,
} from "./uploadPolicy"

describe("uploadPolicy", () => {
  it("rejects oversized multipart bodies before parsing formData", () => {
    expect(validateUploadContentLength(MAX_MULTIPART_BODY_BYTES + 1)).toEqual({
      status: 413,
      body: {
        message: "request body exceeds upload limit",
      },
    })
  })

  it("parses valid content-length values and ignores invalid values", () => {
    expect(parseContentLengthHeader("1024")).toBe(1024)
    expect(parseContentLengthHeader("-1")).toBeNull()
    expect(parseContentLengthHeader("not-a-number")).toBeNull()
  })

  it("detects known image magic bytes", () => {
    expect(
      detectImageMimeType(
        new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      )
    ).toBe("image/png")
  })
})
