import ErrorScreen from "@/src/05_shared/error/ui/ErrorScreen"

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
