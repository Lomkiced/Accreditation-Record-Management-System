"use client"

import * as React from "react"
import { Search, UserPlus } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UsersTable } from "@/components/users/UsersTable"
import { UserFormPanel } from "@/components/users/UserFormPanel"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { useUsers, useToggleUserStatus } from "@/hooks/useUsers"
import type { UserWithCounts } from "@/actions/user.actions"
import { toast } from "sonner"

export default function UsersPage() {
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<UserWithCounts | undefined>()
  const [togglingUser, setTogglingUser] = React.useState<UserWithCounts | null>(null)
  
  const { data: users = [], isLoading } = useUsers()
  const { mutateAsync: toggleStatus, isPending: isToggling } = useToggleUserStatus()

  const handleAdd = () => {
    setEditingUser(undefined)
    setIsModalOpen(true)
  }

  const handleEdit = (user: UserWithCounts) => {
    setEditingUser(user)
    setIsModalOpen(true)
  }

  const handleToggleConfirm = async () => {
    if (!togglingUser) return
    
    const activate = togglingUser.status === "INACTIVE"
    const result = await toggleStatus({ userId: togglingUser.id, activate })
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`User successfully ${activate ? "activated" : "deactivated"}.`)
    }
    
    setTogglingUser(null)
  }

  return (
    <>
      <PageHeader
        title="Faculty Accounts"
        subtitle="Manage faculty member accounts and access"
        actions={
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleAdd}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Faculty
          </Button>
        }
      />

      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input placeholder="Search by name or email..." className="pl-9 h-9" />
          </div>
          <Button variant="outline" size="sm" className="h-9 text-slate-600 bg-slate-50">Department</Button>
          
          <div className="flex bg-slate-100 p-1 rounded-md ml-2">
            <Button variant="ghost" size="sm" className="h-7 text-xs bg-white shadow-sm">All</Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-600">Active</Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-600">Inactive</Button>
          </div>

          <div className="ml-auto text-sm text-slate-500">
            Showing {users.length} results
          </div>
        </div>

        {isLoading ? (
          <div className="py-10 text-center text-slate-500 text-sm animate-pulse bg-white rounded-xl border border-slate-200">
            Loading faculty accounts...
          </div>
        ) : (
          <UsersTable 
            data={users} 
            onEdit={handleEdit}
            onToggleStatus={setTogglingUser}
          />
        )}
      </div>

      <UserFormPanel 
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={editingUser}
      />

      <ConfirmDialog 
        open={!!togglingUser}
        onClose={() => setTogglingUser(null)}
        onConfirm={handleToggleConfirm}
        isPending={isToggling}
        title={togglingUser?.status === "ACTIVE" ? `Deactivate ${togglingUser.name}?` : `Activate ${togglingUser?.name}?`}
        description={togglingUser?.status === "ACTIVE" 
          ? "They will lose access immediately but their data will be preserved." 
          : "They will be able to log in and access their assignments again."}
        type={togglingUser?.status === "ACTIVE" ? "warning" : "info"}
      />
    </>
  )
}
