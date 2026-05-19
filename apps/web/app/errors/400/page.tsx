import ErrorScreen from "@/src/05_shared/error/ui/ErrorScreen"

const BAD_REQUEST_REASON_MAP: Record<
  string,
  {
    title: string
    description: string
  }
> = {
  "invalid-post-id": {
    title: "잘못된 게시글 주소입니다.",
    description: "게시글 번호 형식이 올바른지 다시 확인해주세요.",
  },
}

export default async function BadRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  const { reason } = await searchParams
  const content =
    (reason ? BAD_REQUEST_REASON_MAP[reason] : undefined) ?? {
      title: "잘못된 요청입니다.",
      description: "요청 내용을 다시 확인한 뒤 다시 시도해주세요.",
    }

  return (
    <ErrorScreen
      statusCode={400}
      title={content.title}
      description={content.description}
      actions={["home", "back"]}
    />
  )
}
