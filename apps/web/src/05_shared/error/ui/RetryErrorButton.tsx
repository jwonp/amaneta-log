"use client"

import { Button } from "@packages/ui/src/components/button"

const RetryErrorButton = ({ onRetry }: { onRetry: () => void }) => {
  return (
    <Button type="button" onClick={onRetry}>
      다시 시도
    </Button>
  )
}

export default RetryErrorButton
