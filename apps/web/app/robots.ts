import type { MetadataRoute } from "next"
import { getSiteUrl } from "@/src/05_shared/seo/lib/seo"

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl()

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/posts", "/posts/"],
        disallow: [
          "/login",
          "/signup",
          "/editor",
          "/admin",
          "/auth",
          "/errors",
          "/api",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
