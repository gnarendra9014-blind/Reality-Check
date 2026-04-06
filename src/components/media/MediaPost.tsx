'use client'
import { useState } from 'react'

type MediaItem = {
  url:   string
  type:  'image' | 'video'
  name?: string
}

type MediaPostProps = {
  media:      MediaItem[]
  agentColor: string
}

export default function MediaPost({ media, agentColor }: MediaPostProps) {
  const [lightbox, setLightbox] = useState<MediaItem | null>(null)
  const [videoPlaying, setVideoPlaying] = useState<Record<number,boolean>>({})

  if (!media || media.length === 0) return null

  const count = media.length

  // Grid layout based on count
  const gridStyle: React.CSSProperties =
    count === 1 ? { display:'block' } :
    count === 2 ? { display:'grid', gridTemplateColumns:'1fr 1fr', gap:3 } :
    count === 3 ? { display:'grid', gridTemplateColumns:'2fr 1fr', gridTemplateRows:'1fr 1fr', gap:3 } :
                  { display:'grid', gridTemplateColumns:'1fr 1fr', gridTemplateRows:'1fr 1fr', gap:3 }

  return (
    <>
      <div style={{
        ...gridStyle,
        borderRadius: 12,
        overflow: 'hidden',
        margin: '10px 0',
        border: `1px solid ${agentColor}20`,
        maxHeight: count === 1 ? 400 : 300,
      }}>
        {media.slice(0, 4).map((item, idx) => {
          const isSpanning = count === 3 && idx === 0
          return (
            <div key={idx}
              style={{
                position: 'relative',
                cursor: 'pointer',
                overflow: 'hidden',
                gridRow: isSpanning ? '1 / 3' : 'auto',
                background: '#0d0d0d',
                minHeight: count === 1 ? 200 : 120,
              }}
              onClick={() => item.type === 'image' && setLightbox(item)}>

              {item.type === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt={item.name || 'Agent post media'}
                  style={{
                    width: '100%', height: '100%',
                    objectFit: 'cover', display: 'block',
                    transition: 'transform .3s ease',
                    minHeight: count === 1 ? 200 : 120,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  onError={e => {
                    // Fallback for broken images
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <video
                  src={item.url}
                  controls={videoPlaying[idx]}
                  muted
                  loop
                  playsInline
                  style={{ width:'100%', height:'100%', objectFit:'cover', display:'block',
                           minHeight: count===1 ? 200 : 120 }}
                  onClick={e => {
                    e.stopPropagation()
                    setVideoPlaying(v => ({ ...v, [idx]: true }))
                  }}
                />
              )}

              {/* Video play button overlay */}
              {item.type === 'video' && !videoPlaying[idx] && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,.4)',
                  transition: 'background .2s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,.3)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,.4)')}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: 'rgba(255,255,255,.15)',
                    backdropFilter: 'blur(8px)',
                    border: '2px solid rgba(255,255,255,.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, paddingLeft: 4,
                    transition: 'transform .2s',
                  }}>▶</div>
                </div>
              )}

              {/* Image expand hint */}
              {item.type === 'image' && (
                <div style={{
                  position: 'absolute', top: 8, right: 8,
                  background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(8px)',
                  borderRadius: 6, padding: '3px 8px',
                  fontSize: 10, color: 'rgba(255,255,255,.7)',
                  opacity: 0, transition: 'opacity .2s',
                }}
                  className="expand-hint">
                  ⤢ expand
                </div>
              )}

              {/* +N overlay for 4+ media */}
              {count > 4 && idx === 3 && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,.7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, fontWeight: 900, color: '#fff',
                }}>
                  +{count - 4}
                </div>
              )}

              {/* Media type badge */}
              <div style={{
                position: 'absolute', bottom: 8, left: 8,
                background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(8px)',
                borderRadius: 5, padding: '2px 7px',
                fontSize: 9, fontWeight: 700,
                color: item.type === 'video' ? '#a78bfa' : '#60a5fa',
                border: `1px solid ${item.type === 'video' ? 'rgba(167,139,250,.3)' : 'rgba(96,165,250,.3)'}`,
              }}>
                {item.type === 'video' ? '🎬 VIDEO' : '📸'}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── LIGHTBOX ── */}
      {lightbox && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,.95)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setLightbox(null)}>
          <style>{`.lightbox-img{max-width:90vw;max-height:90vh;border-radius:12px;box-shadow:0 40px 80px rgba(0,0,0,.8)}`}</style>

          {/* Close button */}
          <button
            style={{
              position: 'fixed', top: 20, right: 20,
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,255,255,.1)', border: 'none',
              color: '#fff', fontSize: 18, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onClick={() => setLightbox(null)}>
            ✕
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox.url}
            alt="Full size"
            className="lightbox-img"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
