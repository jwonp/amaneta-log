import LoginForm from "@/src/03_features/auth/ui/LoginForm"

const LoginView = ({ callbackUrl }: { callbackUrl?: string }) => {
  return (
    <div className="item-center flex h-full w-full">
      <div
        className="flex min-h-full w-full items-center justify-center"
        aria-label={"login-form-wrapper"}
      >
        <div className="w-full max-w-96">
          <LoginForm callbackUrl={callbackUrl} />
        </div>
      </div>
    </div>
  )
}
export default LoginView
