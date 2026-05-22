"use client"
import HeaderMenuButton from "@/src/05_shared/button/ui/HeaderMenuButton"
import { cn } from "@packages/ui/src/lib/utils"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

interface HeaderMenuItemProps {
  label: string
  linkTo: string
}
const HeaderMenuItem = ({ label, linkTo }: HeaderMenuItemProps) => {
  const pathname = usePathname()
  const router = useRouter()

  const isSelected = pathname.startsWith(linkTo)
  const LABEL_SELECTED_STYLE = "text-primary"
  const LABEL_NOT_SELECTED_STYLE = "text-foreground/80"

  return (
    <li className="h-14 list-none">
      <HeaderMenuButton label={label} isSelected={isSelected} asChild>
        <Link
          href={linkTo}
          onMouseEnter={() => router.prefetch(linkTo)}
          className="flex h-full items-center"
        >
          <span
            className={cn(
              isSelected ? LABEL_SELECTED_STYLE : LABEL_NOT_SELECTED_STYLE
            )}
          >
            {label}
          </span>
        </Link>
      </HeaderMenuButton>
    </li>
  )
}
export default HeaderMenuItem
