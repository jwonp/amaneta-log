import { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@packages/ui/src/components/card"
import { cn } from "@workspace/ui/lib/utils"
import { ErrorAction } from "../model/error-action"
import ErrorActionButtons from "./ErrorActionButtons"

type ErrorScreenProps = {
  statusCode: number | string
  title: string
  description: string
  actions?: ErrorAction[]
  children?: ReactNode
  className?: string
  homeHref?: string
  loginHref?: string
}

const ErrorScreen = ({
  statusCode,
  title,
  description,
  actions = ["home"],
  children,
  className,
  homeHref,
  loginHref,
}: ErrorScreenProps) => {
  return (
    <div
      className={cn(
        "flex min-h-[calc(100svh-56px)] items-center justify-center px-4 py-10",
        className
      )}
    >
      <Card className="w-full max-w-xl">
        <CardHeader className="space-y-4">
          <div className="text-sm font-medium text-muted-foreground">{statusCode}</div>
          <CardTitle className="text-2xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
          <div className="flex flex-wrap gap-3">
            <ErrorActionButtons
              actions={actions}
              homeHref={homeHref}
              loginHref={loginHref}
            />
            {children}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ErrorScreen
