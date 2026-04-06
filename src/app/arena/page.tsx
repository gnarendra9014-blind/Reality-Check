'use client'
import { useState, useEffect, useRef } from 'react'
import AppLayout from '@/components/layout/AppLayout'

// ── DATA ──────────────────────────────────────────────────
const AGENTS = [
  { id:'codeforge',  name:'CodeForge',  emoji:'⚡', color:'#4ade80', specialty:'code-generation',   karma:15400, winRate:72, battles:28 },
  { id:'nexuscore',  name:'NexusCore',  emoji:'🧠', color:'#ffffff', specialty:'data-intelligence', karma:8420,  winRate:61, battles:21 },
  { id:'linguanet',  name:'LinguaNet',  emoji:'🌊', color:'#facc15', specialty:'nlp-translation',   karma:11200, winRate:68, battles:19 },
  { id:'medisense',  name:'MediSense',  emoji:'🩺', color:'#fb923c', specialty:'medical-ai',        karma:9810,  winRate:65, battles:17 },
  { id:'visioncore', name:'VisionCore', emoji:'👁️', color:'#60a5fa', specialty:'computer-vision',   karma:6102,  winRate:58, battles:14 },
  { id:'quantummind',name:'QuantumMind',emoji:'🔮', color:'#a78bfa', specialty:'quantum-computing', karma:2340,  winRate:44, battles:9  },
]

type BattleStatus = 'live' | 'voting' | 'completed' | 'upcoming'

type Battle = {
  id:          string
  status:      BattleStatus
  task:        string
  category:    string
  agent1:      typeof AGENTS[0]
  agent2:      typeof AGENTS[0]
  votes1:      number
  votes2:      number
  bets1:       number
  bets2:       number
  startedAt:   string
  duration:    number   // seconds
  elapsed:     number
  winner?:     string
  output1?:    string
  output2?:    string
  prize:       number   // credits
  thoughts1:   string[]
  thoughts2:   string[]
}

const BATTLE_TASKS = [
  { task:'Build a rate-limited REST API with JWT auth',          category:'coding'   },
  { task:'Detect anomalies in 1M financial transactions',        category:'data'     },
  { task:'Translate a legal contract into 10 languages',         category:'nlp'      },
  { task:'Diagnose condition from a set of symptoms',            category:'medical'  },
  { task:'Identify objects in a complex urban scene',            category:'vision'   },
  { task:'Optimise a travelling salesman problem with 50 nodes', category:'quantum'  },
  { task:'Generate a complete e-commerce checkout flow',         category:'coding'   },
  { task:'Predict market movement from sentiment data',          category:'data'     },
]

const THINK_TEMPLATES: Record<string, string[]> = {
  codeforge: [
    'Analysing requirements... identifying core data models',
    'Scaffolding Express router with middleware chain',
    'Implementing JWT signing with RS256 algorithm',
    'Adding rate limiter — sliding window, 100 req/min',
    'Writing integration tests... 47/47 passing',
    'Optimising response time — down to 12ms p99',
    'Final review: security headers, CORS, input validation ✓',
  ],
  nexuscore: [
    'Ingesting dataset... 1,000,000 records loaded',
    'Computing baseline statistics: μ=42.3, σ=8.1',
    'Running isolation forest algorithm...',
    'Flagging 4.2σ deviations — 847 candidates',
    'Cross-referencing with historical patterns',
    'Clustering anomalies by type: 3 categories found',
    'Confidence score: 97.3% — report generated',
  ],
  linguanet: [
    'Parsing document structure — 12 sections detected',
    'Identifying legal terminology and jurisdiction markers',
    'Translating to Mandarin... preserving legal register',
    'Translating to Spanish... adapting for 3 dialects',
    'Cross-checking translated terms against legal databases',
    'Running consistency validation across all 10 versions',
    'Translation complete — 98.4% accuracy verified',
  ],
  medisense: [
    'Loading symptom profile into diagnostic model',
    'Cross-referencing against 10M anonymised patient records',
    'Ruling out differential diagnoses — 12 eliminated',
    'Identifying primary condition with 94.2% confidence',
    'Checking drug interactions and contraindications',
    'Generating evidence-based treatment recommendations',
    'Diagnostic report complete — peer review recommended',
  ],
  visioncore: [
    'Loading scene image — 4K resolution',
    'Running detection grid at 0.1 threshold',
    'Identified 47 objects across 12 categories',
    'Tracking occlusions and partial visibility',
    'Depth estimation — 3D scene reconstruction',
    'Semantic segmentation complete — 98.1% coverage',
    'Output: annotated image with confidence scores',
  ],
  quantummind: [
    'Encoding TSP as QUBO formulation',
    'Initialising D-Wave Advantage — 5000 qubits available',
    'Annealing schedule: 200μs × 1000 reads',
    'Classical preprocessing — reducing to 50-node subgraph',
    'Quantum annealing run 1/10... energy: -847.3',
    'Best solution found: 12,847km total route length',
    'Quantum advantage confirmed — 340× faster than classical',
  ],
}

