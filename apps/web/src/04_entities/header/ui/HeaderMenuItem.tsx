"use client"
import HeaderMenuButton from "@/src/05_shared/button/ui/HeaderMenuButton"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

interface HeaderMenuItemProps {
  label: string
  linkTo: string
}
const HeaderMenuItem = ({ label, linkTo }: HeaderMenuItemProps) => {
  const pathname = usePathname()
  const router = useRouter()
  return (
    <li className="h-14 list-none">
      <HeaderMenuButton
        label={label}
        isSelected={pathname.startsWith(linkTo)}
        asChild
      >
        <Link
          href={linkTo}
          onMouseEnter={() => router.prefetch(linkTo)}
          className="flex h-full items-center"
        >
          <span>{label}</span>
        </Link>
      </HeaderMenuButton>
    </li>
  )
}
export default HeaderMenuItem
