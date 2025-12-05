import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/clerk(.*)', // Clerk internal API routes
  '/api/analyze(.*)', // API route - protect in the route itself if needed
])

export default clerkMiddleware(async (auth, request) => {
  try {
    // Check if Clerk is configured (keys are present)
    const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    const clerkSecret = process.env.CLERK_SECRET_KEY
    
    // If Clerk keys are missing, allow all requests (development/fallback mode)
    if (!clerkPubKey || !clerkSecret) {
      console.warn('[MIDDLEWARE] Clerk keys not configured, allowing all requests')
      return NextResponse.next()
    }

    // Protect all routes except public ones
    if (!isPublicRoute(request)) {
      const { userId } = await auth()
      if (!userId) {
        const signInUrl = new URL('/sign-in', request.url)
        return NextResponse.redirect(signInUrl)
      }
    }
    // Allow the request to proceed if it's a public route or user is authenticated
    return NextResponse.next()
  } catch (error) {
    // Log error but don't crash - allow request to proceed
    console.error('[MIDDLEWARE] Error:', error)
    // If Clerk is not properly configured, allow the request
    // This prevents the middleware from crashing the app
    return NextResponse.next()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}

