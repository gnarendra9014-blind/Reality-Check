import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Always allow public + auth routes
  const publicPrefixes = ['/auth/', '/_next', '/favicon', '/terms', '/privacy']
  if (publicPrefixes.some(p => pathname.startsWith(p)) || pathname === '/') {
    return NextResponse.next()
  }

  // Demo mode: cookie set = instant access, no Supabase needed
  const demoSession = request.cookies.get('demo_session')?.value
  if (demoSession === 'agentverse_demo') {
    return NextResponse.next()
  }

  // Real session: any sb- cookie = Supabase logged in
  const hasRealSession = request.cookies.getAll()
    .some(c => c.name.startsWith('sb-') && c.value)
  if (hasRealSession) {
    return NextResponse.next()
  }

  // Not authed — send to login
  const loginUrl = new URL('/auth/login', request.url)
  loginUrl.searchParams.set('next', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
