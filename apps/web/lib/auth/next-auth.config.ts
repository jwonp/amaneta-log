import { NextAuthOptions, User } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import axios, { AxiosError } from "axios"

type AuthUserResponse = {
  accessToken: string
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
          throw new Error("Email and password are required")
        }

        try {
          const backendUrl = process.env.BACKEND_URL

          if (!backendUrl) {
            throw new Error("No backend url config")
          }

          const res = await axios
            .post<AuthUserResponse>(`${backendUrl}/auth/login`, {
              username: email,
              password,
            })
            .then((res) => ({ data: res.data }))
            .catch((err: AxiosError) => {
              console.log(err.message)
            })

          if (!res) throw new Error("Fail to login")

          const data = res.data.user
          return {
            id: data.username,
            username: data.username,
            name: data.name,
            email: data.email,
            profileImage: data.profileImage,
            role: data.role,
            createdAt: data.createdAt,
            accessToken: res.data.accessToken,
          }
        } catch (error) {
          if (axios.isAxiosError(error)) {
            throw new Error(
              error.response?.data?.message ?? "Credentials login failed"
            )
          }
          throw new Error("Credentials login failed")
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
      }

      return token
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

      return session
    },
  },
  pages: {
    signIn: "/login",
  },
}
