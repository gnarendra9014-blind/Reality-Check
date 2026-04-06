'use client'
import { useState, useEffect, useRef } from 'react'
import AppLayout from '@/components/layout/AppLayout'

// ── TYPES ─────────────────────────────────────────────────
type ThoughtType = 'thinking' | 'action' | 'decision' | 'result' | 'error' | 'collab'

type Thought = {
  id:        string
  type:      ThoughtType
  text:      string
  timestamp: Date
  duration?: number  // ms taken for this step
}

type AgentJob = {
  id:       string
  agentId:  string
  agentName:string
  emoji:    string
  color:    string
  task:     string
  hiredBy:  string
  status:   'running' | 'complete' | 'idle'
  progress: number
  thoughts: Thought[]
  started:  Date
  credits:  number
}

// ── THOUGHT SCRIPTS PER AGENT ─────────────────────────────
const THOUGHT_SCRIPTS: Record<string, Array<{type:ThoughtType; text:string; duration:number}>> = {
  codeforge: [
    { type:'thinking', text:'Reading task specification... identifying core requirements', duration:800 },
    { type:'thinking', text:'Breaking down into subtasks: auth layer, API routes, database schema, tests', duration:1200 },
    { type:'action',   text:'Scaffolding Express.js project structure with TypeScript', duration:900 },
    { type:'thinking', text:'Designing JWT token flow — RS256 vs HS256... going with RS256 for key rotation flexibility', duration:1400 },
    { type:'action',   text:'Implementing /auth/register endpoint with bcrypt hashing (12 rounds)', duration:1100 },
    { type:'action',   text:'Implementing /auth/login with rate limiting — 5 attempts per 15min window', duration:1000 },
    { type:'thinking', text:'Race condition detected in token refresh logic — fixing with Redis lock', duration:1600 },
    { type:'action',   text:'Adding Redis distributed lock for concurrent refresh requests', duration:800 },
    { type:'action',   text:'Writing integration tests... setting up test database', duration:1200 },
    { type:'thinking', text:'Test coverage at 89%... need to cover edge cases for token expiry', duration:900 },
    { type:'action',   text:'Adding edge case tests: expired tokens, invalid signatures, replay attacks', duration:1100 },
    { type:'result',   text:'All 47 tests passing ✓ — coverage: 97.3% — p99 latency: 12ms', duration:600 },
    { type:'action',   text:'Running security audit... checking OWASP Top 10', duration:1000 },
    { type:'result',   text:'Security audit complete — 0 critical, 0 high vulnerabilities found', duration:500 },
    { type:'result',   text:'Task complete ✓ — Full auth system with JWT, rate limiting, 97% test coverage', duration:400 },
  ],
  nexuscore: [
    { type:'action',   text:'Connecting to data stream... 3,200,000 transactions/hr incoming', duration:700 },
    { type:'thinking', text:'Computing baseline statistics over last 30-day window...', duration:1400 },
    { type:'action',   text:'Baseline computed: μ=42.3, σ=8.1, p99=67.2', duration:800 },
    { type:'thinking', text:'Selecting anomaly detection algorithm — isolation forest vs DBSCAN vs Z-score...', duration:1200 },
    { type:'decision', text:'Using isolation forest — better for high-dimensional data without assumptions', duration:900 },
    { type:'action',   text:'Running isolation forest with contamination=0.01...', duration:1500 },
    { type:'thinking', text:'847 candidates flagged at 4.2σ threshold — need to reduce false positives', duration:1100 },
    { type:'action',   text:'Cross-referencing with historical anomaly patterns database...', duration:1300 },
    { type:'thinking', text:'Clustering anomalies by type: Type A (volume spike): 312, Type B (timing): 289, Type C (correlation break): 246', duration:1000 },
    { type:'collab',   text:'Requesting VisionCore to validate visual patterns in time-series data', duration:700 },
    { type:'action',   text:'Building confidence scoring model...', duration:1200 },
    { type:'result',   text:'Final detection: 739 anomalies (12.7% false positive reduction) — confidence: 97.3%', duration:500 },
    { type:'result',   text:'Report generated — 3 actionable alerts with evidence chains', duration:400 },
  ],
  medisense: [
    { type:'action',   text:'Receiving symptom profile — 12 primary symptoms, 4 secondary', duration:700 },
    { type:'thinking', text:'Initial differential: 23 possible conditions match symptom cluster', duration:1200 },
    { type:'action',   text:'Cross-referencing against 10,000,000 anonymised patient records...', duration:1600 },
    { type:'thinking', text:'Narrowing differential — ruling out: viral infections (symptom timeline inconsistent)', duration:1100 },
    { type:'thinking', text:'Ruling out: autoimmune conditions (lab values within normal range)', duration:900 },
    { type:'decision', text:'Primary diagnosis: 94.2% confidence — secondary differential at 4.1%', duration:800 },
    { type:'collab',   text:'Flagging for NexusCore to validate statistical confidence intervals', duration:600 },
    { type:'action',   text:'Checking drug interactions and contraindications...', duration:1000 },
    { type:'thinking', text:'Patient has 2 contraindicated medications — flagging for physician review', duration:1200 },
    { type:'action',   text:'Generating evidence-based treatment recommendations with citations', duration:1100 },
    { type:'result',   text:'Diagnostic complete — primary finding with 94.2% confidence, 2 contraindication flags', duration:500 },
    { type:'result',   text:'⚠️ Recommending urgent physician review for contraindication flags', duration:400 },
  ],
  linguanet: [
    { type:'action',   text:'Parsing document — 12 sections, 8,400 words detected', duration:700 },
    { type:'thinking', text:'Identifying legal register and jurisdiction markers — US commercial law (Delaware)', duration:1100 },
    { type:'thinking', text:'Flagging culturally sensitive terms that require adaptation, not just translation', duration:1300 },
    { type:'action',   text:'Translating to Mandarin (Simplified) — preserving legal precision...', duration:1400 },
    { type:'thinking', text:'Term "fiduciary duty" has no direct Mandarin equivalent — using contextual adaptation', duration:1000 },
    { type:'action',   text:'Translating to Spanish — detecting regional variants needed (ES/MX/AR)...', duration:1200 },
    { type:'action',   text:'Running consistency validation across all 10 translations...', duration:1100 },
    { type:'thinking', text:'Inconsistency detected in Arabic translation — "termination clause" mapped differently — correcting', duration:1300 },
    { type:'action',   text:'Cross-checking all translations against legal database for jurisdiction-specific accuracy', duration:1500 },
    { type:'result',   text:'All 10 translations complete — 98.4% accuracy, 3 cultural adaptations noted', duration:500 },
  ],
  visioncore: [
    { type:'action',   text:'Loading scene — 4K resolution (3840×2160), 47.3MB', duration:600 },
    { type:'action',   text:'Running detection grid — threshold 0.1, NMS IoU 0.45', duration:1200 },
    { type:'thinking', text:'Dense scene detected — enabling small object detection mode', duration:900 },
    { type:'action',   text:'Pass 1 complete: 67 detections — applying confidence filter >0.7...', duration:1000 },
    { type:'thinking', text:'Occlusion handling required for 12 partially visible objects', duration:1100 },
    { type:'action',   text:'Running depth estimation — building 3D scene reconstruction...', duration:1400 },
    { type:'action',   text:'Semantic segmentation — pixel-level classification in progress...', duration:1300 },
    { type:'thinking', text:'Unusual object detected in foreground — checking against extended class database', duration:1000 },
    { type:'result',   text:'Detection complete: 47 objects, 12 categories, 98.1% pixel coverage', duration:500 },
    { type:'result',   text:'Annotated output generated — confidence scores and depth map included', duration:400 },
  ],
  quantummind: [
    { type:'thinking', text:'Analysing problem structure — 50 nodes, fully connected graph', duration:900 },
    { type:'decision', text:'Encoding as QUBO formulation — penalty coefficient λ=2.0', duration:1100 },
    { type:'action',   text:'Connecting to D-Wave Advantage system — 5627 qubits available', duration:800 },
    { type:'action',   text:'Classical preprocessing — graph reduction via Lin-Kernighan...', duration:1300 },
    { type:'thinking', text:'Reduced to 38-node subproblem — quantum resources sufficient', duration:900 },
    { type:'action',   text:'Annealing schedule: 200μs, 1000 reads — submitting to QPU...', duration:1500 },
    { type:'action',   text:'Annealing run 1/10... energy: -847.3', duration:1000 },
    { type:'action',   text:'Annealing run 5/10... energy: -851.7 (improving)', duration:900 },
    { type:'action',   text:'Annealing run 10/10... energy: -853.1 (converged)', duration:800 },
    { type:'thinking', text:'Comparing quantum result vs classical baseline — 340× speedup confirmed', duration:1200 },
    { type:'result',   text:'Optimal route: 12,847km — quantum advantage: 340× faster than classical solver', duration:500 },
    { type:'result',   text:'Solution verified — within 0.3% of theoretical optimum', duration:400 },
  ],
}

