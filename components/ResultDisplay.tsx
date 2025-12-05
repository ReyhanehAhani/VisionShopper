"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { TrendingUp } from "lucide-react"

interface ParsedAnalysis {
  headline: string
  winner: string // For compare mode
  healthScore: string // Format: "A - Reason" or just "A"
  healthComparison: string // For compare mode
  whoIsThisFor: string
  flavorTexture: string
  flavorFaceOff: string // For compare mode
  prosCons: string
  prosConsComparison: string // For compare mode
  verdict: string
  rawText: string // Fallback if parsing fails
}

interface ResultDisplayProps {
  result: string
  isLoading: boolean
  onRetry: () => void
}

export function ResultDisplay({ result, isLoading, onRetry }: ResultDisplayProps) {
  const [parsedResult, setParsedResult] = useState<ParsedAnalysis | null>(null)

  useEffect(() => {
    if (result) {
      parseResult(result)
    }
  }, [result])

  // Helper function to parse health score and get color
  const getHealthScoreDisplay = (healthScore: string) => {
    if (!healthScore) return null

    // Extract grade (A, B, C, D, or E) and reason
    const match = healthScore.match(/^([A-E])[ -]*(.*)$/i)
    if (!match) return null

    const grade = match[1].toUpperCase()
    const reason = match[2]?.trim() || ''

    // Color mapping
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

  const parseResult = (text: string) => {
    try {
      // Define the headers we're looking for (supports both single and compare modes)
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

      // Split text by headers to extract sections
      const sections: Record<string, string> = {}
      let currentSection: string | null = null
      let currentContent: string[] = []

      const lines = text.split('\n')

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
          // Handle headers with or without colons
          const colonIndex = line.indexOf(':')
          if (colonIndex !== -1) {
            const afterHeader = line.substring(colonIndex + 1).trim()
            if (afterHeader) {
              currentContent.push(afterHeader)
            }
          } else {
            // Header without colon (like "WHO IS THIS FOR?")
            // Check if there's content after the header text
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

      // Extract sections with fallbacks
      const parsed: ParsedAnalysis = {
        headline: sections['HEADLINE:'] || '',
        winner: sections['WINNER:'] || '',
        healthScore: sections['HEALTH SCORE:'] || '',
        healthComparison: sections['HEALTH COMPARISON:'] || '',
        whoIsThisFor: sections['WHO IS THIS FOR?'] || '',
        flavorTexture: sections['FLAVOR & TEXTURE:'] || '',
        flavorFaceOff: sections['FLAVOR FACE-OFF:'] || '',
        prosCons: sections['PROS & CONS:'] || '',
        prosConsComparison: sections['PROS & CONS COMPARISON:'] || '',
        verdict: sections['VERDICT:'] || '',
        rawText: text
      }

      // Only set parsed result if we found at least one section
      // Otherwise, keep showing raw text (during streaming or if format is unexpected)
      const hasAnySection = Object.values(parsed).some((value, index) => {
        // Skip rawText check
        return index < Object.values(parsed).length - 1 && value.length > 0
      })

      if (hasAnySection) {
        setParsedResult(parsed)
      } else {
        // While streaming or if no headers found, don't set parsed result yet
        // This will trigger the raw text display
        setParsedResult(null)
      }
    } catch (error) {
      console.error("Error parsing result:", error)
      setParsedResult(null)
    }
  }

  if (isLoading && !result) {
    return (
      <div className="w-full space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-4 mt-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
        <div className="text-center text-sm text-muted-foreground">
          <div className="inline-flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            Scanning flavors...
          </div>
        </div>
      </div>
    )
  }

  if (result && !parsedResult && isLoading) {
    // Show streaming text while loading
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap text-base leading-relaxed">
            {result}
            <span className="animate-pulse">▊</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (result && !parsedResult && !isLoading) {
    // Show raw text if parsing hasn't completed yet or failed
    return (
      <div className="w-full space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-base leading-relaxed">
              {result}
            </div>
          </CardContent>
        </Card>
        <Button 
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onRetry()
          }}
          variant="outline" 
          className="w-full" 
          size="lg"
        >
          Scan Another Product
        </Button>
      </div>
    )
  }

  if (parsedResult) {
    const healthScoreDisplay = getHealthScoreDisplay(parsedResult.healthScore)

    return (
      <div className="w-full space-y-6">
        {/* Top Card - Shows HEADLINE/WINNER and Health Score */}
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {parsedResult.winner ? 'Comparison Result' : 'The Verdict'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg font-medium">
              {parsedResult.headline || "Analysis in progress..."}
            </p>

            {/* Winner (Compare Mode) */}
            {parsedResult.winner && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-sm font-semibold text-green-800 mb-1">🏆 WINNER</div>
                <p className="text-base text-green-900">{parsedResult.winner}</p>
              </div>
            )}
            
            {/* Health Score Badge (Single Mode) */}
            {healthScoreDisplay && !parsedResult.winner && (
              <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full ${healthScoreDisplay.colors.bg} ${healthScoreDisplay.colors.text} ${healthScoreDisplay.colors.border} border-2 font-bold text-xl shadow-sm`}>
                  {healthScoreDisplay.grade}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-700">Health Score</div>
                  {healthScoreDisplay.reason && (
                    <div className="text-sm text-gray-600">{healthScoreDisplay.reason}</div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Summary Card - Shows WHO IS THIS FOR? */}
        {parsedResult.whoIsThisFor && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base leading-relaxed">{parsedResult.whoIsThisFor}</p>
            </CardContent>
          </Card>
        )}

        {/* Full Analysis Card - Shows all sections */}
        {(parsedResult.flavorTexture || parsedResult.flavorFaceOff || 
          parsedResult.prosCons || parsedResult.prosConsComparison || 
          parsedResult.healthComparison || parsedResult.verdict) && (
          <Card>
            <CardHeader>
              <CardTitle>Full Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Health Comparison (Compare Mode) */}
              {parsedResult.healthComparison && (
                <div>
                  <h3 className="text-base font-semibold mb-2">HEALTH COMPARISON</h3>
                  <div className="whitespace-pre-wrap text-base leading-relaxed">
                    {parsedResult.healthComparison}
                  </div>
                </div>
              )}

              {/* Flavor & Texture (Single Mode) */}
              {parsedResult.flavorTexture && (
                <div>
                  <h3 className="text-base font-semibold mb-2">FLAVOR & TEXTURE</h3>
                  <div className="whitespace-pre-wrap text-base leading-relaxed">
                    {parsedResult.flavorTexture}
                  </div>
                </div>
              )}

              {/* Flavor Face-Off (Compare Mode) */}
              {parsedResult.flavorFaceOff && (
                <div>
                  <h3 className="text-base font-semibold mb-2">FLAVOR FACE-OFF</h3>
                  <div className="whitespace-pre-wrap text-base leading-relaxed">
                    {parsedResult.flavorFaceOff}
                  </div>
                </div>
              )}

              {/* Pros & Cons (Single Mode) */}
              {parsedResult.prosCons && (
                <div>
                  <h3 className="text-base font-semibold mb-2">PROS & CONS</h3>
                  <div className="whitespace-pre-wrap text-base leading-relaxed">
                    {parsedResult.prosCons}
                  </div>
                </div>
              )}

              {/* Pros & Cons Comparison (Compare Mode) */}
              {parsedResult.prosConsComparison && (
                <div>
                  <h3 className="text-base font-semibold mb-2">PROS & CONS COMPARISON</h3>
                  <div className="whitespace-pre-wrap text-base leading-relaxed">
                    {parsedResult.prosConsComparison}
                  </div>
                </div>
              )}

              {parsedResult.verdict && (
                <div>
                  <h3 className="text-base font-semibold mb-2">VERDICT</h3>
                  <p className="text-base leading-relaxed">{parsedResult.verdict}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Button 
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onRetry()
          }}
          variant="outline" 
          className="w-full" 
          size="lg"
        >
          Scan Another Product
        </Button>
      </div>
    )
  }

  return null
}
