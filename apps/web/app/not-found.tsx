import ErrorScreen from "@/src/05_shared/error/ui/ErrorScreen"
import type { Metadata } from "next"
import { getNoIndexMetadata } from "@/src/05_shared/seo/lib/seo"

export const metadata: Metadata = getNoIndexMetadata(
  "404",
  "요청한 페이지를 찾을 수 없습니다."
)

export default function NotFound() {
  return (
    <ErrorScreen
      statusCode={404}
      title="페이지를 찾을 수 없습니다."
      description="주소가 잘못되었거나 이미 삭제된 페이지입니다."
      actions={["home", "back"]}
    />
  )
}
