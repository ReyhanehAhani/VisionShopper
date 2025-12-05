import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/Header"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ShoppingBag } from "lucide-react"

// Server-side parsing function for analysis display
function parseAnalysis(analysisResult: string) {
  const headers = [
    'HEADLINE:',
    'WINNER:',
    'HEALTH SCORE:',
    'HEALTH COMPARISON:',
    'WHO IS THIS FOR?',
    'FLAVOR & TEXTURE:',
    'FLAVOR FACE-OFF:',
    'PROS & CONS:',
    'PROS & CONS COMPARISON:',
    'VERDICT:'
  ]

  const sections: Record<string, string> = {}
  let currentSection: string | null = null
  let currentContent: string[] = []

  const lines = analysisResult.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Check if this line is a header
    let foundHeader: string | null = null
    for (const header of headers) {
      if (line.toUpperCase().startsWith(header.toUpperCase())) {
        foundHeader = header
        break
      }
    }

    if (foundHeader) {
      // Save previous section
      if (currentSection && currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n').trim()
      }
      // Start new section
      currentSection = foundHeader
      currentContent = []
      // Extract content from same line if there's text after the header
      const colonIndex = line.indexOf(':')
      if (colonIndex !== -1) {
        const afterHeader = line.substring(colonIndex + 1).trim()
        if (afterHeader) {
          currentContent.push(afterHeader)
        }
      } else {
        // Handle headers without colons
        const headerUpper = foundHeader.toUpperCase()
        const lineUpper = line.toUpperCase()
        const headerIndex = lineUpper.indexOf(headerUpper)
        if (headerIndex !== -1) {
          const afterHeader = line.substring(headerIndex + foundHeader.length).trim()
          if (afterHeader) {
            currentContent.push(afterHeader)
          }
        }
      }
    } else if (currentSection && line) {
      // Add to current section
      currentContent.push(line)
    }
  }

  // Save last section
  if (currentSection && currentContent.length > 0) {
    sections[currentSection] = currentContent.join('\n').trim()
  }

  return sections
}

// Helper to get health score badge colors
function getHealthScoreColors(healthScore: string) {
  const match = healthScore.match(/^([A-E])[ -]*(.*)$/i)
  if (!match) return null

  const grade = match[1].toUpperCase()
  const reason = match[2]?.trim() || ''

  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    A: { bg: 'bg-green-500', text: 'text-white', border: 'border-green-600' },
    B: { bg: 'bg-green-400', text: 'text-white', border: 'border-green-500' },
    C: { bg: 'bg-yellow-400', text: 'text-gray-900', border: 'border-yellow-500' },
    D: { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-600' },
    E: { bg: 'bg-red-500', text: 'text-white', border: 'border-red-600' },
  }

  const colors = colorMap[grade] || { bg: 'bg-gray-500', text: 'text-white', border: 'border-gray-600' }
  return { grade, reason, colors }
}

