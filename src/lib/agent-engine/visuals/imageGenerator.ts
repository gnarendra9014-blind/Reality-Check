// ── AI IMAGE GENERATOR ────────────────────────────────────
// Calls DALL-E 3 to generate visuals for agent posts
// Falls back to chart SVG if DALL-E unavailable

export type GeneratedImage = {
  url:      string      // public URL (Supabase storage or DALL-E temp)
  type:     'ai' | 'chart' | 'svg'
  prompt?:  string
  svgData?: string      // raw SVG if type === 'svg'
}

// ── PER-AGENT IMAGE PROMPTS ───────────────────────────────
// Each agent has prompt templates for different post types

const AGENT_PROMPTS: Record<string, {
  result:  string[]
  collab:  string[]
  feature: string[]
}> = {
  codeforge: {
    result: [
      'A dark-themed code editor showing clean TypeScript architecture with glowing green syntax highlighting, abstract digital art style, no text, dark background #0d0d0d',
      'Abstract visualization of a software pipeline as glowing green nodes and connections on dark background, futuristic tech aesthetic, no text',
      'A sleek terminal interface with cascading green code on dark background, matrix-inspired but minimal and modern, no text',
    ],
    collab: [
      'Two AI systems connecting via glowing data streams, green and orange light on dark background, abstract digital art, no text',
    ],
    feature: [
      'Abstract representation of code generation speed — lightning bolt made of circuit patterns, green neon on dark background, minimal, no text',
    ],
  },
  nexuscore: {
    result: [
      'Abstract data visualization showing anomaly detection — a glowing orange spike in a sea of blue data points on dark background, no text',
      'Neural network pattern recognition visualization, orange and white nodes on dark background, flowing data streams, no text',
      'Financial market data as abstract glowing heatmap with orange anomaly clusters on dark background, no text',
    ],
    collab: [
      'Data pipeline flowing between multiple AI nodes, orange light streams on dark background, abstract, no text',
    ],
    feature: [
      'Abstract brain made of data streams and circuit patterns, orange glow on dark background, minimal tech art, no text',
    ],
  },
  linguanet: {
    result: [
      'Abstract visualization of language translation — words flowing between golden streams across a dark globe, no actual text visible, artistic',
      'Golden wave patterns representing multiple languages merging and flowing, dark background, ethereal digital art, no text',
    ],
    collab: [
      'Multiple language streams merging into a unified golden flow on dark background, abstract, no text',
    ],
    feature: [
      'Abstract representation of multilingual NLP — interconnected golden nodes forming a language web, dark background, no text',
    ],
  },
  medisense: {
    result: [
      'Abstract medical imaging visualization — glowing orange scan overlay with highlighted regions on dark background, no actual medical content, artistic interpretation only',
      'Abstract diagnostic AI visualization — orange precision targeting patterns on dark medical imaging background, artistic, no real scans',
    ],
    collab: [
      'Three AI systems collaborating on medical analysis, orange and blue light streams connecting nodes, dark background, abstract, no text',
    ],
    feature: [
      'Abstract medical AI — orange heartbeat pattern integrated with circuit design on dark background, minimal tech art, no text',
    ],
  },
  visioncore: {
    result: [
      'Abstract computer vision detection visualization — blue bounding box patterns overlaid on dark geometric shapes, no real faces or people, artistic interpretation',
      'Neural network vision processing visualization — blue scanning lines and detection grids on dark background, abstract, no text',
    ],
    collab: [
      'Vision and data processing streams connecting — blue and orange light on dark background, abstract AI collaboration, no text',
    ],
    feature: [
      'Abstract eye made of circuit patterns and blue light streams on dark background, minimal tech art, no text',
    ],
  },
  quantummind: {
    result: [
      'Quantum circuit visualization — purple and white qubit connections on dark background, abstract quantum computing art, no text',
      'Abstract quantum superposition visualization — purple probability waves and interference patterns on dark background, no text',
    ],
    collab: [
      'Quantum entanglement visualization — two purple particle streams connecting across dark space, abstract, no text',
    ],
    feature: [
      'Abstract quantum computing — purple geometric crystal structure with glowing connections on dark background, no text',
    ],
  },
}

function getPrompt(agentId: string, tag: string): string {
  const prompts = AGENT_PROMPTS[agentId] || AGENT_PROMPTS.nexuscore
  const type = tag === 'COLLAB' ? 'collab' : tag === 'RESULT' ? 'result' : 'feature'
  const list  = prompts[type] || prompts.result
  return list[Math.floor(Math.random() * list.length)]
    + ' — cinematic, high quality, 16:9 aspect ratio'
}

// ── GENERATE IMAGE VIA DALL-E 3 ───────────────────────────
export async function generateAIImage(
  agentId: string,
  tag:     string,
  title:   string
): Promise<GeneratedImage | null> {

  const openAIKey = process.env.OPENAI_API_KEY
  if (!openAIKey) return null

  try {
    const prompt = getPrompt(agentId, tag)

    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${openAIKey}`,
      },
      body: JSON.stringify({
        model:   'dall-e-3',
        prompt,
        n:        1,
        size:     '1792x1024',   // 16:9 landscape
        quality:  'standard',
        style:    'vivid',
        response_format: 'url',
      }),
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('DALL-E error:', err)
      return null
    }

    const data = await res.json()
    const url  = data.data?.[0]?.url

    if (!url) return null

    // Upload to Supabase storage for permanent URL
    const storedUrl = await uploadToStorage(url, agentId)

    return {
      url:    storedUrl || url,
      type:   'ai',
      prompt,
    }
  } catch (err) {
    console.error('Image generation failed:', err)
    return null
  }
}

// ── UPLOAD TO SUPABASE STORAGE ────────────────────────────
async function uploadToStorage(imageUrl: string, agentId: string): Promise<string | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) return null

    // Fetch the image from DALL-E
    const imgRes  = await fetch(imageUrl)
    const imgBlob = await imgRes.arrayBuffer()

    const fileName = `${agentId}/${Date.now()}.png`

    // Upload to Supabase storage bucket 'agent-posts'
    const uploadRes = await fetch(
      `${supabaseUrl}/storage/v1/object/agent-posts/${fileName}`,
      {
        method:  'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type':  'image/png',
          'x-upsert':      'true',
        },
        body: imgBlob,
      }
    )

    if (!uploadRes.ok) return null

    return `${supabaseUrl}/storage/v1/object/public/agent-posts/${fileName}`
  } catch {
    return null
  }
}

// ── DECIDE WHETHER TO INCLUDE VISUAL ─────────────────────
// Not every post needs an image — ~40% chance for regular posts, 70% for results
export function shouldIncludeVisual(tag: string): boolean {
  const chances: Record<string, number> = {
    RESULT:  0.70,
    COLLAB:  0.45,
    ACHIEVE: 0.80,
    DISCUSS: 0.25,
  }
  return Math.random() < (chances[tag] || 0.4)
}

// ── VIDEO PLACEHOLDER (future) ────────────────────────────
// Video generation via Runway ML / Sora when available
export async function generateVideo(
  _agentId: string,
  _prompt:  string
): Promise<string | null> {
  // TODO: integrate Runway ML Gen-3 or Sora when APIs are available
  // const res = await fetch('https://api.runwayml.com/v1/generate', { ... })
  console.log('Video generation: API not yet available. Coming soon.')
  return null
}
