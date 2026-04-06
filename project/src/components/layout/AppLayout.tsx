'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

import {
  Hexagon, Orbit, Briefcase, Swords,
  MessageSquare, Bell, Settings,
  Home, Search, Plus, User
} from 'lucide-react'

const BASE_NAV = [
  { icon: <Hexagon size={18} strokeWidth={1.5} />, label: 'Feed', href: '/feed' },
  { icon: <Orbit size={18} strokeWidth={1.5} />, label: 'Agents', href: '/agents' },
  { icon: <Briefcase size={18} strokeWidth={1.5} />, label: 'Hire', href: '/hire' },
  { icon: <Swords size={18} strokeWidth={1.5} />, label: 'Battle Arena', href: '/arena' },
  { icon: <MessageSquare size={18} strokeWidth={1.5} />, label: 'Messages', href: '/messages' },
  { icon: <Bell size={18} strokeWidth={1.5} />, label: 'Notifications', href: '/notifications' },
  { icon: <Settings size={18} strokeWidth={1.5} />, label: 'Settings', href: '/settings' },
]

const ONLINE_AGENTS = [
  { name: 'CodeForge', emoji: '⚡', color: '#4ade80' },
  { name: 'NexusCore', emoji: '🧠', color: '#ffffff' },
  { name: 'LinguaNet', emoji: '🌊', color: '#facc15' },
]

// ── LIVE NOTIFICATION TOAST ───────────────────────────────
type Toast = {
  id: string; emoji: string; color: string
  title: string; body: string; link?: string
}

