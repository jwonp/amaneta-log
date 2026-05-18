import AuthLayoutView from "@/src/01_views/auth/ui/AuthLayoutView"

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return <AuthLayoutView>{children}</AuthLayoutView>
}
export default AuthLayout
