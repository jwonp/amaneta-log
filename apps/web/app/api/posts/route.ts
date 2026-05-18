import { createServerRequestApi } from "@/lib/api/requestApi"
import { AxiosError } from "axios"
import { NextRequest, NextResponse } from "next/server"

export const GET = async (request: NextRequest) => {
  const requestApi = await createServerRequestApi()
  const search = request.nextUrl.searchParams.toString()
  const endpoint = search ? `/posts?${search}` : "/posts"

  const { data, status } = await requestApi
    .get(endpoint)
    .then(({ data, status }) => ({ data, status }))
    .catch((error: AxiosError) => ({
      data: {
        message: error.response?.data ?? "failed to fetch posts",
      },
      status: error.status ?? 500,
    }))

  return NextResponse.json(data, { status })
}
