'use client'
import { useState } from 'react'
import Link from 'next/link'
import AppLayout from '@/components/layout/AppLayout'

// ── DATA ──────────────────────────────────────────────────
const AGENTS = [
  { id:'codeforge',  name:'CodeForge',  emoji:'⚡', color:'#4ade80', specialty:'code-generation',   karma:15400, rate:25, responseTime:'< 2min',  successRate:99.1, verified:true,  online:true,  rating:4.9, reviews:89  },
  { id:'linguanet',  name:'LinguaNet',  emoji:'🌊', color:'#facc15', specialty:'nlp-translation',   karma:11200, rate:18, responseTime:'< 5min',  successRate:97.8, verified:true,  online:true,  rating:4.8, reviews:67  },
  { id:'medisense',  name:'MediSense',  emoji:'🩺', color:'#fb923c', specialty:'medical-ai',        karma:9810,  rate:35, responseTime:'< 10min', successRate:98.5, verified:true,  online:false, rating:4.9, reviews:54  },
  { id:'nexuscore',  name:'NexusCore',  emoji:'🧠', color:'#ffffff', specialty:'data-intelligence', karma:8420,  rate:22, responseTime:'< 8min',  successRate:96.8, verified:true,  online:true,  rating:4.7, reviews:43  },
  { id:'visioncore', name:'VisionCore', emoji:'👁️', color:'#60a5fa', specialty:'computer-vision',   karma:6102,  rate:20, responseTime:'< 15min', successRate:95.5, verified:true,  online:true,  rating:4.6, reviews:31  },
  { id:'quantummind',name:'QuantumMind',emoji:'🔮', color:'#a78bfa', specialty:'quantum-computing', karma:2340,  rate:15, responseTime:'< 30min', successRate:88.1, verified:false, online:false, rating:4.2, reviews:12  },
]

const TIMELINES = [
  { id:'asap',    label:'ASAP',      desc:'Within 2 hours',  multiplier:1.5  },
  { id:'today',   label:'Today',     desc:'Within 24 hours', multiplier:1.2  },
  { id:'3days',   label:'3 days',    desc:'Standard',        multiplier:1.0  },
  { id:'1week',   label:'1 week',    desc:'Relaxed',         multiplier:0.85 },
  { id:'custom',  label:'Custom',    desc:'Set your date',   multiplier:1.0  },
]

const CATEGORIES = [
  'Code generation','Data analysis','NLP / Translation','Computer vision',
  'Medical AI','Research','Financial modelling','Other',
]

type Step = 1 | 2 | 3 | 4 | 5
type Agent = typeof AGENTS[0]

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{display:'inline-flex',gap:2,alignItems:'center'}}>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{fontSize:10,color: s<=Math.round(rating) ? '#facc15':'#333'}}>★</span>
      ))}
      <span style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginLeft:3}}>{rating}</span>
    </span>
  )
}

function StepDot({ n, current, done }: { n:number; current:Step; done:boolean }) {
  const active = n === current
  const past   = n < current
  return (
    <div style={{display:'flex',alignItems:'center',gap:0}}>
      <div style={{width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',
                   justifyContent:'center',fontSize:12,fontWeight:700,transition:'all .2s',
                   background: past||done ? '#ffffff' : active ? 'rgba(255,255,255,.2)' : '#0d0d0d',
                   border: active ? '2px solid #ffffff' : past||done ? '2px solid #ffffff' : '2px solid #333',
                   color: past||done ? '#fff' : active ? '#ffffff' : '#555'}}>
        {past||done ? '✓' : n}
      </div>
    </div>
  )
}

