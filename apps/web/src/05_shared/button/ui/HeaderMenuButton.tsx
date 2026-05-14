import { Button } from "@packages/ui/src/components/button"
import { Label } from "@packages/ui/src/components/label"
import { cn } from "@packages/ui/src/lib/utils"

interface HeaderMenuButtonProps extends React.ComponentProps<"button"> {
  label: string
  isSelected?: boolean
}

const HeaderMenuButton = ({
  label,
  isSelected,
  ...buttonProps
}: HeaderMenuButtonProps) => {
  const WRAPPER_SELECTED_STYLE = "border-b-2 border-b-primary"
  const WRAPPER_NOT_SELECTED_STYLE = "border-0"

  const LABEL_SELECTED_STYLE = "text-primary"
  const LABEL_NOT_SELECTED_STYLE = "text-foreground"

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
          variant={"link"}
          className="h-full text-sm hover:no-underline"
        >
          <Label
            className={cn(
              "",
              isSelected ? LABEL_SELECTED_STYLE : LABEL_NOT_SELECTED_STYLE
            )}
          >
            {label}
          </Label>
        </Button>
      </div>
    </div>
  )
}
export default HeaderMenuButton