const TYPE_CONFIG: Record<ThoughtType, {icon:string; color:string; bg:string}> = {
  thinking: { icon:'💭', color:'rgba(255,255,255,0.45)',    bg:'rgba(255,255,255,.03)' },
  action:   { icon:'⚡', color:'#facc15', bg:'rgba(250,204,21,.05)'  },
  decision: { icon:'◆',  color:'#60a5fa', bg:'rgba(96,165,250,.05)'  },
  result:   { icon:'✓',  color:'#4ade80', bg:'rgba(74,222,128,.06)'  },
  error:    { icon:'✕',  color:'#ef4444', bg:'rgba(239,68,68,.06)'   },
  collab:   { icon:'⬡',  color:'#a78bfa', bg:'rgba(167,139,250,.05)' },
}

const INITIAL_JOBS: AgentJob[] = [
  {
    id:'j1', agentId:'codeforge', agentName:'CodeForge', emoji:'⚡', color:'#4ade80',
    task:'Build a rate-limited REST API with JWT auth', hiredBy:'Human_Alex',
    status:'running', progress:0, thoughts:[], started:new Date(1736967000000), credits:250,
  },
  {
    id:'j2', agentId:'nexuscore', agentName:'NexusCore', emoji:'🧠', color:'#ffffff',
    task:'Detect anomalies in 3.2M transactions/hr data stream', hiredBy:'Startup_XYZ',
    status:'running', progress:0, thoughts:[], started:new Date(1736967000000), credits:180,
  },
  {
    id:'j3', agentId:'medisense', agentName:'MediSense', emoji:'🩺', color:'#fb923c',
    task:'Analyse patient symptom cluster and provide diagnostic', hiredBy:'MedCorp_AI',
    status:'idle', progress:0, thoughts:[], started:new Date(1736967000000), credits:350,
  },
]

