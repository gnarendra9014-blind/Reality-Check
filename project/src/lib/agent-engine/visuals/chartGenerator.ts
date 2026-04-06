// ── CHART GENERATOR ───────────────────────────────────────
// Generates SVG charts as base64 PNG-ready strings
// Each agent has chart templates matching their specialty

export type ChartType = 'bar' | 'line' | 'radar' | 'heatmap' | 'scatter' | 'gauge'

export type ChartData = {
  type:    ChartType
  title:   string
  labels:  string[]
  values:  number[]
  color:   string
  unit?:   string
  meta?:   Record<string, string | number>
}

// ── PER-AGENT CHART GENERATORS ────────────────────────────

export function generateChartData(agentId: string): ChartData {
  const generators: Record<string, () => ChartData> = {

    codeforge: () => {
      const tasks = ['Auth System', 'REST API', 'DB Schema', 'UI Components', 'Test Suite']
      const times = tasks.map(() => Math.floor(Math.random() * 8) + 2)
      return {
        type:   'bar',
        title:  `Build Times — Last 5 Tasks (minutes)`,
        labels: tasks,
        values: times,
        color:  '#4ade80',
        unit:   'min',
        meta:   { avgTime: Math.round(times.reduce((a,b)=>a+b)/times.length), tasksToday: 5 }
      }
    },

    nexuscore: () => {
      const hours = Array.from({length:12}, (_,i) => `${i*2}:00`)
      const anomalies = hours.map(() => Math.random() > 0.7 ? Math.floor(Math.random()*4)+1 : 0)
      return {
        type:   'line',
        title:  'Anomaly Detections — Last 24 Hours',
        labels: hours,
        values: anomalies,
        color:  '#ff6d3b',
        unit:   'anomalies',
        meta:   { total: anomalies.reduce((a,b)=>a+b,0), peakHour: hours[anomalies.indexOf(Math.max(...anomalies))] }
      }
    },

    linguanet: () => {
      const langs = ['English','Mandarin','Spanish','Arabic','Hindi','French','Japanese','Russian']
      const accuracy = langs.map(() => Math.floor(Math.random()*8)+91)
      return {
        type:   'bar',
        title:  'Translation Accuracy by Language (%)',
        labels: langs,
        values: accuracy,
        color:  '#facc15',
        unit:   '%',
        meta:   { avgAccuracy: Math.round(accuracy.reduce((a,b)=>a+b)/accuracy.length), languages: 47 }
      }
    },

    medisense: () => {
      const categories = ['True Positive','True Negative','False Positive','False Negative']
      const values = [847, 9102, 43, 8]
      return {
        type:   'bar',
        title:  'Diagnostic Accuracy — CT Scan Batch #4821',
        labels: categories,
        values: values,
        color:  '#fb923c',
        unit:   'cases',
        meta:   { accuracy: '98.5%', scansProcessed: 10000, flagged: 890 }
      }
    },

    visioncore: () => {
      const thresholds = ['0.1','0.2','0.3','0.4','0.5','0.6','0.7','0.8','0.9']
      const precision  = thresholds.map((_,i) => Math.min(0.99, 0.72 + i*0.033 + Math.random()*0.02))
      return {
        type:   'line',
        title:  'Precision-Recall Curve — Object Detection Model',
        labels: thresholds,
        values: precision.map(v => Math.round(v*100)),
        color:  '#60a5fa',
        unit:   '%',
        meta:   { mAP: '94.2%', model: 'YOLOv8-custom', dataset: 'COCO-medical' }
      }
    },

    quantummind: () => {
      const iterations = ['100','500','1K','5K','10K','50K','100K']
      const classical  = iterations.map((_,i) => Math.pow(2, i) * 12)
      const quantum    = iterations.map((_,i) => Math.pow(1.8, i) * 8)
      return {
        type:   'line',
        title:  'Classical vs Quantum: Time Complexity',
        labels: iterations,
        values: quantum.map(v => Math.min(v, 99999)),
        color:  '#a78bfa',
        unit:   'ms',
        meta:   { speedup: '3.2x', algorithm: 'QUBO annealing', qubits: 64 }
      }
    },
  }

  return (generators[agentId] || generators.nexuscore)()
}

// ── SVG CHART RENDERER ────────────────────────────────────
// Returns an SVG string that can be inlined or converted to PNG

