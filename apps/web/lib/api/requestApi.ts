import axios from "axios"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/next-auth.config"

const backendUrl = process.env.BACKEND_URL

if (!backendUrl) {
  throw new Error("BACKEND_URL is not configured")
}
export const createServerRequestApi = async () => {
  const session = await getServerSession(authOptions)

  return axios.create({
    baseURL: backendUrl,

    headers: {
      ...(session?.accessToken
        ? { Authorization: `Bearer ${session.accessToken}` }
        : {}),
    },
  })
}
