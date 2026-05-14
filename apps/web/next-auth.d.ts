import { DefaultSession, DefaultUser } from "next-auth"
import { DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  type UserRole = "USER" | "ADMIN"

  interface Session {
    user: {
      username: string
      name: string
      email: string
      profileImage: string | null
      role: UserRole
      createdAt: Date
    } & DefaultSession["user"]
    accessToken: string
  }

  interface User extends DefaultUser {
    id: string
    username: string
    name: string
    email: string
    profileImage: string | null
    role: UserRole
    createdAt: Date
    accessToken: string
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    username?: string
    role?: UserRole
    profileImage?: string | null
    createdAt?: Date
    accessToken: string
  }
}
