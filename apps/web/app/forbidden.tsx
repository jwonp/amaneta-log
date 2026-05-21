import ErrorScreen from "@/src/05_shared/error/ui/ErrorScreen"
import type { Metadata } from "next"
import { getNoIndexMetadata } from "@/src/05_shared/seo/lib/seo"

export const metadata: Metadata = getNoIndexMetadata(
  "403",
  "접근 권한이 없는 페이지입니다."
)

export default function Forbidden() {
  return (
    <ErrorScreen
      statusCode={403}
      title="접근 권한이 없습니다."
      description="현재 계정으로는 이 페이지를 볼 수 없습니다."
      actions={["home", "back"]}
    />
  )
}
