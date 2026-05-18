import { USER_PROVIDER, USER_ROLE, USER_STATUS } from "./user.const"

export type UserProvider = (typeof USER_PROVIDER)[keyof typeof USER_PROVIDER]
export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS]
export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE]
export interface User {
  name: string
  id: number
  status: UserStatus
  createdAt: Date
  updatedAt: Date
  username: string
  provider: UserProvider
  email: string
  profileImage: string | null
  role: UserRole
}
