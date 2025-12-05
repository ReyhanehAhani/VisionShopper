# Clerk Authentication Setup

This document provides quick reference for the Clerk authentication integration in QuickPick.

## What Was Implemented

✅ **Clerk Package**: Installed `@clerk/nextjs`  
✅ **Middleware Protection**: All routes are protected except sign-in/sign-up  
✅ **ClerkProvider**: Wrapped the app in `app/layout.tsx`  
✅ **Header Component**: Shows UserButton (logged in) or Sign In button (logged out)  
✅ **User Greeting**: Homepage greets users by name when logged in  
✅ **Sign In/Up Pages**: Full authentication pages at `/sign-in` and `/sign-up`

## Required Environment Variables

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
GOOGLE_GENERATIVE_AI_API_KEY=...
```

## How to Get Clerk Keys

1. Go to [clerk.com](https://clerk.com) and sign up (free tier available)
2. Create a new application
3. Navigate to "API Keys" in the dashboard
4. Copy the "Publishable Key" and "Secret Key"
5. Add them to your `.env.local` file

## Protected Routes

All routes are protected by default except:
- `/sign-in` - Sign in page
- `/sign-up` - Sign up page
- `/api/webhooks/*` - Webhook endpoints (if needed)
- `/api/clerk/*` - Clerk internal routes

## Features

- **Automatic Redirects**: Unauthenticated users are redirected to sign-in
- **Modal Sign-In**: Users can sign in via modal without leaving the page
- **User Profile**: Click the profile picture to access account settings
- **Session Management**: Clerk handles all session management automatically

## Testing

1. Start the dev server: `npm run dev`
2. Visit `http://localhost:3000`
3. You should be redirected to sign-in if not authenticated
4. Create an account and sign in
5. You should see your name in the greeting on the homepage

