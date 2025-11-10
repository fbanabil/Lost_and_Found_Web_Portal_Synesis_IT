import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import MiniMap from './MiniMap'
import { useAuth } from '../context/AuthContext'


export default function ItemCard({ item, type }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isInitiating, setIsInitiating] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [showAlert, setShowAlert] = useState(false)

  const me = String(user?.email || '').toLowerCase()
  const owner = String(item?.ownerId || '').toLowerCase()
  const isMine = me && owner && me === owner

  const showCustomAlert = (message) => {
    setAlertMessage(message)
    setShowAlert(true)
    setTimeout(() => setShowAlert(false), 3000) 
  }

  const closeAlert = () => {
    setShowAlert(false)
  }

  const handleInitiateChat = async () => {
    if (!user?.accessToken || !item?.ownerId || !item?.ownerName) {
      return
    }

    setIsInitiating(true)

    try {
      const payload = {
        receiverId: item.ownerId,
        senderName: user.name || user.email || '',
        receiverName: item.ownerName || '',
        createdAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString()
      }

      const response = await fetch('https://localhost:7238/ChatBox/InitiatChatThread', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.accessToken}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        navigate('/inbox')
      } else if (response.status === 400) {
        const errorText = await response.text()
        showCustomAlert(errorText || "You can't chat with yourself")
      } else {
        throw new Error(`Failed to initiate chat: ${response.status}`)
      }
    } catch (error) {
      console.error('Error initiating chat:', error)
      showCustomAlert('Failed to initiate chat. Please try again.')
    } finally {
      setIsInitiating(false)
    }
  }

  return (
    <>
      <motion.div
        className="panel"
        style={{ padding: 16 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
      <div className="row" style={{ justifyContent: 'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <strong>{item.type}</strong>
          <span className="badge">{item.status}</span>
        </div>
        {!isMine && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>
              Contact: {item.ownerName || 'Owner'}
            </div>
            <button 
              className="btn" 
              style={{ fontSize: 12, padding: '4px 8px' }}
              onClick={handleInitiateChat}
              disabled={isInitiating}
            >
              {isInitiating ? 'Starting...' : 'Initiate chat'}
            </button>
          </div>
        )}
      </div>

      {item.photo && (
        <div className="mt-3">
          <img
            src={item.photo}
            alt={`${item.type} photo`}
            className="item-photo"
          />
        </div>
      )}

      <div className="mt-2" style={{ color: 'var(--muted)' }}>
        {item.brand && <span><b>Brand:</b> {item.brand} &nbsp; </span>}
        {item.color && <span><b>Color:</b> {item.color} &nbsp; </span>}
        {item.place && <span><b>Place:</b> {item.place} &nbsp; </span>}
        {item.date && <span><b>Date:</b> {new Date(item.date).toLocaleDateString('en-GB')} </span>}
      </div>

        {item.location && (
          <div className="mt-3">
            <MiniMap location={item.location} />
          </div>
        )}
      </motion.div>

      {/* Custom Alert Modal */}
      <AnimatePresence>
        {showAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}
            onClick={closeAlert}
          >
            <motion.div
              initial={{ scale: 0.8, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: -20 }}
              style={{
                background: 'var(--panel)',
                borderRadius: 16,
                padding: 24,
                maxWidth: 400,
                width: '90%',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                border: '1px solid color-mix(in hsl, var(--panel), #000 10%)'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12, 
                marginBottom: 16 
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'color-mix(in hsl, #ff6b6b, #fff 85%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20
                }}>
                  ⚠️
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                    Chat Initiation Failed
                  </h3>
                </div>
              </div>
              
              <p style={{ 
                margin: 0, 
                marginBottom: 20, 
                color: 'var(--muted)', 
                lineHeight: 1.5 
              }}>
                {alertMessage}
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  className="btn ghost"
                  onClick={closeAlert}
                  style={{ padding: '8px 16px' }}
                >
                  Cancel
                </button>
                <button
                  className="btn"
                  onClick={closeAlert}
                  style={{ padding: '8px 16px' }}
                >
                  OK
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
