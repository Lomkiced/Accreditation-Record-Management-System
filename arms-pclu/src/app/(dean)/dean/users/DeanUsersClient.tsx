"use client"

import * as React from "react"
import { Search, UserPlus, Archive, RotateCcw, Trash2, Users } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UsersTable } from "@/components/users/UsersTable"
import { UserFormPanel } from "@/components/users/UserFormPanel"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { useUsers, useArchiveUser, useRestoreUser, useDeleteUser, useArchivedUsers } from "@/hooks/useUsers"
import { type UserWithCounts } from "@/actions/user.actions"
import { toast } from "sonner"

export function DeanUsersClient({ initialData }: { initialData: UserWithCounts[] }) {
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<UserWithCounts | undefined>()
  const [archivingUser, setArchivingUser] = React.useState<UserWithCounts | null>(null)
  const [restoringUser, setRestoringUser] = React.useState<UserWithCounts | null>(null)
  const [deletingUser, setDeletingUser] = React.useState<UserWithCounts | null>(null)
  const [activeView, setActiveView] = React.useState<"active" | "archived">("active")
  
  const [searchQuery, setSearchQuery] = React.useState("")
  
  const { data: users = [], isLoading } = useUsers(["FACULTY"], initialData)
  const { data: archivedUsers = [], isLoading: isLoadingArchived } = useArchivedUsers(["FACULTY"])
  const { mutateAsync: archiveUser, isPending: isArchiving } = useArchiveUser()
  const { mutateAsync: restoreUser, isPending: isRestoring } = useRestoreUser()
  const { mutateAsync: deleteUser, isPending: isDeleting } = useDeleteUser()

  const currentList = activeView === "active" ? users : archivedUsers

  const filteredUsers = React.useMemo(() => {
    return currentList.filter(user => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!user.name.toLowerCase().includes(q) && !user.email.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [currentList, searchQuery])

  const handleAdd = () => {
    setEditingUser(undefined)
    setIsModalOpen(true)
  }

  const handleEdit = (user: UserWithCounts) => {
    setEditingUser(user)
    setIsModalOpen(true)
  }

  // Archive handler (for active users)
  const handleArchiveConfirm = async () => {
    if (!archivingUser) return
    
    const result = await archiveUser(archivingUser.id)
    
    if (result && !result.success) {
      toast.error(result.error || "Failed to archive faculty.")
    } else {
      toast.success(`${archivingUser.name} has been archived. Their data is preserved and can be restored.`)
    }
    
    setArchivingUser(null)
  }

  // Restore handler (for archived users)
  const handleRestoreConfirm = async () => {
    if (!restoringUser) return
    
    const result = await restoreUser(restoringUser.id)
    
    if (result && !result.success) {
      toast.error(result.error || "Failed to restore faculty.")
    } else {
      toast.success(`${restoringUser.name} has been restored and can now log in again.`)
    }
    
    setRestoringUser(null)
  }

  // Permanent delete handler (for archived users only)
  const handleDeleteConfirm = async () => {
    if (!deletingUser) return
    
    const result = await deleteUser(deletingUser.id)
    
    if (result && !result.success) {
      toast.error(result.error || "Failed to permanently delete faculty.")
    } else {
      toast.success(`Faculty ${deletingUser.name} has been permanently deleted.`)
    }
    
    setDeletingUser(null)
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
        {/* View Toggle: Active / Archived */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 text-sm font-medium px-4 rounded-md flex items-center gap-2 ${
                activeView === "active" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
              }`}
              onClick={() => setActiveView("active")}
            >
              <Users className="w-4 h-4" />
              Active Faculty
              <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {users.length}
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 text-sm font-medium px-4 rounded-md flex items-center gap-2 ${
                activeView === "archived" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
              }`}
              onClick={() => setActiveView("archived")}
            >
              <Archive className="w-4 h-4" />
              Archived
              {archivedUsers.length > 0 && (
                <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {archivedUsers.length}
                </span>
              )}
            </Button>
          </div>
        </div>

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



          <div className="ml-auto text-sm text-slate-500">
            Showing {filteredUsers.length} results
          </div>
        </div>

        {(activeView === "active" ? isLoading && users.length === 0 : isLoadingArchived && archivedUsers.length === 0) ? (
          <div className="py-10 text-center text-slate-500 text-sm animate-pulse bg-white rounded-xl border border-slate-200">
            Loading {activeView === "active" ? "faculty accounts" : "archived faculty"}...
          </div>
        ) : activeView === "active" ? (
          <UsersTable 
            data={filteredUsers} 
            onEdit={handleEdit}
            onDelete={setArchivingUser}
            hideDepartment
            hideStatus
          />
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm py-16 text-center">
            <Archive className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">No archived faculty</p>
            <p className="text-sm text-slate-400 mt-1">When you archive a faculty member, they will appear here.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-amber-50/50">
              <p className="text-xs font-medium text-amber-700">
                Archived faculty cannot log in. You can restore them or permanently delete them below.
              </p>
            </div>
            <ul className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <li key={user.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-500 shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                  {user.designation && (
                    <span className="text-xs text-slate-400 shrink-0">
                      {user.designation}
                    </span>
                  )}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs font-medium text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 flex items-center gap-1.5"
                      onClick={() => setRestoringUser(user)}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restore
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs font-medium text-red-700 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 flex items-center gap-1.5"
                      onClick={() => setDeletingUser(user)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <UserFormPanel 
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={editingUser}
        allowedRoles={["FACULTY"]}
      />

      {/* Archive Confirmation (soft delete) */}
      <ConfirmDialog 
        open={!!archivingUser}
        onClose={() => setArchivingUser(null)}
        onConfirm={handleArchiveConfirm}
        isPending={isArchiving}
        title={`Archive ${archivingUser?.name}?`}
        description={`This will disable ${archivingUser?.name}'s account and prevent them from logging in. All their documents and submissions will be preserved. You can restore this account from the Archived tab at any time.`}
        type="warning"
      />

      {/* Restore Confirmation */}
      <ConfirmDialog 
        open={!!restoringUser}
        onClose={() => setRestoringUser(null)}
        onConfirm={handleRestoreConfirm}
        isPending={isRestoring}
        title={`Restore ${restoringUser?.name}?`}
        description={`This will reactivate ${restoringUser?.name}'s account and allow them to log in again. All their documents and submissions will remain intact.`}
        type="warning"
      />

      {/* Permanent Delete Confirmation (only from archive) */}
      <ConfirmDialog 
        open={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDeleteConfirm}
        isPending={isDeleting}
        title={`Permanently delete ${deletingUser?.name}?`}
        description="This action cannot be undone. This will permanently delete the faculty account from the database and authentication system. ALL uploaded documents provided by this faculty will also be permanently removed from the system."
        type="warning"
      />
    </>
  )
}

