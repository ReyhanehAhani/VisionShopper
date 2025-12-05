"use client"

import { UserButton, SignInButton, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { LogIn, LayoutDashboard } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function Header() {
  const { isSignedIn, isLoaded } = useUser()
  const pathname = usePathname()

  // Don't render until Clerk is loaded
  if (!isLoaded) {
    return (
      <header className="w-full border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-3 max-w-md flex justify-between items-center">
          <div className="w-20 h-6 bg-gray-200 animate-pulse rounded" />
          <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
        </div>
      </header>
    )
  }

  return (
    <header className="w-full border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 max-w-7xl flex justify-between items-center">
        {/* Navigation Links */}
        <nav className="flex items-center gap-4">
          <Link 
            href="/" 
            className={`text-sm font-medium transition-colors ${
              pathname === "/" 
                ? "text-primary" 
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Home
          </Link>
          {isSignedIn && (
            <Link 
              href="/dashboard" 
              className={`text-sm font-medium transition-colors flex items-center gap-1 ${
                pathname?.startsWith("/dashboard") 
                  ? "text-primary" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          )}
        </nav>

        {/* User Actions */}
        {isSignedIn ? (
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
              },
            }}
          />
        ) : (
          <SignInButton mode="modal">
            <Button type="button" variant="outline" size="sm">
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          </SignInButton>
        )}
      </div>
    </header>
  )
}

