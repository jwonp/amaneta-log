"use client"

import { Button } from "@packages/ui/src/components/button"
import { signOut } from "next-auth/react"

const LogoutButton = () => {
  const handleClickLogout = async () => {
    await signOut({
      callbackUrl: "/login",
    })
  }

  return (
    <Button type="button" onClick={handleClickLogout}>
      로그아웃
    </Button>
  )
}

export default LogoutButton
