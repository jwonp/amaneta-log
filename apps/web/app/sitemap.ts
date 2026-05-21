import type { MetadataRoute } from "next"
import { getPostList } from "@/src/03_features/post/api/postList.server"
import { getSiteUrl } from "@/src/05_shared/seo/lib/seo"

const SITEMAP_PAGE_LIMIT = 100
export const dynamic = "force-dynamic"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const items: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/posts`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ]

  let cursor: string | null | undefined = null

  do {
    const response = await getPostList(
      { limit: String(SITEMAP_PAGE_LIMIT) },
      cursor
    )

    items.push(
      ...response.items.map((post) => ({
        url: `${siteUrl}/posts/${post.id}`,
        lastModified: new Date(post.updatedAt),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }))
    )

    cursor = response.pageInfo.nextCursor
  } while (cursor)

  return items
}
