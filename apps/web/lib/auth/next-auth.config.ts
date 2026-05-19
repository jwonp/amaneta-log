import { NextAuthOptions, User } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import axios from "axios"
import { refreshJwtToken } from "@/lib/auth/token-refresh"

type AuthUserResponse = {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: string
  user: {
    username: string
    name: string
    email: string
    profileImage: string | null
    role: "USER" | "ADMIN"
    createdAt: Date
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email?.trim()
        const password = credentials?.password

        if (!email || !password) {
          throw new Error("CredentialsSignin")
        }

        try {
          const backendUrl = process.env.BACKEND_URL

          if (!backendUrl) {
            throw new Error("Configuration")
          }

          const response = await axios.post<AuthUserResponse>(`${backendUrl}/auth/login`, {
            username: email,
            password,
          })

          const data = response.data.user
          return {
            id: data.username,
            username: data.username,
            name: data.name,
            email: data.email,
            profileImage: data.profileImage,
            role: data.role,
            createdAt: data.createdAt,
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
            accessTokenExpiresAt: response.data.accessTokenExpiresAt,
          }
        } catch (error) {
          if (axios.isAxiosError(error)) {
            if (error.response?.status === 401) {
              throw new Error("CredentialsSignin")
            }

            if (error.response?.status === 403) {
              throw new Error("AccessDenied")
            }
          }

          if (error instanceof Error) {
            throw error
          }

          throw new Error("Default")
        }
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        const authUser = user as User

        token.username = authUser.username
        token.role = authUser.role
        token.name = authUser.name
        token.email = authUser.email
        token.profileImage = authUser.profileImage
        token.createdAt = authUser.createdAt
        token.accessToken = authUser.accessToken
        token.refreshToken = authUser.refreshToken
        token.accessTokenExpiresAt = authUser.accessTokenExpiresAt
        token.error = undefined
      }

      if (!token.accessTokenExpiresAt) {
        return token
      }

      const accessTokenExpiresAt = new Date(token.accessTokenExpiresAt).getTime()

      if (Number.isNaN(accessTokenExpiresAt)) {
        return await refreshJwtToken(token)
      }

      if (Date.now() < accessTokenExpiresAt - 30_000) {
        return token
      }

      return await refreshJwtToken(token)
    },

    session: async ({ session, token }) => {
      if (session.user) {
        session.user.username = token.username ?? ""
        session.user.role = token.role ?? "USER"
        session.user.name = token.name ?? ""
        session.user.email = token.email ?? ""
        session.user.profileImage = token.profileImage ?? null
        session.user.image = token.profileImage ?? null
        session.user.createdAt = token.createdAt ?? new Date(0)
      }

      session.accessToken = token.accessToken
      session.accessTokenExpiresAt = token.accessTokenExpiresAt
      session.error = token.error

      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
}