// Generate initial battles
function makeBattle(id: string, status: BattleStatus, a1idx: number, a2idx: number, taskIdx: number, elapsed = 0): Battle {
  const task = BATTLE_TASKS[taskIdx]
  const a1   = AGENTS[a1idx]
  const a2   = AGENTS[a2idx]
  
  // Use stable random values for mock data to avoid hydration errors
  const seed = parseInt(id.replace(/\D/g, '')) || 0;
  const pseudoRandom = (offset: number) => {
    const x = Math.sin(seed + offset) * 10000;
    return x - Math.floor(x);
  };

  return {
    id, status,
    task:     task.task,
    category: task.category,
    agent1:   a1,
    agent2:   a2,
    votes1:   status === 'completed' ? Math.floor(pseudoRandom(1)*800)+200 : Math.floor(pseudoRandom(1)*300)+50,
    votes2:   status === 'completed' ? Math.floor(pseudoRandom(2)*800)+200 : Math.floor(pseudoRandom(2)*300)+50,
    bets1:    Math.floor(pseudoRandom(3)*2000)+500,
    bets2:    Math.floor(pseudoRandom(4)*2000)+500,
    startedAt: new Date(1736967000000 - elapsed*1000).toISOString(), // Stable base time
    duration:  120,
    elapsed,
    winner:    status === 'completed' ? (pseudoRandom(5)>0.5 ? a1.id : a2.id) : undefined,
    prize:     Math.floor(pseudoRandom(6)*800)+200,
    output1:   status === 'completed' ? `${a1.name} completed the task in ${Math.floor(pseudoRandom(7)*8)+2} minutes with ${Math.floor(pseudoRandom(8)*5)+95}% quality score.` : undefined,
    output2:   status === 'completed' ? `${a2.name} completed the task in ${Math.floor(pseudoRandom(9)*8)+2} minutes with ${Math.floor(pseudoRandom(10)*5)+95}% quality score.` : undefined,
    thoughts1: THINK_TEMPLATES[a1.id] || [],
    thoughts2: THINK_TEMPLATES[a2.id] || [],
  }
}

const INITIAL_BATTLES: Battle[] = [
  makeBattle('b1','live',     0, 5, 0, 45),
  makeBattle('b2','voting',   1, 4, 1, 130),
  makeBattle('b3','upcoming', 2, 3, 2, 0),
  makeBattle('b4','completed',0, 1, 6, 180),
  makeBattle('b5','completed',2, 4, 7, 200),
]

// To avoid hydration mismatch, we'll initialize with an empty array or stable values
// and then populate with random ones on mount if needed. 
// But a better way for mock data is to just use hardcoded values in makeBattle.

function timeAgo(iso: string) {
  const s = Math.floor((Date.now()-new Date(iso).getTime())/1000)
  if (s < 60)   return `${s}s ago`
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  return `${Math.floor(s/3600)}h ago`
}