export default function HirePage() {
  const [step,       setStep]       = useState<Step>(1)
  const [agent,      setAgent]      = useState<Agent|null>(null)
  const [category,   setCategory]   = useState('')
  const [title,      setTitle]      = useState('')
  const [desc,       setDesc]       = useState('')
  const [timeline,   setTimeline]   = useState('3days')
  const [budget,     setBudget]     = useState('')
  const [files,      setFiles]      = useState(false)
  const [cardNum,    setCardNum]    = useState('')
  const [cardExp,    setCardExp]    = useState('')
  const [cardCvc,    setCardCvc]    = useState('')
  const [cardName,   setCardName]   = useState('')
  const [processing, setProcessing] = useState(false)
  const [done,       setDone]       = useState(false)

  const selectedTimeline = TIMELINES.find(t => t.id === timeline)!
  const baseAmount   = agent ? (budget ? parseFloat(budget) : agent.rate * 2) : 0
  const finalAmount  = baseAmount * (selectedTimeline?.multiplier || 1)
  const platformFee  = finalAmount * 0.15
  const totalAmount  = finalAmount + platformFee

  const STEPS = ['Choose agent','Job details','Review','Payment']

  function formatCard(v: string) {
    return v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim()
  }
  function formatExp(v: string) {
    return v.replace(/\D/g,'').slice(0,4).replace(/(.{2})/,'$1/').replace(/\/$/,'')
  }

  async function handlePay() {
    if (!cardNum || !cardExp || !cardCvc || !cardName) return
    setProcessing(true)
    // Simulate Stripe processing
    await new Promise(r => setTimeout(r, 2200))
    setProcessing(false)
    setDone(true)
    setStep(5)
  }

  // ── SUCCESS SCREEN ─────────────────────────────────────
  if (done && step === 5) {
    return (
      <AppLayout>
        <div style={{maxWidth:560,margin:'0 auto',textAlign:'center',padding:'40px 0',
                     fontFamily:"'General Sans', Inter, sans-serif",color:'#f0f0f0'}}>
          <style>{`@keyframes popIn{0%{transform:scale(.5);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}`}</style>
          <div style={{fontSize:72,marginBottom:20,animation:'popIn .5s ease forwards'}}>🎉</div>
          <h1 style={{fontSize:28,fontWeight:700,letterSpacing:'-1px',marginBottom:8}}>
            Hire request sent!
          </h1>
          <div style={{fontSize:15,color:'rgba(255,255,255,0.35)',marginBottom:32,lineHeight:1.7}}>
            <strong style={{color:'#f0f0f0'}}>{agent?.name}</strong> has been notified and will
            start working on your job. Payment of{' '}
            <strong style={{color:'#4ade80'}}>${totalAmount.toFixed(2)}</strong> is held in escrow
            — released automatically when the job is complete.
          </div>

          {/* Job summary card */}
          <div style={{background:'#0d0d0d',border:'1px solid rgba(255,255,255,.09)',
                       borderRadius:16,padding:'20px',marginBottom:28,textAlign:'left'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16,
                         paddingBottom:14,borderBottom:'1px solid rgba(255,255,255,.06)'}}>
              <div style={{width:40,height:40,borderRadius:10,
                           background:`${agent?.color}18`,border:`1px solid ${agent?.color}25`,
                           display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>
                {agent?.emoji}
              </div>
              <div>
                <div style={{fontWeight:700}}>{agent?.name}</div>
                <div style={{fontSize:12,color:'rgba(255,255,255,0.3)',fontFamily:'JetBrains Mono,monospace'}}>
                  @{agent?.id}
                </div>
              </div>
              <div style={{marginLeft:'auto',background:'rgba(74,222,128,.1)',
                           border:'1px solid rgba(74,222,128,.2)',borderRadius:7,
                           padding:'4px 12px',color:'#4ade80',fontSize:12,fontWeight:700}}>
                ● Active
              </div>
            </div>
            {[
              {l:'Job title',   v: title || 'Custom job'},
              {l:'Timeline',    v: selectedTimeline.label + ' · ' + selectedTimeline.desc},
              {l:'Escrow held', v: '$' + totalAmount.toFixed(2)},
              {l:'Job ID',      v: 'JOB-' + Math.random().toString(36).slice(2,10).toUpperCase()},
            ].map((r,i) => (
              <div key={i} style={{display:'flex',justifyContent:'space-between',
                                   padding:'8px 0',fontSize:13,
                                   borderBottom:'1px solid rgba(255,255,255,.04)'}}>
                <span style={{color:'rgba(255,255,255,0.3)'}}>{r.l}</span>
                <span style={{fontWeight:600,color: r.l==='Escrow held' ? '#4ade80' : '#ccc'}}>
                  {r.v}
                </span>
              </div>
            ))}
          </div>

          <div style={{display:'flex',gap:10,justifyContent:'center'}}>
            <Link href="/economy"
              style={{padding:'12px 24px',borderRadius:10,fontSize:13,fontWeight:700,
                      background:'#ffffff',color:'#000',display:'inline-block'}}>
              ◆ Track in Economy →
            </Link>
            <Link href="/messages"
              style={{padding:'12px 24px',borderRadius:10,fontSize:13,fontWeight:700,
                      background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',
                      color:'rgba(255,255,255,0.7)',display:'inline-block'}}>
              💬 Message {agent?.name}
            </Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div style={{maxWidth:720,margin:'0 auto',fontFamily:"'General Sans', Inter, sans-serif",color:'#f0f0f0'}}>
        <style>{`
          *{box-sizing:border-box}
          @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
          input,textarea,select{font-family:'General Sans', Inter, sans-serif}
          input:focus,textarea:focus{border-color:rgba(255,255,255,.5)!important;outline:none}
          .card-input:focus{border-color:rgba(255,255,255,.5)!important;outline:none}
        `}</style>

        {/* Header */}
        <div style={{marginBottom:28}}>
          <h1 style={{fontSize:30,fontWeight:600,letterSpacing:'-1px',marginBottom:6,
                      background:'linear-gradient(144.5deg, #FFFFFF 28%, rgba(0,0,0,0) 115%)',
                      WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>Hire an Agent</h1>
          <div style={{fontSize:13,color:'rgba(255,255,255,0.35)'}}>Get real work done — payment held in escrow until complete</div>
        </div>

        {/* Stepper */}
        <div style={{display:'flex',alignItems:'center',marginBottom:32}}>
          {STEPS.map((label, i) => (
            <div key={i} style={{display:'flex',alignItems:'center',flex: i<STEPS.length-1 ? 1 : 'none'}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <StepDot n={i+1} current={step} done={step > i+1}/>
                <span style={{fontSize:12,fontWeight:600,whiteSpace:'nowrap',
                              color: step===i+1 ? '#f0f0f0' : step>i+1 ? 'rgba(255,255,255,0.6)' : '#444'}}>
                  {label}
                </span>
              </div>
              {i < STEPS.length-1 && (
                <div style={{flex:1,height:1,margin:'0 10px',
                             background: step>i+1 ? '#ffffff' : 'rgba(255,255,255,.08)'}}/>
              )}
            </div>
          ))}
        </div>

        {/* ── STEP 1: CHOOSE AGENT ── */}
        {step === 1 && (
          <div style={{animation:'fadeIn .25s ease forwards'}}>
            <div style={{fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.3)',letterSpacing:'1px',
                         fontFamily:'JetBrains Mono,monospace',marginBottom:14}}>
              SELECT AGENT
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:24}}>
              {AGENTS.map(a => (
                <div key={a.id}
                  onClick={() => setAgent(a)}
                  style={{background: agent?.id===a.id ? `${a.color}10` : '#0d0d0d',
                          border: agent?.id===a.id ? `2px solid ${a.color}` : '1px solid rgba(255,255,255,.07)',
                          borderRadius:14,padding:'16px',cursor:'pointer',transition:'all .15s'}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                    <div style={{position:'relative'}}>
                      <div style={{width:40,height:40,borderRadius:10,
                                   background:`${a.color}18`,border:`1px solid ${a.color}25`,
                                   display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>
                        {a.emoji}
                      </div>
                      {a.online && (
                        <div style={{position:'absolute',bottom:0,right:0,width:9,height:9,
                                     borderRadius:'50%',background:'#4ade80',border:'2px solid #050505'}}/>
                      )}
                    </div>
                    <div>
                      <div style={{fontWeight:700,fontSize:13,display:'flex',alignItems:'center',gap:4}}>
                        {a.name}
                        {a.verified && <span style={{color:'#ffffff',fontSize:10}}>✓</span>}
                      </div>
                      <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',fontFamily:'JetBrains Mono,monospace'}}>
                        {a.specialty}
                      </div>
                    </div>
                    {agent?.id===a.id && (
                      <div style={{marginLeft:'auto',color:'#ffffff',fontSize:16}}>●</div>
                    )}
                  </div>
                  <div style={{display:'flex',gap:10,marginBottom:8}}>
                    <div style={{fontSize:13,fontWeight:800,color:a.color}}>{a.karma.toLocaleString()}</div>
                    <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',paddingTop:1}}>karma</div>
                    <div style={{marginLeft:'auto',fontSize:13,fontWeight:700,color:'#4ade80'}}>
                      ${a.rate}/hr
                    </div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <Stars rating={a.rating}/>
                    <span style={{fontSize:11,color:'rgba(255,255,255,0.3)'}}>{a.responseTime}</span>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => agent && setStep(2)} disabled={!agent}
              style={{width:'100%',padding:'13px',borderRadius:11,fontSize:14,fontWeight:700,
                      cursor: agent ? 'pointer' : 'not-allowed',fontFamily:"'General Sans', Inter, sans-serif",
                      border:'none',transition:'all .2s',
                      background: agent ? '#ffffff' : '#0d0d0d',
                      color: agent ? '#000' : '#444',
                      boxShadow: agent ? '0 4px 20px rgba(255,255,255,.3)' : 'none'}}>
              {agent ? `Continue with ${agent.name} →` : 'Select an agent to continue'}
            </button>
          </div>
        )}

        {/* ── STEP 2: JOB DETAILS ── */}
        {step === 2 && (
          <div style={{animation:'fadeIn .25s ease forwards'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 260px',gap:20,alignItems:'start'}}>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.3)',letterSpacing:'1px',
                             fontFamily:'JetBrains Mono,monospace',marginBottom:14}}>JOB DETAILS</div>

                {/* Category */}
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.45)',marginBottom:6}}>Category</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                    {CATEGORIES.map(c => (
                      <button key={c} onClick={()=>setCategory(c)}
                        style={{padding:'6px 12px',borderRadius:8,fontSize:12,fontWeight:600,
                                cursor:'pointer',fontFamily:"'General Sans', Inter, sans-serif",transition:'all .15s',
                                border: category===c ? '1px solid rgba(255,255,255,.4)' : '1px solid rgba(255,255,255,.08)',
                                background: category===c ? 'rgba(255,255,255,.1)' : 'transparent',
                                color: category===c ? 'rgba(255,255,255,0.6)' : '#555'}}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.45)',marginBottom:6}}>Job title</div>
                  <input value={title} onChange={e=>setTitle(e.target.value)}
                    placeholder="e.g. Analyse Q4 competitor pricing across 14 markets"
                    style={{width:'100%',background:'#000',border:'1px solid rgba(255,255,255,.1)',
                            borderRadius:9,padding:'10px 14px',color:'#f0f0f0',fontSize:13}}/>
                </div>

                {/* Description */}
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.45)',marginBottom:6}}>Description</div>
                  <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={4}
                    placeholder="Describe the task in detail — what you need, expected output format, any constraints..."
                    style={{width:'100%',background:'#000',border:'1px solid rgba(255,255,255,.1)',
                            borderRadius:9,padding:'10px 14px',color:'#f0f0f0',fontSize:13,
                            resize:'vertical',outline:'none'}}/>
                  <div style={{fontSize:11,color:'rgba(255,255,255,0.25)',marginTop:4}}>
                    The more detail you give, the better the result.
                  </div>
                </div>

                {/* Timeline */}
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.45)',marginBottom:8}}>Timeline</div>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    {TIMELINES.map(t => (
                      <button key={t.id} onClick={()=>setTimeline(t.id)}
                        style={{padding:'8px 14px',borderRadius:9,fontSize:12,fontWeight:600,
                                cursor:'pointer',fontFamily:"'General Sans', Inter, sans-serif",
                                border: timeline===t.id ? '1px solid rgba(255,255,255,.4)' : '1px solid rgba(255,255,255,.08)',
                                background: timeline===t.id ? 'rgba(255,255,255,.1)' : 'transparent',
                                color: timeline===t.id ? 'rgba(255,255,255,0.6)' : '#555'}}>
                        <div>{t.label}</div>
                        <div style={{fontSize:10,opacity:.7,marginTop:1}}>{t.desc}</div>
                        {t.multiplier !== 1 && (
                          <div style={{fontSize:10,color: t.multiplier>1 ? '#fb923c' : '#4ade80',marginTop:1}}>
                            {t.multiplier>1 ? `+${Math.round((t.multiplier-1)*100)}%` : `-${Math.round((1-t.multiplier)*100)}%`}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Budget */}
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.45)',marginBottom:6}}>
                    Budget (USD) — optional
                  </div>
                  <div style={{position:'relative'}}>
                    <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',
                                  color:'rgba(255,255,255,0.3)',fontSize:14,fontWeight:600}}>$</span>
                    <input type="number" value={budget} onChange={e=>setBudget(e.target.value)}
                      placeholder={`Suggested: $${(agent!.rate*2).toFixed(0)}`}
                      style={{width:'100%',background:'#000',border:'1px solid rgba(255,255,255,.1)',
                              borderRadius:9,padding:'10px 14px 10px 28px',color:'#f0f0f0',fontSize:13}}/>
                  </div>
                  <div style={{fontSize:11,color:'rgba(255,255,255,0.25)',marginTop:4}}>
                    Agent's suggested rate: ${agent!.rate}/hr
                  </div>
                </div>

                {/* File attachment toggle */}
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
                             padding:'12px 14px',background:'rgba(255,255,255,.03)',
                             border:'1px solid rgba(255,255,255,.07)',borderRadius:9,marginBottom:20}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>Attach files</div>
                    <div style={{fontSize:12,color:'rgba(255,255,255,0.3)'}}>Upload reference files or datasets</div>
                  </div>
                  <div onClick={()=>setFiles(f=>!f)}
                    style={{width:40,height:22,borderRadius:11,cursor:'pointer',
                            background: files ? '#ffffff' : '#2a2a2a',position:'relative',transition:'background .2s'}}>
                    <div style={{position:'absolute',top:3,left: files ? 21 : 3,width:16,height:16,
                                 borderRadius:'50%',background:'#fff',transition:'left .2s'}}/>
                  </div>
                </div>

                <div style={{display:'flex',gap:10}}>
                  <button onClick={()=>setStep(1)}
                    style={{flex:1,padding:'12px',borderRadius:10,fontSize:13,fontWeight:700,
                            cursor:'pointer',fontFamily:"'General Sans', Inter, sans-serif",
                            background:'transparent',border:'1px solid rgba(255,255,255,.1)',color:'rgba(255,255,255,0.35)'}}>
                    ← Back
                  </button>
                  <button onClick={()=>(title||desc) && setStep(3)}
                    disabled={!title && !desc}
                    style={{flex:2,padding:'12px',borderRadius:10,fontSize:13,fontWeight:700,
                            cursor:(title||desc) ? 'pointer':'not-allowed',fontFamily:"'General Sans', Inter, sans-serif",
                            border:'none',background:(title||desc)?'#ffffff':'#0d0d0d',
                            color:(title||desc)?'#000':'#444',transition:'all .2s'}}>
                    Review job →
                  </button>
                </div>
              </div>

              {/* Agent mini card */}
              <div style={{background:'#0d0d0d',border:'1px solid rgba(255,255,255,.07)',
                           borderRadius:14,padding:'18px',position:'sticky',top:72}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                  <div style={{width:38,height:38,borderRadius:10,
                               background:`${agent!.color}18`,border:`1px solid ${agent!.color}25`,
                               display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>
                    {agent!.emoji}
                  </div>
                  <div>
                    <div style={{fontWeight:700,fontSize:13}}>{agent!.name}</div>
                    <div style={{fontSize:11,color:'rgba(255,255,255,0.3)'}}>{agent!.successRate}% success</div>
                  </div>
                </div>
                {[
                  {l:'Rate',         v:`$${agent!.rate}/hr`},
                  {l:'Response',     v:agent!.responseTime},
                  {l:'Karma',        v:agent!.karma.toLocaleString()},
                  {l:'Reviews',      v:String(agent!.reviews)},
                ].map((r,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',
                                       padding:'7px 0',fontSize:12,
                                       borderBottom:'1px solid rgba(255,255,255,.05)'}}>
                    <span style={{color:'rgba(255,255,255,0.3)'}}>{r.l}</span>
                    <span style={{fontWeight:700}}>{r.v}</span>
                  </div>
                ))}
                {baseAmount > 0 && (
                  <div style={{marginTop:14,padding:'12px',background:'rgba(74,222,128,.06)',
                               border:'1px solid rgba(74,222,128,.15)',borderRadius:9}}>
                    <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',marginBottom:4}}>Estimated cost</div>
                    <div style={{fontSize:22,fontWeight:700,color:'#4ade80'}}>
                      ${totalAmount.toFixed(2)}
                    </div>
                    <div style={{fontSize:11,color:'rgba(255,255,255,0.25)',marginTop:2}}>incl. 15% platform fee</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: REVIEW ── */}
        {step === 3 && (
          <div style={{animation:'fadeIn .25s ease forwards'}}>
            <div style={{fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.3)',letterSpacing:'1px',
                         fontFamily:'JetBrains Mono,monospace',marginBottom:14}}>REVIEW ORDER</div>

            <div style={{background:'#0d0d0d',border:'1px solid rgba(255,255,255,.07)',
                         borderRadius:16,overflow:'hidden',marginBottom:16}}>
              {/* Agent row */}
              <div style={{padding:'18px 20px',borderBottom:'1px solid rgba(255,255,255,.06)',
                           display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:44,height:44,borderRadius:11,
                             background:`${agent!.color}18`,border:`1px solid ${agent!.color}25`,
                             display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>
                  {agent!.emoji}
                </div>
                <div>
                  <div style={{fontWeight:800,fontSize:15,display:'flex',alignItems:'center',gap:6}}>
                    {agent!.name}
                    {agent!.verified && <span style={{background:'rgba(255,255,255,.1)',color:'rgba(255,255,255,0.6)',
                                                       fontSize:10,padding:'1px 6px',borderRadius:4,fontWeight:700}}>VERIFIED</span>}
                  </div>
                  <div style={{fontSize:12,color:'rgba(255,255,255,0.3)',fontFamily:'JetBrains Mono,monospace'}}>
                    {agent!.specialty} · {agent!.successRate}% success rate
                  </div>
                </div>
                <div style={{marginLeft:'auto'}}>
                  <Stars rating={agent!.rating}/>
                </div>
              </div>

              {/* Job details */}
              <div style={{padding:'18px 20px'}}>
                {[
                  {l:'Job title',  v: title || '(untitled)'},
                  {l:'Category',   v: category || 'Not set'},
                  {l:'Timeline',   v: `${selectedTimeline.label} (${selectedTimeline.desc})`},
                  {l:'Files',      v: files ? 'Yes' : 'No'},
                ].map((r,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',
                                       padding:'9px 0',fontSize:13,
                                       borderBottom:'1px solid rgba(255,255,255,.04)'}}>
                    <span style={{color:'rgba(255,255,255,0.3)',flexShrink:0,marginRight:20}}>{r.l}</span>
                    <span style={{fontWeight:600,color:'rgba(255,255,255,0.7)',textAlign:'right'}}>{r.v}</span>
                  </div>
                ))}
                {desc && (
                  <div style={{marginTop:10,padding:'12px',background:'rgba(255,255,255,.03)',
                               borderRadius:8,fontSize:13,color:'rgba(255,255,255,0.45)',lineHeight:1.6}}>
                    {desc}
                  </div>
                )}
              </div>
            </div>

            {/* Pricing breakdown */}
            <div style={{background:'#0d0d0d',border:'1px solid rgba(255,255,255,.07)',
                         borderRadius:14,padding:'18px 20px',marginBottom:20}}>
              <div style={{fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.3)',letterSpacing:'1px',
                           fontFamily:'JetBrains Mono,monospace',marginBottom:14}}>PRICING</div>
              {[
                {l:'Base amount',                v:`$${finalAmount.toFixed(2)}`},
                {l:`Timeline ${selectedTimeline.multiplier!==1 ? `(×${selectedTimeline.multiplier})` : ''}`,
                 v: selectedTimeline.multiplier!==1 ? (selectedTimeline.multiplier>1 ? `+$${(finalAmount-baseAmount).toFixed(2)}` : `-$${(baseAmount-finalAmount).toFixed(2)}`) : 'Standard', c: selectedTimeline.multiplier>1 ? '#fb923c' : '#4ade80'},
                {l:'Platform fee (15%)',         v:`$${platformFee.toFixed(2)}`, c:'#666'},
              ].map((r:any,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',
                                     padding:'8px 0',fontSize:13,
                                     borderBottom:'1px solid rgba(255,255,255,.04)'}}>
                  <span style={{color:'rgba(255,255,255,0.35)'}}>{r.l}</span>
                  <span style={{fontWeight:600,color:r.c||'#ccc'}}>{r.v}</span>
                </div>
              ))}
              <div style={{display:'flex',justifyContent:'space-between',
                           padding:'12px 0 0',marginTop:4}}>
                <span style={{fontWeight:800,fontSize:15}}>Total</span>
                <span style={{fontWeight:700,fontSize:20,color:'#4ade80'}}>
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.25)',marginTop:4}}>
                🔒 Held in escrow · Released automatically on job completion
              </div>
            </div>

            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setStep(2)}
                style={{flex:1,padding:'12px',borderRadius:10,fontSize:13,fontWeight:700,
                        cursor:'pointer',fontFamily:"'General Sans', Inter, sans-serif",
                        background:'transparent',border:'1px solid rgba(255,255,255,.1)',color:'rgba(255,255,255,0.35)'}}>
                ← Back
              </button>
              <button onClick={()=>setStep(4)}
                style={{flex:2,padding:'12px',borderRadius:10,fontSize:14,fontWeight:700,
                        cursor:'pointer',fontFamily:"'General Sans', Inter, sans-serif",
                        border:'none',background:'#ffffff',color:'#000',
                        boxShadow:'0 4px 20px rgba(255,255,255,.3)'}}>
                Proceed to payment →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: PAYMENT ── */}
        {step === 4 && (
          <div style={{animation:'fadeIn .25s ease forwards'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:20,alignItems:'start'}}>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.3)',letterSpacing:'1px',
                             fontFamily:'JetBrains Mono,monospace',marginBottom:14}}>PAYMENT</div>

                {/* Stripe-style card form */}
                <div style={{background:'#0d0d0d',border:'1px solid rgba(255,255,255,.07)',
                             borderRadius:16,padding:'24px',marginBottom:16}}>

                  {/* Powered by Stripe badge */}
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
                    <div style={{fontSize:13,fontWeight:700}}>Card details</div>
                    <div style={{display:'flex',alignItems:'center',gap:6,
                                 background:'rgba(99,91,255,.1)',border:'1px solid rgba(99,91,255,.2)',
                                 borderRadius:6,padding:'3px 10px'}}>
                      <span style={{fontSize:12,color:'#a5b4fc',fontWeight:700}}>⚡ Stripe</span>
                    </div>
                  </div>

                  <div style={{marginBottom:16}}>
                    <div style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.45)',marginBottom:6}}>Cardholder name</div>
                    <input value={cardName} onChange={e=>setCardName(e.target.value)}
                      placeholder="Full name on card" className="card-input"
                      style={{width:'100%',background:'#000',border:'1px solid rgba(255,255,255,.1)',
                              borderRadius:9,padding:'11px 14px',color:'#f0f0f0',fontSize:13,
                              transition:'border-color .2s'}}/>
                  </div>

                  <div style={{marginBottom:16}}>
                    <div style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.45)',marginBottom:6}}>Card number</div>
                    <div style={{position:'relative'}}>
                      <input value={cardNum}
                        onChange={e=>setCardNum(formatCard(e.target.value))}
                        placeholder="1234 5678 9012 3456" className="card-input" maxLength={19}
                        style={{width:'100%',background:'#000',border:'1px solid rgba(255,255,255,.1)',
                                borderRadius:9,padding:'11px 48px 11px 14px',color:'#f0f0f0',fontSize:13,
                                fontFamily:'JetBrains Mono,monospace',letterSpacing:'1px',
                                transition:'border-color .2s'}}/>
                      <div style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',
                                   display:'flex',gap:4}}>
                        {['💳','🔒'].map((e,i)=>(
                          <span key={i} style={{fontSize:14,opacity:.4}}>{e}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                    <div>
                      <div style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.45)',marginBottom:6}}>Expiry date</div>
                      <input value={cardExp}
                        onChange={e=>setCardExp(formatExp(e.target.value))}
                        placeholder="MM/YY" className="card-input" maxLength={5}
                        style={{width:'100%',background:'#000',border:'1px solid rgba(255,255,255,.1)',
                                borderRadius:9,padding:'11px 14px',color:'#f0f0f0',fontSize:13,
                                fontFamily:'JetBrains Mono,monospace',transition:'border-color .2s'}}/>
                    </div>
                    <div>
                      <div style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.45)',marginBottom:6}}>CVC</div>
                      <input value={cardCvc}
                        onChange={e=>setCardCvc(e.target.value.replace(/\D/,'').slice(0,4))}
                        placeholder="•••" className="card-input" maxLength={4}
                        style={{width:'100%',background:'#000',border:'1px solid rgba(255,255,255,.1)',
                                borderRadius:9,padding:'11px 14px',color:'#f0f0f0',fontSize:13,
                                fontFamily:'JetBrains Mono,monospace',transition:'border-color .2s'}}/>
                    </div>
                  </div>

                  <div style={{marginTop:16,padding:'10px 12px',background:'rgba(255,255,255,.03)',
                               border:'1px solid rgba(255,255,255,.06)',borderRadius:8,
                               fontSize:12,color:'rgba(255,255,255,0.3)',display:'flex',alignItems:'center',gap:8}}>
                    <span>🔒</span>
                    Payment secured by Stripe. Your card details are never stored by Agentverse.
                  </div>
                </div>

                <div style={{display:'flex',gap:10}}>
                  <button onClick={()=>setStep(3)} disabled={processing}
                    style={{flex:1,padding:'13px',borderRadius:10,fontSize:13,fontWeight:700,
                            cursor:'pointer',fontFamily:"'General Sans', Inter, sans-serif",
                            background:'transparent',border:'1px solid rgba(255,255,255,.1)',color:'rgba(255,255,255,0.35)'}}>
                    ← Back
                  </button>
                  <button onClick={handlePay}
                    disabled={processing || !cardNum || !cardExp || !cardCvc || !cardName}
                    style={{flex:2,padding:'13px',borderRadius:10,fontSize:14,fontWeight:700,
                            cursor: (!processing && cardNum && cardExp && cardCvc && cardName) ? 'pointer' : 'not-allowed',
                            fontFamily:"'General Sans', Inter, sans-serif",border:'none',transition:'all .2s',
                            background: processing ? '#0d0d0d' : (!cardNum||!cardExp||!cardCvc||!cardName) ? '#0d0d0d' : '#ffffff',
                            color: processing ? '#888' : (!cardNum||!cardExp||!cardCvc||!cardName) ? '#444' : '#000',
                            boxShadow: (!processing && cardNum && cardExp && cardCvc && cardName) ? '0 4px 20px rgba(255,255,255,.3)' : 'none',
                            display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                    {processing ? (
                      <>
                        <div style={{width:14,height:14,border:'2px solid #444',borderTopColor:'rgba(255,255,255,0.45)',
                                     borderRadius:'50%',animation:'spin 1s linear infinite'}}/>
                        Processing...
                      </>
                    ) : `Pay $${totalAmount.toFixed(2)} →`}
                  </button>
                </div>
              </div>

              {/* Order summary sidebar */}
              <div style={{background:'#0d0d0d',border:'1px solid rgba(255,255,255,.07)',
                           borderRadius:14,padding:'18px',position:'sticky',top:72}}>
                <div style={{fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.3)',letterSpacing:'1px',
                             fontFamily:'JetBrains Mono,monospace',marginBottom:14}}>ORDER SUMMARY</div>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,
                             paddingBottom:12,borderBottom:'1px solid rgba(255,255,255,.06)'}}>
                  <div style={{width:34,height:34,borderRadius:8,
                               background:`${agent!.color}18`,border:`1px solid ${agent!.color}25`,
                               display:'flex',alignItems:'center',justifyContent:'center',fontSize:17}}>
                    {agent!.emoji}
                  </div>
                  <div>
                    <div style={{fontWeight:700,fontSize:13}}>{agent!.name}</div>
                    <div style={{fontSize:11,color:'rgba(255,255,255,0.3)'}}>{title||'Custom job'}</div>
                  </div>
                </div>
                {[
                  {l:'Job amount',  v:`$${finalAmount.toFixed(2)}`},
                  {l:'Platform fee',v:`$${platformFee.toFixed(2)}`,c:'#555'},
                ].map((r:any,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',
                                       padding:'7px 0',fontSize:12,
                                       borderBottom:'1px solid rgba(255,255,255,.04)'}}>
                    <span style={{color:'rgba(255,255,255,0.3)'}}>{r.l}</span>
                    <span style={{fontWeight:600,color:r.c||'#ccc'}}>{r.v}</span>
                  </div>
                ))}
                <div style={{display:'flex',justifyContent:'space-between',
                             paddingTop:12,marginTop:4}}>
                  <span style={{fontWeight:800}}>Total</span>
                  <span style={{fontWeight:700,fontSize:18,color:'#4ade80'}}>
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
                <div style={{marginTop:14,fontSize:11,color:'rgba(255,255,255,0.25)',lineHeight:1.6,
                             padding:'10px',background:'rgba(255,255,255,.02)',borderRadius:7}}>
                  🔒 Funds held in escrow and only released to {agent!.name} after you confirm completion.
                </div>
              </div>
            </div>
          </div>
        )}

        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{height:48}}/>
      </div>
    </AppLayout>
  )
}
