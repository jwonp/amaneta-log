"use client"
import { useTheme } from "next-themes"
import Image from "next/image"
import LogoSvg from "@/public/logo.svg"
import LogoWhiteSvg from "@/public/logo-white.svg"
import { useEffect, useState } from "react"

const Logo = () => {
  return (
    <div className="flex h-full w-fit px-4">
      <Image
        className="my-auto h-auto w-auto dark:hidden"
        src={LogoSvg}
        alt=""
      />
      <Image
        className="my-auto hidden h-auto w-auto dark:block"
        src={LogoWhiteSvg}
        alt=""
      />
    </div>
  )
}
export default Logo
