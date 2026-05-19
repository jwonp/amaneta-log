"use client"

import ErrorScreen from "@/src/05_shared/error/ui/ErrorScreen"
import RetryErrorButton from "@/src/05_shared/error/ui/RetryErrorButton"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <ErrorScreen
          statusCode={500}
          title="애플리케이션을 불러오지 못했습니다."
          description="잠시 후 다시 시도해주세요."
          actions={["home"]}
          className="min-h-screen"
        >
          <RetryErrorButton onRetry={reset} />
          {process.env.NODE_ENV !== "production" && error.message ? (
            <p className="w-full text-xs text-muted-foreground">{error.message}</p>
          ) : null}
        </ErrorScreen>
      </body>
    </html>
  )
}
