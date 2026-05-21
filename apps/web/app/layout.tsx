import {
  //  Geist,
  Geist_Mono,
  Inter,
} from "next/font/google"
import type { Metadata } from "next"

import "@packages/ui/src/styles/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@workspace/ui/lib/utils"
import Logo from "@/src/05_shared/logo/ui/Logo"
import HeaderMenuItem from "@/src/04_entities/header/ui/HeaderMenuItem"
import LogoutButton from "@/src/04_entities/header/ui/LogoutButton"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/next-auth.config"
import { getDefaultMetadata } from "@/src/05_shared/seo/lib/seo"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = getDefaultMetadata()

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getServerSession(authOptions)

  return (
    <html
      lang="ko-KR"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body>
        <ThemeProvider>
          <div className="relative w-full">
            <header className="w-full border-b border-b-muted">
              <nav
                aria-label="주요 메뉴"
                className="flex min-h-14 w-full max-w-screen-2xl items-center justify-between px-2"
              >
                <div className="flex items-center gap-2">
                  <Logo />
                  {session ? (
                    <ul className="flex h-full items-center gap-2 px-2">
                      <HeaderMenuItem label={"Blog"} linkTo={"/posts"} />
                      {session.user.role === "USER" ||
                      session.user.role === "ADMIN" ? (
                        <HeaderMenuItem label={"Editor"} linkTo={"/editor"} />
                      ) : null}
                      {session.user.role === "ADMIN" ? (
                        <HeaderMenuItem label={"Admin"} linkTo={"/admin"} />
                      ) : null}
                    </ul>
                  ) : null}
                </div>
                {session ? (
                  <div className="px-4">
                    <LogoutButton />
                  </div>
                ) : null}
              </nav>
            </header>
            <main id="main-content">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
