import { DashboardShell } from "@/components/layout"
import { AdminAuthProvider } from "@/contexts/admin-auth-context"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>
}
