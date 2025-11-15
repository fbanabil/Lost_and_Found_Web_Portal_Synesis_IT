// src/pages/Inbox.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'

export default function Inbox(){
  const { user } = useAuth()
  const { getThreadsFor, getThreadById, sendMessage, markRead, fetchSortedThreads, loadThreadMessages } = useChat()
  const [params] = useSearchParams()
  const nav = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [loadedMessages, setLoadedMessages] = useState({})
  const [isSending, setIsSending] = useState(false)


  useEffect(() => {
    const loadThreads = async () => {
      if (user?.accessToken) {
        setIsLoading(true)
        try {
          await fetchSortedThreads()
        } catch (error) {
        } finally {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }
    
    loadThreads()
  }, [user?.accessToken]) 

  const myThreads = useMemo(() => {
    const threads = getThreadsFor(user?.email)
    return threads
  }, [user, getThreadsFor])

  const paramId = params.get('t')
  const [fallbackId, setFallbackId] = useState(null)
  useEffect(() => {
    if (!paramId && myThreads.length > 0) setFallbackId(prev => prev || myThreads[0].id)
  }, [paramId, myThreads])

  const activeId = paramId || fallbackId
  const active = activeId ? getThreadById(activeId) : null

  useEffect(() => {
    const loadMessages = async () => {
      if (activeId && !loadedMessages[activeId]) {
        try {
          const messages = await loadThreadMessages(activeId)
          setLoadedMessages(prev => ({ ...prev, [activeId]: messages }))
        } catch (error) {
        }
      }
    }
    
    loadMessages()
  }, [activeId, loadThreadMessages]) 

  useEffect(() => {
    if (!activeId) return

    const pollMessages = async () => {
      try {
        const messages = await loadThreadMessages(activeId)
        setLoadedMessages(prev => ({ ...prev, [activeId]: messages }))
      } catch (error) {
      }
    }

    pollMessages()
    const intervalId = setInterval(pollMessages, 500)

    return () => clearInterval(intervalId)
  }, [activeId, loadThreadMessages])

  const activeMessages = activeId ? (loadedMessages[activeId] || active?.messages || []) : []

  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [fileBase64, setFileBase64] = useState(null)
  const endRef = useRef(null)
  const me = String(user?.email||'').toLowerCase()

  useEffect(()=>{ if (active?.id) markRead(active.id) }, [active?.id])
  useEffect(()=>{ endRef.current?.scrollIntoView({ behavior:'smooth' }) }, [activeMessages.length])

  const onSend = async (e) => {
    e.preventDefault()
    if (!active?.id) return
    if (!text.trim() && !file) return
    if (isSending) return 

    try {
      setIsSending(true)
      let attachment = null
      
      if (file) {
        if (!fileBase64) {
          setIsSending(false)
          try{ window.alert('Attachment is not ready yet. Please wait a moment and try again.') }catch(_){}
          return
        }
        attachment = { name: file.name, type: file.type, base64: fileBase64 }
      }

      const result = await sendMessage(active.id, text, attachment)
      
      if (result && (Object.keys(result).length > 0 || result.Id || result.id)) {
        const newMessage = {
          id: result.Id || result.id,
          threadId: result.ThreadId || result.threadId,
          senderId: result.SenderId || result.senderId || user?.id || user?.email,
          sender: user?.email?.toLowerCase() || 'me',
          senderName: user?.name || 'You',
          text: result.Message || text,
          ts: Date.now(),
          attachment: result.base64string ? {
            base64: result.base64string.startsWith('data:') ? result.base64string.split(',')[1] : result.base64string,
            dataUrl: result.base64string.startsWith('data:') ? result.base64string : `data:${attachment?.type || 'image/jpeg'};base64,${result.base64string}`,
            type: attachment?.type || 'image/*',
            name: attachment?.name || 'attachment'
          } : null
        }

        setLoadedMessages(prev => {
          const updated = {
            ...prev,
            [active.id]: [...(prev[active.id] || []), newMessage]
          }
          return updated
        })
      } else {        
        const fallbackMessage = {
          id: Date.now().toString(), 
          threadId: active.id,
          senderId: user?.id || user?.email,
          sender: user?.email?.toLowerCase() || 'me',
          senderName: user?.name || 'You',
          text: text,
          ts: Date.now(),
          attachment: attachment ? {
            base64: attachment.base64,
            type: attachment.type,
            name: attachment.name,
            dataUrl: `data:${attachment.type};base64,${attachment.base64}`
          } : null
        }

        setLoadedMessages(prev => {
          const updated = {
            ...prev,
            [active.id]: [...(prev[active.id] || []), fallbackMessage]
          }
          return updated
        })
      }

      setText('')
      setFile(null)
      setFilePreview(null)
      setFileBase64(null)
    } catch (error) {
      try{ window.alert('Failed to send message. Please try again.') }catch(_){}
    } finally {
      setIsSending(false)
    }
  }

  const onFileChange = (e) => {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    if (!f.type.startsWith('image/')) {
      try{ window.alert('Only image files are supported as attachments.') }catch(_){}
      return
    }
    setFile(f)
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string'){
        const parts = result.split(',')
        const base64 = parts[1] || ''
        setFilePreview(result)
        setFileBase64(base64)
      } else {
        setFilePreview(null)
        setFileBase64(null)
      }
    }
    reader.readAsDataURL(f)
  }

  const removeAttachment = () => { setFile(null); setFilePreview(null); setFileBase64(null) }


  const renderBadge = t => (
    <span style={{
      fontSize:12, padding:'2px 8px', borderRadius:999,
      background:'color-mix(in hsl, var(--accent), #fff 85%)',
      textTransform:'capitalize'
    }}>
      {t.item?.type || 'item'}
    </span>
  )

  return (
    <div className="container" style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:18 }}>
      <div className="panel" style={{ padding:10, overflow:'auto', maxHeight:'calc(100vh - 180px)', borderRadius:14 }}>
        <div style={{ padding:'6px 10px 12px' }}>
          <strong>Inbox</strong>
        </div>

        {isLoading && (
          <div className="center" style={{ padding:24, color:'var(--muted)' }}>Loading threads...</div>
        )}

        {!isLoading && myThreads.length === 0 && (
          <div className="center" style={{ padding:24, color:'var(--muted)' }}>No messages yet.</div>
        )}

        {!isLoading && (
          <div style={{ display:'grid', gap:10 }}>
            {myThreads.map(t=>{
            const isActive = t.id===activeId
            const lastRead = t.lastRead?.[me]||0
            const unread = (t.messages || []).filter(m=>m.sender!==me && m.ts>lastRead).length
            
            return (
              <div
                key={t.id}
                role="button"
                tabIndex={0}
                aria-selected={isActive}
                onClick={()=>nav(`/inbox?t=${t.id}`)}
                onKeyDown={e=>{ if(e.key==='Enter') nav(`/inbox?t=${t.id}`) }}
                style={{

                  display:'grid',
                  gridTemplateColumns:'1fr auto',
                  alignItems:'center',
                  gap:8,
                  padding:'10px 12px',
                  borderRadius:12,
                  background: isActive ? 'var(--accent)' : 'var(--panel)',
                  border: isActive
                    ? '2px solid var(--accent)'
                    : '1px solid color-mix(in hsl, var(--panel), #000 12%)',
                  boxShadow: isActive ? '0 6px 20px rgba(0,0,0,.15)' : '0 2px 6px rgba(0,0,0,.05)',
                  position:'relative',
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
                      position:'absolute', left:4, top:8, bottom:8,
                      width:4, borderRadius:4, background:'var(--accent)'
                    }}
                  />
                )}

                {/* LEFT: title */}
                <div style={{ display:'grid', gap:4, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
                    {renderBadge(t)}
                    <span
                      title={t.customTitle || t.item?.title || 'Item'}
                      style={{
                        fontWeight: isActive ? 800 : 700, 
                        minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                        textTransform:'capitalize'
                      }}
                    >
                      {t.customTitle || t.item?.title || 'Item'}
                    </span>
                  </div>
                  <div style={{ fontSize:12, color: isActive ? 'rgba(255,255,255,0.8)' : 'var(--muted)' }}>
                    {t.receiverName ? `With: ${t.receiverName}` : `With: ${t.participants.filter(p=>p!==me)[0]}`}
                  </div>
                </div>


                {/* Unread count bubble */}
                {unread>0 && (
                  <span
                    style={{
                      position:'absolute', right:10, top:10,
                      borderRadius:999, minWidth:20, height:20,
                      display:'grid', placeItems:'center', fontSize:11,
                      background:'var(--accent)', color:'#fff'
                    }}
                  >
                    {unread}
                  </span>
                )}
              </div>
            )
          })}
          </div>
        )}
      </div>

      {/* Right: conversation */}
      <div className="panel" style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 180px)', overflow:'hidden', borderRadius:14 }}>
        <div style={{ flex:'0 0 auto', padding:'12px 16px', borderBottom:'1px solid color-mix(in hsl, var(--panel), #fff 10%)' }}>
          {active ? (
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <strong>{active.customTitle || active.item?.title || 'Item'}</strong>
              <span style={{ color:'var(--muted)' }}>•</span>
              <span style={{ color:'var(--muted)' }}>{active.item?.type || 'post'}</span>
            </div>
          ) : <strong>Select a thread</strong>}
        </div>

        <div style={{ flex:'1 1 auto', overflowY:'auto', padding:16, background:'color-mix(in hsl, var(--panel), #000 6%)' }}>
          {!active && <div className="center" style={{ padding:24, color:'var(--muted)' }}>No conversation selected.</div>}
          {activeMessages.map(m=>{
            const mine = m.sender === me || m.sender === user?.email || m.sender === user?.id || m.senderName === 'You'

            let displayName = m.senderName || ''
            if (!displayName || displayName === 'Unknown User') {
              if (active) {
                if (m.senderId && (String(m.senderId) === String(active.senderId))) displayName = active.senderName || active.otherName || 'User'
                else if (m.senderId && (String(m.senderId) === String(active.receiverId))) displayName = active.receiverName || active.otherName || 'User'
                else if (m.sender === me || m.sender === user?.email || m.sender === user?.id) displayName = user?.name || 'You'
                else displayName = active.otherName || 'User'
              } else {
                displayName = m.senderName || 'Unknown User'
              }
            }

            return (
              <div key={m.id} style={{ display:'flex', justifyContent:mine?'flex-end':'flex-start', marginBottom:10 }}>
                <div style={{
                  maxWidth:'70%', background:mine?'var(--accent)':'color-mix(in hsl, var(--panel), #fff 12%)',
                  color:mine?'#fff':'var(--text)', padding:'10px 12px', borderRadius:14
                }}>
                  <div style={{ fontSize:12, fontWeight:600, marginBottom:4, opacity:0.9 }}>
                    {mine ? (user?.name || 'You') : (displayName || 'Unknown User')}
                  </div>
                  <div style={{ whiteSpace:'pre-wrap' }}>{m.text}</div>
                          {m.attachment && (
                            <div style={{ marginTop:8 }}>
                              {m.attachment.dataUrl ? (
                                <div className="chat-image-container">
                                  <img src={m.attachment.dataUrl} alt={m.attachment.name} className="chat-image" />
                                </div>
                              ) : m.attachment.base64 ? (
                                <div className="chat-image-container">
                                  <img src={`data:${m.attachment.type};base64,${m.attachment.base64}`} alt={m.attachment.name} className="chat-image" />
                                </div>
                              ) : m.attachment.url ? (
                                <div className="chat-image-container">
                                  <img src={m.attachment.url} alt={m.attachment.name || 'attachment'} className="chat-image" />
                                </div>
                              ) : null}
                            </div>
                          )}
                          {!m.attachment && m.attachmentUrl && (
                            <div style={{ marginTop:8 }}>
                              <div className="chat-image-container">
                                <img src={m.attachmentUrl} alt="attachment" className="chat-image" />
                              </div>
                            </div>
                          )}
                  <div style={{ fontSize:11, opacity:0.8, marginTop:4 }}>
                    {new Date(m.ts).toLocaleString()}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={endRef}/>
        </div>

        <form onSubmit={onSend} style={{ flex:'0 0 auto', display:'flex', gap:8, padding:10, borderTop:'1px solid color-mix(in hsl, var(--panel), #fff 10%)', alignItems:'center' }}>
          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            disabled={!active}
            className="file-btn"
          />
          <input
            className="input"
            placeholder={active ? 'Type a message…' : 'Select a conversation'}
            value={text}
            onChange={e=>setText(e.target.value)}
            disabled={!active}
            style={{ flex:1 }}
          />
          <button 
            className="btn" 
            type="submit" 
            disabled={!active||(!text.trim() && !file)||isSending}
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </form>
        {filePreview && (
          <div style={{ padding:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <img src={filePreview} alt={file?.name} style={{ width:72, height:72, objectFit:'cover', borderRadius:6, border:'1px solid rgba(0,0,0,.06)' }} />
              <div>
                <div style={{ fontSize:13 }}>{file?.name}</div>
                <div style={{ fontSize:12, color:'var(--muted)' }}>{file?.type}</div>
                <div style={{ marginTop:6 }}>
                  <button className="btn ghost" onClick={(e)=>{ e.preventDefault(); removeAttachment() }}>Remove</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
