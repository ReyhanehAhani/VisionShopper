"use client"

import { useState, useEffect, useRef } from "react"
import { CameraCapture } from "@/components/CameraCapture"
import { ResultDisplay } from "@/components/ResultDisplay"

export default function Home() {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [cameraKey, setCameraKey] = useState(0) // Key to force remount
  const imageUrlRef = useRef<string | null>(null)

  // Cleanup blob URL when component unmounts or imageFile changes
  useEffect(() => {
    return () => {
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current)
        imageUrlRef.current = null
      }
    }
  }, [])

  // Cleanup blob URL when imageFile is cleared
  useEffect(() => {
    if (!imageFile && imageUrlRef.current) {
      URL.revokeObjectURL(imageUrlRef.current)
      imageUrlRef.current = null
    }
  }, [imageFile])

  const handleImageCapture = async (file: File) => {
    console.log("📸 [HOME] handleImageCapture called with file:", file.name, file.type, file.size)
    
    // Prevent processing if already processing another image
    if (isProcessing) {
      console.warn("⚠️ [HOME] Already processing an image, ignoring new selection")
      return
    }
    
    // Cleanup previous blob URL if it exists
    if (imageUrlRef.current) {
      URL.revokeObjectURL(imageUrlRef.current)
      imageUrlRef.current = null
    }
    
    console.log("📸 [HOME] Setting state: imageFile, isProcessing=true, clearing result and error")
    // Clear previous state first, then set new state
    // Use batch update to ensure all state changes happen together
    setError(null)
    setResult("")
    setImageFile(file)
    setIsProcessing(true)

    try {
      // Create form data
      const formData = new FormData()
      formData.append("file", file)

      // Call the API
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        // Try to parse error response for detailed message
        let errorMessage = "Failed to analyze image"
        try {
          const errorData = await response.clone().json()
          errorMessage = errorData.message || errorData.error || errorMessage
          if (errorData.details) {
            errorMessage += `: ${errorData.details}`
          }
          console.error("API Error Response:", errorData)
        } catch {
          const textError = await response.clone().text()
          console.error("API Error (text):", textError)
          errorMessage = textError || errorMessage
        }
        throw new Error(errorMessage)
      }

      // Get reader and decoder for manual stream parsing
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("No response body")
      }

      // Stream parser with proper buffering to handle incomplete lines
      let buffer = ''
      
      while (true) {
        const { done, value } = await reader.read()
        
        // Decode chunk and add to buffer
        if (value) {
          buffer += decoder.decode(value, { stream: true })
        }
        
        if (done) {
          // Process any remaining buffer after stream ends
          if (buffer.trim()) {
            const finalLines = buffer.split('\n')
            for (const line of finalLines) {
              if (line.trim() && line.startsWith('0:')) {
                try {
                  const jsonStr = line.substring(2).trim()
                  if (jsonStr) {
                    const parsed = JSON.parse(jsonStr)
                    let textContent = ""
                    if (typeof parsed === "string") {
                      textContent = parsed
                    } else if (parsed && typeof parsed === "object") {
                      textContent = parsed.textDelta || parsed.text || parsed.content || ""
                      if (typeof textContent !== "string") {
                        textContent = String(textContent)
                      }
                    }
                    if (textContent) {
                      setResult((prev) => prev + textContent)
                    }
                  }
                } catch (e) {
                  // Skip parsing errors
                }
              }
            }
          }
          break
        }

        // Split by newlines, keep last incomplete line in buffer
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line

        // Process complete lines
        for (const line of lines) {
          if (!line.trim()) continue
          
          if (line.startsWith('0:')) {
            try {
              const jsonStr = line.substring(2).trim()
              if (!jsonStr) continue
              
              const parsed = JSON.parse(jsonStr)
              
              // Handle both string and object formats
              let textContent = ""
              if (typeof parsed === "string") {
                textContent = parsed
              } else if (parsed && typeof parsed === "object") {
                textContent = parsed.textDelta || parsed.text || parsed.content || ""
                if (typeof textContent !== "string") {
                  textContent = String(textContent)
                }
              }
              
              // Append text to result in real-time (it's okay if asterisks show up)
              if (textContent) {
                setResult((prev) => prev + textContent)
              }
            } catch (e) {
              // Skip parsing errors
            }
          }
        }
      }
    } catch (err) {
      console.error("❌ [HOME] Error processing image:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to analyze image"
      console.error("❌ [HOME] Setting error state:", errorMessage)
      setError(errorMessage)
      // Don't clear imageFile on error - keep it so user can see what they tried to upload
    } finally {
      console.log("✅ [HOME] Finally block - setting isProcessing=false")
      setIsProcessing(false)
    }
  }

  const handleRetry = () => {
    console.log("🔄 [HOME] handleRetry called - clearing all state")
    // Cleanup blob URL
    if (imageUrlRef.current) {
      URL.revokeObjectURL(imageUrlRef.current)
      imageUrlRef.current = null
    }
    
    // Clear all state - React will batch these updates
    setError(null)
    setResult("")
    setIsProcessing(false)
    setImageFile(null)
    
    // Increment key to force CameraCapture remount
    // This happens in the same render cycle, so it's safe
    setCameraKey(prev => prev + 1)
    console.log("🔄 [HOME] State cleared, cameraKey incremented")
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">QuickPick</h1>
          <p className="text-gray-600 text-base">
            AI Shopping Assistant
          </p>
        </div>

        {/* Camera Capture - Show when ready to capture (no active processing or results) */}
        {!imageFile && !isProcessing && !result && !error && (
          <div className="space-y-6" key={`camera-wrapper-${cameraKey}`}>
            <CameraCapture key={cameraKey} onImageCapture={handleImageCapture} isProcessing={isProcessing} />
          </div>
        )}

        {/* Debug: Show current state values */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 p-2 bg-black/80 text-white text-xs rounded z-50 max-w-xs">
            <div>imageFile: {imageFile ? imageFile.name : 'null'}</div>
            <div>isProcessing: {String(isProcessing)}</div>
            <div>result: {result ? `${result.length} chars` : 'empty'}</div>
            <div>error: {error || 'none'}</div>
            <div>cameraKey: {cameraKey}</div>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="space-y-6">
            {imageFile && (() => {
              // Create blob URL if not already created
              if (!imageUrlRef.current) {
                imageUrlRef.current = URL.createObjectURL(imageFile)
              }
              return (
                <div className="relative w-full rounded-lg overflow-hidden border-2 border-primary">
                  <img
                    src={imageUrlRef.current}
                    alt="Uploaded"
                    className="w-full h-auto max-h-[400px] object-contain opacity-75"
                  />
                </div>
              )
            })()}
            <ResultDisplay result={result || ""} isLoading={true} onRetry={handleRetry} />
          </div>
        )}

        {/* Results */}
        {result && !isProcessing && (
          <ResultDisplay
            result={result}
            isLoading={false}
            onRetry={handleRetry}
          />
        )}

        {/* Error State - Show error even if imageFile exists */}
        {error && !isProcessing && (
          <div className="mt-6 p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600 text-sm mt-1">
              {error || "Failed to analyze image. Please try again."}
            </p>
            {imageFile && (
              <div className="mt-3 p-2 bg-red-100 rounded text-xs text-red-700">
                Failed to process: {imageFile.name}
              </div>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleRetry()
              }}
              className="mt-3 text-sm text-red-700 underline"
            >
              Try Again
            </button>
            <details className="mt-2 text-xs text-red-600">
              <summary className="cursor-pointer font-medium">Debug Info</summary>
              <pre className="mt-2 p-2 bg-red-100 rounded overflow-auto text-[10px]">
                {JSON.stringify({ error, imageFile: imageFile?.name, isProcessing, result: result ? 'has result' : 'no result' }, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Take a photo of products to get instant comparisons</p>
        </div>
      </div>
    </main>
  )
}
