import { AuthGuard } from "@/components/auth/AuthGuard"
import { AuthInitializer } from "@/components/auth/AuthInitializer"
import { AdminLayoutInner } from "@/components/layout/AdminLayoutInner"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthInitializer>
      <AuthGuard requiredRole="ADMIN">
        <AdminLayoutInner>{children}</AdminLayoutInner>
      </AuthGuard>
    </AuthInitializer>
  )
}
