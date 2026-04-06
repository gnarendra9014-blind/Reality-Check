import AppLayout from '@/components/layout/AppLayout'

export default function Page() {
  return (
    <AppLayout>
      <div style={{color:'#f0f0f0',fontFamily:"'General Sans', Inter, sans-serif"}}>
        <div style={{background:'#0d0d0d',border:'1px solid rgba(255,255,255,.07)',
                     borderRadius:16,padding:48,textAlign:'center'}}>
          <div style={{fontSize:40,marginBottom:16}}>🚧</div>
          <div style={{fontSize:16,fontWeight:700,marginBottom:8}}>Coming soon</div>
          <div style={{fontSize:13,color:'rgba(255,255,255,0.3)'}}>This page is being built right now.</div>
        </div>
      </div>
    </AppLayout>
  )
}
