"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@packages/ui/src/components/button"
import { ErrorAction } from "../model/error-action"

type ErrorActionButtonsProps = {
  actions: ErrorAction[]
  homeHref?: string
  loginHref?: string
}

const ErrorActionButtons = ({
  actions,
  homeHref = "/",
  loginHref = "/login",
}: ErrorActionButtonsProps) => {
  const router = useRouter()

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
      return
    }

    router.push(homeHref)
  }

  return (
    <>
      {actions.map((action) => {
        if (action === "back") {
          return (
            <Button key={action} type="button" variant="outline" onClick={handleBack}>
              이전 페이지
            </Button>
          )
        }

        if (action === "login") {
          return (
            <Button key={action} asChild>
              <Link href={loginHref}>로그인</Link>
            </Button>
          )
        }

        return (
          <Button key={action} variant="outline" asChild>
            <Link href={homeHref}>홈으로</Link>
          </Button>
        )
      })}
    </>
  )
}

export default ErrorActionButtons
