"use client"

import * as React from "react"
import { Search, UserPlus } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UsersTable, type User } from "@/components/users/UsersTable"
import { UserFormPanel } from "@/components/users/UserFormPanel"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"

const mockUsers: User[] = [
  { id: "1", name: "Dr. Juan Perez", email: "jperez@pclu.edu.ph", department: "Computer Science", designation: "Dean", assignedAreas: 2, status: "ACTIVE", lastLogin: "2 hours ago" },
  { id: "2", name: "Maria Clara", email: "mclara@pclu.edu.ph", department: "Information Tech", designation: "Professor", assignedAreas: 1, status: "ACTIVE", lastLogin: "1 day ago" },
  { id: "3", name: "Pedro Penduko", email: "ppenduko@pclu.edu.ph", department: "Computer Science", designation: "Instructor", assignedAreas: 0, status: "INACTIVE", lastLogin: "1 month ago" },
]

export default function UsersPage() {
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<User | undefined>()
  const [togglingUser, setTogglingUser] = React.useState<User | null>(null)

  const handleAdd = () => {
    setEditingUser(undefined)
    setIsModalOpen(true)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setIsModalOpen(true)
  }

  const handleToggleConfirm = () => {
    console.log("Toggling status for", togglingUser?.id)
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
            Showing {mockUsers.length} results
          </div>
        </div>

        <UsersTable 
          data={mockUsers} 
          onEdit={handleEdit}
          onToggleStatus={setTogglingUser}
        />
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
        title={togglingUser?.status === "ACTIVE" ? `Deactivate ${togglingUser.name}?` : `Activate ${togglingUser?.name}?`}
        description={togglingUser?.status === "ACTIVE" 
          ? "They will lose access immediately but their data will be preserved." 
          : "They will be able to log in and access their assignments again."}
        type={togglingUser?.status === "ACTIVE" ? "warning" : "info"}
      />
    </>
  )
}
