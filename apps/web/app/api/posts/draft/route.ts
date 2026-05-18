import { createServerRequestApi } from "@/lib/api/requestApi"
import { NextResponse } from "next/server"

export const POST = async () => {
  const requestApi = await createServerRequestApi()
  const postDraft = await requestApi.post("/post/draft").then((res) => res.data)

  return NextResponse.json(postDraft)
}
