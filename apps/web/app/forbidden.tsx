import ErrorScreen from "@/src/05_shared/error/ui/ErrorScreen"

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
