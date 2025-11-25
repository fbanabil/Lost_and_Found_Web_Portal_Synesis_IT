// src/context/SignalRChatContext.jsx
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef
} from 'react'
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { useAuth } from './AuthContext'
import { base_url } from '../Setup.js'

const SignalRChatContext = createContext()

export function useSignalRChat() {
  const context = useContext(SignalRChatContext)
  if (!context) {
    throw new Error('useSignalRChat must be used within SignalRChatProvider')
  }
  return context
}

export function SignalRChatProvider({ children }) {
  const { user } = useAuth()

  const [connection, setConnection] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('Disconnected')
  const [backendThreads, setBackendThreads] = useState([])
  const [messages, setMessages] = useState({})
  const [joinedThreads, setJoinedThreads] = useState(new Set())
  const [backendUserId, setBackendUserId] = useState(null)

  const connectionRef = useRef(null)
  const backendUserIdRef = useRef(null)
  const joinedThreadsRef = useRef(new Set())
  const loadingThreadsRef = useRef(new Set())

  useEffect(() => {
    joinedThreadsRef.current = joinedThreads
  }, [joinedThreads])

  useEffect(() => {
    backendUserIdRef.current = backendUserId
  }, [backendUserId])

  const connect = useCallback(async () => {
    if (!user?.accessToken) return
    if (connectionRef.current) return

    setConnectionStatus(prev =>
      prev === 'Connected' ? prev : 'Connecting'
    )

    try {
      const newConnection = new HubConnectionBuilder()
        .withUrl("https://lostandfoundwebportal.runasp.net/chathub", {
          accessTokenFactory: () => user?.accessToken
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Warning)
        .build()

      newConnection.onclose(() => {
        connectionRef.current = null
        setConnection(null)
        setConnectionStatus('Disconnected')
      })

      newConnection.onreconnecting(() => {
        setConnectionStatus('Reconnecting')
      })

      newConnection.onreconnected(async () => {
        setConnectionStatus('Connected')
        try {
          for (const threadId of joinedThreadsRef.current) {
            await newConnection.invoke('JoinThread', threadId)
          }
        } catch (err) {
          console.warn('Failed to re-join some threads after reconnect', err)
        }
      })

      newConnection.on('ReceiveMessage', messageData => {
        if (!messageData) return

        const threadIdRaw = messageData.threadId ?? messageData.ThreadId
        if (!threadIdRaw) return

        const id =
          messageData.messageId ??
          messageData.MessageId ??
          (globalThis.crypto?.randomUUID
            ? globalThis.crypto.randomUUID()
            : String(Date.now()))

        const senderId = messageData.senderId ?? messageData.SenderId ?? null
        const senderName =
          messageData.senderName ?? messageData.SenderName ?? ''
        const text = messageData.text ?? messageData.Text ?? ''
        const sentAtRaw =
          messageData.sentAt ?? messageData.SentAt ?? new Date().toISOString()
        const base64 =
          messageData.base64stringImage ??
          messageData.base64StringImage ??
          null

        const sentAtTime = sentAtRaw
          ? new Date(sentAtRaw).getTime()
          : Date.now()
        const threadId = String(threadIdRaw)

        const currentBackendId = backendUserIdRef.current
        const isCurrentUser =
          currentBackendId && senderId
            ? String(senderId) === String(currentBackendId)
            : false

        const newMessage = {
          id,
          threadId,
          sender: senderName,
          senderId,
          senderName,
          text,
          ts: sentAtTime,
          SentAt: sentAtRaw,
          sentAtTime,
          base64stringImage: base64,
          attachment: base64
            ? {
                name: 'image',
                type: 'image/jpeg',
                base64,
                dataUrl: base64.startsWith('data:')
                  ? base64
                  : `data:image/jpeg;base64,${base64}`
              }
            : null,
          isCurrentUser
        }

        setMessages(prev => {
          const currentMessages = prev[threadId] || []

          // Less aggressive deduplication for real-time updates
          if (
            newMessage.id &&
            currentMessages.some(m => m.id === newMessage.id)
          ) {
            return prev
          }

          // Only check for duplicates in the last 5 messages
          const recentMessages = currentMessages.slice(-5)
          const isDuplicateByContent = recentMessages.some(m => {
            const sameText = m.text === newMessage.text
            const sameSender =
              String(m.senderId || '') === String(newMessage.senderId || '')
            const mTime = m.sentAtTime || m.ts || 0
            const sameTimestamp =
              Math.abs(mTime - newMessage.sentAtTime) < 1000 // Reduced to 1 second
            return sameText && sameSender && sameTimestamp
          })

          if (isDuplicateByContent) {
            return prev
          }

          const updatedMessages = [...currentMessages, newMessage].sort(
            (a, b) => {
              const aTime = a.sentAtTime || a.ts || 0
              const bTime = b.sentAtTime || b.ts || 0
              return aTime - bTime
            }
          )

          // Update threads immediately with new message
          setTimeout(() => {
            setBackendThreads(prevThreads =>
              prevThreads.map(thread => {
                const key = String(
                  thread.ThreadId || thread.threadId || thread.id
                )
                if (key === threadId) {
                  return {
                    ...thread,
                    messages: updatedMessages,
                    lastActivity: new Date().toISOString()
                  }
                }
                return thread
              })
            )
          }, 0)

          return {
            ...prev,
            [threadId]: updatedMessages
          }
        })
      })

      newConnection.on('MessagesLoaded', (firstParam, secondParam) => {
        let threadId = null
        let messagesArray = null

        if (Array.isArray(secondParam)) {
          threadId = String(firstParam)
          messagesArray = secondParam
        } else if (
          firstParam &&
          typeof firstParam === 'object' &&
          firstParam.threadId &&
          Array.isArray(firstParam.messages)
        ) {
          threadId = String(firstParam.threadId)
          messagesArray = firstParam.messages
        }

        if (!threadId || !Array.isArray(messagesArray)) return

        const currentBackendId = backendUserIdRef.current

        const processedMessages = messagesArray
          .map(msg => {
            const id =
              msg.messageId ??
              msg.MessageId ??
              (globalThis.crypto?.randomUUID
                ? globalThis.crypto.randomUUID()
                : String(Date.now()))

            const senderId = msg.senderId ?? msg.SenderId ?? null
            const senderName =
              msg.senderName ?? msg.SenderName ?? 'Unknown User'
            const text = msg.text ?? msg.Text ?? ''
            const sentAtRaw =
              msg.sentAt ?? msg.SentAt ?? new Date().toISOString()
            const base64 =
              msg.base64stringImage ?? msg.base64StringImage ?? null
            const sentAtTime = sentAtRaw
              ? new Date(sentAtRaw).getTime()
              : Date.now()

            const isCurrentUser =
              currentBackendId && senderId
                ? String(senderId) === String(currentBackendId)
                : false

            return {
              id,
              threadId: String(msg.threadId ?? msg.ThreadId ?? threadId),
              sender: senderName,
              senderId,
              senderName,
              text,
              ts: sentAtTime,
              SentAt: sentAtRaw,
              sentAtTime,
              base64stringImage: base64,
              attachment: base64
                ? {
                    name: 'image',
                    type: 'image/jpeg',
                    base64,
                    dataUrl: base64.startsWith('data:')
                      ? base64
                      : `data:image/jpeg;base64,${base64}`
                  }
                : null,
              isCurrentUser
            }
          })
          .sort((a, b) => {
            const aTime = a.sentAtTime || a.ts || 0
            const bTime = b.sentAtTime || b.ts || 0
            return aTime - bTime
          })

        setMessages(prev => {
          const newState = {
            ...prev,
            [threadId]: processedMessages
          }
          // Force state update
          setTimeout(() => {
            setBackendThreads(current => [...current])
          }, 0)
          return newState
        })

        setBackendThreads(prevThreads =>
          prevThreads.map(thread => {
            const key = String(
              thread.ThreadId || thread.threadId || thread.id
            )
            if (key === String(threadId)) {
              const lastMsg = processedMessages[processedMessages.length - 1]
              const lastActivity = lastMsg
                ? lastMsg.SentAt ||
                  new Date(lastMsg.sentAtTime || lastMsg.ts).toISOString()
                : thread.lastActivity
              return {
                ...thread,
                messages: processedMessages,
                lastActivity
              }
            }
            return thread
          })
        )
      })

      newConnection.on('UserJoined', userName => {
        console.debug('UserJoined', userName)
      })

      newConnection.on('UserLeft', userName => {
        console.debug('UserLeft', userName)
      })

      newConnection.on('UserTyping', userName => {
        console.debug('UserTyping', userName)
      })

      newConnection.on('UserStoppedTyping', userName => {
        console.debug('UserStoppedTyping', userName)
      })

      newConnection.on('NewThreadNotification', notification => {
        console.debug('NewThreadNotification', notification)
      })

      newConnection.on('Error', error => {
        console.error('Server error from ChatHub:', error)
      })

      await newConnection.start()
      connectionRef.current = newConnection
      setConnection(newConnection)
      setConnectionStatus('Connected')
    } catch (error) {
      console.error('SignalR connection error', error)
      connectionRef.current = null
      setConnection(null)
      setConnectionStatus('Failed')

      setTimeout(() => {
        if (user?.accessToken && !connectionRef.current) {
          connect()
        }
      }, 5000)
    }
  }, [user?.accessToken])

  useEffect(() => {
    if (user?.accessToken && !connectionRef.current) {
      connect()
    }
  }, [user?.accessToken, connect])

  useEffect(() => {
    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop().catch(() => {})
      }
    }
  }, [])

  const fetchSortedThreads = useCallback(async () => {
    if (!user?.accessToken) {
      return []
    }

    try {
      const response = await fetch(
        "https://lostandfoundwebportal.runasp.net/ChatBox/GetSortedThreads",
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        if (response.status === 400) {
          return []
        }
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      const rawId = data?.Id ?? data?.id
      if (rawId) {
        const idStr = String(rawId)
        setBackendUserId(idStr)
        backendUserIdRef.current = idStr
      }

      const threads = Array.isArray(
        data?.threadToShowDTOs || data?.threadToShowDtos
      )
        ? data.threadToShowDTOs || data.threadToShowDtos
        : []

      setBackendThreads(threads)
      return threads
    } catch (error) {
      console.error('fetchSortedThreads error', error)
      return []
    }
  }, [user])

  const joinThread = useCallback(async threadId => {
    if (!threadId) return false
    const conn = connectionRef.current
    if (!conn) return false

    try {
      await conn.invoke('JoinThread', threadId)
      setJoinedThreads(prev => {
        const next = new Set(prev)
        next.add(threadId)
        return next
      })
      return true
    } catch (error) {
      console.error('JoinThread error', error)
      return false
    }
  }, [])

  const leaveThread = useCallback(async threadId => {
    if (!threadId) return false
    const conn = connectionRef.current
    if (!conn) return false

    try {
      await conn.invoke('LeaveThread', threadId)
      setJoinedThreads(prev => {
        const next = new Set(prev)
        next.delete(threadId)
        return next
      })
      return true
    } catch (error) {
      console.error('LeaveThread error', error)
      return false
    }
  }, [])

  const loadThreadMessages = useCallback(
    async threadId => {
      if (!threadId) {
        return messages[threadId] || []
      }

      if (loadingThreadsRef.current.has(threadId)) {
        return messages[threadId] || []
      }

      if (messages[threadId] && messages[threadId].length > 0) {
        return messages[threadId]
      }

      const conn = connectionRef.current
      if (!conn || connectionStatus !== 'Connected') {
        return []
      }

      try {
        loadingThreadsRef.current.add(threadId)

        await joinThread(threadId)
        await conn.invoke('GetMessages', threadId)

        await new Promise(resolve => setTimeout(resolve, 800))

        return messages[threadId] || []
      } catch (error) {
        console.error('loadThreadMessages error', error)
        return []
      } finally {
        loadingThreadsRef.current.delete(threadId)
      }
    },
    [messages, connectionStatus, joinThread]
  )

  const sendMessage = useCallback(
    async (threadId, text, attachment = null) => {
      const conn = connectionRef.current
      if (!conn || connectionStatus !== 'Connected') {
        throw new Error('SignalR connection not available')
      }

      const trimmed = (text || '').trim()
      if (!trimmed && !attachment) {
        throw new Error('Message cannot be empty')
      }

      let formattedBase64 = null
      if (attachment?.base64) {
        formattedBase64 = attachment.base64
      }

      if (
        !threadId ||
        threadId === '00000000-0000-0000-0000-000000000000'
      ) {
        throw new Error('Invalid thread ID')
      }

      const senderId =
        backendUserIdRef.current ||
        '00000000-0000-0000-0000-000000000000'

      const messageDto = {
        ThreadId: threadId,
        SenderId: senderId,
        Text: trimmed || '',
        base64stringImage: formattedBase64
      }

      try {
        await conn.invoke('SendMessage', messageDto)
        return { success: true }
      } catch (error) {
        console.error('SendMessage error', error)
        throw new Error(
          `Failed to send message: ${error.message || String(error)}`
        )
      }
    },
    [connectionStatus]
  )

  const refreshMessages = useCallback(async threadId => {
    const conn = connectionRef.current
    if (!conn || !threadId) return false

    try {
      await conn.invoke('GetMessages', threadId)
      return true
    } catch (error) {
      console.error('refreshMessages error', error)
      return false
    }
  }, [])

  const cleanupDuplicateMessages = useCallback(() => {
    setMessages(prev => {
      const updated = {}
      Object.keys(prev).forEach(threadId => {
        const threadMessages = prev[threadId] || []
        const uniqueMessages = []
        const seenIds = new Set()
        const seenKeys = new Set()

        threadMessages.forEach(msg => {
          const key = `${msg.text}-${msg.sentAtTime || msg.ts}-${
            msg.senderId || msg.sender
          }`
          if (!seenIds.has(msg.id) && !seenKeys.has(key)) {
            uniqueMessages.push(msg)
            if (msg.id) seenIds.add(msg.id)
            seenKeys.add(key)
          }
        })

        updated[threadId] = uniqueMessages.sort((a, b) => {
          const aTime = a.sentAtTime || a.ts || 0
          const bTime = b.sentAtTime || b.ts || 0
          return aTime - bTime
        })
      })
      return updated
    })
  }, [])

  const initiateChat = useCallback(
    (receiverId, receiverName, message = '') => {
      const conn = connectionRef.current
      if (!conn || connectionStatus !== 'Connected') {
        return Promise.reject(
          new Error('SignalR connection not available')
        )
      }

      return new Promise((resolve, reject) => {
        const handleNewThread = threadId => {
          cleanup('ok', threadId, null)
        }
        const handleExistingThread = threadId => {
          cleanup('ok', threadId, null)
        }

        let timeoutId = null

        const cleanup = (type, value, error) => {
          if (timeoutId) clearTimeout(timeoutId)
          conn.off('ThreadCreated', handleNewThread)
          conn.off('ThreadExists', handleExistingThread)

          if (type === 'ok') resolve(value)
          else reject(error)
        }

        timeoutId = setTimeout(() => {
          cleanup('error', null, new Error('Chat initiation timeout'))
        }, 10000)

        conn.on('ThreadCreated', handleNewThread)
        conn.on('ThreadExists', handleExistingThread)

        conn.invoke('InitiateChat', receiverId, receiverName).catch(err => {
          cleanup('error', null, err)
        })
      })
    },
    [connectionStatus]
  )

  const sendTyping = useCallback(
    async threadId => {
      const conn = connectionRef.current
      if (conn && connectionStatus === 'Connected' && threadId) {
        try {
          await conn.invoke('UserTyping', threadId)
        } catch (error) {
          console.error('UserTyping invoke error', error)
        }
      }
    },
    [connectionStatus]
  )

  const sendStoppedTyping = useCallback(
    async threadId => {
      const conn = connectionRef.current
      if (conn && connectionStatus === 'Connected' && threadId) {
        try {
          await conn.invoke('UserStoppedTyping', threadId)
        } catch (error) {
          console.error('UserStoppedTyping invoke error', error)
        }
      }
    },
    [connectionStatus]
  )

  const getThreadsFor = useCallback(
    userEmail => {
      return backendThreads
        .map(backendThread => {
          const threadId =
            backendThread.ThreadId ||
            backendThread.threadId ||
            backendThread.id
          const threadMessages = messages[threadId] || []

          return {
            ...backendThread,
            id: threadId,
            threadName:
              backendThread.ThreadName || backendThread.threadName,
            lastActivity:
              backendThread.LastActivity || backendThread.lastActivity,
            messages: threadMessages,
            lastMessage:
              threadMessages[threadMessages.length - 1] || null,
            lastRead: backendThread.lastRead || {}
          }
        })
        .sort((a, b) => {
          const aTime = a.lastActivity
            ? new Date(a.lastActivity).getTime()
            : a.lastMessage?.ts || 0
          const bTime = b.lastActivity
            ? new Date(b.lastActivity).getTime()
            : b.lastMessage?.ts || 0
          return bTime - aTime
        })
    },
    [backendThreads, messages]
  )

  const getThreadById = useCallback(
    id => {
      if (!id) return null

      const thread = backendThreads.find(t => {
        const tid = t.ThreadId || t.threadId || t.id
        return String(tid) === String(id)
      })
      if (!thread) return null

      const threadId = thread.ThreadId || thread.threadId || thread.id
      const threadMessages = messages[threadId] || []

      return {
        ...thread,
        id: threadId,
        threadName: thread.ThreadName || thread.threadName,
        messages: threadMessages,
        lastMessage:
          threadMessages[threadMessages.length - 1] || null
      }
    },
    [backendThreads, messages]
  )

  const markRead = useCallback(threadId => {
    return
  }, [])

  const contextValue = {
    connection,
    connectionStatus,

    backendUserId,

    backendThreads,
    messages,

    connect,
    fetchSortedThreads,
    loadThreadMessages,
    sendMessage,
    refreshMessages,
    cleanupDuplicateMessages,
    initiateChat,
    sendTyping,
    sendStoppedTyping,
    joinThread,
    leaveThread,
    getThreadsFor,
    getThreadById,
    markRead
  }

  return (
    <SignalRChatContext.Provider value={contextValue}>
      {children}
    </SignalRChatContext.Provider>
  )
}
