import { createServerRequestApi } from "@/lib/api/requestApi"
import { AxiosError } from "axios"
import { NextRequest, NextResponse } from "next/server"

type RouteContext = {
  params: Promise<{
    postId: string
  }>
}

export const GET = async (_request: NextRequest, context: RouteContext) => {
  const requestApi = await createServerRequestApi()
  const { postId } = await context.params

  const { data, status } = await requestApi
    .get(`/posts/${postId}/edit`)
    .then(({ data, status }) => ({ data, status }))
    .catch((err: AxiosError) => ({
      data: { message: "fail to get editable post" },
      status: err?.status || 500,
    }))

  return NextResponse.json(data, { status })
}
