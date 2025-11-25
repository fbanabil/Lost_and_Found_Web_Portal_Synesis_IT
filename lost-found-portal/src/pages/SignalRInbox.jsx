// src/pages/SignalRInbox.jsx
import {
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSignalRChat } from '../context/SignalRChatContext'

export default function SignalRInbox() {
  const { user } = useAuth()
  const {
    getThreadsFor,
    getThreadById,
    sendMessage,
    markRead,
    fetchSortedThreads,
    loadThreadMessages,
    connectionStatus,
    messages,
    sendTyping,
    sendStoppedTyping,
    joinThread,
    leaveThread,
    backendUserId
  } = useSignalRChat()

  const [refreshKey, setRefreshKey] = useState(0)
  const forceRefresh = () => setRefreshKey(prev => prev + 1)

  const [params] = useSearchParams()
  const nav = useNavigate()

  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef(null)

  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [fileBase64, setFileBase64] = useState(null)
  const endRef = useRef(null)

  const paramId = params.get('t')
  const [fallbackId, setFallbackId] = useState(null)

  const meEmail = String(user?.email || '').toLowerCase()

  useEffect(() => {
    const loadThreads = async () => {
      if (user?.accessToken) {
        setIsLoading(true)
        try {
          const threads = await fetchSortedThreads()

          if (
            connectionStatus === 'Connected' &&
            Array.isArray(threads) &&
            threads.length > 0
          ) {
            await Promise.allSettled(
              threads.map(t => {
                const id = t.ThreadId || t.threadId || t.id
                return id ? loadThreadMessages(id) : Promise.resolve()
              })
            )
          }
        } catch (error) {
          console.error('Error loading threads', error)
        } finally {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }

    loadThreads()
  }, [user?.accessToken, fetchSortedThreads, connectionStatus, loadThreadMessages])

  const myThreads = useMemo(() => {
    return getThreadsFor(user?.email)
  }, [user, getThreadsFor, refreshKey, messages])

  useEffect(() => {
    if (!paramId && myThreads.length > 0) {
      setFallbackId(prev => prev || myThreads[0].id)
    }
  }, [paramId, myThreads])

  const activeId = paramId || fallbackId
  const active = activeId ? getThreadById(activeId) : null

  useEffect(() => {
    if (connectionStatus === 'Connected' && myThreads.length > 0) {
      myThreads.forEach(t => {
        const id = t.id || t.ThreadId || t.threadId
        if (id) loadThreadMessages(id)
      })
    }
  }, [connectionStatus, myThreads, loadThreadMessages])

  // Periodic refresh to ensure messages are up to date
  useEffect(() => {
    if (connectionStatus === 'Connected' && activeId) {
      const interval = setInterval(() => {
        loadThreadMessages(activeId)
        forceRefresh()
      }, 5000) // Refresh every 5 seconds

      return () => clearInterval(interval)
    }
  }, [connectionStatus, activeId, loadThreadMessages])

  useEffect(() => {
    if (activeId && connectionStatus === 'Connected') {
      loadThreadMessages(activeId)
      joinThread(activeId)
    }

    return () => {
      if (activeId) {
        leaveThread(activeId)
      }
    }
  }, [activeId, connectionStatus, loadThreadMessages, joinThread, leaveThread])

  const [messageUpdateTrigger, setMessageUpdateTrigger] = useState(0)

  const activeMessages = useMemo(() => {
    if (!activeId) return []
    return messages[activeId] || []
  }, [activeId, messages, messageUpdateTrigger])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeMessages.length, messageUpdateTrigger])

  // Force re-render when messages change
  useEffect(() => {
    if (activeId && messages[activeId]) {
      setMessageUpdateTrigger(prev => prev + 1)
    }
  }, [messages, activeId])

  useEffect(() => {
    if (active?.id) {
      markRead(active.id)
    }
  }, [active?.id, markRead])

  const handleTyping = e => {
    const value = e.target.value
    setText(value)

    if (!activeId) return

    if (!isTyping) {
      setIsTyping(true)
      sendTyping(activeId)
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      sendStoppedTyping(activeId)
    }, 1000)
  }

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  const onSend = async e => {
    e.preventDefault()
    if (!active?.id) return
    if (!text.trim() && !file) return
    if (isSending) return

    if (isTyping) {
      setIsTyping(false)
      sendStoppedTyping(active.id)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }

    try {
      setIsSending(true)
      let attachment = null

      if (file) {
        if (!fileBase64) {
          setIsSending(false)
          try {
            window.alert(
              'Attachment is not ready yet. Please wait a moment and try again.'
            )
          } catch (_) {}
          return
        }
        attachment = {
          name: file.name,
          type: file.type,
          base64: fileBase64
        }
      }

      await sendMessage(active.id, text, attachment)

      setText('')
      setFile(null)
      setFilePreview(null)
      setFileBase64(null)
    } catch (error) {
      const errorMessage = error.message || 'Unknown error occurred'
      try {
        window.alert(
          `Failed to send message: ${errorMessage}. Please try again.`
        )
      } catch (_) {}
    } finally {
      setIsSending(false)
    }
  }

  const onFileChange = e => {
    const f = e.target.files && e.target.files[0]
    if (!f) return

    if (!f.type.startsWith('image/')) {
      try {
        window.alert('Only image files are supported as attachments.')
      } catch (_) {}
      return
    }

    setFile(f)

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') {
        setFilePreview(result)
        setFileBase64(result)
      } else {
        setFilePreview(null)
        setFileBase64(null)
      }
    }
    reader.readAsDataURL(f)
  }

  const removeAttachment = () => {
    setFile(null)
    setFilePreview(null)
    setFileBase64(null)
  }

  const getStatusColor = status => {
    switch (status) {
      case 'Connected':
        return 'var(--success)'
      case 'Connecting':
      case 'Reconnecting':
        return 'var(--warning)'
      case 'Failed':
        return 'var(--error)'
      default:
        return 'var(--muted)'
    }
  }

  return (
    <div
      className="container"
      style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        gap: 18
      }}
    >
      {/* LEFT: Thread list */}
      <div
        className="panel"
        style={{
          padding: 10,
          overflow: 'auto',
          maxHeight: 'calc(100vh - 180px)',
          borderRadius: 14
        }}
      >
        <div
          style={{
            padding: '6px 10px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <strong>Inbox</strong>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: getStatusColor(connectionStatus)
              }}
            />
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>
              {connectionStatus}
            </span>
          </div>
        </div>

        {isLoading && (
          <div
            className="center"
            style={{ padding: 24, color: 'var(--muted)' }}
          >
            Loading threads...
          </div>
        )}

        {!isLoading && myThreads.length === 0 && (
          <div
            className="center"
            style={{ padding: 24, color: 'var(--muted)' }}
          >
            No message available
          </div>
        )}

        {!isLoading && (
          <div style={{ display: 'grid', gap: 10 }}>
            {myThreads.map(t => {
              const isActive = t.id === activeId


              return (
                <div
                  key={t.id}
                  role="button"
                  tabIndex={0}
                  aria-selected={isActive}
                  onClick={() => nav(`/inbox?t=${t.id}`)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') nav(`/inbox?t=${t.id}`)
                  }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: isActive ? 'var(--accent)' : 'var(--panel)',
                    border: isActive
                      ? '2px solid var(--accent)'
                      : '1px solid color-mix(in hsl, var(--panel), #000 12%)',
                    boxShadow: isActive
                      ? '0 6px 20px rgba(0,0,0,.15)'
                      : '0 2px 6px rgba(0,0,0,.05)',
                    position: 'relative',
                    paddingLeft: isActive ? 14 : 12,
                    color: isActive ? '#fff' : 'var(--text)',
                    transform: isActive ? 'translateY(-1px)' : 'translateY(0)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isActive && (
                    <span
                      aria-hidden
                      style={{
                        position: 'absolute',
                        left: 4,
                        top: 8,
                        bottom: 8,
                        width: 4,
                        borderRadius: 4,
                        background: 'var(--accent)'
                      }}
                    />
                  )}

                  {/* LEFT: title */}
                  <div
                    style={{
                      display: 'grid',
                      gap: 4,
                      minWidth: 0
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        minWidth: 0
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          padding: '2px 8px',
                          borderRadius: 999,
                          background:
                            'color-mix(in hsl, var(--accent), #fff 85%)',
                          textTransform: 'capitalize'
                        }}
                      >
                        Chat
                      </span>
                      <span
                        title={t.threadName || 'Thread'}
                        style={{
                          fontWeight: isActive ? 800 : 700,
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          textTransform: 'capitalize'
                        }}
                      >
                        {t.threadName || 'Thread'}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: isActive
                          ? 'rgba(255,255,255,0.8)'
                          : 'var(--muted)'
                      }}
                    >
                      {t.lastActivity
                        ? `Last: ${new Date(
                            t.lastActivity
                          ).toLocaleDateString()}`
                        : 'No messages'}
                    </div>
                  </div>


                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* RIGHT: Conversation pane */}
      <div
        className="panel"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 180px)',
          overflow: 'hidden',
          borderRadius: 14
        }}
      >
        <div
          style={{
            flex: '0 0 auto',
            padding: '12px 16px',
            borderBottom:
              '1px solid color-mix(in hsl, var(--panel), #fff 10%)'
          }}
        >
          {active ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}
            >
              <strong>{active.threadName || 'Thread'}</strong>
              <span style={{ color: 'var(--muted)' }}>•</span>
              <span style={{ color: 'var(--muted)' }}>Chat</span>
            </div>
          ) : (
            <strong>Select a thread</strong>
          )}
        </div>

        <div
          style={{
            flex: '1 1 auto',
            overflowY: 'auto',
            padding: '20px 16px',
            background: 'color-mix(in hsl, var(--panel), #000 6%)'
          }}
        >
          {!active && (
            <div
              className="center"
              style={{ padding: 24, color: 'var(--muted)' }}
            >
              No conversation selected.
            </div>
          )}

          {connectionStatus === 'Disconnected' ||
          connectionStatus === 'Failed' ? (
            <div
              className="center"
              style={{
                padding: '16px 20px',
                color: 'var(--error)',
                background:
                  'color-mix(in hsl, var(--error), #fff 90%)',
                borderRadius: 12,
                margin: '0 20px 20px',
                border:
                  '1px solid color-mix(in hsl, var(--error), #fff 70%)'
              }}
            >
              ⚠️ SignalR connection lost. Messages may not be real-time.
            </div>
          ) : null}

          {/* Empty-state hint */}
          {active && activeMessages.length === 0 && (
            <div
              className="center"
              style={{
                padding: 40,
                color: 'var(--muted)',
                fontSize: 14
              }}
            >
              No messages available
            </div>
          )}

          {/* Messages */}
          {activeMessages.map((m, index) => {
            // Decide whether this message belongs to current user
            let mine = false

            if (typeof m.isCurrentUser === 'boolean') {
              mine = m.isCurrentUser
            } else if (backendUserId && m.senderId) {
              mine = String(m.senderId) === String(backendUserId)
            } else if (user?.email && m.sender) {
              mine =
                String(m.sender).toLowerCase() ===
                String(user.email).toLowerCase()
            }

            mine = Boolean(mine)

            // Sender display name
            let displayName = 'Unknown User'
            if (mine) {
              displayName = 'You'
            } else if (m.senderName && m.senderName !== 'You') {
              displayName = m.senderName
            } else if (active) {
              displayName =
                active.otherName ||
                active.receiverName ||
                active.senderName ||
                'User'
            }

            const messageKey = `${
              m.threadId || 'thread'
            }-${m.id || index}-${m.ts || m.sentAtTime || Date.now()}`

            const timestamp = m.sentAtTime || m.ts || Date.now()

            return (
              <div
                key={messageKey}
                style={{
                  display: 'flex',
                  justifyContent: mine ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-start',
                  marginBottom: 12,
                  paddingLeft: mine ? 40 : 0,
                  paddingRight: mine ? 0 : 40
                }}
              >
                <div
                  style={{
                    maxWidth: '75%',
                    minWidth: '120px',
                    background: mine
                      ? 'linear-gradient(135deg, var(--accent), color-mix(in hsl, var(--accent), #000 15%))'
                      : 'color-mix(in hsl, var(--panel), #fff 20%)',
                    color: mine ? '#fff' : 'var(--text)',
                    padding: '12px 16px',
                    borderRadius: mine
                      ? '18px 18px 4px 18px'
                      : '18px 18px 18px 4px',
                    boxShadow: mine
                      ? '0 2px 12px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1)'
                      : '0 1px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05)',
                    border: mine
                      ? 'none'
                      : '1px solid color-mix(in hsl, var(--panel), #000 8%)',
                    position: 'relative'
                  }}
                >
                  {/* Tail */}
                  <div
                    style={{
                      position: 'absolute',
                      width: 0,
                      height: 0,
                      [mine ? 'right' : 'left']: -8,
                      bottom: 8,
                      borderStyle: 'solid',
                      borderWidth: mine
                        ? '8px 8px 0 0'
                        : '8px 0 0 8px',
                      borderColor: mine
                        ? 'var(--accent) transparent transparent transparent'
                        : 'color-mix(in hsl, var(--panel), #fff 20%) transparent transparent transparent'
                    }}
                  />

                  {/* Sender Name */}
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      marginBottom: 8,
                      color: mine
                        ? 'rgba(255,255,255,0.95)'
                        : 'var(--text)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: mine ? 'flex-end' : 'flex-start',
                      gap: 6
                    }}
                  >
                    {!mine && (
                      <span style={{ fontSize: 12, opacity: 0.8 }}>
                        👤
                      </span>
                    )}
                    <span style={{ textTransform: 'capitalize' }}>
                      {displayName}
                    </span>
                    {mine && (
                      <span style={{ fontSize: 12, opacity: 0.9 }}>
                        ✓
                      </span>
                    )}
                  </div>

                  {/* Text */}
                  {m.text ? (
                    <div
                      style={{
                        whiteSpace: 'pre-wrap',
                        lineHeight: '1.5',
                        fontSize: '14px',
                        marginBottom:
                          m.attachment || m.base64stringImage ? 12 : 8,
                        wordBreak: 'break-word'
                      }}
                    >
                      {m.text}
                    </div>
                  ) : m.attachment || m.base64stringImage ? null : (
                    <div
                      style={{
                        fontSize: '13px',
                        fontStyle: 'italic',
                        opacity: 0.6,
                        marginBottom: 8
                      }}
                    >
                      No text message
                    </div>
                  )}

                  {/* Image attachment */}
                  {(m.attachment || m.base64stringImage) && (
                    <div style={{ marginBottom: 8 }}>
                      {m.attachment?.dataUrl ? (
                        <div
                          style={{
                            borderRadius: 12,
                            overflow: 'hidden',
                            maxWidth: '280px',
                            boxShadow:
                              '0 2px 8px rgba(0,0,0,0.1)',
                            border:
                              '1px solid rgba(255,255,255,0.1)'
                          }}
                        >
                          <img
                            src={m.attachment.dataUrl}
                            alt="Shared image"
                            style={{
                              width: '100%',
                              height: 'auto',
                              display: 'block'
                            }}
                          />
                        </div>
                      ) : m.attachment?.base64 ? (
                        <div
                          style={{
                            borderRadius: 12,
                            overflow: 'hidden',
                            maxWidth: '280px',
                            boxShadow:
                              '0 2px 8px rgba(0,0,0,0.1)',
                            border:
                              '1px solid rgba(255,255,255,0.1)'
                          }}
                        >
                          <img
                            src={
                              m.attachment.base64.startsWith('data:')
                                ? m.attachment.base64
                                : `data:image/jpeg;base64,${m.attachment.base64}`
                            }
                            alt="Shared image"
                            style={{
                              width: '100%',
                              height: 'auto',
                              display: 'block'
                            }}
                          />
                        </div>
                      ) : m.base64stringImage ? (
                        <div
                          style={{
                            borderRadius: 12,
                            overflow: 'hidden',
                            maxWidth: '280px',
                            boxShadow:
                              '0 2px 8px rgba(0,0,0,0.1)',
                            border:
                              '1px solid rgba(255,255,255,0.1)'
                          }}
                        >
                          <img
                            src={
                              m.base64stringImage.startsWith('data:')
                                ? m.base64stringImage
                                : `data:image/jpeg;base64,${m.base64stringImage}`
                            }
                            alt="Shared image"
                            style={{
                              width: '100%',
                              height: 'auto',
                              display: 'block'
                            }}
                          />
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Timestamp */}
                  <div
                    style={{
                      fontSize: 11,
                      opacity: mine ? 0.85 : 0.7,
                      textAlign: mine ? 'right' : 'left',
                      color: mine
                        ? 'rgba(255,255,255,0.8)'
                        : 'var(--muted)',
                      fontWeight: 500,
                      letterSpacing: '0.2px'
                    }}
                  >
                    {new Date(timestamp).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={endRef} />
        </div>

        {/* Composer */}
        <form
          onSubmit={onSend}
          style={{
            flex: '0 0 auto',
            display: 'flex',
            gap: 8,
            padding: 10,
            borderTop:
              '1px solid color-mix(in hsl, var(--panel), #fff 10%)',
            alignItems: 'center'
          }}
        >
          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            disabled={!active || connectionStatus !== 'Connected'}
            className="file-btn"
          />
          <input
            className="input"
            placeholder={
              active ? 'Type a message…' : 'Select a conversation'
            }
            value={text}
            onChange={handleTyping}
            disabled={!active || connectionStatus !== 'Connected'}
            style={{ flex: 1 }}
          />
          <button
            className="btn"
            type="submit"
            disabled={
              !active ||
              (!text.trim() && !file) ||
              isSending ||
              connectionStatus !== 'Connected'
            }
          >
            {isSending
              ? 'Sending...'
              : connectionStatus !== 'Connected'
              ? 'Offline'
              : 'Send'}
          </button>
        </form>

        {filePreview && (
          <div style={{ padding: 10 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <img
                src={filePreview}
                alt={file?.name}
                style={{
                  width: 72,
                  height: 72,
                  objectFit: 'cover',
                  borderRadius: 6,
                  border: '1px solid rgba(0,0,0,.06)'
                }}
              />
              <div>
                <div style={{ fontSize: 13 }}>{file?.name}</div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--muted)'
                  }}
                >
                  {file?.type}
                </div>
                <div style={{ marginTop: 6 }}>
                  <button
                    className="btn ghost"
                    onClick={e => {
                      e.preventDefault()
                      removeAttachment()
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
