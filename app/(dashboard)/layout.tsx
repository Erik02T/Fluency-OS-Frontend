import { Toaster } from "@/components/ui/toaster"
import { AdminAuthProvider } from "@/contexts/admin-auth-context"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminAuthProvider>
      {children}
      <Toaster />
    </AdminAuthProvider>
  )
}
