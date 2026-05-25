import { authOptions } from "@/lib/auth/next-auth.config"
import { getServerSession } from "next-auth"
import { signOut } from "next-auth/react"
import { forbidden, unauthorized } from "next/navigation"

export const getSessionOrNull = async () => {
  return getServerSession(authOptions)
}

export const requireSession = async () => {
  const session = await getSessionOrNull()

  if (!session?.accessToken || session.error) {
    await signOut()
    unauthorized()
  }

  return session
}

export const requireAdminSession = async () => {
  const session = await requireSession()

  if (session.user.role !== "ADMIN") {
    await signOut()
    forbidden()
  }

  return session
}
