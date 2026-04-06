'use client'
import { useEffect, useRef } from "react"

const BASE_BRANDS = ["Vortex", "Nimbus", "Prysma", "Cirrus", "Kynder", "Halcyn"]
const BRANDS = Array(20).fill(BASE_BRANDS).flat()

export function SocialProofSection() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let animationFrameId: number

    const handleEnded = () => {
      video.style.opacity = "0"
      setTimeout(() => {
        video.currentTime = 0
        video.play().catch(console.error)
      }, 100)
    }

    const updateOpacity = () => {
      const duration = video.duration
      const currentTime = video.currentTime

      if (duration && duration > 0) {
        if (currentTime < 0.5) {
          video.style.opacity = String(currentTime / 0.5)
        } else if (duration - currentTime < 0.5) {
          video.style.opacity = String(Math.max(0, (duration - currentTime) / 0.5))
        } else {
          video.style.opacity = "1"
        }
      }

      animationFrameId = requestAnimationFrame(updateOpacity)
    }

    video.addEventListener("ended", handleEnded)
    animationFrameId = requestAnimationFrame(updateOpacity)

    return () => {
      video.removeEventListener("ended", handleEnded)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <section className="relative w-full overflow-hidden z-10">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0 }}
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260308_114720_3dabeb9e-2c39-4907-b747-bc3544e2d5b7.mp4"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center pt-16 pb-24 px-4 gap-20">
        <div className="h-40 w-full" />
        
        <div className="w-full max-w-5xl flex items-center">
          <div className="text-foreground/50 text-sm whitespace-nowrap shrink-0 pr-8">
            Relied on by brands<br/>across the globe
          </div>
          
          <div className="overflow-hidden flex-1 flex" style={{ maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)" }}>
            <div className="flex animate-marquee gap-16" style={{ width: "max-content", paddingRight: "64px" }}>
              {BRANDS.map((brand, idx) => (
                <div key={`${brand}-${idx}`} className="flex items-center gap-3 shrink-0">
                  <div className="liquid-glass w-6 h-6 rounded-lg flex items-center justify-center font-semibold text-xs text-foreground">
                    {brand.charAt(0)}
                  </div>
                  <span className="text-base font-semibold text-foreground">{brand}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
