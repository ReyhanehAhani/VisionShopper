"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, TrendingUp } from "lucide-react"

interface ProductComparison {
  productNames: string[]
  verdict: string
  comparisons: Array<{
    product: string
    flavorProfile: string
    keyPro: string
    keyCon: string
  }>
  quickSummary: string
}

interface ResultDisplayProps {
  result: string
  isLoading: boolean
  onRetry: () => void
}

export function ResultDisplay({ result, isLoading, onRetry }: ResultDisplayProps) {
  const [parsedResult, setParsedResult] = useState<ProductComparison | null>(null)

  useEffect(() => {
    if (result && !isLoading) {
      parseResult(result)
    }
  }, [result, isLoading])

  const parseResult = (text: string) => {
    // Simple parsing logic - in production, you'd want more robust parsing
    // This is a simplified version that tries to extract structured data
    
    try {
      const lines = text.split("\n").filter(line => line.trim())
      
      // Extract product names (usually first line or after "Products:")
      const productNames: string[] = []
      let verdict = ""
      const comparisons: ProductComparison["comparisons"] = []
      let quickSummary = ""

      // Simple regex patterns for extraction
      const productPattern = /(?:Products?|Product Names?):?\s*(.+)/i
      const verdictPattern = /(?:Verdict|Recommendation):?\s*(.+)/i
      
      let currentProduct: Partial<ProductComparison["comparisons"][0]> | null = null

      lines.forEach((line, index) => {
        // Try to find product names
        if (index === 0 || productPattern.test(line)) {
          const match = line.match(productPattern)
          if (match) {
            const products = match[1].split(/[&,]/).map(p => p.trim())
            productNames.push(...products)
          } else if (index === 0 && !line.includes(":")) {
            productNames.push(line.trim())
          }
        }

        // Find verdict
        if (verdictPattern.test(line)) {
          verdict = line.replace(verdictPattern, "$1").trim()
        } else if (line.toLowerCase().includes("verdict") && !verdict) {
          verdict = lines[index + 1]?.trim() || ""
        }

        // Find flavor profiles
        if (line.toLowerCase().includes("flavor")) {
          const flavor = line.split(":")[1]?.trim() || ""
          if (currentProduct) {
            currentProduct.flavorProfile = flavor
          }
        }

        // Find pros/cons
        if (line.toLowerCase().includes("pro:") || line.toLowerCase().includes("key pro")) {
          const pro = line.split(":")[1]?.trim() || ""
          if (currentProduct) {
            currentProduct.keyPro = pro
          }
        }

        if (line.toLowerCase().includes("con:") || line.toLowerCase().includes("key con")) {
          const con = line.split(":")[1]?.trim() || ""
          if (currentProduct) {
            currentProduct.keyCon = con
          }
        }

        // Quick summary (usually last 1-2 sentences)
        if (line.length > 50 && !line.includes(":") && index > lines.length / 2) {
          quickSummary += line + " "
        }
      })

      // If we couldn't parse structured data, create a simple display
      if (productNames.length === 0 && verdict === "") {
        // Fallback: show raw text in a readable format
        setParsedResult({
          productNames: ["Products in image"],
          verdict: "Analysis complete",
          comparisons: [],
          quickSummary: text.substring(0, 200) + (text.length > 200 ? "..." : "")
        })
      } else {
        setParsedResult({
          productNames: productNames.length > 0 ? productNames : ["Product"],
          verdict: verdict || "Check the comparison below",
          comparisons: comparisons.length > 0 ? comparisons : [],
          quickSummary: quickSummary.trim() || text.substring(0, 150)
        })
      }
    } catch (error) {
      console.error("Error parsing result:", error)
      // Fallback to raw display
      setParsedResult({
        productNames: ["Products"],
        verdict: "Analysis complete",
        comparisons: [],
        quickSummary: text.substring(0, 200)
      })
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
    return (
      <div className="w-full space-y-6">
        {/* Verdict Card */}
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              The Verdict
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">{parsedResult.verdict || "Check comparison below"}</p>
          </CardContent>
        </Card>

        {/* Product Names */}
        {parsedResult.productNames.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Products Identified:</h3>
            <div className="flex flex-wrap gap-2">
              {parsedResult.productNames.map((name, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-sm"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Comparison Cards */}
        {parsedResult.comparisons.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {parsedResult.comparisons.map((comp, idx) => (
              <Card
                key={idx}
                className={idx % 2 === 0 ? "border-blue-500" : "border-green-500"}
              >
                <CardHeader>
                  <CardTitle className="text-xl">{comp.product}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Flavor Profile</p>
                    <p className="text-base">{comp.flavorProfile}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Key Pro</p>
                      <p className="text-base">{comp.keyPro}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Key Con</p>
                      <p className="text-base">{comp.keyCon}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Summary */}
        {parsedResult.quickSummary && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base leading-relaxed">{parsedResult.quickSummary}</p>
            </CardContent>
          </Card>
        )}

        {/* Raw result fallback if structured parsing didn't work well */}
        {(parsedResult.comparisons.length === 0 || !parsedResult.quickSummary) && result && (
          <Card>
            <CardHeader>
              <CardTitle>Full Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-base leading-relaxed">
                {result}
              </div>
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