export function renderChartSVG(data: ChartData): string {
  const W = 600, H = 340
  const pad = { top:48, right:24, bottom:64, left:52 }
  const chartW = W - pad.left - pad.right
  const chartH = H - pad.top  - pad.bottom

  const maxVal = Math.max(...data.values) * 1.15
  const minVal = Math.min(0, ...data.values)

  const bg       = '#0d0d0d'
  const gridCol  = 'rgba(255,255,255,0.06)'
  const textCol  = '#888'
  const titleCol = '#f0f0f0'

  function yPos(v: number) {
    return pad.top + chartH - ((v - minVal) / (maxVal - minVal)) * chartH
  }

  function xPos(i: number) {
    if (data.type === 'bar') {
      const barW = chartW / data.labels.length
      return pad.left + i * barW + barW / 2
    }
    return pad.left + (i / (data.labels.length - 1)) * chartW
  }

  let chartBody = ''

  if (data.type === 'bar') {
    const barW   = (chartW / data.labels.length) * 0.65
    const barGap = (chartW / data.labels.length) * 0.35 / 2

    chartBody = data.values.map((v, i) => {
      const x  = pad.left + i * (chartW / data.labels.length) + barGap
      const y  = yPos(v)
      const h  = yPos(0) - y
      const pct= (v - minVal) / (maxVal - minVal)
      // Gradient effect via opacity layers
      return `
        <rect x="${x}" y="${y}" width="${barW}" height="${h}"
              fill="${data.color}" opacity="${0.3 + pct * 0.7}" rx="4"/>
        <rect x="${x}" y="${y}" width="${barW}" height="3"
              fill="${data.color}" opacity="0.9" rx="2"/>
        <text x="${x + barW/2}" y="${y - 6}" text-anchor="middle"
              font-size="10" fill="${data.color}" font-family="JetBrains Mono,monospace">
          ${v}${data.unit === '%' ? '%' : ''}
        </text>
      `
    }).join('')
  }

  if (data.type === 'line') {
    const points = data.values.map((v, i) =>
      `${xPos(i)},${yPos(v)}`
    ).join(' ')

    // Area fill
    const areaPoints = [
      `${xPos(0)},${yPos(0)}`,
      ...data.values.map((v, i) => `${xPos(i)},${yPos(v)}`),
      `${xPos(data.values.length-1)},${yPos(0)}`
    ].join(' ')

    chartBody = `
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${data.color}" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="${data.color}" stop-opacity="0.02"/>
        </linearGradient>
      </defs>
      <polygon points="${areaPoints}" fill="url(#areaGrad)"/>
      <polyline points="${points}" fill="none" stroke="${data.color}"
                stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${data.values.map((v, i) => `
        <circle cx="${xPos(i)}" cy="${yPos(v)}" r="4"
                fill="${bg}" stroke="${data.color}" stroke-width="2"/>
      `).join('')}
    `
  }

  // Grid lines
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(pct => {
    const y   = pad.top + pct * chartH
    const val = Math.round(maxVal * (1 - pct))
    return `
      <line x1="${pad.left}" y1="${y}" x2="${W - pad.right}" y2="${y}"
            stroke="${gridCol}" stroke-width="1"/>
      <text x="${pad.left - 6}" y="${y + 4}" text-anchor="end"
            font-size="10" fill="${textCol}" font-family="JetBrains Mono,monospace">
        ${val}
      </text>
    `
  }).join('')

  // X axis labels
  const xLabels = data.labels.map((label, i) => {
    const x = data.type === 'bar'
      ? pad.left + i * (chartW / data.labels.length) + (chartW / data.labels.length) / 2
      : xPos(i)
    return `
      <text x="${x}" y="${H - pad.bottom + 18}" text-anchor="middle"
            font-size="9.5" fill="${textCol}" font-family="JetBrains Mono,monospace">
        ${label.length > 9 ? label.slice(0,8)+'…' : label}
      </text>
    `
  }).join('')

  // Meta tags
  const metaStr = Object.entries(data.meta || {})
    .slice(0, 3)
    .map(([k, v], i) => `
      <rect x="${pad.left + i * 160}" y="${H - 20}" width="150" height="16" rx="4"
            fill="rgba(255,255,255,0.04)"/>
      <text x="${pad.left + i * 160 + 6}" y="${H - 8}"
            font-size="9" fill="${data.color}" font-family="JetBrains Mono,monospace">
        ${k}: ${v}
      </text>
    `).join('')

  return `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"
     style="background:${bg};border-radius:12px;font-family:Inter,sans-serif">

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="${bg}" rx="12"/>

  <!-- Title -->
  <text x="${pad.left}" y="28" font-size="13" font-weight="700"
        fill="${titleCol}" font-family="Inter,sans-serif">
    ${data.title}
  </text>

  <!-- Color accent bar -->
  <rect x="${pad.left}" y="34" width="40" height="2" fill="${data.color}" rx="1" opacity="0.7"/>

  <!-- Grid -->
  ${gridLines}

  <!-- Chart body -->
  ${chartBody}

  <!-- X axis -->
  <line x1="${pad.left}" y1="${yPos(0)}" x2="${W - pad.right}" y2="${yPos(0)}"
        stroke="rgba(255,255,255,0.12)" stroke-width="1"/>

  <!-- X labels -->
  ${xLabels}

  <!-- Meta -->
  ${metaStr}

</svg>`.trim()
}
