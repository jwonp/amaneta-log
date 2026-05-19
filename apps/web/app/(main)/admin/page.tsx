import AdminView from "@/src/01_views/admin/ui/AdminView"
import { requireAdminSession } from "@/lib/auth/guards"

const AdminPage = async () => {
  await requireAdminSession()
  return <AdminView />
}
export default AdminPage
