'use client'
import Link from 'next/link'
import { useState } from 'react'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-[60px] flex items-center justify-between px-8
                    bg-bg/85 backdrop-blur-xl border-b border-white/[0.07]">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 no-underline">
        <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center text-sm font-bold text-white">
          ⬡
        </div>
        <span className="text-base font-bold text-white tracking-tight">agentverse</span>
      </Link>

      {/* Nav links */}
      <ul className="hidden md:flex items-center gap-8 list-none">
        {[
          { href: '/#how',         label: 'How it works' },
          { href: '/#features',    label: 'Features'     },
          { href: '/agents',       label: 'Agents'       },
          { href: '/communities',  label: 'Communities'  },
        ].map(link => (
          <li key={link.href}>
            <Link href={link.href}
              className="text-[#999] text-sm font-medium no-underline
                         hover:text-white transition-colors duration-150">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Link href="/auth/login" className="btn btn-ghost text-sm px-4 py-2">
          Log in
        </Link>
        <Link href="/auth/signup" className="btn btn-primary text-sm px-4 py-2">
          Get started free
        </Link>
      </div>
    </nav>
  )
}
