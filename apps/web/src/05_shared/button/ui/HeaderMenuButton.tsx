import { Button } from "@packages/ui/src/components/button"
import { Label } from "@packages/ui/src/components/label"
import { cn } from "@packages/ui/src/lib/utils"

interface HeaderMenuButtonProps
  extends Omit<React.ComponentProps<"button">, "children"> {
  label: string
  isSelected?: boolean
  asChild?: boolean
  children?: React.ReactNode
}

const HeaderMenuButton = ({
  label,
  isSelected,
  asChild,
  children,
  ...buttonProps
}: HeaderMenuButtonProps) => {
  const WRAPPER_SELECTED_STYLE = "border-b-2 border-b-primary"
  const WRAPPER_NOT_SELECTED_STYLE = "border-0"

  const LABEL_SELECTED_STYLE = "text-foreground"
  const LABEL_NOT_SELECTED_STYLE = "text-foreground/80"

  return (
    <div className="my-auto h-full">
      <div
        className={cn(
          "h-full",
          isSelected ? WRAPPER_SELECTED_STYLE : WRAPPER_NOT_SELECTED_STYLE
        )}
      >
        <Button
          {...buttonProps}
          asChild={asChild}
          variant={"link"}
          className="h-full text-sm hover:text-foreground hover:no-underline"
        >
          {children ?? (
            <Label
              className={cn(
                "",
                isSelected ? LABEL_SELECTED_STYLE : LABEL_NOT_SELECTED_STYLE
              )}
            >
              {label}
            </Label>
          )}
        </Button>
      </div>
    </div>
  )
}
export default HeaderMenuButton
