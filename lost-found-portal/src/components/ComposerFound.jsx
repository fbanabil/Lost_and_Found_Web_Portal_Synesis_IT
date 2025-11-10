import { useState } from 'react'
import Modal from './Modal'
import MapPicker from './MapPicker'
import { useSettings } from '../context/SettingsContext'
import { useAuth } from '../context/AuthContext'

export default function ComposerFound({ onCreate }) {
  const [open, setOpen] = useState(false)
  const [publicForm, setPublicForm] = useState({ type:'', place:'', date:'', location:null })
  const [privateForm, setPrivateForm] = useState({ brand:'', color:'', detail:'' })
  const { play } = useSettings()
  const { user } = useAuth()
  const initials = (user?.name || user?.email || 'U')[0]?.toUpperCase()

  const submit = async (e) => {
    e.preventDefault()
    const item = {
      id: crypto.randomUUID(),
      ...publicForm,
      private: privateForm,
      status:'Pending',
      ownerId: user?.email || 'anon',
      ownerName: user?.name || user?.email || 'Anonymous'
    }

    try{
      const result = await Promise.resolve(onCreate ? onCreate(item) : item)
      play('success')
      setOpen(false)
      setPublicForm({ type:'', place:'', date:'', location:null })
      setPrivateForm({ brand:'', color:'', detail:'' })
    }catch(err){
      try{ window.alert(err?.message || String(err)) }catch(e){}
    }
  }

  return (
    <>
      <div className="panel composer">
        <div className="avatar" aria-hidden>{initials}</div>
        <button className="composer-input" onClick={()=>setOpen(true)}>Report a found item…</button>
        <button className="btn pill" onClick={()=>setOpen(true)}>Open</button>
      </div>

      <Modal
        open={open}
        onClose={()=>setOpen(false)}
        title="Report Found Item"
        footer={
          <>
            <button className="btn ghost" onClick={()=>setOpen(false)}>Cancel</button>
            <button className="btn" form="found-compose-form" type="submit">Post</button>
          </>
        }
      >
        <form id="found-compose-form" className="grid" onSubmit={submit} style={{ gap: 18 }}>
          <div className="field-row">
            <div>
              <label>Item type</label>
              <input className="input" placeholder="Phone, Wallet…" value={publicForm.type}
                     onChange={e=>setPublicForm({...publicForm, type:e.target.value})} required />
            </div>
            <div>
              <label>Place found</label>
              <input className="input" placeholder="Place" value={publicForm.place}
                     onChange={e=>setPublicForm({...publicForm, place:e.target.value})} />
            </div>
          </div>

          <div>
            <label>Date</label>
            <input className="input" type="date" value={publicForm.date}
                   onChange={e=>setPublicForm({...publicForm, date:e.target.value})} required />
          </div>

          <div>
            <label>Location</label>
            <MapPicker value={publicForm.location} onChange={(loc)=>setPublicForm({...publicForm, location: loc})} />
          </div>

          <div>
            <h4>Private attributes (for verification)</h4>
            <div className="field-row">
              <div>
                <label>Brand</label>
                <input className="input" placeholder="Brand" value={privateForm.brand}
                       onChange={e=>setPrivateForm({...privateForm, brand:e.target.value})} />
              </div>
              <div>
                <label>Color</label>
                <input className="input" placeholder="Color" value={privateForm.color}
                       onChange={e=>setPrivateForm({...privateForm, color:e.target.value})} />
              </div>
            </div>
            <div className="mt-3">
              <label>Extra detail</label>
              <input className="input" placeholder="e.g., zipper color, keychain" value={privateForm.detail}
                     onChange={e=>setPrivateForm({...privateForm, detail:e.target.value})} />
            </div>
          </div>
        </form>
      </Modal>
    </>
  )
}
