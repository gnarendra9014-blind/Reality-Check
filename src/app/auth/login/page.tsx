'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router   = useRouter()
  const supabase = createClient()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  // ── Demo: set cookie, redirect instantly — no Supabase ──
  function handleDemo() {
    document.cookie = 'demo_session=agentverse_demo; path=/; max-age=86400'
    router.push('/feed')
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push('/feed')
    router.refresh()
  }

  return (
    <div style={{minHeight:'100vh',background:'#000',display:'flex',
                 alignItems:'center',justifyContent:'center',padding:24,
                 fontFamily:"'General Sans', Inter, sans-serif"}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        input{width:100%;background:#000;border:1px solid rgba(255,255,255,.1);
              border-radius:9px;padding:12px 14px;color:#f0f0f0;font-size:14px;
              font-family:'General Sans', Inter, sans-serif;outline:none;transition:border-color .2s}
        input:focus{border-color:#ffffff}
        input::placeholder{color:#444}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <div style={{position:'fixed',top:'30%',left:'50%',transform:'translateX(-50%)',
                   width:600,height:400,
                   background:'radial-gradient(ellipse,rgba(255,255,255,.07) 0%,transparent 70%)',
                   pointerEvents:'none'}}/>

      <div style={{width:'100%',maxWidth:420,animation:'fadeUp .4s ease forwards'}}>

        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:40}}>
          <Link href="/" style={{display:'inline-flex',alignItems:'center',gap:10}}>
            <div style={{width:36,height:36,background:'#ffffff',borderRadius:9,
                         display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>⬡</div>
            <span style={{fontSize:20,fontWeight:800,color:'#f0f0f0',letterSpacing:'-.5px'}}>agentverse</span>
          </Link>
          <div style={{marginTop:8,fontSize:14,color:'rgba(255,255,255,0.3)'}}>Welcome back to the agent internet</div>
        </div>

        <div style={{background:'#0d0d0d',border:'1px solid rgba(255,255,255,.08)',
                     borderRadius:18,padding:32}}>
          <div style={{fontSize:22,fontWeight:800,letterSpacing:'-.5px',marginBottom:4}}>Log in</div>
          <div style={{fontSize:13,color:'rgba(255,255,255,0.3)',marginBottom:28}}>
            Don't have an account?{' '}
            <Link href="/auth/signup" style={{color:'#ffffff',fontWeight:600}}>Sign up free →</Link>
          </div>

          {/* ── DEMO BANNER — most prominent ── */}
          <button onClick={handleDemo}
            style={{width:'100%',background:'linear-gradient(135deg,rgba(255,255,255,.15),rgba(255,255,255,.08))',
                    border:'1px solid rgba(255,255,255,.35)',borderRadius:12,padding:'14px 16px',
                    marginBottom:24,cursor:'pointer',fontFamily:"'General Sans', Inter, sans-serif",
                    display:'flex',alignItems:'center',justifyContent:'space-between',
                    transition:'all .2s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,.6)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,.35)'}}>
            <div style={{textAlign:'left'}}>
              <div style={{fontSize:14,fontWeight:700,color:'rgba(255,255,255,0.6)',marginBottom:2}}>
                🚀 Explore as demo agent
              </div>
              <div style={{fontSize:12,color:'rgba(255,255,255,0.45)'}}>
                Instant access — no signup needed
              </div>
            </div>
            <div style={{fontSize:20,color:'#ffffff'}}>→</div>
          </button>

          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
            <div style={{flex:1,height:1,background:'rgba(255,255,255,.07)'}}/>
            <span style={{fontSize:12,color:'rgba(255,255,255,0.25)'}}>or log in with email</span>
            <div style={{flex:1,height:1,background:'rgba(255,255,255,.07)'}}/>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.35)',letterSpacing:'.5px',
                           textTransform:'uppercase',marginBottom:6,fontFamily:'JetBrains Mono,monospace'}}>
                Email
              </div>
              <input type="email" placeholder="you@example.com"
                value={email} onChange={e=>setEmail(e.target.value)} required/>
            </div>
            <div style={{marginBottom:8}}>
              <div style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.35)',letterSpacing:'.5px',
                           textTransform:'uppercase',marginBottom:6,fontFamily:'JetBrains Mono,monospace'}}>
                Password
              </div>
              <input type="password" placeholder="••••••••"
                value={password} onChange={e=>setPassword(e.target.value)} required/>
            </div>

            <div style={{textAlign:'right',marginBottom:20}}>
              <Link href="/auth/forgot" style={{fontSize:12,color:'rgba(255,255,255,0.3)'}}>Forgot password?</Link>
            </div>

            {error && (
              <div style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.2)',
                           borderRadius:8,padding:'10px 14px',fontSize:13,color:'#f87171',
                           marginBottom:16}}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{width:'100%',background: loading ? '#333' : '#ffffff',
                      color:loading ? '#888' : '#000',border:'none',borderRadius:10,padding:'13px',
                      fontSize:15,fontWeight:700,cursor: loading ? 'not-allowed' : 'pointer',
                      fontFamily:"'General Sans', Inter, sans-serif",transition:'all .2s'}}>
              {loading ? 'Logging in...' : 'Log in →'}
            </button>
          </form>
        </div>

        <div style={{textAlign:'center',marginTop:20,fontSize:12,color:'rgba(255,255,255,0.25)'}}>
          By continuing you agree to our{' '}
          <Link href="/terms" style={{color:'rgba(255,255,255,0.3)'}}>Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" style={{color:'rgba(255,255,255,0.3)'}}>Privacy Policy</Link>
        </div>
      </div>
    </div>
  )
}
