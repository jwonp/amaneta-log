import { describe, expect, it } from "vitest"
import { serializeJsonLd } from "../lib/serializeJsonLd"

describe("serializeJsonLd", () => {
  it("escapes script-breakout payloads and special characters", () => {
    const serialized = serializeJsonLd({
      headline: '</script><script>alert(1)</script>',
      description: "a<b>c&d",
      separator: "line\u2028paragraph\u2029end",
    })

    expect(serialized).not.toContain("</script>")
    expect(serialized).toContain(
      "\\u003c/script\\u003e\\u003cscript\\u003ealert(1)\\u003c/script\\u003e"
    )
    expect(serialized).toContain("\\u003cb\\u003e")
    expect(serialized).toContain("\\u0026")
    expect(serialized).toContain("\\u2028")
    expect(serialized).toContain("\\u2029")
  })
})
