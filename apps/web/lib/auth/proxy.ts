import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

const PUBLIC_ROUTES = ["/login", "/signup"]

const AUTH_REQUIRED_ROUTES = ["/editor", "/admin"]

const ADMIN_REQUIRED_ROUTES = ["/admin"]

const isMatchedRoute = (pathname: string, routes: string[]) => {
  return routes.some((route) => {
    return pathname === route || pathname.startsWith(`${route}/`)
  })
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const isPublicRoute = isMatchedRoute(pathname, PUBLIC_ROUTES)
  const isAuthRequiredRoute = isMatchedRoute(pathname, AUTH_REQUIRED_ROUTES)
  const isAdminRequiredRoute = isMatchedRoute(pathname, ADMIN_REQUIRED_ROUTES)

  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  if (!token && isAuthRequiredRoute) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.href)

    return NextResponse.redirect(loginUrl)
  }

  if (isAdminRequiredRoute && token?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/login", "/signup", "/editor/:path*", "/admin/:path*"],
}
