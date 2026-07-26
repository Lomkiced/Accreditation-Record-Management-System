import { AuthGuard } from "@/components/auth/AuthGuard"
import { AuthInitializer } from "@/components/auth/AuthInitializer"
import { NewAdminLayoutInner } from "@/components/layout/NewAdminLayoutInner"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthInitializer>
      <AuthGuard requiredRole="ADMIN">
        <NewAdminLayoutInner>{children}</NewAdminLayoutInner>
      </AuthGuard>
    </AuthInitializer>
  )
}
