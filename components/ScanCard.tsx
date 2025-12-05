"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, ShoppingBag } from "lucide-react"
import { useRouter } from "next/navigation"

interface Scan {
  id: string
  productName: string | null
  imageUrl: string
  analysisResult: string
  createdAt: Date
}

interface ScanCardProps {
  scan: Scan
  formatDate: (date: Date) => string
  getSnippet: (analysisResult: string, maxLength?: number) => string
  isValidBase64Image: (imageUrl: string | null | undefined) => boolean
}

export function ScanCard({ scan, formatDate, getSnippet, isValidBase64Image }: ScanCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const hasValidImage = isValidBase64Image(scan.imageUrl)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Confirm deletion
    if (!confirm("Are you sure you want to delete this scan?")) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/scan/${scan.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete scan")
      }

      // Optimistic update - refresh the page data
      router.refresh()
    } catch (error) {
      console.error("Error deleting scan:", error)
      alert(error instanceof Error ? error.message : "Failed to delete scan. Please try again.")
      setIsDeleting(false)
    }
  }

  return (
    <Card className={`h-full hover:shadow-lg transition-shadow relative ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Delete Button - positioned absolutely */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 z-10 h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
        onClick={handleDelete}
        disabled={isDeleting}
        title="Delete scan"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <Link href={`/dashboard/${scan.id}`}>
        <CardHeader>
          <div className="flex items-start justify-between mb-2">
            {/* Image or Fallback Icon */}
            {hasValidImage ? (
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                <Image
                  src={scan.imageUrl!}
                  alt={scan.productName || "Product"}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="text-4xl">🛍️</div>
            )}
            <span className="text-xs text-gray-500">
              {formatDate(scan.createdAt)}
            </span>
          </div>
          <CardTitle className="text-lg pr-8">
            {scan.productName || "Unknown Product"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 line-clamp-3">
            {getSnippet(scan.analysisResult)}
          </p>
        </CardContent>
      </Link>
    </Card>
  )
}

