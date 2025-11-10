import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Modal from './Modal'

export default function NotificationMenu() {
  const { user } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchNotifications = async () => {
    if (!user) return

    setLoading(true)
    setError(null)
    try {
      const token = user?.accessToken
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const resp = await fetch('https://localhost:7238/LostAndFound/GetMyNotifications', {
        method: 'GET',
        headers
      })

      if (!resp.ok) {
        throw new Error(`Server returned ${resp.status}`)
      }

      const list = await resp.json()
      const normalized = (Array.isArray(list) ? list : []).map(notification => ({
        id: notification.id || notification.Id,
        foundItemId: notification.foundItemId || notification.FoundItemId,
        notificationReceiver: notification.notificationReceiver || notification.NotificationReceiver,
        isRead: notification.isRead || notification.IsRead || false,
        details: notification.details || notification.Details || '',
        createdAt: notification.createdAt || notification.CreatedAt
      }))

      setNotifications(normalized)
    } catch (err) {
      setError(err?.message || 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationClick = () => {
    setShowModal(true)
    fetchNotifications()
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const toggleReadStatus = async (notificationId) => {
    try {
      const token = user?.accessToken
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const resp = await fetch('https://localhost:7238/LostAndFound/IsRead', {
        method: 'POST',
        headers,
        body: JSON.stringify(notificationId)
      })

      if (!resp.ok) {
        throw new Error(`Server returned ${resp.status}`)
      }

      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: !notification.isRead }
            : notification
        )
      )
    } catch (err) {
      alert(err?.message || 'Failed to update notification status')
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  if (!user) return null

  return (
    <>
      <button 
        className="btn ghost" 
        onClick={handleNotificationClick}
        style={{ 
          position: 'relative', 
          height: 40, 
          width: 40, 
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: '#e02424',
              color: 'white',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              minWidth: 16,
              boxShadow: '0 0 0 2px var(--panel)'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Notifications"
        footer={
          <button 
            className="btn" 
            onClick={() => setShowModal(false)}
          >
            Close
          </button>
        }
      >
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {loading && (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>
              Loading notifications...
            </div>
          )}

          {error && (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          {!loading && !error && notifications.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>
              No notifications yet.
            </div>
          )}

          {!loading && !error && notifications.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className="panel"
                  style={{
                    padding: '12px 16px',
                    backgroundColor: notification.isRead ? 'var(--panel)' : 'color-mix(in hsl, var(--accent), var(--panel) 90%)',
                    border: notification.isRead ? '1px solid var(--border)' : '1px solid var(--accent)',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    {!notification.isRead && (
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--accent)',
                          marginTop: '6px',
                          flexShrink: 0
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '14px', lineHeight: '1.4' }}>
                        {notification.details}
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleReadStatus(notification.id)}
                      className="btn ghost"
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        height: 'auto',
                        minWidth: 'auto',
                        backgroundColor: notification.isRead ? 'var(--accent)' : 'var(--muted)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px'
                      }}
                      title={notification.isRead ? 'Mark as unread' : 'Mark as read'}
                    >
                      {notification.isRead ? '📖' : '📩'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}