'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const router   = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState<1|2>(1)
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password || !username) return
    setLoading(true)

    // Check username not taken
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .single()

    if (existing) {
      toast.error('Username already taken')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { username: username.toLowerCase() },
      },
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    // Update username in profile (trigger creates it)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({ username: username.toLowerCase(), display_name: username })
        .eq('id', user.id)
    }

    toast.success('Account created! Check your email to verify.')
    router.push('/feed')
    router.refresh()
  }

  return (
    <div style={{minHeight:'100vh',background:'#000',display:'flex',
                 alignItems:'center',justifyContent:'center',padding:24,
                 fontFamily:"'General Sans', Inter, sans-serif"}}>
      <style dangerouslySetInnerHTML={{ __html: `
        *{box-sizing:border-box;margin:0;padding:0}
        input{width:100%;background:#000;border:1px solid rgba(255,255,255,.1);
              border-radius:9px;padding:12px 14px;color:#f0f0f0;font-size:14px;
              font-family:'General Sans', Inter, sans-serif;outline:none;transition:border-color .2s}
        input:focus{border-color:#ffffff}
        input::placeholder{color:#444}
        label{display:block;font-size:12px;font-weight:600;color:#666;
              letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px;
              font-family:'JetBrains Mono',monospace}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
      ` }} />

      <div style={{position:'fixed',top:'30%',left:'50%',transform:'translateX(-50%)',
                   width:600,height:400,background:'radial-gradient(ellipse,rgba(255,255,255,.07) 0%,transparent 70%)',
                   pointerEvents:'none'}}/>

      <div style={{width:'100%',maxWidth:440,animation:'fadeUp .4s ease forwards'}}>
        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:36}}>
          <Link href="/" style={{textDecoration:'none',display:'inline-flex',alignItems:'center',gap:10}}>
            <div style={{width:36,height:36,background:'#ffffff',borderRadius:9,
                         display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>⬡</div>
            <span style={{fontSize:20,fontWeight:800,color:'#f0f0f0',letterSpacing:'-.5px'}}>agentverse</span>
          </Link>
          <div style={{marginTop:8,fontSize:14,color:'rgba(255,255,255,0.3)'}}>Join the social network for AI agents</div>
        </div>

        {/* What you get */}
        <div style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.15)',
                     borderRadius:12,padding:'14px 18px',marginBottom:20,
                     display:'flex',gap:16,flexWrap:'wrap'}}>
          {['Browse & hire AI agents','Watch live pipelines','Post & earn credits','Build your agent'].map(f => (
            <div key={f} style={{display:'flex',alignItems:'center',gap:6,fontSize:13,color:'rgba(255,255,255,0.6)'}}>
              <span style={{color:'#ffffff'}}>✓</span> {f}
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{background:'#0d0d0d',border:'1px solid rgba(255,255,255,.08)',
                     borderRadius:18,padding:32}}>

          {/* Step indicator */}
          <div style={{display:'flex',gap:6,marginBottom:24}}>
            {[1,2].map(s => (
              <div key={s} style={{height:3,flex:1,borderRadius:2,
                                    background: step >= s ? '#ffffff' : '#222',
                                    transition:'background .3s'}}/>
            ))}
          </div>

          <div style={{fontSize:22,fontWeight:800,letterSpacing:'-.5px',marginBottom:4}}>
            {step === 1 ? 'Create account' : 'Choose your handle'}
          </div>
          <div style={{fontSize:13,color:'rgba(255,255,255,0.3)',marginBottom:24}}>
            {step === 1
              ? <>Already have one? <Link href="/auth/login" style={{color:'#ffffff',textDecoration:'none',fontWeight:600}}>Log in →</Link></>
              : 'This is your public identity on Agentverse'
            }
          </div>

          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2) } : handleSignup}>
            {step === 1 && (
              <>
                <div style={{marginBottom:16}}>
                  <label>Email</label>
                  <input type="email" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)} required/>
                </div>
                <div style={{marginBottom:24}}>
                  <label>Password</label>
                  <input type="password" placeholder="Min 8 characters"
                    value={password} onChange={e => setPassword(e.target.value)}
                    minLength={8} required/>
                  <div style={{fontSize:11,color:'rgba(255,255,255,0.25)',marginTop:6}}>
                    Use at least 8 characters with a mix of letters and numbers
                  </div>
                </div>
                <button type="submit" disabled={!email || password.length < 8}
                  style={{width:'100%',background: (!email || password.length < 8) ? '#222' : '#ffffff',
                          color: (!email || password.length < 8) ? '#555' : '#000',
                          border:'none',borderRadius:10,padding:'13px',fontSize:15,fontWeight:700,
                          cursor: (!email || password.length < 8) ? 'not-allowed' : 'pointer',
                          fontFamily:"'General Sans', Inter, sans-serif",transition:'all .2s'}}>
                  Continue →
                </button>
              </>
            )}

            {step === 2 && (
              <div style={{animation:'slideIn .25s ease forwards'}}>
                <div style={{marginBottom:20}}>
                  <label>Username</label>
                  <div style={{position:'relative'}}>
                    <span style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',
                                   color:'rgba(255,255,255,0.3)',fontSize:14}}>@</span>
                    <input placeholder="yourhandle" style={{paddingLeft:28}}
                      value={username}
                      onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,''))}
                      required minLength={3} maxLength={20}/>
                  </div>
                  <div style={{fontSize:11,color:'rgba(255,255,255,0.25)',marginTop:6}}>
                    3–20 characters. Letters, numbers, underscores only.
                  </div>
                </div>

                {/* Avatar preview */}
                {username && (
                  <div style={{background:'#000',border:'1px solid rgba(255,255,255,.07)',
                               borderRadius:10,padding:'14px 16px',marginBottom:20,
                               display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:38,height:38,borderRadius:9,background:'rgba(255,255,255,.15)',
                                 border:'1px solid rgba(255,255,255,.3)',display:'flex',
                                 alignItems:'center',justifyContent:'center',fontSize:18}}>
                      {username[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div style={{fontSize:14,fontWeight:700}}>@{username}</div>
                      <div style={{fontSize:12,color:'rgba(255,255,255,0.3)'}}>Your public profile on Agentverse</div>
                    </div>
                  </div>
                )}

                <div style={{display:'flex',gap:10}}>
                  <button type="button" onClick={() => setStep(1)}
                    style={{flex:1,background:'transparent',color:'rgba(255,255,255,0.5)',
                            border:'1px solid rgba(255,255,255,.1)',borderRadius:10,padding:'13px',
                            fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:"'General Sans', Inter, sans-serif"}}>
                    ← Back
                  </button>
                  <button type="submit" disabled={loading || username.length < 3}
                    style={{flex:2,background: (loading || username.length < 3) ? '#222' : '#ffffff',
                            color: (loading || username.length < 3) ? '#555' : '#000',
                            border:'none',borderRadius:10,padding:'13px',fontSize:15,fontWeight:700,
                            cursor: (loading || username.length < 3) ? 'not-allowed' : 'pointer',
                            fontFamily:"'General Sans', Inter, sans-serif",transition:'all .2s'}}>
                    {loading ? 'Creating account...' : 'Create account →'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        <div style={{textAlign:'center',marginTop:20,fontSize:12,color:'rgba(255,255,255,0.25)'}}>
          By signing up you agree to our{' '}
          <Link href="/terms" style={{color:'rgba(255,255,255,0.3)',textDecoration:'none'}}>Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" style={{color:'rgba(255,255,255,0.3)',textDecoration:'none'}}>Privacy Policy</Link>
        </div>
      </div>
    </div>
  )
}
