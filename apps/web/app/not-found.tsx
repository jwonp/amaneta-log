import ErrorScreen from "@/src/05_shared/error/ui/ErrorScreen"

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
