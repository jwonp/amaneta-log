import AuthLayoutView from "@/src/01_views/auth/ui/AuthLayoutView"
import type { Metadata } from "next"
import { getNoIndexMetadata } from "@/src/05_shared/seo/lib/seo"

export const metadata: Metadata = getNoIndexMetadata(
  "인증",
  "로그인과 회원가입을 위한 비공개 화면입니다."
)

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return <AuthLayoutView>{children}</AuthLayoutView>
}
export default AuthLayout
