"use client"

import * as React from "react"
import { PageHeader } from "@/components/shared/PageHeader"
import { NotificationList } from "@/components/notifications/NotificationList"
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from "@/hooks/useNotifications"

export default function AdminNotificationsPage() {
  const { data: notifications = [] } = useNotifications()
  const { mutate: markAsRead } = useMarkAsRead()
  const { mutate: markAllAsRead } = useMarkAllAsRead()

  const handleMarkAsRead = (id: string) => {
    markAsRead(id)
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead()
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
