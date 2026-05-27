import { createServerRequestApi } from "@/lib/api/requestApi"
import { NextResponse } from "next/server"
import type { Tag } from "@/src/03_features/post/filter/model/tag.type"

export const GET = async () => {
  try {
    const requestApi = await createServerRequestApi()
    const { data } = await requestApi.get<{
      items: { tags: string[] }[]
    }>("/posts?limit=200")

    const tagCounts = new Map<string, number>()
    for (const item of data.items ?? []) {
      for (const slug of item.tags ?? []) {
        tagCounts.set(slug, (tagCounts.get(slug) ?? 0) + 1)
      }
    }

    const tags: Tag[] = Array.from(tagCounts.entries())
      .map(([slug, count]) => ({ slug, label: slug, count }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json(tags)
  } catch {
    return NextResponse.json([])
  }
}
