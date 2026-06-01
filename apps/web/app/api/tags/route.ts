import { createServerRequestApi } from "@/lib/api/requestApi"
import { NextResponse } from "next/server"
import type { Tag } from "@/src/03_features/post/filter/model/tag.type"

export const GET = async () => {
  try {
    const requestApi = await createServerRequestApi()
    const { data } = await requestApi.get<Tag[]>("/posts/tags")
    return NextResponse.json(data)
  } catch {
    return NextResponse.json([])
  }
}
