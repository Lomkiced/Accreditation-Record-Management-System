"use client"

import * as React from "react"
import { Search, UserPlus } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UsersTable } from "@/components/users/UsersTable"
import { UserFormPanel } from "@/components/users/UserFormPanel"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { useUsers, useDeleteUser } from "@/hooks/useUsers"
import { type UserWithCounts } from "@/actions/user.actions"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function AdminUsersClient({ initialData }: { initialData: UserWithCounts[] }) {
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<UserWithCounts | undefined>()
  const [deletingUser, setDeletingUser] = React.useState<UserWithCounts | null>(null)
  
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedDept, setSelectedDept] = React.useState<string>("All")
  const [roleFilter, setRoleFilter] = React.useState<"ALL" | "ADMIN" | "DEAN">("ALL")
  
  const { data: users = [], isLoading } = useUsers(["ADMIN", "DEAN"], initialData)
  const { mutateAsync: deleteUser, isPending: isDeleting } = useDeleteUser()

  const departments = React.useMemo(() => {
    const depts = new Set<string>()
    users.forEach(u => { if (u.department) depts.add(u.department) })
    return Array.from(depts).sort()
  }, [users])

  const filteredUsers = React.useMemo(() => {
    return users.filter(user => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!user.name.toLowerCase().includes(q) && !user.email.toLowerCase().includes(q)) return false
      }
      if (selectedDept !== "All" && user.department !== selectedDept) return false
      if (roleFilter !== "ALL" && user.role !== roleFilter) return false
      return true
    })
  }, [users, searchQuery, selectedDept, roleFilter])

  const handleAdd = () => {
    setEditingUser(undefined)
    setIsModalOpen(true)
  }

  const handleEdit = (user: UserWithCounts) => {
    setEditingUser(user)
    setIsModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return
    
    const result = await deleteUser(deletingUser.id)
    
    if (result && !result.success) {
      toast.error(result.error || "Failed to delete user.")
    } else {
      toast.success(`User ${deletingUser.name} has been permanently deleted.`)
    }
    
    setDeletingUser(null)
  }

  return (
    <>
      <PageHeader
        title="User Management"
        subtitle="Manage system administrators and deans"
        actions={
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleAdd}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Account
          </Button>
        }
      />

      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by name or email..." 
              className="pl-9 h-9" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 text-slate-600 bg-slate-50">
                {selectedDept === "All" ? "Department" : selectedDept}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-white z-50">
              <DropdownMenuItem onClick={() => setSelectedDept("All")}>All Departments</DropdownMenuItem>
              {departments.map(dept => (
                <DropdownMenuItem key={dept} onClick={() => setSelectedDept(dept)}>{dept}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="flex bg-slate-100 p-1 rounded-md ml-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-7 text-xs ${roleFilter === "ALL" ? "bg-white shadow-sm" : "text-slate-600"}`}
              onClick={() => setRoleFilter("ALL")}
            >All</Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-7 text-xs ${roleFilter === "ADMIN" ? "bg-white shadow-sm" : "text-slate-600"}`}
              onClick={() => setRoleFilter("ADMIN")}
            >Admin</Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-7 text-xs ${roleFilter === "DEAN" ? "bg-white shadow-sm" : "text-slate-600"}`}
              onClick={() => setRoleFilter("DEAN")}
            >Dean</Button>
          </div>

          <div className="ml-auto text-sm text-slate-500">
            Showing {filteredUsers.length} results
          </div>
        </div>

        {isLoading && users.length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-sm animate-pulse bg-white rounded-xl border border-slate-200">
            Loading user accounts...
          </div>
        ) : (
          <UsersTable 
            data={filteredUsers} 
            onEdit={handleEdit}
            onDelete={setDeletingUser}
          />
        )}
      </div>

      <UserFormPanel 
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={editingUser}
      />

      <ConfirmDialog 
        open={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDeleteConfirm}
        isPending={isDeleting}
        title={`Permanently delete ${deletingUser?.name}?`}
        description={`This action cannot be undone. This will permanently delete the ${deletingUser?.role} account from the database and authentication system. ALL uploaded documents provided by this user will also be permanently removed from the system.`}
        type="warning"
      />
    </>
  )
}
