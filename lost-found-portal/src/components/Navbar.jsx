import { NavLink, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import UserMenu from './UserMenu'
import NotificationMenu from './NotificationMenu'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'

export default function Navbar(){
  const { user } = useAuth()
  const { unreadTotal } = useChat()

  const brandHref = user ? '/lost' : '/'

  const Tab = ({ to, label, isInbox }) => {
    const unread = isInbox && user ? unreadTotal(user.email) : 0
    return (
      <NavLink
        to={to}
        className="btn ghost"
        style={{
          position:'relative', overflow:'hidden', textTransform:'capitalize',
          height: 40, padding: '0 16px'
        }}
      >
        {({ isActive }) => (
          <>
            {label}
            {isActive && (
              <motion.span
                layoutId="nav-pill"
                style={{
                  position:'absolute', inset:0, borderRadius:12,
                  background:'color-mix(in hsl, var(--accent), #fff 85%)', opacity:.18
                }}
                transition={{ type:'spring', stiffness:280, damping:24 }}
              />
            )}
            {/* Facebook-style red dot for unread */}
            {isInbox && unread > 0 && (
              <span
                aria-label="unread"
                style={{
                  position:'absolute', top:6, right:6, width:10, height:10,
                  borderRadius:'50%', background:'#e02424', boxShadow:'0 0 0 2px var(--panel)'
                }}
              />
            )}
          </>
        )}
      </NavLink>
    )
  }

  return (
    <header className="container" style={{paddingTop:16, position:'relative', zIndex:2000}}>
      {/* Top brand bar */}
      <div
        className="panel"
        style={{
          padding:'10px 16px',
          marginBottom:12,
          display:'grid',
          gridTemplateColumns:'1fr auto 1fr',
          alignItems:'center'
        }}
      >
        {/* Left: brand logo + name */}
        <Link to={brandHref} style={{textDecoration:'none', display:'flex', alignItems:'center', gap:12}}>
          <div
            aria-hidden
            style={{
              width:36, height:36, borderRadius:9999,
              display:'grid', placeItems:'center',
              background:'color-mix(in hsl, var(--accent), #000 15%)',
              color:'#fff', fontWeight:800, boxShadow:'var(--shadow)'
            }}
            title="Lost & Found"
          >
            L&F
          </div>
          <h1 style={{margin:0, fontSize:28, lineHeight:1.1, letterSpacing:'.2px', color:'var(--text)'}}>Lost &amp; Found</h1>
        </Link>

        {/* Center: tabs */}
        <nav className="row" style={{justifyContent:'center', gap:10}}>
          <Tab to="/lost" label="Lost" />
          <Tab to="/found" label="Found" />
          {user && <Tab to="/inbox" label="Inbox" isInbox />}
        </nav>

        {/* Right: auth / profile */}
        <div className="row" style={{justifyContent:'flex-end', gap:'8px', alignItems:'center'}}>
          {!user && (
            <Link to="/auth" className="btn secondary" style={{height:40}}>
              Login / Register
            </Link>
          )}
          {user && (
            <>
              <NotificationMenu />
              <UserMenu />
            </>
          )}
        </div>
      </div>

      {/* Decorative underline */}
      <motion.div
        layoutId="underline"
        style={{height:2, background:'var(--accent)', width: '100%', opacity:.25, borderRadius:999}}
      />
    </header>
  )
}
