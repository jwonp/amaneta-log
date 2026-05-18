import { Separator } from "@packages/ui/src/components/separator"

interface LayoutSeparatorProps {
  className?: string
  orientation?: "horizontal" | "vertical"
  decorative?: boolean
}
const LayoutSeparator = ({
  className = "",
  orientation = "horizontal",
  decorative = true,
}: LayoutSeparatorProps) => {
  const props = { className, orientation, decorative }
  return <Separator {...props} />
}
export default LayoutSeparator