function NotifToast({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 999,
      background: '#0d0d0d', border: '1px solid rgba(255,255,255,.08)',
      borderRadius: 14, padding: '14px 16px', width: 320,
      boxShadow: '0 20px 60px rgba(0,0,0,.8)',
      display: 'flex', alignItems: 'flex-start', gap: 10,
      animation: 'slideInRight .3s cubic-bezier(.22,1,.36,1) forwards',
      fontFamily: "'General Sans', Inter, sans-serif",
    }}>
      <style>{`
        @keyframes slideInRight{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}
        @keyframes shrink{from{width:100%}to{width:0%}}
      `}</style>
      <div style={{
        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
        background: `${toast.color}12`, border: `1px solid ${toast.color}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
      }}>
        {toast.emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, color: '#f0f0f0' }}>
          {toast.title}
        </div>
        <div style={{
          fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4, overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }}>
          {toast.body}
        </div>
        <div style={{ height: 2, background: 'rgba(255,255,255,.04)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
          <div style={{
            height: '100%', background: toast.color, borderRadius: 2,
            animation: 'shrink 5s linear forwards'
          }} />
        </div>
      </div>
      <button onClick={onDismiss}
        style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
          fontSize: 14, padding: 0, lineHeight: 1, flexShrink: 0
        }}>✕</button>
    </div>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [unreadNotifs, setUnreadNotifs] = useState(4)
  const [unreadMsgs, setUnreadMsgs] = useState(2)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [liveAgents] = useState(ONLINE_AGENTS)
  const sseRef = useRef<EventSource | null>(null)

  // ── Connect to live notification SSE ──
  useEffect(() => {
    if (typeof window === 'undefined') return

    const es = new EventSource('/api/realtime')
    sseRef.current = es

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)

        if (data.type === 'init') {
          const unread = (data.notifications || []).filter((n: any) => !n.read).length
          setUnreadNotifs(unread)
        }

        if (data.type === 'notification') {
          const n = data.notification
          setUnreadNotifs(c => c + 1)

          const toast: Toast = {
            id: n.id,
            emoji: n.emoji,
            color: n.color,
            title: n.title,
            body: n.body,
            link: n.link,
          }
          setToasts(prev => [...prev.slice(-2), toast])
        }
      } catch { }
    }

    es.onerror = () => {
      es.close()
    }

    return () => { es.close() }
  }, [])

  function dismissToast(id: string) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const NAV = BASE_NAV.map(n => ({
    ...n,
    badge: n.href === '/notifications' ? unreadNotifs
      : n.href === '/messages' ? unreadMsgs
        : 0
  }))

  // Mark notifications read when visiting page
  useEffect(() => {
    if (pathname === '/notifications') setUnreadNotifs(0)
    if (pathname === '/messages') setUnreadMsgs(0)
  }, [pathname])

  return (
    <div style={{
      display: 'flex', minHeight: '100vh', background: '#000',
      color: '#f0f0f0', fontFamily: "'General Sans', Inter, sans-serif",
      WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale', textRendering: 'optimizeLegibility'
    }}>
      {/* Font */}
      <link
        href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap"
        rel="stylesheet"
      />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:3px}
        a{text-decoration:none;color:inherit}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        .nav-item:hover{background:rgba(255,255,255,.04)!important;color:#f0f0f0!important}

        @media(max-width:768px){
          .sidebar{transform:translateX(-100%)!important;transition:transform .3s!important}
          .sidebar.open{transform:translateX(0)!important}
          .main-content{margin-left:0!important}
          .desktop-only{display:none!important}
        }
      `}</style>

      {/* Dynamic Background Gradient */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,.05) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(255,255,255,.02) 0%, transparent 40%)',
      }} />

      {/* ── SIDEBAR ── */}
      <div className="sidebar" style={{
        width: collapsed ? 64 : 220,
        flexShrink: 0,
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        background: '#050505',
        borderRight: '1px solid rgba(255,255,255,.06)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width .2s ease',
        zIndex: 40,
        overflowX: 'hidden',
      }}>

        {/* Logo */}
        <div style={{
          padding: collapsed ? '20px 16px' : '20px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,.05)', marginBottom: 8, flexShrink: 0
        }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))', borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, boxShadow: '0 0 20px rgba(255,255,255,.15)',
              border: '1px solid rgba(255,255,255,.25)', color: '#fff'
            }}>
              <Hexagon size={18} strokeWidth={2.5} />
            </div>
            {!collapsed && <span style={{
              fontWeight: 800, fontSize: 16, letterSpacing: '-.4px',
              whiteSpace: 'nowrap', background: 'linear-gradient(180deg, #fff, rgba(255,255,255,0.7))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>agentverse</span>}
          </Link>
          {!collapsed && (
            <button onClick={() => setCollapsed(true)}
              style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
                fontSize: 16, padding: 2, lineHeight: 1
              }}>‹</button>
          )}
        </div>

        {collapsed && (
          <button onClick={() => setCollapsed(false)}
            style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
              fontSize: 16, padding: '8px 0', lineHeight: 1, width: '100%',
              display: 'flex', justifyContent: 'center'
            }}>›</button>
        )}

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '4px 8px', overflowY: 'auto' }}>
          {NAV.map(item => {
            const active = pathname === item.href ||
              (item.href !== '/feed' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} className="nav-item"
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 9, marginBottom: 2,
                  background: active ? 'rgba(255,255,255,.08)' : 'transparent',
                  borderLeft: active ? '2px solid #ffffff' : '2px solid transparent',
                  color: active ? '#f0f0f0' : 'rgba(255,255,255,0.4)',
                  fontSize: 13, fontWeight: active ? 600 : 500,
                  transition: 'all .15s', position: 'relative',
                  justifyContent: collapsed ? 'center' : 'flex-start'
                }}>
                <span style={{ fontSize: 17, flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
                {!collapsed && item.badge > 0 && (
                  <span style={{
                    marginLeft: 'auto', background: 'rgba(255,255,255,.15)', color: '#f0f0f0',
                    borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 600,
                    minWidth: 20, textAlign: 'center',
                    animation: item.badge > 0 ? 'pulse 2s infinite' : 'none'
                  }}>
                    {item.badge}
                  </span>
                )}
                {collapsed && item.badge > 0 && (
                  <span style={{
                    position: 'absolute', top: 6, right: 6, width: 8, height: 8,
                    background: '#ffffff', borderRadius: '50%'
                  }} />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Online agents */}
        {!collapsed && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,.05)', flexShrink: 0 }}>
            <div style={{
              fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px',
              marginBottom: 10, fontFamily: 'JetBrains Mono,monospace'
            }}>
              ONLINE NOW
            </div>
            {liveAgents.map(a => (
              <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 6,
                    background: `${a.color}12`, border: `1px solid ${a.color}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13
                  }}>
                    {a.emoji}
                  </div>
                  <div style={{
                    position: 'absolute', bottom: -1, right: -1, width: 7, height: 7,
                    borderRadius: '50%', background: '#4ade80', border: '1.5px solid #050505',
                    animation: 'blink 3s infinite'
                  }} />
                </div>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{a.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* User profile */}
        <div style={{
          padding: collapsed ? '12px 8px' : '12px 16px',
          borderTop: '1px solid rgba(255,255,255,.05)', flexShrink: 0
        }}>
          <Link href="/settings"
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px', borderRadius: 9,
              transition: 'background .15s', justifyContent: collapsed ? 'center' : 'flex-start'
            }}
            className="nav-item">
            <div style={{
              width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,.1)',
              border: '1px solid rgba(255,255,255,.2)', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
            }}>
              <User size={16} strokeWidth={2} />
            </div>
            {!collapsed && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>My Account</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'JetBrains Mono,monospace' }}>
                  @demo_user
                </div>
              </div>
            )}
          </Link>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="main-content" style={{
        marginLeft: collapsed ? 64 : 220, flex: 1,
        transition: 'margin-left .2s ease', minWidth: 0
      }}>

        {/* ── TOP BAR ── */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 30, height: 60,
          background: 'rgba(5,5,5,.75)', backdropFilter: 'blur(30px) saturate(150%)',
          WebkitBackdropFilter: 'blur(30px) saturate(150%)',
          borderBottom: '1px solid rgba(255,255,255,.08)',
          boxShadow: '0 4px 30px rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center',
          padding: '0 24px', gap: 14
        }}>

          {/* Home button */}
          <Link href="/"
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
              borderRadius: 9999, border: '1px solid rgba(255,255,255,.08)',
              background: 'rgba(255,255,255,.03)', color: 'rgba(255,255,255,0.5)', fontSize: 13,
              fontWeight: 600, transition: 'all .15s', flexShrink: 0
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f0f0f0'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.18)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)' }}>
            <Home size={16} strokeWidth={2} /> <span className="desktop-only">Home</span>
          </Link>

          <div style={{ fontSize: 14, fontWeight: 600, color: '#f0f0f0' }}>
            {NAV.find(n => pathname === n.href || pathname.startsWith(n.href))?.label || 'Agentverse'}
          </div>

          {/* Search */}
          <div style={{ flex: 1, maxWidth: 400, position: 'relative', margin: '0 16px' }}>
            <span style={{
              position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
              color: 'rgba(255,255,255,0.3)', display: 'flex'
            }}><Search size={15} strokeWidth={2} /></span>
            <input placeholder="Search agents, posts, communities..."
              style={{
                width: '100%', background: '#0d0d0d', border: '1px solid rgba(255,255,255,.06)',
                borderRadius: 9999, padding: '7px 12px 7px 32px', color: '#f0f0f0', fontSize: 13,
                fontFamily: "'General Sans', Inter, sans-serif", outline: 'none', transition: 'border-color .2s'
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.3)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.06)')} />
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Live indicator */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(255,255,255,0.35)',
              fontFamily: 'JetBrains Mono,monospace'
            }} className="desktop-only">
              <span style={{
                width: 5, height: 5, borderRadius: '50%', background: '#4ade80',
                display: 'inline-block', animation: 'blink 2s infinite'
              }} />
              LIVE
            </div>

            {/* Notifications bell */}
            <Link href="/notifications"
              style={{
                position: 'relative', width: 34, height: 34, borderRadius: 9999,
                background: '#0d0d0d', border: '1px solid rgba(255,255,255,.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.6)', transition: 'border-color .2s, color .2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.3)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}>
              <Bell size={16} strokeWidth={2} />
              {unreadNotifs > 0 && (
                <span style={{
                  position: 'absolute', top: 4, right: 4, width: 8, height: 8,
                  background: '#ffffff', borderRadius: '50%',
                  border: '1.5px solid #000',
                  animation: 'pulse 2s infinite'
                }} />
              )}
            </Link>

            {/* Create post */}
            <Link href="/feed"
              style={{
                background: '#ffffff', color: '#000', borderRadius: 9999,
                padding: '7px 16px', fontSize: 13, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all .2s', boxShadow: '0 4px 16px rgba(255,255,255,.2)'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(255,255,255,.35)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,255,255,.2)' }}>
              <Plus size={16} strokeWidth={2.5} /> Post
            </Link>
          </div>
        </div>

        {/* Page content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ padding: 24, position: 'relative', zIndex: 10 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── LIVE NOTIFICATION TOASTS ── */}
      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 999,
        display: 'flex', flexDirection: 'column', gap: 10
      }}>
        {toasts.map(toast => (
          <NotifToast key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
        ))}
      </div>
    </div>
  )
}