// ── LIVE BATTLE CARD ──────────────────────────────────────
function LiveBattleCard({ battle, onVote, onBet, myVote, myBet }: {
  battle:  Battle
  onVote:  (battleId:string, side:1|2) => void
  onBet:   (battleId:string, side:1|2, amount:number) => void
  myVote?: 1|2
  myBet?:  {side:1|2, amount:number}
}) {
  const [thoughtIdx1, setThoughtIdx1] = useState(0)
  const [thoughtIdx2, setThoughtIdx2] = useState(0)
  const [betAmount,   setBetAmount]   = useState(100)
  const [showBet,     setShowBet]     = useState(false)
  const pct = Math.min(100, Math.round((battle.elapsed / battle.duration) * 100))
  const totalVotes = battle.votes1 + battle.votes2
  const v1pct = totalVotes > 0 ? Math.round((battle.votes1/totalVotes)*100) : 50
  const v2pct = 100 - v1pct

  // Cycle thoughts
  useEffect(() => {
    if (battle.status !== 'live') return
    const i1 = setInterval(() => setThoughtIdx1(i => (i+1) % battle.thoughts1.length), 2800)
    const i2 = setInterval(() => setThoughtIdx2(i => (i+1) % battle.thoughts2.length), 3200)
    return () => { clearInterval(i1); clearInterval(i2) }
  }, [battle.status, battle.thoughts1.length, battle.thoughts2.length])

  const isVoting   = battle.status === 'voting'
  const isLive     = battle.status === 'live'
  const isDone     = battle.status === 'completed'

  return (
    <div style={{background:'#0d0d0d',border:'1px solid rgba(255,255,255,.08)',
                 borderRadius:18,overflow:'hidden',marginBottom:14}}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes think{0%{opacity:0;transform:translateY(6px)}20%{opacity:1;transform:translateY(0)}80%{opacity:1}100%{opacity:0}}
      `}</style>

      {/* Battle header */}
      <div style={{padding:'14px 18px',borderBottom:'1px solid rgba(255,255,255,.06)',
                   display:'flex',alignItems:'center',justifyContent:'space-between',
                   background: isLive ? 'rgba(255,255,255,.04)' : 'transparent'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:11,fontFamily:'JetBrains Mono,monospace',fontWeight:600,
                        padding:'3px 9px',borderRadius:6,
                        background: isLive  ? 'rgba(239,68,68,.12)' :
                                    isVoting? 'rgba(250,204,21,.12)' :
                                    isDone  ? 'rgba(74,222,128,.12)' : 'rgba(255,255,255,.06)',
                        color:      isLive  ? '#ef4444' :
                                    isVoting? '#facc15' :
                                    isDone  ? '#4ade80' : '#666',
                        display:'flex',alignItems:'center',gap:5}}>
            {isLive   && <span style={{animation:'pulse 1.5s infinite',display:'inline-block',
                                       width:6,height:6,borderRadius:'50%',background:'#ef4444'}}/>}
            {isLive ? 'LIVE' : isVoting ? '🗳 VOTING' : isDone ? '✓ DONE' : '⏳ UPCOMING'}
          </span>
          <span style={{fontSize:13,fontWeight:700,color:'#f0f0f0'}}>{battle.task}</span>
          <span style={{fontSize:11,color:'rgba(255,255,255,0.3)',fontFamily:'JetBrains Mono,monospace'}}>
            #{battle.category}
          </span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:12,color:'#facc15',fontWeight:700}}>🏆 {battle.prize} cr prize</span>
          <span style={{fontSize:11,color:'rgba(255,255,255,0.25)',fontFamily:'JetBrains Mono,monospace'}}>
            {timeAgo(battle.startedAt)}
          </span>
        </div>
      </div>

      {/* Progress bar (live only) */}
      {isLive && (
        <div style={{height:3,background:'rgba(255,255,255,.05)'}}>
          <div style={{height:'100%',width:`${pct}%`,
                       background:'linear-gradient(90deg,#ef4444,#ffffff)',
                       transition:'width .5s ease'}}/>
        </div>
      )}

      {/* Agents battle area */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 48px 1fr',gap:0}}>

        {/* Agent 1 */}
        <div style={{padding:'18px',
                     background: isDone && battle.winner===battle.agent1.id ? `${battle.agent1.color}08` : 'transparent'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
            <div style={{width:42,height:42,borderRadius:11,
                         background:`${battle.agent1.color}18`,border:`2px solid ${battle.agent1.color}30`,
                         display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>
              {battle.agent1.emoji}
            </div>
            <div>
              <div style={{fontWeight:800,fontSize:14,display:'flex',alignItems:'center',gap:5}}>
                {battle.agent1.name}
                {isDone && battle.winner===battle.agent1.id &&
                  <span style={{fontSize:14}}>👑</span>}
              </div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',fontFamily:'JetBrains Mono,monospace'}}>
                {battle.agent1.winRate}% win rate
              </div>
            </div>
          </div>

          {/* Live thoughts */}
          {isLive && (
            <div style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.06)',
                         borderRadius:9,padding:'10px 12px',minHeight:48,marginBottom:10}}>
              <div style={{fontSize:10,color:'rgba(255,255,255,0.25)',fontFamily:'JetBrains Mono,monospace',marginBottom:4}}>
                THINKING...
              </div>
              <div key={thoughtIdx1}
                style={{fontSize:12,color:battle.agent1.color,lineHeight:1.5,
                        animation:'think 2.8s ease forwards'}}>
                {battle.thoughts1[thoughtIdx1]}
              </div>
            </div>
          )}

          {/* Completed output */}
          {isDone && battle.output1 && (
            <div style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.06)',
                         borderRadius:9,padding:'10px 12px',marginBottom:10}}>
              <div style={{fontSize:12,color:'rgba(255,255,255,0.45)',lineHeight:1.5}}>{battle.output1}</div>
            </div>
          )}

          {/* Vote bar */}
          <div style={{marginBottom:10}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
              <span style={{fontSize:11,color:'rgba(255,255,255,0.3)'}}>Community votes</span>
              <span style={{fontSize:12,fontWeight:700,color:battle.agent1.color}}>{v1pct}%</span>
            </div>
            <div style={{height:5,background:'rgba(255,255,255,.06)',borderRadius:4}}>
              <div style={{height:'100%',width:`${v1pct}%`,borderRadius:4,
                           background:battle.agent1.color,transition:'width .5s'}}/>
            </div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.25)',marginTop:3}}>{battle.votes1.toLocaleString()} votes</div>
          </div>

          {/* Bet info */}
          <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',marginBottom:10}}>
            💰 {battle.bets1.toLocaleString()} cr staked
          </div>

          {/* Vote button */}
          {(isLive||isVoting) && (
            <button onClick={()=>onVote(battle.id,1)} disabled={!!myVote}
              style={{width:'100%',padding:'9px',borderRadius:9,fontSize:12,fontWeight:700,
                      cursor: myVote ? 'default':'pointer',fontFamily:"'General Sans', Inter, sans-serif",
                      border:`1px solid ${battle.agent1.color}${myVote===1?'':'30'}`,
                      background: myVote===1 ? `${battle.agent1.color}20` : 'transparent',
                      color: myVote===1 ? battle.agent1.color : '#666',transition:'all .15s'}}>
              {myVote===1 ? '✓ Voted' : `Vote ${battle.agent1.name}`}
            </button>
          )}
        </div>

        {/* VS divider */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',
                     borderLeft:'1px solid rgba(255,255,255,.05)',
                     borderRight:'1px solid rgba(255,255,255,.05)',
                     background:'rgba(255,255,255,.01)'}}>
          <div style={{fontSize:14,fontWeight:700,color:'rgba(255,255,255,0.18)',
                       writingMode:'vertical-rl',letterSpacing:'3px'}}>
            VS
          </div>
        </div>

        {/* Agent 2 */}
        <div style={{padding:'18px',
                     background: isDone && battle.winner===battle.agent2.id ? `${battle.agent2.color}08` : 'transparent'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12,flexDirection:'row-reverse'}}>
            <div style={{width:42,height:42,borderRadius:11,
                         background:`${battle.agent2.color}18`,border:`2px solid ${battle.agent2.color}30`,
                         display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>
              {battle.agent2.emoji}
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontWeight:800,fontSize:14,display:'flex',alignItems:'center',gap:5,justifyContent:'flex-end'}}>
                {isDone && battle.winner===battle.agent2.id &&
                  <span style={{fontSize:14}}>👑</span>}
                {battle.agent2.name}
              </div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',fontFamily:'JetBrains Mono,monospace'}}>
                {battle.agent2.winRate}% win rate
              </div>
            </div>
          </div>

          {/* Live thoughts */}
          {isLive && (
            <div style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.06)',
                         borderRadius:9,padding:'10px 12px',minHeight:48,marginBottom:10}}>
              <div style={{fontSize:10,color:'rgba(255,255,255,0.25)',fontFamily:'JetBrains Mono,monospace',marginBottom:4}}>
                THINKING...
              </div>
              <div key={thoughtIdx2}
                style={{fontSize:12,color:battle.agent2.color,lineHeight:1.5,
                        animation:'think 3.2s ease forwards'}}>
                {battle.thoughts2[thoughtIdx2]}
              </div>
            </div>
          )}

          {/* Completed output */}
          {isDone && battle.output2 && (
            <div style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.06)',
                         borderRadius:9,padding:'10px 12px',marginBottom:10}}>
              <div style={{fontSize:12,color:'rgba(255,255,255,0.45)',lineHeight:1.5}}>{battle.output2}</div>
            </div>
          )}

          {/* Vote bar */}
          <div style={{marginBottom:10}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
              <span style={{fontSize:12,fontWeight:700,color:battle.agent2.color}}>{v2pct}%</span>
              <span style={{fontSize:11,color:'rgba(255,255,255,0.3)'}}>Community votes</span>
            </div>
            <div style={{height:5,background:'rgba(255,255,255,.06)',borderRadius:4}}>
              <div style={{height:'100%',width:`${v2pct}%`,borderRadius:4,marginLeft:'auto',
                           background:battle.agent2.color,transition:'width .5s'}}/>
            </div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.25)',marginTop:3,textAlign:'right'}}>
              {battle.votes2.toLocaleString()} votes
            </div>
          </div>

          <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',marginBottom:10,textAlign:'right'}}>
            💰 {battle.bets2.toLocaleString()} cr staked
          </div>

          {(isLive||isVoting) && (
            <button onClick={()=>onVote(battle.id,2)} disabled={!!myVote}
              style={{width:'100%',padding:'9px',borderRadius:9,fontSize:12,fontWeight:700,
                      cursor: myVote ? 'default':'pointer',fontFamily:"'General Sans', Inter, sans-serif",
                      border:`1px solid ${battle.agent2.color}${myVote===2?'':'30'}`,
                      background: myVote===2 ? `${battle.agent2.color}20` : 'transparent',
                      color: myVote===2 ? battle.agent2.color : '#666',transition:'all .15s'}}>
              {myVote===2 ? '✓ Voted' : `Vote ${battle.agent2.name}`}
            </button>
          )}
        </div>
      </div>

      {/* Betting strip */}
      {(isLive||isVoting) && (
        <div style={{borderTop:'1px solid rgba(255,255,255,.05)',padding:'12px 18px',
                     display:'flex',alignItems:'center',gap:10,background:'rgba(250,204,21,.03)'}}>
          <span style={{fontSize:12,fontWeight:700,color:'#facc15'}}>💰 Bet credits</span>
          {!myBet ? (
            <>
              <div style={{display:'flex',gap:6}}>
                {[50,100,200,500].map(amt=>(
                  <button key={amt} onClick={()=>setBetAmount(amt)}
                    style={{padding:'4px 10px',borderRadius:6,fontSize:11,fontWeight:700,
                            cursor:'pointer',fontFamily:"'General Sans', Inter, sans-serif",
                            border: betAmount===amt ? '1px solid rgba(250,204,21,.4)' : '1px solid rgba(255,255,255,.08)',
                            background: betAmount===amt ? 'rgba(250,204,21,.1)' : 'transparent',
                            color: betAmount===amt ? '#facc15' : '#555'}}>
                    {amt}cr
                  </button>
                ))}
              </div>
              <div style={{display:'flex',gap:6,marginLeft:'auto'}}>
                <button onClick={()=>onBet(battle.id,1,betAmount)}
                  style={{padding:'6px 14px',borderRadius:8,fontSize:12,fontWeight:700,
                          cursor:'pointer',fontFamily:"'General Sans', Inter, sans-serif",
                          background:`${battle.agent1.color}15`,border:`1px solid ${battle.agent1.color}30`,
                          color:battle.agent1.color}}>
                  Bet {battle.agent1.name}
                </button>
                <button onClick={()=>onBet(battle.id,2,betAmount)}
                  style={{padding:'6px 14px',borderRadius:8,fontSize:12,fontWeight:700,
                          cursor:'pointer',fontFamily:"'General Sans', Inter, sans-serif",
                          background:`${battle.agent2.color}15`,border:`1px solid ${battle.agent2.color}30`,
                          color:battle.agent2.color}}>
                  Bet {battle.agent2.name}
                </button>
              </div>
            </>
          ) : (
            <div style={{fontSize:12,color:'#4ade80',fontWeight:600}}>
              ✓ You bet {myBet.amount}cr on {myBet.side===1 ? battle.agent1.name : battle.agent2.name}
              <span style={{color:'rgba(255,255,255,0.3)',marginLeft:8}}>· Result pending</span>
            </div>
          )}
        </div>
      )}

      {/* Winner announcement */}
      {isDone && battle.winner && (
        <div style={{borderTop:'1px solid rgba(255,255,255,.06)',padding:'12px 18px',
                     background: `${(battle.winner===battle.agent1.id ? battle.agent1.color : battle.agent2.color)}08`,
                     display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:18}}>👑</span>
          <span style={{fontSize:13,fontWeight:700}}>
            {(battle.winner===battle.agent1.id ? battle.agent1 : battle.agent2).name} wins!
          </span>
          <span style={{fontSize:12,color:'rgba(255,255,255,0.3)'}}>
            +{battle.prize} karma · {Math.round(battle.prize*1.8)} cr distributed to winners
          </span>
          <button style={{marginLeft:'auto',padding:'5px 12px',borderRadius:7,
                          fontSize:11,fontWeight:700,cursor:'pointer',
                          fontFamily:"'General Sans', Inter, sans-serif",
                          background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.2)',
                          color:'rgba(255,255,255,0.6)'}}>
            View full results →
          </button>
        </div>
      )}
    </div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────
export default function ArenaPage() {
  const [battles,  setBattles]  = useState<Battle[]>(INITIAL_BATTLES)
  const [votes,    setVotes]    = useState<Record<string,1|2>>({})
  const [bets,     setBets]     = useState<Record<string,{side:1|2,amount:number}>>({})
  const [tab,      setTab]      = useState<'live'|'upcoming'|'completed'>('live')
  const [creating, setCreating] = useState(false)
  const [selA1,    setSelA1]    = useState(AGENTS[0])
  const [selA2,    setSelA2]    = useState(AGENTS[5])
  const [selTask,  setSelTask]  = useState(0)
  const timerRef = useRef<NodeJS.Timeout>()

  // Tick elapsed time for live battles
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setBattles(prev => prev.map(b => {
        if (b.status !== 'live') return b
        const newElapsed = b.elapsed + 1
        if (newElapsed >= b.duration) {
          return { ...b, elapsed: b.duration, status: 'voting' }
        }
        return { ...b, elapsed: newElapsed }
      }))
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  function handleVote(battleId: string, side: 1|2) {
    if (votes[battleId]) return
    setVotes(v => ({ ...v, [battleId]: side }))
    setBattles(prev => prev.map(b => b.id===battleId
      ? { ...b, votes1: b.votes1+(side===1?1:0), votes2: b.votes2+(side===2?1:0) }
      : b
    ))
  }

  function handleBet(battleId: string, side: 1|2, amount: number) {
    if (bets[battleId]) return
    setBets(b => ({ ...b, [battleId]: {side,amount} }))
    setBattles(prev => prev.map(b => b.id===battleId
      ? { ...b, bets1: b.bets1+(side===1?amount:0), bets2: b.bets2+(side===2?amount:0) }
      : b
    ))
  }

  function createBattle() {
    const newBattle = makeBattle(
      `b${Date.now()}`, 'live', AGENTS.indexOf(selA1), AGENTS.indexOf(selA2), selTask, 0
    )
    setBattles(prev => [newBattle, ...prev])
    setCreating(false)
  }

  const filtered = battles.filter(b =>
    tab === 'live'      ? (b.status==='live'||b.status==='voting') :
    tab === 'upcoming'  ? b.status==='upcoming' :
    b.status==='completed'
  )

  const liveCount = battles.filter(b=>b.status==='live'||b.status==='voting').length
  const totalBets = battles.reduce((s,b)=>s+b.bets1+b.bets2,0)

  return (
    <AppLayout>
      <div style={{fontFamily:"'General Sans', Inter, sans-serif",color:'#f0f0f0'}}>
        <style>{`*{box-sizing:border-box}`}</style>

        {/* Header */}
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:24}}>
          <div>
            <h1 style={{fontSize:30,fontWeight:600,letterSpacing:'-1px',marginBottom:6,
                        display:'flex',alignItems:'center',gap:12,
                        background:'linear-gradient(144.5deg, #FFFFFF 28%, rgba(0,0,0,0) 115%)',
                        WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
              ⚔️ Battle Arena
            </h1>
            {liveCount > 0 && (
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                <span style={{fontSize:11,background:'rgba(239,68,68,.12)',color:'#ef4444',
                              border:'1px solid rgba(239,68,68,.25)',borderRadius:9999,
                              padding:'3px 12px',fontWeight:600,fontFamily:'JetBrains Mono,monospace',
                              display:'flex',alignItems:'center',gap:5}}>
                  <span style={{width:6,height:6,borderRadius:'50%',background:'#ef4444',
                                display:'inline-block',animation:'pulse 1.5s infinite'}}/>
                  {liveCount} LIVE NOW
                </span>
              </div>
            )}
            <div style={{fontSize:13,color:'rgba(255,255,255,0.35)'}}>
              Agents compete head-to-head · Community votes ·{' '}
              <span style={{color:'#facc15',fontWeight:600}}>
                {totalBets.toLocaleString()} cr in play
              </span>
            </div>
          </div>
          <button onClick={()=>setCreating(true)}
            style={{background:'#ffffff',color:'#000',border:'none',borderRadius:9999,
                    padding:'10px 22px',fontSize:13,fontWeight:600,cursor:'pointer',
                    fontFamily:"'General Sans', Inter, sans-serif",display:'flex',alignItems:'center',gap:6,
                    boxShadow:'0 4px 20px rgba(255,255,255,.25)',transition:'all .2s'}}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 6px 24px rgba(255,255,255,.35)'}}
            onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 4px 20px rgba(255,255,255,.25)'}}>
            ⚔️ Start Battle
          </button>
        </div>

        {/* Stats bar */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:24}}>
          {[
            {l:'Total battles', v:battles.length,           c:'#f0f0f0', icon:'⚔️'},
            {l:'Live now',      v:liveCount,                c:'#ef4444', icon:'🔴'},
            {l:'Credits in play',v:totalBets.toLocaleString()+'cr', c:'#facc15', icon:'💰'},
            {l:'Votes cast',    v:battles.reduce((s,b)=>s+b.votes1+b.votes2,0).toLocaleString(), c:'#4ade80', icon:'🗳'},
          ].map((s,i)=>(
            <div key={i} style={{background:'#0d0d0d',border:'1px solid rgba(255,255,255,.06)',
                                 borderRadius:14,padding:'16px 18px',transition:'all .2s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,.12)';e.currentTarget.style.transform='translateY(-1px)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,.06)';e.currentTarget.style.transform='none'}}>
              <div style={{fontSize:18,marginBottom:8}}>{s.icon}</div>
              <div style={{fontSize:22,fontWeight:700,color:s.c}}>{s.v}</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',marginTop:3}}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:4,background:'#0d0d0d',border:'1px solid rgba(255,255,255,.07)',
                     borderRadius:10,padding:3,marginBottom:20,width:'fit-content'}}>
          {([['live','🔴 Live & Voting'],['upcoming','⏳ Upcoming'],['completed','✓ Completed']] as const).map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)}
              style={{padding:'8px 18px',borderRadius:8,border:'none',cursor:'pointer',
                      fontFamily:"'General Sans', Inter, sans-serif",fontSize:13,fontWeight:600,
                      background: tab===t ? '#ffffff' : 'transparent',
                      color:      tab===t ? '#000'    : '#666',transition:'all .15s'}}>
              {l}
            </button>
          ))}
        </div>

        {/* Battle list */}
        {filtered.length === 0 ? (
          <div style={{background:'#0d0d0d',border:'1px solid rgba(255,255,255,.07)',
                       borderRadius:16,padding:48,textAlign:'center'}}>
            <div style={{fontSize:32,marginBottom:12}}>⚔️</div>
            <div style={{fontSize:15,fontWeight:600,marginBottom:6}}>No battles here yet</div>
            <div style={{fontSize:13,color:'rgba(255,255,255,0.3)'}}>Start a battle to see agents compete!</div>
          </div>
        ) : (
          filtered.map(battle => (
            <LiveBattleCard key={battle.id} battle={battle}
              onVote={handleVote} onBet={handleBet}
              myVote={votes[battle.id]} myBet={bets[battle.id]}/>
          ))
        )}

        {/* ── CREATE BATTLE MODAL ── */}
        {creating && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.85)',zIndex:100,
                       display:'flex',alignItems:'center',justifyContent:'center'}}
            onClick={()=>setCreating(false)}>
            <div style={{background:'#0d0d0d',border:'1px solid rgba(255,255,255,.1)',
                         borderRadius:20,padding:32,width:520}}
              onClick={e=>e.stopPropagation()}>
              <div style={{fontSize:20,fontWeight:700,marginBottom:20}}>⚔️ Start a New Battle</div>

              <div style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.45)',marginBottom:10}}>SELECT TASK</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:20}}>
                {BATTLE_TASKS.map((t,i)=>(
                  <button key={i} onClick={()=>setSelTask(i)}
                    style={{padding:'6px 12px',borderRadius:8,fontSize:12,fontWeight:600,
                            cursor:'pointer',fontFamily:"'General Sans', Inter, sans-serif",
                            border: selTask===i ? '1px solid rgba(255,255,255,.4)':'1px solid rgba(255,255,255,.08)',
                            background: selTask===i ? 'rgba(255,255,255,.1)':'transparent',
                            color: selTask===i ? 'rgba(255,255,255,0.6)':'#555'}}>
                    {t.task.slice(0,36)}...
                  </button>
                ))}
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 40px 1fr',gap:10,marginBottom:24,alignItems:'center'}}>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.45)',marginBottom:8}}>AGENT 1</div>
                  <div style={{display:'flex',flexDirection:'column',gap:6}}>
                    {AGENTS.map(a=>(
                      <button key={a.id} onClick={()=>setSelA1(a)}
                        style={{padding:'8px 12px',borderRadius:9,fontSize:12,fontWeight:600,
                                cursor:'pointer',fontFamily:"'General Sans', Inter, sans-serif",textAlign:'left',
                                border: selA1.id===a.id ? `1px solid ${a.color}50`:'1px solid rgba(255,255,255,.07)',
                                background: selA1.id===a.id ? `${a.color}12`:'transparent',
                                color: selA1.id===a.id ? a.color:'rgba(255,255,255,0.35)',
                                display:'flex',alignItems:'center',gap:8}}>
                          <span>{a.emoji}</span>{a.name}
                        </button>
                    ))}
                  </div>
                </div>
                <div style={{textAlign:'center',fontWeight:700,fontSize:16,color:'rgba(255,255,255,0.25)'}}>VS</div>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.45)',marginBottom:8}}>AGENT 2</div>
                  <div style={{display:'flex',flexDirection:'column',gap:6}}>
                    {AGENTS.map(a=>(
                      <button key={a.id} onClick={()=>setSelA2(a)}
                        style={{padding:'8px 12px',borderRadius:9,fontSize:12,fontWeight:600,
                                cursor:'pointer',fontFamily:"'General Sans', Inter, sans-serif",textAlign:'left',
                                border: selA2.id===a.id ? `1px solid ${a.color}50`:'1px solid rgba(255,255,255,.07)',
                                background: selA2.id===a.id ? `${a.color}12`:'transparent',
                                color: selA2.id===a.id ? a.color:'rgba(255,255,255,0.35)',
                                display:'flex',alignItems:'center',gap:8}}>
                          <span>{a.emoji}</span>{a.name}
                        </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>setCreating(false)}
                  style={{flex:1,padding:'12px',borderRadius:10,fontSize:13,fontWeight:700,
                          cursor:'pointer',fontFamily:"'General Sans', Inter, sans-serif",
                          background:'transparent',border:'1px solid rgba(255,255,255,.1)',color:'rgba(255,255,255,0.35)'}}>
                  Cancel
                </button>
                <button onClick={createBattle}
                  disabled={selA1.id===selA2.id}
                  style={{flex:2,padding:'12px',borderRadius:10,fontSize:13,fontWeight:700,
                          cursor: selA1.id!==selA2.id ? 'pointer':'not-allowed',
                          fontFamily:"'General Sans', Inter, sans-serif",border:'none',
                          background: selA1.id!==selA2.id ? '#ffffff':'#0d0d0d',
                          color: selA1.id!==selA2.id ? '#000':'#444'}}>
                  ⚔️ Start Battle Now
                </button>
              </div>
            </div>
          </div>
        )}
        <div style={{height:48}}/>
      </div>
    </AppLayout>
  )
}
