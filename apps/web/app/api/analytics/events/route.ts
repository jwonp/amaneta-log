import axios, { AxiosError } from "axios"
import { NextRequest, NextResponse } from "next/server"

const getBackendUrl = () => {
  const backendUrl = process.env.BACKEND_URL

  if (!backendUrl) {
    throw new Error("BACKEND_URL is not configured")
  }

  return backendUrl
}

export const POST = async (request: NextRequest) => {
  const payload = await request.json()

  const { data, status } = await axios
    .post(`${getBackendUrl()}/analytics/events`, payload, {
      headers: {
        "user-agent": request.headers.get("user-agent") ?? "",
      },
    })
    .then(({ data, status }) => ({ data, status }))
    .catch((error: AxiosError) => ({
      data: {
        message: error.response?.data ?? "failed to track analytics event",
      },
      status: error.status ?? 500,
    }))

  return NextResponse.json(data, { status })
}
