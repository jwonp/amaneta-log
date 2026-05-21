import SignupView from "@/src/01_views/auth/ui/SignupView"
import type { Metadata } from "next"
import { getNoIndexMetadata } from "@/src/05_shared/seo/lib/seo"

export const metadata: Metadata = getNoIndexMetadata(
  "회원가입",
  "Amaneta Log 회원가입 페이지입니다."
)

const SignupPage = () => {
  return <SignupView />
}
export default SignupPage
