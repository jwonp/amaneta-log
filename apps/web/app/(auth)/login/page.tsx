import LoginView from "@/src/01_views/auth/ui/LoginView"

const LoginPage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    callbackUrl?: string
  }>
}) => {
  const { callbackUrl } = await searchParams

  return <LoginView callbackUrl={callbackUrl} />
}
export default LoginPage
