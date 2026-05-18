import SignupForm from "@/src/03_features/auth/ui/SignupForm"

const SignupView = () => {
  return (
    <div className="item-center flex h-full w-full">
      <div
        className="flex min-h-full w-full items-center justify-center"
        aria-label={"login-form-wrapper"}
      >
        <div className="w-full max-w-96">
          <SignupForm />
        </div>
      </div>
    </div>
  )
}
export default SignupView
