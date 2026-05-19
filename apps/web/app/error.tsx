"use client"

import ErrorScreen from "@/src/05_shared/error/ui/ErrorScreen"
import RetryErrorButton from "@/src/05_shared/error/ui/RetryErrorButton"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorScreen
      statusCode={500}
      title="예기치 않은 오류가 발생했습니다."
      description="문제가 계속되면 잠시 후 다시 시도해주세요."
      actions={["home", "back"]}
    >
      <RetryErrorButton onRetry={reset} />
      {process.env.NODE_ENV !== "production" && error.message ? (
        <p className="w-full text-xs text-muted-foreground">{error.message}</p>
      ) : null}
    </ErrorScreen>
  )
}
