import ErrorScreen from "@/src/05_shared/error/ui/ErrorScreen"
import type { Metadata } from "next"
import { getNoIndexMetadata } from "@/src/05_shared/seo/lib/seo"

export const metadata: Metadata = getNoIndexMetadata(
  "401",
  "로그인이 필요한 페이지입니다."
)

export default function Unauthorized() {
  return (
    <ErrorScreen
      statusCode={401}
      title="로그인이 필요합니다."
      description="이 페이지를 보려면 로그인 후 다시 시도해주세요."
      actions={["login", "home"]}
    />
  )
}