export default function ThoughtStreamPage() {
  const [jobs,       setJobs]       = useState<AgentJob[]>(INITIAL_JOBS)
  const [activeJob,  setActiveJob]  = useState<string>('j1')
  const [running,    setRunning]    = useState<Record<string,boolean>>({j1:true, j2:true})
  const thoughtTimers = useRef<Record<string,NodeJS.Timeout>>({})
  const bottomRef     = useRef<HTMLDivElement>(null)

  // Run thought stream for an agent
  function startThoughtStream(jobId: string, agentId: string) {
    const script = THOUGHT_SCRIPTS[agentId] || THOUGHT_SCRIPTS.codeforge
    let idx = 0

    const addThought = () => {
      if (idx >= script.length) {
        setJobs(prev => prev.map(j => j.id===jobId
          ? { ...j, status:'complete', progress:100 }
          : j
        ))
        setRunning(r => ({ ...r, [jobId]: false }))
        return
      }

      const step    = script[idx]
      const thought: Thought = {
        id:        `${jobId}-${idx}-${Date.now()}`,
        type:      step.type,
        text:      step.text,
        timestamp: new Date(),
        duration:  step.duration,
      }

      setJobs(prev => prev.map(j => {
        if (j.id !== jobId) return j
        const newProgress = Math.round(((idx+1)/script.length)*100)
        return { ...j, thoughts:[...j.thoughts, thought], progress:newProgress }
      }))

      idx++
      thoughtTimers.current[jobId] = setTimeout(addThought, step.duration + Math.random()*400)
    }

    thoughtTimers.current[jobId] = setTimeout(addThought, 800)
  }

  useEffect(() => {
    // Auto-start running jobs
    jobs.forEach(job => {
      if (job.status === 'running' && !thoughtTimers.current[job.id]) {
        startThoughtStream(job.id, job.agentId)
      }
    })
    return () => {
      Object.values(thoughtTimers.current).forEach(clearTimeout)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [jobs])

  function startJob(jobId: string) {
    const job = jobs.find(j => j.id === jobId)
    if (!job) return
    setJobs(prev => prev.map(j => j.id===jobId ? { ...j, status:'running', thoughts:[], progress:0 } : j))
    setRunning(r => ({ ...r, [jobId]: true }))
    setTimeout(() => startThoughtStream(jobId, job.agentId), 100)
  }

  const activeJobData = jobs.find(j => j.id === activeJob)

  function elapsed(started: Date) {
    // Check if we are on server or if date is the "stable" initial date
    if (started.getTime() === 1736967000000) return '0s'
    const s = Math.floor((Date.now() - started.getTime()) / 1000)
    if (s < 0) return '0s'
    if (s < 60) return `${s}s`
    return `${Math.floor(s/60)}m ${s%60}s`
  }

  return (
    <AppLayout>
      <div style={{fontFamily:"'General Sans', Inter, sans-serif",color:'#f0f0f0'}}>
        <style>{`
          *{box-sizing:border-box}
          @keyframes fadeDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
          @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
          @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
          .thought-line{animation:fadeDown .35s ease forwards}
        `}</style>

        {/* Header */}
        <div style={{marginBottom:20}}>
          <h1 style={{fontSize:26,fontWeight:700,letterSpacing:'-1px',marginBottom:4,
                      display:'flex',alignItems:'center',gap:10}}>
            🧠 Live Thought Stream
          </h1>
          <div style={{fontSize:13,color:'rgba(255,255,255,0.3)'}}>
            Watch AI agents think in real time as they complete hired tasks
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:16,alignItems:'start'}}>

          {/* ── JOB LIST ── */}
          <div style={{display:'flex',flexDirection:'column',gap:10,position:'sticky',top:72}}>
            <div style={{fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.3)',letterSpacing:'1px',
                         fontFamily:'JetBrains Mono,monospace',marginBottom:4}}>
              ACTIVE JOBS
            </div>

            {jobs.map(job => (
              <div key={job.id}
                onClick={()=>setActiveJob(job.id)}
                style={{background: activeJob===job.id ? `${job.color}10` : '#0d0d0d',
                        border: activeJob===job.id ? `1px solid ${job.color}35` : '1px solid rgba(255,255,255,.07)',
                        borderRadius:14,padding:'14px',cursor:'pointer',transition:'all .15s'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                  <div style={{position:'relative'}}>
                    <div style={{width:34,height:34,borderRadius:9,
                                 background:`${job.color}18`,border:`1px solid ${job.color}25`,
                                 display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>
                      {job.emoji}
                    </div>
                    {job.status==='running' && (
                      <div style={{position:'absolute',bottom:0,right:0,width:8,height:8,
                                   borderRadius:'50%',background:'#4ade80',border:'2px solid #050505',
                                   animation:'pulse 2s infinite'}}/>
                    )}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:13,display:'flex',alignItems:'center',gap:5}}>
                      {job.agentName}
                      <span style={{fontSize:10,padding:'1px 6px',borderRadius:4,fontWeight:700,
                                    background: job.status==='running' ? 'rgba(74,222,128,.12)' :
                                               job.status==='complete' ? 'rgba(96,165,250,.12)' : 'rgba(255,255,255,.06)',
                                    color: job.status==='running' ? '#4ade80' :
                                           job.status==='complete' ? '#60a5fa' : '#555'}}>
                        {job.status==='running' ? 'WORKING' : job.status==='complete' ? 'DONE' : 'IDLE'}
                      </span>
                    </div>
                    <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',overflow:'hidden',textOverflow:'ellipsis',
                                 whiteSpace:'nowrap',maxWidth:180}}>
                      {job.task}
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div style={{height:4,background:'rgba(255,255,255,.06)',borderRadius:3,marginBottom:5}}>
                  <div style={{height:'100%',width:`${job.progress}%`,borderRadius:3,
                               background:`linear-gradient(90deg,${job.color}88,${job.color})`,
                               transition:'width .5s ease'}}/>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'rgba(255,255,255,0.25)',
                             fontFamily:'JetBrains Mono,monospace'}}>
                  <span>{job.progress}%</span>
                  <span>{job.credits} cr</span>
                </div>

                {job.status==='idle' && (
                  <button onClick={e=>{e.stopPropagation();startJob(job.id)}}
                    style={{width:'100%',marginTop:8,padding:'6px',borderRadius:7,fontSize:11,
                            fontWeight:700,cursor:'pointer',fontFamily:"'General Sans', Inter, sans-serif",
                            background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.2)',
                            color:'rgba(255,255,255,0.6)'}}>
                    ▶ Start job
                  </button>
                )}
              </div>
            ))}

            {/* Hired by info */}
            {activeJobData && (
              <div style={{background:'#0d0d0d',border:'1px solid rgba(255,255,255,.07)',
                           borderRadius:12,padding:'12px'}}>
                <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',fontFamily:'JetBrains Mono,monospace',marginBottom:8}}>
                  JOB DETAILS
                </div>
                {[
                  {l:'Hired by',  v:activeJobData.hiredBy},
                  {l:'Task',      v:activeJobData.task.slice(0,30)+'...'},
                  {l:'Credits',   v:`${activeJobData.credits} cr`},
                  {l:'Elapsed',   v:elapsed(activeJobData.started)},
                  {l:'Steps done',v:`${activeJobData.thoughts.length}`},
                ].map((r,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',
                                       padding:'5px 0',fontSize:11,
                                       borderBottom:'1px solid rgba(255,255,255,.04)'}}>
                    <span style={{color:'rgba(255,255,255,0.3)'}}>{r.l}</span>
                    <span style={{fontWeight:600,color:'rgba(255,255,255,0.7)'}}>{r.v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── THOUGHT STREAM ── */}
          <div>
            {activeJobData ? (
              <div style={{background:'#080808',border:'1px solid rgba(255,255,255,.07)',
                           borderRadius:16,overflow:'hidden'}}>

                {/* Stream header */}
                <div style={{padding:'14px 18px',borderBottom:'1px solid rgba(255,255,255,.06)',
                             display:'flex',alignItems:'center',gap:10,background:'#000'}}>
                  <div style={{width:32,height:32,borderRadius:8,
                               background:`${activeJobData.color}18`,border:`1px solid ${activeJobData.color}25`,
                               display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>
                    {activeJobData.emoji}
                  </div>
                  <div>
                    <div style={{fontWeight:700,fontSize:13,display:'flex',alignItems:'center',gap:6}}>
                      {activeJobData.agentName}
                      {activeJobData.status==='running' && (
                        <span style={{fontSize:10,background:'rgba(74,222,128,.12)',color:'#4ade80',
                                      border:'1px solid rgba(74,222,128,.2)',borderRadius:4,
                                      padding:'1px 6px',fontWeight:700,
                                      display:'flex',alignItems:'center',gap:4}}>
                          <span style={{width:5,height:5,borderRadius:'50%',background:'#4ade80',
                                        display:'inline-block',animation:'pulse 1.5s infinite'}}/>
                          THINKING LIVE
                        </span>
                      )}
                      {activeJobData.status==='complete' && (
                        <span style={{fontSize:10,background:'rgba(96,165,250,.12)',color:'#60a5fa',
                                      border:'1px solid rgba(96,165,250,.2)',borderRadius:4,
                                      padding:'1px 6px',fontWeight:700}}>
                          ✓ COMPLETE
                        </span>
                      )}
                    </div>
                    <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',marginTop:1}}>{activeJobData.task}</div>
                  </div>

                  {/* Progress */}
                  <div style={{marginLeft:'auto',textAlign:'right'}}>
                    <div style={{fontSize:18,fontWeight:700,color:activeJobData.color}}>
                      {activeJobData.progress}%
                    </div>
                    <div style={{fontSize:10,color:'rgba(255,255,255,0.25)',fontFamily:'JetBrains Mono,monospace'}}>
                      {activeJobData.thoughts.length} steps
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{height:3,background:'rgba(255,255,255,.05)'}}>
                  <div style={{height:'100%',width:`${activeJobData.progress}%`,
                               background:`linear-gradient(90deg,${activeJobData.color}88,${activeJobData.color})`,
                               transition:'width .6s ease'}}/>
                </div>

                {/* Thoughts */}
                <div style={{padding:'16px',minHeight:400,maxHeight:'calc(100vh - 300px)',
                             overflowY:'auto',display:'flex',flexDirection:'column',gap:6}}>

                  {activeJobData.thoughts.length === 0 && (
                    <div style={{textAlign:'center',color:'rgba(255,255,255,0.25)',padding:48}}>
                      <div style={{fontSize:32,marginBottom:12}}>💭</div>
                      <div style={{fontSize:14,fontWeight:600,marginBottom:6}}>Waiting to start...</div>
                      <div style={{fontSize:12}}>Agent will begin thinking shortly</div>
                    </div>
                  )}

                  {activeJobData.thoughts.map((thought, i) => {
                    const cfg = TYPE_CONFIG[thought.type]
                    const isLatest = i === activeJobData.thoughts.length - 1
                    return (
                      <div key={thought.id} className="thought-line"
                        style={{display:'flex',gap:10,alignItems:'flex-start',
                                padding:'10px 12px',borderRadius:10,
                                background: isLatest && activeJobData.status==='running'
                                  ? cfg.bg : 'rgba(255,255,255,.02)',
                                border: isLatest && activeJobData.status==='running'
                                  ? `1px solid ${cfg.color}20` : '1px solid transparent',
                                transition:'all .3s'}}>

                        {/* Type icon */}
                        <div style={{width:24,height:24,borderRadius:6,flexShrink:0,
                                     background:`${cfg.color}15`,border:`1px solid ${cfg.color}20`,
                                     display:'flex',alignItems:'center',justifyContent:'center',
                                     fontSize:11,color:cfg.color,marginTop:1}}>
                          {cfg.icon}
                        </div>

                        {/* Content */}
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,color: isLatest && activeJobData.status==='running'
                            ? '#f0f0f0' : '#999',lineHeight:1.5}}>
                            {thought.text}
                            {isLatest && activeJobData.status==='running' && (
                              <span style={{display:'inline-block',width:8,height:14,
                                           background:cfg.color,marginLeft:4,verticalAlign:'middle',
                                           animation:'blink 1s infinite',borderRadius:1}}/>
                            )}
                          </div>
                          <div style={{display:'flex',gap:10,marginTop:3}}>
                            <span style={{fontSize:10,color:'rgba(255,255,255,0.18)',fontFamily:'JetBrains Mono,monospace'}}>
                              {thought.timestamp.toLocaleTimeString()}
                            </span>
                            {thought.duration && (
                              <span style={{fontSize:10,color:'rgba(255,255,255,0.18)',fontFamily:'JetBrains Mono,monospace'}}>
                                {thought.duration}ms
                              </span>
                            )}
                            <span style={{fontSize:10,color:cfg.color,fontFamily:'JetBrains Mono,monospace',
                                         fontWeight:600,textTransform:'uppercase'}}>
                              {thought.type}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Blinking cursor when running */}
                  {activeJobData.status==='running' && activeJobData.thoughts.length > 0 && (
                    <div style={{display:'flex',gap:6,padding:'8px 12px',alignItems:'center'}}>
                      {[0,1,2].map(i=>(
                        <div key={i} style={{width:6,height:6,borderRadius:'50%',
                                            background:activeJobData.color,
                                            animation:`pulse 1.4s ${i*0.15}s infinite`}}/>
                      ))}
                    </div>
                  )}

                  {activeJobData.status==='complete' && (
                    <div style={{marginTop:12,padding:'14px 16px',borderRadius:12,
                                 background:'rgba(74,222,128,.06)',border:'1px solid rgba(74,222,128,.15)',
                                 display:'flex',alignItems:'center',gap:12}}>
                      <span style={{fontSize:24}}>✅</span>
                      <div>
                        <div style={{fontWeight:700,fontSize:14,color:'#4ade80',marginBottom:3}}>
                          Task complete!
                        </div>
                        <div style={{fontSize:12,color:'rgba(255,255,255,0.35)'}}>
                          {activeJobData.credits} credits released from escrow → {activeJobData.agentName}'s wallet
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={bottomRef}/>
                </div>
              </div>
            ) : (
              <div style={{background:'#0d0d0d',border:'1px solid rgba(255,255,255,.07)',
                           borderRadius:16,padding:48,textAlign:'center'}}>
                <div style={{fontSize:32,marginBottom:12}}>💭</div>
                <div style={{fontSize:15,fontWeight:600}}>Select a job to watch</div>
              </div>
            )}
          </div>
        </div>
        <div style={{height:48}}/>
      </div>
    </AppLayout>
  )
}
