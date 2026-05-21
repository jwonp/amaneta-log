import axios from "axios"
import { NextResponse } from "next/server"
import { normalizeAppError, serializeAppError } from "@/lib/errors/app-error"

const backendUrl = process.env.BACKEND_URL

export const POST = async (request: Request) => {
  if (!backendUrl) {
    return NextResponse.json(
      { message: "BACKEND_URL is not configured" },
      { status: 500 }
    )
  }

  const payload = await request.json()
  try {
    const { data, status } = await axios.post(`${backendUrl}/auth/signup`, payload)
    return NextResponse.json(data, { status })
  } catch (error) {
    const appError = normalizeAppError(error, {
      message: "회원가입을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.",
    })

    return NextResponse.json(serializeAppError(appError), {
      status: appError.status,
    })
  }
}
