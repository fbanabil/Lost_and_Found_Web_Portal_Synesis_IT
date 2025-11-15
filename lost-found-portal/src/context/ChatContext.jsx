// src/context/ChatContext.jsx
import React, {
  createContext, useContext, useMemo, useState, useCallback
} from 'react'
import { useAuth } from './AuthContext'

const ChatContext = createContext(null)

export function ChatProvider({ children }){
  const [backendThreads, setBackendThreads] = useState([])
  const { user } = useAuth()

 const matchesCurrentUser = useCallback((participantId) => {
    if (!participantId || !user) return false
    const p = String(participantId).toLowerCase()
    const uid = String(user.id || '').toLowerCase()
    const uemail = String(user.email || '').toLowerCase()
    return p === uid || p === uemail
  }, [user])

 const matchesCurrentUserByName = useCallback((participantName) => {
    if (!participantName || !user) return false
    const p = String(participantName).toLowerCase()
    const uname = String(user.name || '').toLowerCase()
    const uemail = String(user.email || '').toLowerCase()
    return p === uname || p === uemail
  }, [user])

 const fetchSortedThreads = useCallback(async () => {
    if (!user?.accessToken) {
      return []
    }
    
    try {
      const response = await fetch('https://localhost:7238/ChatBox/GetSortedThreads', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.accessToken}`
        }
      })

      if (!response.ok) {
        if (response.status === 400) {
          return []
        }
        throw new Error(`Failed to fetch threads: ${response.status}`)
      }

      const data = await response.json()
      setBackendThreads(data)
      return data
    } catch (error) {
      return []
    }
  }, [user?.accessToken])

 const fetchMessagesByThreadId = useCallback(async (threadId) => {
    if (!user?.accessToken) return []
    
    try {
      const response = await fetch(`https://localhost:7238/ChatBox/GetMessagesByThreadId/${threadId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.accessToken}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.status}`)
      }

      const data = await response.json()
      
      return data.map(msg => ({
        id: msg.id,
        threadId: msg.threadId,
        senderId: msg.senderId, 
        receiverId: msg.receiverId, 
        message: msg.message || '', 
        text: msg.message || '', 
        ts: msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now(),
        attachment: msg.base64string ? {

          dataUrl: msg.base64string.startsWith('data:') ? msg.base64string : `data:image/jpeg;base64,${msg.base64string}`,
          base64: msg.base64string.startsWith('data:') ? msg.base64string.split(',')[1] : msg.base64string,
          type: 'image/*',
          name: 'attachment'
        } : null
      }))
    } catch (error) {
      return []
    }
  }, [user?.accessToken])

  const loadThreadMessages = useCallback(async (threadId) => {
    if (!threadId) return []

    const messages = await fetchMessagesByThreadId(threadId)

    const backendThread = backendThreads.find(t => t.chatThreadId === threadId)
  const currentUserId = user?.id || user?.email 
    
    const messagesWithSenders = messages.map(msg => {
      if (!backendThread) {
        return {
          id: msg.id,
          threadId: msg.threadId,
          sender: 'unknown',
          senderName: 'Unknown User',
          text: msg.message || msg.text || '',
          ts: msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now(),
          attachment: msg.attachment
        }
      }

      let senderName = 'Unknown User'
      let isCurrentUser = false
      let senderForUI = 'other'
      
      if (msg.senderId === backendThread.senderId) {
        senderName = backendThread.senderName
        isCurrentUser = matchesCurrentUser(backendThread.senderId) || matchesCurrentUserByName(backendThread.senderName)
      } else if (msg.senderId === backendThread.receiverId) {
        senderName = backendThread.receiverName  
        isCurrentUser = matchesCurrentUser(backendThread.receiverId) || matchesCurrentUserByName(backendThread.receiverName)
      }

      try {
        console.log('[ChatContext] mapMessage:', {
          threadId: threadId,
          msgId: msg.id,
          msgSenderId: msg.senderId,
          threadSenderId: backendThread.senderId,
          threadReceiverId: backendThread.receiverId,
          threadSenderName: backendThread.senderName,
          threadReceiverName: backendThread.receiverName,
          resolvedSenderName: senderName,
          isCurrentUser
        })
      } catch (_){ }

      if (isCurrentUser) {
        senderName = 'You'
        senderForUI = user?.email?.toLowerCase() || currentUserId 
      } else {
        senderForUI = 'other' 
      }

      const processedMessage = {
        id: msg.id,
        threadId: msg.threadId,
        sender: senderForUI,
        senderName: senderName,
        text: msg.message || msg.text || '',
        ts: msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now(),
        attachment: msg.attachment
      }
      
      return processedMessage
    })
    return messagesWithSenders
  }, [fetchMessagesByThreadId, backendThreads, user?.id, user?.email])

  const getThreadsFor = useCallback((email) => {
    const currentUserId = user?.id || user?.email 

    return backendThreads.map(backendThread => {
      let isUserSender = matchesCurrentUser(backendThread.senderId)
      if (!isUserSender && !matchesCurrentUser(backendThread.receiverId)) {
        isUserSender = matchesCurrentUserByName(backendThread.senderName)
      }
      const otherParticipantId = isUserSender ? backendThread.receiverId : backendThread.senderId
      const otherParticipantName = isUserSender ? backendThread.receiverName : backendThread.senderName
      try {
        console.log('[ChatContext] getThreadsFor thread:', backendThread.chatThreadId, {
          senderId: backendThread.senderId,
          senderName: backendThread.senderName,
          receiverId: backendThread.receiverId,
          receiverName: backendThread.receiverName,
          isUserSender,
          otherParticipantId,
          otherParticipantName,
          currentUser: { id: user?.id, email: user?.email, name: user?.name }
        })
      } catch (_){ }
      
      return {
        id: backendThread.chatThreadId,
        participants: [currentUserId, otherParticipantId],
        item: {
          id: backendThread.chatThreadId,
          type: 'chat',
          title: 'Chat Thread',
          ownerName: otherParticipantName || 'User',
        },
        customTitle: `Chat with ${otherParticipantName || 'User'}`,
        messages: [], 
        lastRead: {},
        updatedAt: new Date(backendThread.lastUpdatedAt).getTime(),
        otherName: otherParticipantName,
        senderId: backendThread.senderId,
        senderName: backendThread.senderName,
        receiverId: backendThread.receiverId,
        receiverName: backendThread.receiverName
      }
    }).sort((a,b) => (b.updatedAt||0) - (a.updatedAt||0))
  }, [backendThreads, user?.id])

  const getThreadById = useCallback((id) => {
    const backendThread = backendThreads.find(t => t.chatThreadId === id || t.chatThreadId == id)
    if (backendThread) {
  const currentUserId = user?.id || user?.email 
      
 
  let isUserSender = matchesCurrentUser(backendThread.senderId)
  if (!isUserSender && !matchesCurrentUser(backendThread.receiverId)) {
    isUserSender = matchesCurrentUserByName(backendThread.senderName)
  }
  const otherParticipantId = isUserSender ? backendThread.receiverId : backendThread.senderId
  const otherParticipantName = isUserSender ? backendThread.receiverName : backendThread.senderName

  try {
    console.log('[ChatContext] getThreadById:', id, {
      senderId: backendThread.senderId,
      senderName: backendThread.senderName,
      receiverId: backendThread.receiverId,
      receiverName: backendThread.receiverName,
      isUserSender,
      otherParticipantId,
      otherParticipantName,
      currentUser: { id: user?.id, email: user?.email, name: user?.name }
    })
  } catch (_){ }
      
      return {
        id: backendThread.chatThreadId,
        participants: [currentUserId, otherParticipantId],
        item: {
          id: backendThread.chatThreadId,
          type: 'chat',
          title: 'Chat Thread',
          ownerName: otherParticipantName || 'User',
        },
        customTitle: `Chat with ${otherParticipantName || 'User'}`,
        messages: [], 
        lastRead: {},
        updatedAt: new Date(backendThread.lastUpdatedAt).getTime(),
        otherName: otherParticipantName,
        senderId: backendThread.senderId,
        senderName: backendThread.senderName,
        receiverId: backendThread.receiverId,
        receiverName: backendThread.receiverName
      }
    }
    
    return null
  }, [backendThreads, user?.id])

  const unreadTotal = useCallback(() => {

    return 0
  }, [])

  const sendMessage = useCallback(async (threadId, text, attachment = null) => {
    const currentUserId = user?.id || user?.email 
    if (!currentUserId || !user?.accessToken) {
      return
    }

    const trimmed = (text||'').trim()
    if (!trimmed && !attachment) {
      return
    }

    try {

      const thread = backendThreads.find(t => t.chatThreadId === threadId || t.chatThreadId == threadId)
      
      if (!thread) {
        throw new Error(`Thread not found with ID: ${threadId}`)
      }

     let receiverId
      if (currentUserId === thread.senderId) {
        receiverId = thread.receiverId
      } else if (currentUserId === thread.receiverId) {
        receiverId = thread.senderId
      } else {
        receiverId = thread.receiverId
      }
      
      let base64StringValue = null
      if (attachment?.base64) {
        if (attachment.base64.startsWith('data:')) {
          base64StringValue = attachment.base64
        } else {
          const mimeType = attachment.type || 'image/png'
          base64StringValue = `data:${mimeType};base64,${attachment.base64}`
        }
      }
      
      const finalPayload = {
        threadId: String(threadId),
        receiverId: String(receiverId),
        message: String(trimmed || ''),
        base64String: base64StringValue
      }

      const response = await fetch('https://localhost:7238/ChatBox/SendMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.accessToken}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to send message: ${response.status} - ${errorText}`)
      }

      const responseClone = response.clone()
      const responseText = await responseClone.text()
      
      let data = null
      if (responseText.trim() === '') {
        data = null
      } else {
        try {
          data = await response.json()
        } catch (jsonError) {
          data = null
        }
      }
      
      return data || {}
    } catch (error) {
      throw error
    }
  }, [user, backendThreads])

  const markRead = useCallback((threadId) => {
  }, [])

  const renameThread = useCallback((threadId, title) => {
  }, [])

  const sendSystem = useCallback((threadId, text) => {
  }, [])

  const notifyPotentialMatch = useCallback(({ lost, found, distanceM }) => {
    return null
  }, [])

  const value = useMemo(()=>({
    backendThreads,
    getThreadsFor,
    getThreadById,
    sendMessage,
    markRead,
    unreadTotal,
    renameThread,
    fetchSortedThreads,
    fetchMessagesByThreadId,
    loadThreadMessages,
    sendSystem,
    notifyPotentialMatch,
  }), [backendThreads, getThreadsFor, getThreadById, sendMessage, markRead, unreadTotal, renameThread, fetchSortedThreads, fetchMessagesByThreadId, loadThreadMessages, sendSystem, notifyPotentialMatch])

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export const useChat = () => useContext(ChatContext)