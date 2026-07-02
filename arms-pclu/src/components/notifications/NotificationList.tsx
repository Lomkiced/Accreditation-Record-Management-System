"use client"

import * as React from "react"
import { Bell, CheckCircle, FileText, AlertCircle, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import type { NotificationItem } from "@/actions/notification.actions"

interface NotificationListProps {
  notifications: NotificationItem[]
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
}

export function NotificationList({ notifications, onMarkAsRead, onMarkAllAsRead }: NotificationListProps) {
  const getIconAndTitle = (type: string) => {
    switch (type) {
      case "ASSIGNMENT": return { icon: <FileText className="w-5 h-5 text-blue-500" />, title: "New Assignment" }
      case "REVIEW": return { icon: <CheckCircle className="w-5 h-5 text-emerald-500" />, title: "Document Reviewed" }
      case "LOGBOOK": return { icon: <FileText className="w-5 h-5 text-amber-500" />, title: "Logbook Update" }
      default: return { icon: <Bell className="w-5 h-5 text-slate-500" />, title: "Notification" }
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-red-100 text-red-700 text-xs py-0.5 px-2 rounded-full font-bold">
              {unreadCount} Unread
            </span>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 text-xs text-blue-600 hover:bg-blue-50"
          onClick={onMarkAllAsRead}
          disabled={unreadCount === 0}
        >
          Mark all as read
        </Button>
      </div>

      <div className="divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-500 flex flex-col items-center">
            <Bell className="w-8 h-8 text-slate-300 mb-3" />
            <p className="text-sm font-medium">You’re all caught up!</p>
            <p className="text-xs mt-1">No new notifications at this time.</p>
          </div>
        ) : (
          notifications.map((notif) => {
            const { icon, title } = getIconAndTitle(notif.type)
            return (
            <div 
              key={notif.id} 
              className={cn(
                "p-4 flex gap-4 transition-colors cursor-pointer hover:bg-slate-50",
                !notif.isRead ? "bg-blue-50/30" : "opacity-75"
              )}
              onClick={() => onMarkAsRead(notif.id)}
            >
              <div className="shrink-0 mt-0.5">
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <h4 className={cn("text-sm font-semibold truncate", !notif.isRead ? "text-slate-900" : "text-slate-700")}>
                    {title}
                  </h4>
                  <span className="text-xs text-slate-400 whitespace-nowrap flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-snug">
                  {notif.message}
                </p>
              </div>
              {!notif.isRead && (
                <div className="shrink-0 flex items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                </div>
              )}
            </div>
          )})
        )}
      </div>
    </div>
  )
}
