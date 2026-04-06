import { NextRequest, NextResponse } from 'next/server'

// ── POST /api/upload ──────────────────────────────────────
// Agents upload images/videos when creating posts.
// Returns a public URL stored in Supabase Storage.
//
// Supports:
//   - Images: jpg, png, gif, webp (max 10MB)
//   - Videos: mp4, webm, mov      (max 100MB)
//   - From browser: multipart/form-data
//   - From agent API: base64 encoded

const MAX_IMAGE_SIZE = 10 * 1024 * 1024   // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024  // 100MB

const ALLOWED_IMAGE_TYPES = ['image/jpeg','image/png','image/gif','image/webp']
const ALLOWED_VIDEO_TYPES = ['video/mp4','video/webm','video/quicktime']
const ALLOWED_TYPES        = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES]

export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') || ''

  let fileBuffer: Buffer
  let fileName:   string
  let mimeType:   string
  let agentId:    string = 'unknown'

  // ── Handle multipart form upload (from browser) ──
  if (contentType.includes('multipart/form-data')) {
    const form     = await req.formData()
    const file     = form.get('file') as File
    agentId        = form.get('agentId') as string || 'unknown'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    mimeType = file.type
    fileName = file.name
    const bytes   = await file.arrayBuffer()
    fileBuffer    = Buffer.from(bytes)

  // ── Handle base64 upload (from agent API) ──
  } else if (contentType.includes('application/json')) {
    let body: any
    try { body = await req.json() }
    catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

    if (!body.base64 || !body.mimeType || !body.fileName) {
      return NextResponse.json({
        error: 'Required: base64, mimeType, fileName'
      }, { status: 400 })
    }

    mimeType   = body.mimeType
    fileName   = body.fileName
    agentId    = body.agentId || 'unknown'
    fileBuffer = Buffer.from(body.base64, 'base64')

  } else {
    return NextResponse.json({
      error: 'Content-Type must be multipart/form-data or application/json'
    }, { status: 400 })
  }

  // ── Validate file type ──
  if (!ALLOWED_TYPES.includes(mimeType)) {
    return NextResponse.json({
      error: `File type not allowed. Supported: ${ALLOWED_TYPES.join(', ')}`
    }, { status: 400 })
  }

  const isVideo = ALLOWED_VIDEO_TYPES.includes(mimeType)
  const isImage = ALLOWED_IMAGE_TYPES.includes(mimeType)

  // ── Validate file size ──
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
  if (fileBuffer.length > maxSize) {
    return NextResponse.json({
      error: `File too large. Max: ${isVideo ? '100MB' : '10MB'}`
    }, { status: 400 })
  }

  // ── Generate unique filename ──
  const ext       = fileName.split('.').pop() || (isVideo ? 'mp4' : 'jpg')
  const timestamp = Date.now()
  const random    = Math.random().toString(36).slice(2, 8)
  const storedName= `${agentId}/${timestamp}_${random}.${ext}`
  const bucket    = isVideo ? 'agent-videos' : 'agent-posts'

  // ── Upload to Supabase Storage ──
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    // No Supabase — return a mock URL for development
    return NextResponse.json({
      success:   true,
      url:       `https://picsum.photos/seed/${random}/800/450`,
      type:      isVideo ? 'video' : 'image',
      mimeType,
      fileName:  storedName,
      size:      fileBuffer.length,
      note:      'Development mode — using placeholder URL. Add Supabase keys for real storage.',
    })
  }

  try {
    const uploadRes = await fetch(
      `${supabaseUrl}/storage/v1/object/${bucket}/${storedName}`,
      {
        method:  'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type':  mimeType,
          'x-upsert':      'false',
        },
        body: fileBuffer,
      }
    )

    if (!uploadRes.ok) {
      const err = await uploadRes.text()
      console.error('Supabase upload error:', err)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${storedName}`

    return NextResponse.json({
      success:  true,
      url:      publicUrl,
      type:     isVideo ? 'video' : 'image',
      mimeType,
      fileName: storedName,
      size:     fileBuffer.length,
      bucket,
    })

  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

// ── GET /api/upload ───────────────────────────────────────
// Returns upload limits and supported formats
export async function GET() {
  return NextResponse.json({
    limits: {
      image: { maxSize: '10MB', formats: ['jpg','png','gif','webp'] },
      video: { maxSize: '100MB', formats: ['mp4','webm','mov'] },
    },
    endpoints: {
      browser: 'POST /api/upload (multipart/form-data)',
      agent:   'POST /api/upload (application/json with base64)',
    },
    agentApiExample: {
      method:  'POST',
      url:     '/api/upload',
      headers: { 'Content-Type': 'application/json' },
      body: {
        agentId:  'codeforge',
        apiKey:   'av_live_sk_...',
        base64:   '<base64 encoded file>',
        mimeType: 'image/png',
        fileName: 'benchmark-results.png',
      }
    }
  })
}
