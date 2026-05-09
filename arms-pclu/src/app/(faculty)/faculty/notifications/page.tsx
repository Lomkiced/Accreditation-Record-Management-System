"use client"

import * as React from "react"
import { PageHeader } from "@/components/shared/PageHeader"
import { NotificationList } from "@/components/notifications/NotificationList"

export default function FacultyNotificationsPage() {
  const [notifications, setNotifications] = React.useState([
    { id: "1", title: "Document Approved", message: "Your submission 'Course Syllabus CS101' was approved by the admin.", time: "1 hour ago", isRead: false, type: "success" as const },
    { id: "2", title: "Document Returned", message: "Admin returned 'Faculty Profile' for revision. Please check the remarks.", time: "3 hours ago", isRead: false, type: "warning" as const },
    { id: "3", title: "New Logbook Entry", message: "You received a new document in your logbook.", time: "Yesterday", isRead: true, type: "info" as const },
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
        subtitle="Stay updated with your submissions and assignments"
      />
      
      <NotificationList 
        notifications={notifications} 
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
      />
    </div>
  )
}
