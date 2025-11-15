// src/pages/Lost.jsx
import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { store } from '../utils/storage'
import ItemCard from '../components/ItemCard'
import ComposerLost from '../components/ComposerLost'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'
import { findMatches } from '../utils/matcher'
import { useNavigate } from 'react-router-dom'

const KEY_LOST = 'lf_lost_v1'
const KEY_FOUND = 'lf_found_v1'

export default function Lost(){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()
  const { notifyPotentialMatch } = useChat()
  const nav = useNavigate()
  const [mine, setMine] = useState(false)

  useEffect(() => {
    let mounted = true
    const fetchAll = async () => {
      setLoading(true)
      setError(null)
      try{
        const token = user?.accessToken
        const headers = { 'Content-Type': 'application/json' }
        if(token) headers['Authorization'] = `Bearer ${token}`

        const resp = await fetch('https://localhost:7238/LostAndFound/GetLostItems', { method: 'GET', headers })
        if(!resp.ok) throw new Error(`Server returned ${resp.status}`)
        const list = await resp.json()
        const normalized = (Array.isArray(list) ? list : []).map(si => ({
          id: si.id || si.Id || crypto.randomUUID(),
          type: si.type || si.Type || '',
          brand: si.brand || si.Brand || '',
          color: si.color || si.Color || '',
          marks: si.marks || si.Marks || '',
          place: si.place || si.Place || '',
          date: si.date || si.Date || null,
          location: {
            lat: si.latitude ?? si.Latitude ?? (si.location?.lat) ?? null,
            lng: si.longitude ?? si.Longitude ?? (si.location?.lng) ?? null
          },
          photo: si.photoUrl || si.PhotoUrl || si.photo || si.PhotoBase64 || si.photoBase64 || null,
          status: si.status || si.Status || 'Pending',
          ownerId: si.ownerId || si.OwnerId || si.owner || null,
          ownerName: si.ownerName || si.OwnerName || si.personName || null
        }))

        if(!mounted) return
        setItems(normalized)
        store.set(KEY_LOST, normalized)
      }catch(err){
        const cached = store.get(KEY_LOST, [])
        if(mounted){ setItems(cached); setError(err) }
      }finally{ if(mounted) setLoading(false) }
    }

    const fetchMine = async () => {
      setLoading(true)
      setError(null)
      try{
        const token = user?.accessToken
        const headers = { 'Content-Type': 'application/json' }
        if(token) headers['Authorization'] = `Bearer ${token}`

        const resp = await fetch('https://localhost:7238/LostAndFound/GetMyLostItemsPost', { method: 'GET', headers })
        if(!resp.ok) throw new Error(`Server returned ${resp.status}`)
        const list = await resp.json()
        const normalized = (Array.isArray(list) ? list : []).map(si => ({
          id: si.id || si.Id || crypto.randomUUID(),
          type: si.type || si.Type || '',
          brand: si.brand || si.Brand || '',
          color: si.color || si.Color || '',
          marks: si.marks || si.Marks || '',
          place: si.place || si.Place || '',
          date: si.date || si.Date || null,
          location: {
            lat: si.latitude ?? si.Latitude ?? (si.location?.lat) ?? null,
            lng: si.longitude ?? si.Longitude ?? (si.location?.lng) ?? null
          },
          photo: si.photoUrl || si.PhotoUrl || si.photo || si.PhotoBase64 || si.photoBase64 || null,
          status: si.status || si.Status || 'Pending',
          ownerId: si.ownerId || si.OwnerId || si.owner || user?.email || null,
          ownerName: si.ownerName || si.OwnerName || si.personName || user?.name || null
        }))

        if(!mounted) return
        setItems(normalized)
        store.set(KEY_LOST, normalized)
      }catch(err){
        const cached = store.get(KEY_LOST, [])
        const mineCached = cached.filter(i => i.ownerId && user?.email && i.ownerId === user.email)
        if(mounted){ setItems(mineCached); setError(err) }
      }finally{ if(mounted) setLoading(false) }
    }

    if(mine) fetchMine(); else fetchAll()
    return () => { mounted = false }
  }, [mine, user])
  const addItem = async (item) => {

    const payload = {
      Type: item.type,
      Brand: item.brand,
      Color: item.color,
      Marks: item.marks,
      Place: item.place,
      Date: item.date || null,
      Latitude: item.location?.lat ?? null,
      Longitude: item.location?.lng ?? null,
      PhotoBase64: item.photo && item.photo.startsWith('data:') ? item.photo : null
    }

    let saved = null
    try{
      const token = user?.accessToken
      const headers = { 'Content-Type': 'application/json' }
      if(token) headers['Authorization'] = `Bearer ${token}`

      const resp = await fetch('https://localhost:7238/LostAndFound/AddLostItem', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })

      if(!resp.ok){
        let msg = `Server returned ${resp.status}`
        try{ const body = await resp.json(); msg = body?.message || body?.error || JSON.stringify(body) }catch(e){ try{ msg = await resp.text() }catch(_){} }
        throw new Error(msg)
      }

      const serverItem = await resp.json()

      saved = {
        id: serverItem.id || serverItem.Id || item.id,
        type: serverItem.type || serverItem.Type || item.type,
        brand: serverItem.brand || serverItem.Brand || item.brand,
        color: serverItem.color || serverItem.Color || item.color,
        marks: serverItem.marks || serverItem.Marks || item.marks,
        place: serverItem.place || serverItem.Place || item.place,
        date: serverItem.date || serverItem.Date || item.date,
        location: {
          lat: serverItem.latitude ?? serverItem.Latitude ?? item.location?.lat ?? null,
          lng: serverItem.longitude ?? serverItem.Longitude ?? item.location?.lng ?? null
        },
  photo: serverItem.photoUrl || serverItem.photoURL || serverItem.PhotoUrl || serverItem.PhotoBase64 || serverItem.photoBase64 || item.photo,
        status: serverItem.status || serverItem.Status || item.status || 'Pending',
        ownerId: serverItem.ownerId || serverItem.OwnerId || item.ownerId,
        ownerName: serverItem.ownerName || serverItem.OwnerName || item.ownerName,
      }
      }catch(err){
        try{ window.alert(err?.message || String(err)) }catch(e){ /* ignore */ }
        return
      }    const next = [...items, saved]
    setItems(next)
    store.set(KEY_LOST, next)

    const foundList = store.get(KEY_FOUND, [])
    const matches = findMatches('lost', saved, { candidates: foundList, maxMeters: 100 })
    if (matches.length > 0) {
      const m = matches[0]
      const t = notifyPotentialMatch(m)
      if (t && window.confirm(`Nearby “Found” match for "${saved.type}" within ~${m.distanceM}m. Open chat?`)) {
        nav(`/inbox?t=${t.id}`)
      }
    }
  }

  const visible = useMemo(() => {
    if (mine) return items
    return items
  }, [items, mine])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35 }}
      className="feed"
    >
      <ComposerLost onCreate={addItem} />

      <div className="panel" style={{padding:12, display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <div className="filters">
          <button className={`chip ${!mine ? 'active':''}`} onClick={()=>setMine(false)}>All posts</button>
          <button className={`chip ${mine ? 'active':''}`} onClick={()=>setMine(true)}>My posts</button>
        </div>
        <div style={{color:'var(--muted)'}}>{visible.length} item(s)</div>
      </div>

      {visible.length === 0 ? (
        <div className="panel center" style={{padding:24}}>No lost items yet.</div>
      ) : visible.map(i => <ItemCard key={i.id} item={i} type="lost" />)}
    </motion.div>
  )
}
