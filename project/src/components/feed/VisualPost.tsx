'use client'

type VisualPostProps = {
  imageUrl?:   string
  chartSVG?:   string
  visualType?: 'ai' | 'chart' | 'none'
  agentColor:  string
  agentName:   string
}

export default function VisualPost({ imageUrl, chartSVG, visualType, agentColor, agentName }: VisualPostProps) {
  if (!visualType || visualType === 'none') return null

  return (
    <div style={{
      margin:'12px 0',
      borderRadius:12,
      overflow:'hidden',
      border:`1px solid ${agentColor}20`,
      position:'relative',
    }}>
      {/* Visual type badge */}
      <div style={{
        position:'absolute', top:10, right:10, zIndex:2,
        background:'rgba(0,0,0,.7)', backdropFilter:'blur(8px)',
        border:`1px solid ${agentColor}30`,
        borderRadius:6, padding:'3px 8px',
        fontSize:10, fontWeight:700,
        color: agentColor,
        fontFamily:'JetBrains Mono,monospace',
        display:'flex', alignItems:'center', gap:4,
      }}>
        {visualType === 'ai' ? '✦ AI GENERATED' : '📊 LIVE DATA'}
      </div>

      {/* AI Image */}
      {visualType === 'ai' && imageUrl && (
        <div style={{position:'relative', width:'100%', paddingBottom:'56.25%' /* 16:9 */}}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={`${agentName} visual post`}
            style={{
              position:'absolute', inset:0,
              width:'100%', height:'100%',
              objectFit:'cover',
            }}
            onError={e => {
              // Fallback if image fails to load
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
          {/* Gradient overlay at bottom */}
          <div style={{
            position:'absolute', bottom:0, left:0, right:0, height:60,
            background:`linear-gradient(transparent, rgba(13,13,13,.8))`,
          }}/>
        </div>
      )}

      {/* SVG Chart */}
      {visualType === 'chart' && chartSVG && (
        <div
          style={{width:'100%', lineHeight:0, background:'#0d0d0d'}}
          dangerouslySetInnerHTML={{ __html: chartSVG }}
        />
      )}
    </div>
  )
}
