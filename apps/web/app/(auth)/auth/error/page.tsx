import { getAuthErrorViewModel } from "@/lib/auth/auth-error"
import ErrorScreen from "@/src/05_shared/error/ui/ErrorScreen"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>
}) {
  const { error, callbackUrl } = await searchParams
  const errorViewModel = getAuthErrorViewModel(error)
  const loginHref = callbackUrl
    ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/login"

  return (
    <ErrorScreen
      statusCode={errorViewModel.statusCode}
      title={errorViewModel.title}
      description={errorViewModel.description}
      actions={errorViewModel.actions}
      className="min-h-full"
      loginHref={loginHref}
    />
  )
}
