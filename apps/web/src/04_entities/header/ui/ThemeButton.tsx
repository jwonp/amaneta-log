"use client"

import { Button } from "@packages/ui/src/components/button"
import { IconMoon, IconSun } from "@tabler/icons-react"
import { useTheme } from "next-themes"

const ThemeButton = () => {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Button
      variant={"ghost"}
      onPointerDown={() =>
        setTheme(resolvedTheme === "dark" ? "light" : "dark")
      }
    >
      {resolvedTheme === "dark" ? <IconMoon /> : <IconSun />}
    </Button>
  )
}
export default ThemeButton
