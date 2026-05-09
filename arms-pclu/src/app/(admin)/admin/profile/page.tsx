import { PageHeader } from "@/components/shared/PageHeader"
import { ProfileForm } from "@/components/profile/ProfileForm"
import { getCurrentUser } from "@/lib/auth/getUser"
import { redirect } from "next/navigation"

export default async function AdminProfilePage() {
  const user = await getCurrentUser()

  if (!user) redirect("/login")

  return (
    <>
      <PageHeader
        title="My Profile"
        subtitle="Manage your account settings and preferences"
      />
      <ProfileForm
        user={{
          name: user.name,
          email: user.email,
          department: user.department,
          designation: user.designation,
          phone: user.phone,
          isActive: user.isActive,
        }}
      />
    </>
  )
}
