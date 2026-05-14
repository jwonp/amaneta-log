"use client"
import HeaderMenuButton from "@/src/05_shared/button/ui/HeaderMenuButton"
import { NavigationMenuItem } from "@packages/ui/src/components/navigation-menu"
import { usePathname, useRouter } from "next/navigation"

interface HeaderMenuItemProps {
  label: string
  linkTo: string
}
const HeaderMenuItem = ({ label, linkTo }: HeaderMenuItemProps) => {
  const pathname = usePathname()
  const router = useRouter()
  console.log({ pathname })
  return (
    <NavigationMenuItem className="h-14">
      <HeaderMenuButton
        label={label}
        isSelected={pathname.startsWith(linkTo)}
        onPointerDown={() => router.push(linkTo)}
      />
    </NavigationMenuItem>
  )
}
export default HeaderMenuItem