// Component to display parsed analysis
function AnalysisDisplay({ analysisResult }: { analysisResult: string }) {
  const sections = parseAnalysis(analysisResult)
  
  // Check if we have parsed sections
  const hasParsedSections = Object.keys(sections).length > 0

  if (!hasParsedSections) {
    // Fallback to raw text display
    return (
      <div className="whitespace-pre-wrap text-base leading-relaxed text-gray-700">
        {analysisResult}
      </div>
    )
  }

  // Display parsed sections in a structured format
  return (
    <div className="space-y-6">
      {/* HEADLINE */}
      {sections['HEADLINE:'] && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Headline</h3>
          <p className="text-base text-gray-700">{sections['HEADLINE:']}</p>
        </div>
      )}

      {/* HEALTH SCORE */}
      {sections['HEALTH SCORE:'] && (() => {
        const healthScoreInfo = getHealthScoreColors(sections['HEALTH SCORE:'])
        if (healthScoreInfo) {
          return (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Health Score</h3>
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${healthScoreInfo.colors.bg} ${healthScoreInfo.colors.text} font-bold text-lg border-2 ${healthScoreInfo.colors.border}`}>
                  {healthScoreInfo.grade}
                </span>
                {healthScoreInfo.reason && (
                  <p className="text-base text-gray-700">{healthScoreInfo.reason}</p>
                )}
              </div>
            </div>
          )
        }
        return null
      })()}

      {/* WHO IS THIS FOR */}
      {sections['WHO IS THIS FOR?'] && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Who Is This For?</h3>
          <p className="text-base text-gray-700">{sections['WHO IS THIS FOR?']}</p>
        </div>
      )}

      {/* FLAVOR & TEXTURE */}
      {sections['FLAVOR & TEXTURE:'] && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Flavor & Texture</h3>
          <div className="whitespace-pre-wrap text-base text-gray-700">
            {sections['FLAVOR & TEXTURE:']}
          </div>
        </div>
      )}

      {/* PROS & CONS */}
      {sections['PROS & CONS:'] && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Pros & Cons</h3>
          <div className="whitespace-pre-wrap text-base text-gray-700">
            {sections['PROS & CONS:']}
          </div>
        </div>
      )}

      {/* VERDICT */}
      {sections['VERDICT:'] && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Verdict</h3>
          <p className="text-base text-gray-700">{sections['VERDICT:']}</p>
        </div>
      )}

      {/* Comparison Mode Sections */}
      {sections['WINNER:'] && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Winner</h3>
          <p className="text-base text-gray-700 font-semibold">{sections['WINNER:']}</p>
        </div>
      )}

      {sections['HEALTH COMPARISON:'] && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Health Comparison</h3>
          <div className="whitespace-pre-wrap text-base text-gray-700">
            {sections['HEALTH COMPARISON:']}
          </div>
        </div>
      )}

      {sections['FLAVOR FACE-OFF:'] && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Flavor Face-Off</h3>
          <div className="whitespace-pre-wrap text-base text-gray-700">
            {sections['FLAVOR FACE-OFF:']}
          </div>
        </div>
      )}

      {sections['PROS & CONS COMPARISON:'] && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Pros & Cons Comparison</h3>
          <div className="whitespace-pre-wrap text-base text-gray-700">
            {sections['PROS & CONS COMPARISON:']}
          </div>
        </div>
      )}
    </div>
  )
}

interface PageProps {
  params: {
    id: string
  }
}

export default async function ScanDetailPage({ params }: PageProps) {
  // Auth check - redirect if not logged in
  const { userId } = await auth()
  
  if (!userId) {
    redirect("/sign-in")
  }

  // Fetch the scan by ID and verify it belongs to the current user
  const scan = await prisma.scan.findUnique({
    where: {
      id: params.id,
    },
  })

  // Security: Check if scan exists and belongs to current user
  if (!scan || scan.userId !== userId) {
    notFound()
  }

  // Format date helper
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Check if imageUrl is a valid base64 image
  const isValidBase64Image = (imageUrl: string | null | undefined): boolean => {
    if (!imageUrl) return false
    return imageUrl.startsWith("data:image") || imageUrl.startsWith("data:image/")
  }

  const hasValidImage = isValidBase64Image(scan.imageUrl)

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Back Button */}
        <Link href="/dashboard">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>

        {/* Main Content Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Product Image */}
              <div className="flex-shrink-0">
                {hasValidImage ? (
                  <div className="relative w-full sm:w-64 h-64 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                    <Image
                      src={scan.imageUrl!}
                      alt={scan.productName || "Product"}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-full sm:w-64 h-64 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center">
                    <ShoppingBag className="h-24 w-24 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">
                  {scan.productName || "Unknown Product"}
                </CardTitle>
                <p className="text-sm text-gray-500 mb-4">
                  Scanned on {formatDate(scan.createdAt)}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Full Analysis */}
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Full Analysis</h2>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <AnalysisDisplay analysisResult={scan.analysisResult} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

