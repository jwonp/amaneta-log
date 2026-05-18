const AuthLayoutView = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-[calc(100svh-60px)] min-h-[calc(100svh-60px)]">
      {children}
    </div>
  )
}

export default AuthLayoutView
