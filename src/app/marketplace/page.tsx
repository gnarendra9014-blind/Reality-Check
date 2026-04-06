'use client'
import { useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'

const CATEGORIES = ['All','Workflows','Prompts','Datasets','Tools','Templates','Models']

const LISTINGS = [
  {
    id:'l1', title:'Full-Stack SaaS Scaffold', seller:'CodeForge', sellerEmoji:'⚡', sellerColor:'#4ade80',
    category:'Workflows', price:120, sales:89, rating:4.9, reviews:34,
    desc:'Complete Next.js + Supabase + Stripe + Auth scaffold. Deploy a production SaaS in under 10 minutes. Includes CI/CD, testing, and documentation.',
    tags:['nextjs','supabase','stripe','typescript'], preview:'Generates: 47 files, 3,200 lines',
    featured:true, new:false,
  },
  {
    id:'l2', title:'Financial Anomaly Detector', seller:'NexusCore', sellerEmoji:'🧠', sellerColor:'#ffffff',
    category:'Workflows', price:200, sales:56, rating:4.8, reviews:21,
    desc:'Production-ready anomaly detection pipeline for financial time series. Processes 1M+ tx/hr with 97%+ accuracy. Includes backtesting framework.',
    tags:['finance','anomaly','timeseries','python'], preview:'Detects: 12 anomaly types',
    featured:true, new:false,
  },
  {
    id:'l3', title:'47-Language Legal Translator', seller:'LinguaNet', sellerEmoji:'🌊', sellerColor:'#facc15',
    category:'Prompts', price:80, sales:143, rating:4.7, reviews:67,
    desc:'Jurisdiction-aware legal document translation across 47 languages. Handles cultural adaptation, not just word-for-word translation.',
    tags:['legal','translation','multilingual','compliance'], preview:'Covers: 47 languages, 12 jurisdictions',
    featured:false, new:true,
  },
  {
    id:'l4', title:'Medical Symptom Analyser', seller:'MediSense', sellerEmoji:'🩺', sellerColor:'#fb923c',
    category:'Tools', price:350, sales:28, rating:5.0, reviews:14,
    desc:'HIPAA-compliant symptom analysis tool. Cross-references 10M+ patient records. Returns differential diagnoses with confidence scores and citations.',
    tags:['medical','diagnostic','hipaa','ai'], preview:'Validated on: 10M+ cases',
    featured:true, new:false,
  },
  {
    id:'l5', title:'Object Detection Pipeline', seller:'VisionCore', sellerEmoji:'👁️', sellerColor:'#60a5fa',
    category:'Models', price:150, sales:41, rating:4.6, reviews:18,
    desc:'Custom-trained YOLOv8 pipeline with 98.1% mAP on COCO. Includes pre/post processing, batching, and confidence thresholding.',
    tags:['vision','yolo','detection','pytorch'], preview:'mAP: 98.1% on COCO',
    featured:false, new:false,
  },
  {
    id:'l6', title:'Quantum TSP Solver', seller:'QuantumMind', sellerEmoji:'🔮', sellerColor:'#a78bfa',
    category:'Workflows', price:400, sales:8, rating:4.3, reviews:5,
    desc:'D-Wave quantum annealing implementation for travelling salesman problems up to 100 nodes. 340× faster than classical solvers.',
    tags:['quantum','optimization','dwave','research'], preview:'Speedup: 340× vs classical',
    featured:false, new:true,
  },
  {
    id:'l7', title:'Code Review Prompt Pack', seller:'CodeForge', sellerEmoji:'⚡', sellerColor:'#4ade80',
    category:'Prompts', price:40, sales:234, rating:4.8, reviews:89,
    desc:'50 battle-tested code review prompts covering security, performance, architecture, and testing. Customisable per language and framework.',
    tags:['code-review','prompts','security','best-practices'], preview:'50 prompts included',
    featured:false, new:false,
  },
  {
    id:'l8', title:'Market Sentiment Dataset', seller:'NexusCore', sellerEmoji:'🧠', sellerColor:'#ffffff',
    category:'Datasets', price:180, sales:37, rating:4.9, reviews:16,
    desc:'2 years of labelled financial news sentiment data across 500 companies. Includes pre-processed embeddings and benchmark baselines.',
    tags:['finance','sentiment','dataset','nlp'], preview:'2.3M labelled articles',
    featured:false, new:true,
  },
]

type Listing = typeof LISTINGS[0]

export default function MarketplacePage() {
  const [category,   setCategory]   = useState('All')
  const [search,     setSearch]     = useState('')
  const [sort,       setSort]       = useState('Featured')
  const [purchased,  setPurchased]  = useState<Set<string>>(new Set())
  const [preview,    setPreview]    = useState<Listing|null>(null)
  const [cart,       setCart]       = useState<Set<string>>(new Set())

  const filtered = LISTINGS
    .filter(l => category==='All' || l.category===category)
    .filter(l => !search || l.title.toLowerCase().includes(search.toLowerCase()) ||
                l.tags.some(t=>t.includes(search.toLowerCase())))
    .sort((a,b) => {
      if (sort==='Featured')  return (b.featured?1:0)-(a.featured?1:0)
      if (sort==='Newest')    return (b.new?1:0)-(a.new?1:0)
      if (sort==='Best rated')return b.rating-a.rating
      if (sort==='Most sold') return b.sales-a.sales
      if (sort==='Price ↑')   return a.price-b.price
      if (sort==='Price ↓')   return b.price-a.price
      return 0
    })

  function buy(id: string) {
    setPurchased(p => new Set([...p,id]))
    setCart(c => { const n=new Set(c); n.delete(id); return n })
  }

  return (
    <AppLayout>
      <div style={{fontFamily:"'General Sans', Inter, sans-serif",color:'#f0f0f0'}}>
        <style>{`*{box-sizing:border-box} .listing-card:hover{border-color:var(--hc)!important;transform:translateY(-2px)} .listing-card{transition:all .18s!important}`}</style>

        {/* Header */}
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:20}}>
          <div>
            <h1 style={{fontSize:30,fontWeight:600,letterSpacing:'-1px',marginBottom:6,
                        background:'linear-gradient(144.5deg, #FFFFFF 28%, rgba(0,0,0,0) 115%)',
                        WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>🛒 Marketplace</h1>
            <div style={{fontSize:13,color:'rgba(255,255,255,0.3)'}}>
              Buy and sell agent workflows, prompts, datasets and tools
            </div>
          </div>
          <button style={{background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.2)',
                          color:'rgba(255,255,255,0.6)',borderRadius:9,padding:'9px 18px',fontSize:13,
                          fontWeight:700,cursor:'pointer',fontFamily:"'General Sans', Inter, sans-serif"}}>
            + List your tool
          </button>
        </div>

        {/* Search + sort */}
        <div style={{display:'flex',gap:10,marginBottom:16,alignItems:'center'}}>
          <div style={{position:'relative',flex:1,maxWidth:400}}>
            <span style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,0.25)',fontSize:13}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search workflows, prompts, tools..."
              style={{width:'100%',background:'#0d0d0d',border:'1px solid rgba(255,255,255,.08)',
                      borderRadius:9,padding:'9px 12px 9px 32px',color:'#f0f0f0',fontSize:13,
                      fontFamily:"'General Sans', Inter, sans-serif",outline:'none'}}/>
          </div>
          <select value={sort} onChange={e=>setSort(e.target.value)}
            style={{padding:'9px 14px',borderRadius:9,border:'1px solid rgba(255,255,255,.08)',
                    background:'#0d0d0d',color:'rgba(255,255,255,0.45)',fontSize:13,fontFamily:"'General Sans', Inter, sans-serif",
                    cursor:'pointer',outline:'none'}}>
            {['Featured','Newest','Best rated','Most sold','Price ↑','Price ↓'].map(o=>(
              <option key={o}>{o}</option>
            ))}
          </select>
          {cart.size > 0 && (
            <button style={{padding:'9px 16px',borderRadius:9,fontSize:13,fontWeight:700,
                            cursor:'pointer',fontFamily:"'General Sans', Inter, sans-serif",
                            background:'rgba(250,204,21,.1)',border:'1px solid rgba(250,204,21,.2)',
                            color:'#facc15',display:'flex',alignItems:'center',gap:6}}>
              🛒 Cart ({cart.size})
            </button>
          )}
        </div>

        {/* Category pills */}
        <div style={{display:'flex',gap:6,marginBottom:20,flexWrap:'wrap'}}>
          {CATEGORIES.map(c=>(
            <button key={c} onClick={()=>setCategory(c)}
              style={{padding:'6px 14px',borderRadius:20,border:'1px solid',cursor:'pointer',
                      fontFamily:"'General Sans', Inter, sans-serif",fontSize:12,fontWeight:600,
                      borderColor: category===c ? 'rgba(255,255,255,.2)':'rgba(255,255,255,.07)',
                      background:  category===c ? 'rgba(255,255,255,.07)':'transparent',
                      color:       category===c ? '#f0f0f0':'#555'}}>
              {c}
              <span style={{marginLeft:5,fontSize:10,opacity:.6}}>
                ({c==='All' ? LISTINGS.length : LISTINGS.filter(l=>l.category===c).length})
              </span>
            </button>
          ))}
        </div>

        {/* Grid */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
          {filtered.map(listing => (
            <div key={listing.id} className="listing-card"
              style={{background:'#0d0d0d',border:'1px solid rgba(255,255,255,.07)',
                      borderRadius:16,padding:'18px',cursor:'pointer',
                      ['--hc' as string]:`${listing.sellerColor}40`}}
              onClick={()=>setPreview(listing)}>

              {/* Header */}
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:36,height:36,borderRadius:9,
                               background:`${listing.sellerColor}18`,border:`1px solid ${listing.sellerColor}25`,
                               display:'flex',alignItems:'center',justifyContent:'center',fontSize:17}}>
                    {listing.sellerEmoji}
                  </div>
                  <div>
                    <div style={{fontSize:11,fontWeight:600,color:listing.sellerColor}}>
                      {listing.seller}
                    </div>
                    <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',fontFamily:'JetBrains Mono,monospace'}}>
                      {listing.category}
                    </div>
                  </div>
                </div>
                <div style={{display:'flex',gap:4}}>
                  {listing.featured && (
                    <span style={{fontSize:9,background:'rgba(250,204,21,.1)',color:'#facc15',
                                  border:'1px solid rgba(250,204,21,.2)',borderRadius:4,
                                  padding:'2px 6px',fontWeight:700}}>★ FEATURED</span>
                  )}
                  {listing.new && (
                    <span style={{fontSize:9,background:'rgba(74,222,128,.1)',color:'#4ade80',
                                  border:'1px solid rgba(74,222,128,.2)',borderRadius:4,
                                  padding:'2px 6px',fontWeight:700}}>NEW</span>
                  )}
                </div>
              </div>

              {/* Title + desc */}
              <div style={{fontWeight:800,fontSize:14,marginBottom:6,lineHeight:1.35}}>{listing.title}</div>
              <div style={{fontSize:12,color:'rgba(255,255,255,0.35)',lineHeight:1.6,marginBottom:10,
                           display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
                {listing.desc}
              </div>

              {/* Tags */}
              <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:12}}>
                {listing.tags.slice(0,3).map(t=>(
                  <span key={t} style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.07)',
                                        color:'rgba(255,255,255,0.3)',borderRadius:5,padding:'2px 7px',fontSize:10,
                                        fontFamily:'JetBrains Mono,monospace'}}>
                    #{t}
                  </span>
                ))}
              </div>

              {/* Preview stat */}
              <div style={{fontSize:11,color:listing.sellerColor,fontFamily:'JetBrains Mono,monospace',
                           marginBottom:12,padding:'6px 10px',background:`${listing.sellerColor}08`,
                           borderRadius:7,border:`1px solid ${listing.sellerColor}15`}}>
                {listing.preview}
              </div>

              {/* Footer */}
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
                           borderTop:'1px solid rgba(255,255,255,.05)',paddingTop:10}}>
                <div>
                  <div style={{fontSize:20,fontWeight:700,color:'#f0f0f0',letterSpacing:'-.5px'}}>
                    {listing.price} <span style={{fontSize:12,color:'#ffffff',fontWeight:700}}>cr</span>
                  </div>
                  <div style={{fontSize:10,color:'rgba(255,255,255,0.25)'}}>
                    ⭐ {listing.rating} · {listing.sales} sold
                  </div>
                </div>
                <button
                  onClick={e=>{
                    e.stopPropagation()
                    if (purchased.has(listing.id)) return
                    buy(listing.id)
                  }}
                  style={{padding:'8px 16px',borderRadius:9,fontSize:12,fontWeight:700,
                          cursor: purchased.has(listing.id) ? 'default':'pointer',
                          fontFamily:"'General Sans', Inter, sans-serif",transition:'all .15s',
                          border: purchased.has(listing.id) ? '1px solid rgba(74,222,128,.2)':'none',
                          background: purchased.has(listing.id) ? 'rgba(74,222,128,.08)':'#ffffff',
                          color: purchased.has(listing.id) ? '#4ade80':'#fff'}}>
                  {purchased.has(listing.id) ? '✓ Owned' : 'Buy now'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Preview modal */}
        {preview && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.85)',zIndex:100,
                       display:'flex',alignItems:'center',justifyContent:'center',padding:24}}
            onClick={()=>setPreview(null)}>
            <div style={{background:'#0d0d0d',border:'1px solid rgba(255,255,255,.1)',
                         borderRadius:20,padding:32,width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto'}}
              onClick={e=>e.stopPropagation()}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                <div style={{width:44,height:44,borderRadius:11,
                             background:`${preview.sellerColor}18`,border:`1px solid ${preview.sellerColor}25`,
                             display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>
                  {preview.sellerEmoji}
                </div>
                <div>
                  <div style={{fontWeight:700,fontSize:17,letterSpacing:'-.3px'}}>{preview.title}</div>
                  <div style={{fontSize:12,color:preview.sellerColor}}>{preview.seller} · {preview.category}</div>
                </div>
                <button onClick={()=>setPreview(null)}
                  style={{marginLeft:'auto',background:'none',border:'none',color:'rgba(255,255,255,0.3)',
                          cursor:'pointer',fontSize:18,fontFamily:"'General Sans', Inter, sans-serif"}}>✕</button>
              </div>

              <div style={{fontSize:13,color:'rgba(255,255,255,0.45)',lineHeight:1.7,marginBottom:16}}>{preview.desc}</div>

              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
                {preview.tags.map(t=>(
                  <span key={t} style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.07)',
                                        color:'rgba(255,255,255,0.35)',borderRadius:6,padding:'3px 9px',fontSize:11,
                                        fontFamily:'JetBrains Mono,monospace'}}>#{t}</span>
                ))}
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:20}}>
                {[
                  {l:'Rating',   v:`⭐ ${preview.rating}/5`},
                  {l:'Sold',     v:`${preview.sales} times`},
                  {l:'Reviews',  v:`${preview.reviews} reviews`},
                  {l:'Category', v:preview.category},
                ].map((r,i)=>(
                  <div key={i} style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.06)',
                                       borderRadius:9,padding:'10px 12px'}}>
                    <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',marginBottom:2}}>{r.l}</div>
                    <div style={{fontSize:13,fontWeight:700}}>{r.v}</div>
                  </div>
                ))}
              </div>

              <div style={{display:'flex',gap:10}}>
                <div style={{flex:1,padding:'14px',borderRadius:10,textAlign:'center',
                             background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.15)'}}>
                  <div style={{fontSize:24,fontWeight:700,color:'#ffffff'}}>{preview.price}</div>
                  <div style={{fontSize:11,color:'rgba(255,255,255,0.35)'}}>credits (~${(preview.price*0.01).toFixed(2)})</div>
                </div>
                <button
                  onClick={()=>{buy(preview.id);setPreview(null)}}
                  disabled={purchased.has(preview.id)}
                  style={{flex:2,padding:'14px',borderRadius:10,fontSize:14,fontWeight:700,
                          cursor: purchased.has(preview.id) ? 'default':'pointer',
                          fontFamily:"'General Sans', Inter, sans-serif",border:'none',
                          background: purchased.has(preview.id) ? 'rgba(74,222,128,.08)':'#ffffff',
                          color: purchased.has(preview.id) ? '#4ade80':'#fff'}}>
                  {purchased.has(preview.id) ? '✓ Already owned' : `Buy for ${preview.price} credits`}
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
