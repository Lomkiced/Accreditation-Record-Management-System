import { AuthGuard } from "@/components/auth/AuthGuard"
import { AuthInitializer } from "@/components/auth/AuthInitializer"
import { DeanLayoutInner } from "@/components/layout/DeanLayoutInner"

export default function DeanLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthInitializer>
      <AuthGuard requiredRole="DEAN">
        <DeanLayoutInner>{children}</DeanLayoutInner>
      </AuthGuard>
    </AuthInitializer>
  )
}
