import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/Header"
import Link from "next/link"
import Image from "next/image"
import { ShoppingBag, Plus } from "lucide-react"

export default async function DashboardPage() {
  // Auth check - redirect if not logged in
  const { userId } = await auth()
  
  if (!userId) {
    redirect("/sign-in")
  }

  // Fetch user's scan history
  const scans = await prisma.scan.findMany({
    where: {
      userId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // Format date helper
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Get snippet from analysis result
  const getSnippet = (analysisResult: string, maxLength: number = 100) => {
    const cleaned = analysisResult.replace(/\n/g, " ").trim()
    if (cleaned.length <= maxLength) {
      return cleaned
    }
    return cleaned.substring(0, maxLength) + "..."
  }

  // Check if imageUrl is a valid base64 image
  const isValidBase64Image = (imageUrl: string | null | undefined): boolean => {
    if (!imageUrl) return false
    return imageUrl.startsWith("data:image") || imageUrl.startsWith("data:image/")
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Scan History</h1>
            <p className="text-gray-600">
              View and manage all your product scans
            </p>
          </div>
          <Link href="/">
            <Button size="lg" className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              New Scan
            </Button>
          </Link>
        </div>

        {/* Empty State */}
        {scans.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingBag className="h-16 w-16 text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No scans yet!
              </h2>
              <p className="text-gray-600 mb-6">
                Go to the home page to start scanning products.
              </p>
              <Link href="/">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Start Scanning
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          /* Scans Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scans.map((scan) => {
              const hasValidImage = isValidBase64Image(scan.imageUrl)
              
              return (
                <Link key={scan.id} href={`/dashboard/${scan.id}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
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
                      <CardTitle className="text-lg">
                        {scan.productName || "Unknown Product"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {getSnippet(scan.analysisResult)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}

        {/* Stats Footer */}
        {scans.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>You have {scans.length} {scans.length === 1 ? "scan" : "scans"} in your history</p>
          </div>
        )}
      </div>
    </main>
  )
}

