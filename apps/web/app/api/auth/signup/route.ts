import axios, { AxiosError } from "axios"
import { NextResponse } from "next/server"

const backendUrl = process.env.BACKEND_URL

export const POST = async (request: Request) => {
  if (!backendUrl) {
    return NextResponse.json(
      { message: "BACKEND_URL is not configured" },
      { status: 500 }
    )
  }

  const payload = await request.json()

  const { data, status } = await axios
    .post(`${backendUrl}/auth/signup`, payload)
    .then((res) => ({ data: res.data, status: res.status }))
    .catch((res: AxiosError) => ({
      data: { message: "sign-up failed", error: res },
      status: res.status,
    }))

  return NextResponse.json(data, { status: status || 500 })
}
