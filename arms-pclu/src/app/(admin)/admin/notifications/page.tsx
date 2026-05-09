"use client"

import * as React from "react"
import { PageHeader } from "@/components/shared/PageHeader"
import { NotificationList } from "@/components/notifications/NotificationList"

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = React.useState([
    { id: "1", title: "New Submission", message: "Dr. Juan Perez submitted 'Faculty Development Plan'.", time: "10 mins ago", isRead: false, type: "info" as const },
    { id: "2", title: "Logbook Entry", message: "Maria Clara acknowledged receipt of Memo #123.", time: "1 hour ago", isRead: false, type: "success" as const },
    { id: "3", title: "Approaching Deadline", message: "Area 4 submissions are due in 2 days.", time: "Yesterday", isRead: true, type: "warning" as const },
  ])

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
  }

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Notifications"
        subtitle="Stay updated with system activities and alerts"
      />
      
      <NotificationList 
        notifications={notifications} 
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
      />
    </div>
  )
}
