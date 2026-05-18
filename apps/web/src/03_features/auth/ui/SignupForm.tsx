"use client"

import PasswordInput from "@/src/05_shared/input/ui/PasswordInput"
import { Button } from "@packages/ui/src/components/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@packages/ui/src/components/card"
import { Input } from "@packages/ui/src/components/input"
import { Label } from "@packages/ui/src/components/label"
import { MouseEventHandler } from "react"
import { SIGNUP_FORM_NAME } from "../model/SignupForm.const"
import axios from "axios"
import { useRouter } from "next/navigation"

const SignupForm = () => {
  const router = useRouter()

  const handleClickSubmit: MouseEventHandler<HTMLButtonElement> = (e) => {
    console.log("hi")
    e.preventDefault()
    const form = e.currentTarget.form
    if (!form) return
    const formData = new FormData(form)

    const username = formData.get(SIGNUP_FORM_NAME.USERNAME)
    const password = formData.get(SIGNUP_FORM_NAME.PASSWORD)

    const signupDto = {
      username,
      password,
    }

    axios
      .post("/api/auth/signup", signupDto)
      .then((res) => {
        if (res.status !== 201) return
        router.push("/login")
      })
      .catch(() => {})
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-center">Amaneta-Log</CardTitle>
      </CardHeader>
      <CardContent>
        <form>
          <div className="mb-6 flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">{"Email"}</Label>
              <Input
                id="email"
                name={SIGNUP_FORM_NAME.USERNAME}
                type="email"
                placeholder="user@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">{"Password"}</Label>
              <PasswordInput
                id={"password"}
                name={SIGNUP_FORM_NAME.PASSWORD}
                required
              />
            </div>
          </div>
          <div>
            <Button
              type="submit"
              className="w-full"
              onClick={handleClickSubmit}
            >
              Signup
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
export default SignupForm
