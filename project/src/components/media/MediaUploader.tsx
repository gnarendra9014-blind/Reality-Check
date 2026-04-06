'use client'
import { useState, useRef, useCallback } from 'react'

type MediaFile = {
  url:      string
  type:     'image' | 'video'
  mimeType: string
  name:     string
  size:     number
  preview:  string  // local blob URL for preview
}

type MediaUploaderProps = {
  agentId:   string
  onUpload:  (files: MediaFile[]) => void
  maxFiles?: number
}

export default function MediaUploader({
  agentId, onUpload, maxFiles = 4
}: MediaUploaderProps) {
  const [files,    setFiles]    = useState<MediaFile[]>([])
  const [dragging, setDragging] = useState(false)
  const [uploading,setUploading]= useState(false)
  const [progress, setProgress] = useState<Record<string,number>>({})
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(async (raw: File[]) => {
    if (files.length + raw.length > maxFiles) {
      alert(`Max ${maxFiles} files per post`)
      return
    }

    setUploading(true)
    const uploaded: MediaFile[] = []

    for (const file of raw) {
      const isVideo = file.type.startsWith('video/')
      const isImage = file.type.startsWith('image/')
      if (!isVideo && !isImage) continue

      // Show local preview immediately
      const preview = URL.createObjectURL(file)
      const tempId  = Math.random().toString(36).slice(2)
      setProgress(p => ({ ...p, [tempId]: 0 }))

      try {
        // Upload to server
        const form = new FormData()
        form.append('file', file)
        form.append('agentId', agentId)

        // Simulate progress
        const progressInterval = setInterval(() => {
          setProgress(p => ({
            ...p,
            [tempId]: Math.min((p[tempId] || 0) + 15, 90)
          }))
        }, 200)

        const res  = await fetch('/api/upload', { method:'POST', body:form })
        const data = await res.json()

        clearInterval(progressInterval)
        setProgress(p => ({ ...p, [tempId]: 100 }))

        if (data.success) {
          uploaded.push({
            url:      data.url,
            type:     isVideo ? 'video' : 'image',
            mimeType: file.type,
            name:     file.name,
            size:     file.size,
            preview,
          })
        }

        // Clean up progress after a moment
        setTimeout(() => {
          setProgress(p => { const n = {...p}; delete n[tempId]; return n })
        }, 1000)

      } catch (err) {
        console.error('Upload failed:', err)
      }
    }

    const newFiles = [...files, ...uploaded]
    setFiles(newFiles)
    onUpload(newFiles)
    setUploading(false)
  }, [files, agentId, maxFiles, onUpload])

  function removeFile(idx: number) {
    const updated = files.filter((_,i) => i !== idx)
    setFiles(updated)
    onUpload(updated)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    handleFiles(Array.from(e.dataTransfer.files))
  }

  function formatSize(bytes: number) {
    if (bytes < 1024*1024) return `${(bytes/1024).toFixed(0)}KB`
    return `${(bytes/1024/1024).toFixed(1)}MB`
  }

  const hasUploading = Object.keys(progress).length > 0

  return (
    <div style={{fontFamily:'Inter,sans-serif'}}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
      `}</style>

      {/* Drop zone */}
      {files.length < maxFiles && (
        <div
          onDragOver={e=>{e.preventDefault();setDragging(true)}}
          onDragLeave={()=>setDragging(false)}
          onDrop={onDrop}
          onClick={()=>inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? '#ffffff' : 'rgba(255,255,255,.1)'}`,
            borderRadius: 12,
            padding: '20px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragging ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.02)',
            transition: 'all .2s',
            marginBottom: files.length > 0 ? 12 : 0,
          }}>
          <input ref={inputRef} type="file" multiple hidden
            accept="image/*,video/*"
            onChange={e=>handleFiles(Array.from(e.target.files||[]))}/>

          {uploading ? (
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,
                         fontSize:13,color:'#888'}}>
              <div style={{width:16,height:16,border:'2px solid #333',borderTopColor:'#ffffff',
                           borderRadius:'50%',animation:'spin 1s linear infinite'}}/>
              Uploading...
            </div>
          ) : (
            <>
              <div style={{fontSize:28,marginBottom:8}}>
                {dragging ? '📥' : '📎'}
              </div>
              <div style={{fontSize:13,fontWeight:600,color: dragging ? 'rgba(255,255,255,0.6)' : '#888',
                           marginBottom:4}}>
                {dragging ? 'Drop to upload' : 'Add images or videos'}
              </div>
              <div style={{fontSize:11,color:'#444'}}>
                Drag & drop or click · Images up to 10MB · Videos up to 100MB
              </div>
              <div style={{display:'flex',gap:8,justifyContent:'center',marginTop:8}}>
                {['📸 JPG/PNG','🎬 MP4/WebM','🖼️ GIF/WebP'].map(t=>(
                  <span key={t} style={{fontSize:10,background:'rgba(255,255,255,.04)',
                                         border:'1px solid rgba(255,255,255,.07)',
                                         borderRadius:5,padding:'2px 8px',color:'#555'}}>
                    {t}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Upload progress bars */}
      {hasUploading && (
        <div style={{marginBottom:10}}>
          {Object.entries(progress).map(([id, pct]) => (
            <div key={id} style={{marginBottom:6}}>
              <div style={{height:3,background:'rgba(255,255,255,.06)',borderRadius:3,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${pct}%`,background:'#ffffff',
                             borderRadius:3,transition:'width .3s ease'}}/>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File previews */}
      {files.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: files.length === 1 ? '1fr' : files.length === 2 ? '1fr 1fr' : 'repeat(2,1fr)',
          gap: 6,
        }}>
          {files.map((file, idx) => (
            <div key={idx} style={{position:'relative',borderRadius:10,overflow:'hidden',
                                    animation:'fadeIn .3s ease forwards',
                                    aspectRatio: files.length === 1 ? '16/9' : '1/1'}}>
              {file.type === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={file.preview} alt={file.name}
                  style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
              ) : (
                <video src={file.preview} controls muted
                  style={{width:'100%',height:'100%',objectFit:'cover',display:'block',
                          background:'#000'}}/>
              )}

              {/* Overlay info */}
              <div style={{position:'absolute',bottom:0,left:0,right:0,
                           background:'linear-gradient(transparent,rgba(0,0,0,.8))',
                           padding:'20px 10px 8px',
                           display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{display:'flex',alignItems:'center',gap:5}}>
                  <span style={{fontSize:11}}>{file.type==='video' ? '🎬' : '📸'}</span>
                  <span style={{fontSize:10,color:'rgba(255,255,255,.7)',
                                overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
                                maxWidth:100}}>
                    {file.name}
                  </span>
                </div>
                <span style={{fontSize:10,color:'rgba(255,255,255,.5)'}}>{formatSize(file.size)}</span>
              </div>

              {/* Type badge */}
              <div style={{position:'absolute',top:8,left:8,
                           background:'rgba(0,0,0,.7)',backdropFilter:'blur(8px)',
                           borderRadius:5,padding:'2px 7px',fontSize:9,fontWeight:700,
                           color: file.type==='video' ? '#a78bfa':'#60a5fa',
                           border: `1px solid ${file.type==='video'?'rgba(167,139,250,.3)':'rgba(96,165,250,.3)'}`}}>
                {file.type==='video' ? '🎬 VIDEO' : '📸 IMAGE'}
              </div>

              {/* Remove button */}
              <button onClick={()=>removeFile(idx)}
                style={{position:'absolute',top:8,right:8,width:24,height:24,
                        borderRadius:'50%',background:'rgba(0,0,0,.7)',border:'1px solid rgba(255,255,255,.2)',
                        color:'#fff',fontSize:11,cursor:'pointer',
                        display:'flex',alignItems:'center',justifyContent:'center',
                        fontFamily:'Inter,sans-serif',transition:'background .15s'}}
                onMouseEnter={e=>(e.currentTarget.style.background='rgba(239,68,68,.8)')}
                onMouseLeave={e=>(e.currentTarget.style.background='rgba(0,0,0,.7)')}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && files.length < maxFiles && (
        <button onClick={()=>inputRef.current?.click()}
          style={{width:'100%',marginTop:6,padding:'7px',borderRadius:8,fontSize:11,
                  fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif',
                  background:'transparent',border:'1px dashed rgba(255,255,255,.1)',
                  color:'#555',transition:'all .15s'}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,.3)';e.currentTarget.style.color='rgba(255,255,255,0.6)'}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,.1)';e.currentTarget.style.color='#555'}}>
          + Add more ({files.length}/{maxFiles})
        </button>
      )}
    </div>
  )
}
