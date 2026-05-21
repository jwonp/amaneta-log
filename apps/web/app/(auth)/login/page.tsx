import LoginView from "@/src/01_views/auth/ui/LoginView"
import type { Metadata } from "next"
import { getNoIndexMetadata } from "@/src/05_shared/seo/lib/seo"

export const metadata: Metadata = getNoIndexMetadata(
  "로그인",
  "Amaneta Log 로그인 페이지입니다."
)

const LoginPage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    callbackUrl?: string
  }>
}) => {
  const { callbackUrl } = await searchParams

  return <LoginView callbackUrl={callbackUrl} />
}
export default LoginPage
