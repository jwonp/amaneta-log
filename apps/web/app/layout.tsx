import {
  //  Geist,
  Geist_Mono,
  Inter,
} from "next/font/google"

import "@packages/ui/src/styles/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@workspace/ui/lib/utils"
import Logo from "@/src/05_shared/logo/ui/Logo"
import {
  NavigationMenu,
  NavigationMenuList,
} from "@packages/ui/src/components/navigation-menu"
import HeaderMenuItem from "@/src/04_entities/header/ui/HeaderMenuItem"
import ReactQueryClientProvider from "@/src/04_entities/query/ui/ReactQueryClientProvider"
import LogoutButton from "@/src/04_entities/header/ui/LogoutButton"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/next-auth.config"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getServerSession(authOptions)

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body>
        <ReactQueryClientProvider>
          <ThemeProvider>
            <div className="relative w-full">
              <NavigationMenu className="block h-14 w-full max-w-full border-b border-b-muted">
                <NavigationMenuList className="flex h-full w-full justify-between">
                  <div className="flex items-center gap-6">
                    <Logo />
                    {session ? (
                      <div className="flex h-full w-fit gap-2 px-4">
                        <HeaderMenuItem label={"Blog"} linkTo={"/posts"} />
                        {session.user.role === "USER" ||
                        session.user.role === "ADMIN" ? (
                          <HeaderMenuItem label={"Editor"} linkTo={"/editor"} />
                        ) : null}
                        {session.user.role === "ADMIN" ? (
                          <HeaderMenuItem label={"Admin"} linkTo={"/admin"} />
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  {session ? (
                    <div className="px-4">
                      <LogoutButton />
                    </div>
                  ) : null}
                </NavigationMenuList>
              </NavigationMenu>
              {children}
            </div>
          </ThemeProvider>
        </ReactQueryClientProvider>
      </body>
    </html>
  )
}
