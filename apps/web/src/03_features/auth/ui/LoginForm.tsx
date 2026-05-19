"use client"

import { Button } from "@packages/ui/src/components/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
} from "@packages/ui/src/components/card"
import { Input } from "@packages/ui/src/components/input"
import { Label } from "@packages/ui/src/components/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { useState } from "react"

const LoginForm = ({ callbackUrl }: { callbackUrl?: string }) => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleClickLogin = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault()

    const form = event.currentTarget.closest("form")
    if (!form) return

    const formData = new FormData(form)
    const email = String(formData.get("email") ?? "").trim()
    const password = String(formData.get("password") ?? "")

    if (!email || !password) {
      form.reportValidity()
      return
    }

    setIsSubmitting(true)

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: callbackUrl ?? "/",
    })

    setIsSubmitting(false)

    if (result?.error) {
      const query = new URLSearchParams({ error: result.error })

      if (callbackUrl) {
        query.set("callbackUrl", callbackUrl)
      }

      router.push(`/auth/error?${query.toString()}`)
      return
    }

    if (result?.url) {
      router.push(result.url)
      router.refresh()
      return
    }

    router.push(callbackUrl ?? "/")
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Amaneta-Log</CardTitle>
        <CardDescription>로그인하여 인증을 완료해주세요.</CardDescription>
        <CardAction>
          <Button variant="link">
            <Link href={"/signup"}>{"Sign Up"}</Link>
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        <form>
          <div className="mb-6 flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">{"Email"}</Label>
              <Input
                id="email"
                name="email"
                type="text"
                placeholder="user@example.com"
                required
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">{"Password"}</Label>
                <a
                  href="#"
                  className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                >
                  {"Forgot your password?"}
                </a>
              </div>

              <Input id="password" name="password" type="password" required />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full"
              onClick={handleClickLogin}
              disabled={isSubmitting}
            >
              {isSubmitting ? "로그인 중..." : "Login"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default LoginForm
