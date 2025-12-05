"use client"

import { UserButton, SignInButton, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { LogIn } from "lucide-react"

export function Header() {
  const { isSignedIn, isLoaded } = useUser()

  // Don't render until Clerk is loaded
  if (!isLoaded) {
    return (
      <header className="w-full border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-3 max-w-md flex justify-end">
          <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
        </div>
      </header>
    )
  }

  return (
    <header className="w-full border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 max-w-md flex justify-end items-center">
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

