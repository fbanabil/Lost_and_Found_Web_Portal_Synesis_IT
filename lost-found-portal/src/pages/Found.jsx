// src/pages/Found.jsx
import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { store } from '../utils/storage'
import ItemCard from '../components/ItemCard'
import ComposerFound from '../components/ComposerFound'
import Modal from '../components/Modal'
import MapPicker from '../components/MapPicker'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'
import { findMatches } from '../utils/matcher'
import { useNavigate } from 'react-router-dom'

const KEY_FOUND = 'lf_found_v1'
const KEY_LOST = 'lf_lost_v1'

export default function Found(){
  const [items, setItems] = useState(()=> store.get(KEY_FOUND, []))
  const [mine, setMine] = useState(false)
  const { user } = useAuth()
  const { notifyPotentialMatch } = useChat()
  const nav = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [filterData, setFilterData] = useState({
    itemType: '',
    dateOfLoss: '',
    location: null
  })
  const [isFilterActive, setIsFilterActive] = useState(false)
  const [filteredItems, setFilteredItems] = useState([])

  const addItem = async (item) => {
    const payload = {
      Type: item.type,
      Place: item.place || '',
      FoundDate: item.date || null,
      Brand: item.private?.brand || item.brand || '',
      Color: item.private?.color || item.color || '',
      Detail: item.private?.detail || item.marks || '',
      Latitude: item.location?.lat ?? null,
      Longitude: item.location?.lng ?? null
    }

    let saved = null
    try{
      const token = user?.accessToken
      const headers = { 'Content-Type': 'application/json' }
      if(token) headers['Authorization'] = `Bearer ${token}`

      const resp = await fetch('https://localhost:7238/LostAndFound/AddFoundItem', {
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
        brand: serverItem.brand || serverItem.Brand || item.private?.brand || item.brand,
        color: serverItem.color || serverItem.Color || item.private?.color || item.color,
        marks: serverItem.detail || serverItem.Detail || serverItem.marks || serverItem.Marks || item.private?.detail || item.marks,
        detail: serverItem.detail || serverItem.Detail || item.private?.detail || item.marks,
        place: serverItem.place || serverItem.Place || item.place,
        date: serverItem.foundDate || serverItem.FoundDate || serverItem.date || serverItem.Date || item.date,
        location: {
          lat: serverItem.latitude ?? serverItem.Latitude ?? item.location?.lat ?? null,
          lng: serverItem.longitude ?? serverItem.Longitude ?? item.location?.lng ?? null
        },
        photo: serverItem.photoUrl || serverItem.PhotoUrl || serverItem.PhotoBase64 || serverItem.photoBase64 || null,
        status: serverItem.status || serverItem.Status || item.status || 'Pending',
        ownerId: serverItem.ownerId || serverItem.OwnerId || item.ownerId,
        ownerName: serverItem.ownerName || serverItem.OwnerName || item.ownerName
      }
    }catch(err){
      try{ window.alert(err?.message || String(err)) }catch(e){}
      return
    }

    const next = [...items, saved]
    setItems(next)
    store.set(KEY_FOUND, next)

    const lostList = store.get(KEY_LOST, [])
    const matches = findMatches('found', saved, { candidates: lostList, maxMeters: 100 })
    if (matches.length > 0) {
      const m = matches[0]
      const t = notifyPotentialMatch(m)
      if (t && window.confirm(`Nearby “Lost” match for "${saved.type}" within ~${m.distanceM}m. Open chat?`)) {
        nav(`/inbox?t=${t.id}`)
      }
    }
  }

  useEffect(() => {
    let mounted = true
    const fetchAll = async () => {
      setLoading(true)
      setError(null)
      try{
        const token = user?.accessToken
        const headers = { 'Content-Type': 'application/json' }
        if(token) headers['Authorization'] = `Bearer ${token}`

        const resp = await fetch('https://localhost:7238/LostAndFound/GetFoundItems', { method: 'GET', headers })
        if(!resp.ok) throw new Error(`Server returned ${resp.status}`)
        const list = await resp.json()
        const normalized = (Array.isArray(list) ? list : []).map(si => ({
          id: si.id || si.Id || crypto.randomUUID(),
          type: si.type || si.Type || '',
          brand: si.brand || si.Brand || '',
          color: si.color || si.Color || '',
          marks: si.marks || si.Marks || si.detail || si.Detail || '',
          place: si.place || si.Place || '',
          date: si.foundDate || si.FoundDate || si.date || si.Date || null,
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
        store.set(KEY_FOUND, normalized)
      }catch(err){
        const cached = store.get(KEY_FOUND, [])
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

        const resp = await fetch('https://localhost:7238/LostAndFound/GetMyFoundItemsPost', { method: 'GET', headers })
        if(!resp.ok) throw new Error(`Server returned ${resp.status}`)
        const list = await resp.json()
        const normalized = (Array.isArray(list) ? list : []).map(si => ({
          id: si.id || si.Id || crypto.randomUUID(),
          type: si.type || si.Type || '',
          brand: si.brand || si.Brand || '',
          color: si.color || si.Color || '',
          marks: si.marks || si.Marks || si.detail || si.Detail || '',
          place: si.place || si.Place || '',
          date: si.foundDate || si.FoundDate || si.date || si.Date || null,
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
        store.set(KEY_FOUND, normalized)
      }catch(err){
        const cached = store.get(KEY_FOUND, [])
        const mineCached = cached.filter(i => i.ownerId && user?.email && i.ownerId === user.email)
        if(mounted){ setItems(mineCached); setError(err) }
      }finally{ if(mounted) setLoading(false) }
    }

    if(mine) fetchMine(); else fetchAll()
    return () => { mounted = false }
  }, [mine, user])

  const visible = useMemo(() => {
    if (isFilterActive) {
      return mine ? filteredItems.filter(i => i.ownerId && user?.email && i.ownerId === user.email) : filteredItems
    }
    if (mine) return items
    return items
  }, [items, mine, isFilterActive, filteredItems, user])

  const handleFilterSubmit = async () => {
    if (!filterData.itemType || !filterData.dateOfLoss || !filterData.location?.lat || !filterData.location?.lng) {
      alert('Please fill in all required fields: Item Type, Date of Loss, and Location')
      return
    }

    setLoading(true)
    try {
      const token = user?.accessToken
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const filterParams = new URLSearchParams({
        ItemType: filterData.itemType,
        DateOfLoss: filterData.dateOfLoss,
        Latitude: filterData.location.lat.toString(),
        Longitude: filterData.location.lng.toString()
      })

      const resp = await fetch(`https://localhost:7238/LostAndFound/GetFoundItemsByFiltering?${filterParams}`, {
        method: 'GET',
        headers
      })

      if (!resp.ok) {
        throw new Error(`Server returned ${resp.status}`)
      }

      const list = await resp.json()
      const normalized = (Array.isArray(list) ? list : []).map(si => ({
        id: si.id || si.Id || crypto.randomUUID(),
        type: si.type || si.Type || '',
        brand: si.brand || si.Brand || '',
        color: si.color || si.Color || '',
        marks: si.marks || si.Marks || si.detail || si.Detail || '',
        place: si.place || si.Place || '',
        date: si.foundDate || si.FoundDate || si.date || si.Date || null,
        location: {
          lat: si.latitude ?? si.Latitude ?? (si.location?.lat) ?? null,
          lng: si.longitude ?? si.Longitude ?? (si.location?.lng) ?? null
        },
        photo: si.photoUrl || si.PhotoUrl || si.photo || si.PhotoBase64 || si.photoBase64 || null,
        status: si.status || si.Status || 'Pending',
        ownerId: si.ownerId || si.OwnerId || si.owner || null,
        ownerName: si.ownerName || si.OwnerName || si.personName || null
      }))

      setFilteredItems(normalized)
      setIsFilterActive(true)
      setShowFilterModal(false)
    } catch (err) {
      alert(err?.message || 'Failed to apply filter')
    } finally {
      setLoading(false)
    }
  }

  const handleClearFilter = () => {
    setFilterData({
      itemType: '',
      dateOfLoss: '',
      location: null
    })
    setFilteredItems([])
    setIsFilterActive(false)
  }



  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35 }}
      className="feed"
    >
      <ComposerFound onCreate={addItem} />

      <div className="panel" style={{padding:12, display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <div className="filters" style={{display:'flex', gap:'8px', alignItems:'center'}}>
          <button className={`chip ${!mine ? 'active':''}`} onClick={()=>setMine(false)}>All posts</button>
          <button className={`chip ${mine ? 'active':''}`} onClick={()=>setMine(true)}>My posts</button>
          <div style={{display:'flex', alignItems:'center', gap:'4px'}}>
            <button 
              className={`chip ${isFilterActive ? 'active' : ''}`} 
              onClick={()=>setShowFilterModal(true)} 
              style={{
                backgroundColor: isFilterActive ? 'var(--accent)' : 'var(--primary)', 
                color:'white'
              }}
            >
              🔍 Filter
            </button>
            {isFilterActive && (
              <button 
                className="chip" 
                onClick={handleClearFilter}
                style={{
                  backgroundColor:'var(--danger)', 
                  color:'white', 
                  padding:'4px 8px',
                  fontSize:'12px',
                  minWidth:'auto'
                }}
                title="Clear Filter"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        <div style={{color:'var(--muted)'}}>{visible.length} item(s)</div>
      </div>

      {visible.length === 0 ? (
        <div className="panel center" style={{padding:24}}>No found items yet.</div>
      ) : visible.map(i => <ItemCard key={i.id} item={i} type="found" />)}

      {/* Filter Modal */}
      <Modal 
        open={showFilterModal} 
        onClose={() => setShowFilterModal(false)}
        title="Filter Found Items"
        footer={
          <div style={{display:'flex', gap:'12px', justifyContent:'flex-end'}}>
            <button 
              className="btn" 
              onClick={() => setShowFilterModal(false)}
              style={{backgroundColor:'var(--muted)', color:'white'}}
            >
              Cancel
            </button>
            <button 
              className="btn primary" 
              onClick={handleFilterSubmit}
            >
              Filter
            </button>
          </div>
        }
      >
        <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
          {/* Item Type Field */}
          <div>
            <label style={{display:'block', marginBottom:'8px', fontWeight:'500'}}>
              Item Type <span style={{color:'var(--danger)'}}>*</span>
            </label>
            <input 
              type="text"
              className="input" 
              placeholder="Enter item type (e.g., Phone, Wallet, Keys)"
              value={filterData.itemType} 
              onChange={(e) => setFilterData({...filterData, itemType: e.target.value})}
              required
            />
          </div>

          {/* Date of Loss Field */}
          <div>
            <label style={{display:'block', marginBottom:'8px', fontWeight:'500'}}>
              Date of Loss <span style={{color:'var(--danger)'}}>*</span>
            </label>
            <input 
              type="date" 
              className="input" 
              value={filterData.dateOfLoss} 
              onChange={(e) => setFilterData({...filterData, dateOfLoss: e.target.value})}
              required
            />
          </div>

          {/* Location (Map Picker) Field */}
          <div>
            <label style={{display:'block', marginBottom:'8px', fontWeight:'500'}}>
              Location (Latitude & Longitude) <span style={{color:'var(--danger)'}}>*</span>
            </label>
            <MapPicker 
              value={filterData.location} 
              onChange={(location) => setFilterData({...filterData, location})}
            />
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
