import { authOptions } from "@/lib/auth/next-auth.config"
import { getServerSession } from "next-auth"
import { forbidden, unauthorized } from "next/navigation"

export const getSessionOrNull = async () => {
  return getServerSession(authOptions)
}

export const requireSession = async () => {
  const session = await getSessionOrNull()

  if (!session?.accessToken || session.error) {
    unauthorized()
  }

  return session
}

export const requireAdminSession = async () => {
  const session = await requireSession()

  if (session.user.role !== "ADMIN") {
    forbidden()
  }

  return session
}
