import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'

export default function Auth(){
  const nav = useNavigate()
  const { register, login } = useAuth()
  const { play } = useSettings()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name:'', email:'', password:'', confirmPassword: '', phone: '' })
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try{
      if(mode==='register'){
        if(form.password !== form.confirmPassword) throw new Error('Passwords do not match')
        await register(form)
      }
      else await login(form)
      play('success')
      nav('/lost', { replace:true })
    }catch(err){
      setError(err.message || 'Something went wrong')
    }
  }

  return (
    <div className="panel" style={{ padding: 24, maxWidth: 560, margin: '0 auto' }}>
      <div className="row" style={{ justifyContent:'space-between', alignItems:'center' }}>
        <h2 style={{ margin: 0 }}>{mode==='login' ? 'Welcome back' : 'Create your account'}</h2>
        <button className="btn ghost" onClick={()=>setMode(mode==='login'?'register':'login')}>
          {mode==='login' ? 'Need an account?' : 'Already registered?'}
        </button>
      </div>

      <form className="grid mt-4" onSubmit={submit} style={{ gap: 18 }}>
        {mode==='register' && (
          <div>
            <label>Full name</label>
            <input className="input" placeholder="Your name" value={form.name}
                   onChange={e=>setForm({...form, name:e.target.value})} required />
          </div>
        )}

        {mode==='register' && (
          <div>
            <label>Phone number</label>
            <input className="input" placeholder="+8801..." value={form.phone}
                   onChange={e=>setForm({...form, phone:e.target.value})} />
          </div>
        )}

        <div>
          <label>Email</label>
          <input className="input" type="email" placeholder="you@example.com" value={form.email}
                 onChange={e=>setForm({...form, email:e.target.value})} required />
        </div>

        <div>
          <label>Password</label>
          <input className="input" type="password" placeholder="••••••••" value={form.password}
                 onChange={e=>setForm({...form, password:e.target.value})} required minLength={6} />
        </div>

        {mode==='register' && (
          <div>
            <label>Confirm password</label>
            <input className="input" type="password" placeholder="••••••••" value={form.confirmPassword}
                   onChange={e=>setForm({...form, confirmPassword:e.target.value})} required minLength={6} />
          </div>
        )}

        {error && <p style={{ color: '#f87171', margin: 0 }}>{error}</p>}
        <div className="row" style={{ justifyContent:'flex-end' }}>
          <button className="btn" type="submit">{mode==='login' ? 'Login' : 'Register'}</button>
        </div>
      </form>

      <p className="mt-3" style={{ color:'var(--muted)' }}>
        You will remain logged in until you choose Logout from the profile menu.
      </p>
    </div>
  )
}
