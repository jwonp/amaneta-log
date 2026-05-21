import Image from "next/image"
import Link from "next/link"
import LogoSvg from "@/public/logo.svg"
import LogoWhiteSvg from "@/public/logo-white.svg"

const Logo = () => {
  return (
    <Link
      href="/posts"
      aria-label="Amaneta Log 블로그 홈"
      className="flex h-14 items-center px-4 transition-opacity hover:opacity-80"
    >
      <span className="sr-only">Amaneta Log</span>
      <Image
        className="block h-6 w-auto dark:hidden"
        src={LogoSvg}
        alt="Amaneta Log"
      />
      <Image
        className="hidden h-6 w-auto dark:block"
        src={LogoWhiteSvg}
        alt="Amaneta Log"
      />
    </Link>
  )
}
export default Logo
