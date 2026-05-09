import { AuthGuard } from "@/components/auth/AuthGuard"
import { AuthInitializer } from "@/components/auth/AuthInitializer"
import { FacultyLayoutInner } from "@/components/layout/FacultyLayoutInner"

export default function FacultyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthInitializer>
      <AuthGuard requiredRole="FACULTY">
        <FacultyLayoutInner>{children}</FacultyLayoutInner>
      </AuthGuard>
    </AuthInitializer>
  )
}
