"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { useUser } from "@clerk/nextjs"
import { CameraCapture } from "@/components/CameraCapture"
import { ResultDisplay } from "@/components/ResultDisplay"
import { Header } from "@/components/Header"

type Mode = 'single' | 'compare'

export default function Home() {
  const { user, isLoaded } = useUser()
  const [mode, setMode] = useState<Mode>('single')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageFile2, setImageFile2] = useState<File | null>(null) // For compare mode
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [cameraKey, setCameraKey] = useState(0) // Key to force remount
  const imageUrlRef = useRef<string | null>(null)
  const imageUrlRef2 = useRef<string | null>(null) // For compare mode

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
    if (!imageFile2 && imageUrlRef2.current) {
      URL.revokeObjectURL(imageUrlRef2.current)
      imageUrlRef2.current = null
    }
  }, [imageFile, imageFile2])

  const handleImageCapture = async (file: File, slot: 'first' | 'second' = 'first') => {
    console.log(`📸 [HOME] handleImageCapture called with file: ${file.name}, slot: ${slot}, mode: ${mode}`)
    
    // Prevent processing if already processing
    if (isProcessing) {
      console.warn("⚠️ [HOME] Already processing, ignoring new selection")
      return
    }
    
    // Set the appropriate image file
    if (slot === 'first') {
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current)
        imageUrlRef.current = null
      }
      setImageFile(file)
    } else {
      if (imageUrlRef2.current) {
        URL.revokeObjectURL(imageUrlRef2.current)
        imageUrlRef2.current = null
      }
      setImageFile2(file)
    }

    // In single mode, process immediately
    // In compare mode, wait for both images
    if (mode === 'single') {
      await processImages(file, null)
    } else {
      // Compare mode: check if we have both images
      const currentFirst = slot === 'first' ? file : imageFile
      const currentSecond = slot === 'second' ? file : imageFile2
      
      if (currentFirst && currentSecond) {
        await processImages(currentFirst, currentSecond)
      } else {
        console.log("📸 [HOME] Waiting for second image in compare mode...")
      }
    }
  }

  const processImages = async (file1: File, file2: File | null) => {
    console.log("🔄 [HOME] processImages called", { file1: file1.name, file2: file2?.name })
    
    // Cleanup previous blob URLs
    if (imageUrlRef.current) {
      URL.revokeObjectURL(imageUrlRef.current)
      imageUrlRef.current = null
    }
    if (imageUrlRef2.current) {
      URL.revokeObjectURL(imageUrlRef2.current)
      imageUrlRef2.current = null
    }
    
    // Set state
    setError(null)
    setResult("")
    setIsProcessing(true)

    try {
      // Convert images to base64
      const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            const base64 = reader.result as string
            resolve(base64)
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
      }

      const base64Image1 = await convertToBase64(file1)
      const base64Image2 = file2 ? await convertToBase64(file2) : null

      // Create JSON body
      const body = JSON.stringify({
        image: base64Image1,
        image2: base64Image2,
      })

      // Call the API
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: body,
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
    // Cleanup blob URLs
    if (imageUrlRef.current) {
      URL.revokeObjectURL(imageUrlRef.current)
      imageUrlRef.current = null
    }
    if (imageUrlRef2.current) {
      URL.revokeObjectURL(imageUrlRef2.current)
      imageUrlRef2.current = null
    }
    
    // Clear all state - React will batch these updates
    setError(null)
    setResult("")
    setIsProcessing(false)
    setImageFile(null)
    setImageFile2(null)
    
    // Increment key to force CameraCapture remount
    // This happens in the same render cycle, so it's safe
    setCameraKey(prev => prev + 1)
    console.log("🔄 [HOME] State cleared, cameraKey incremented")
  }

  const handleModeChange = (newMode: Mode) => {
    if (isProcessing) return // Don't allow mode change while processing
    setMode(newMode)
    // Clear images when switching modes
    handleRetry()
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">QuickPick</h1>
          <p className="text-gray-600 text-base mb-4">
            AI Shopping Assistant
          </p>
          {isLoaded && user && (
            <p className="text-sm text-gray-500 mb-2">
              Welcome back, {user.firstName || user.username || 'there'}! 👋
            </p>
          )}
          
          {/* Mode Toggle */}
          <div className="flex items-center justify-center gap-2 bg-gray-100 rounded-lg p-1 max-w-xs mx-auto">
            <button
              type="button"
              onClick={() => handleModeChange('single')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'single'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Single Scan
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('compare')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'compare'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Compare Two
            </button>
          </div>
        </div>

        {/* Camera Capture - Show when ready to capture (no active processing or results) */}
        {!isProcessing && !result && !error && (mode === 'single' ? !imageFile : (!imageFile || !imageFile2)) && (
          <div className="space-y-6" key={`camera-wrapper-${cameraKey}`}>
            {mode === 'single' ? (
              <CameraCapture 
                key={cameraKey} 
                onImageCapture={(file) => handleImageCapture(file, 'first')} 
                isProcessing={isProcessing}
                label="Product"
              />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <CameraCapture 
                  key={`${cameraKey}-1`} 
                  onImageCapture={(file) => handleImageCapture(file, 'first')} 
                  isProcessing={isProcessing}
                  label="Product A"
                />
                <CameraCapture 
                  key={`${cameraKey}-2`} 
                  onImageCapture={(file) => handleImageCapture(file, 'second')} 
                  isProcessing={isProcessing}
                  label="Product B"
                />
              </div>
            )}
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="space-y-6">
            <div className={`grid gap-4 ${mode === 'compare' && imageFile2 ? 'grid-cols-2' : ''}`}>
              {imageFile && (() => {
                // Create blob URL if not already created
                if (!imageUrlRef.current) {
                  imageUrlRef.current = URL.createObjectURL(imageFile)
                }
                return (
                  <div className="relative rounded-lg overflow-hidden border-2 border-primary">
                    <div className="absolute top-2 left-2 bg-primary text-white px-2 py-1 rounded text-xs font-semibold z-10">
                      {mode === 'compare' ? 'Product A' : 'Product'}
                    </div>
                    <div className="relative w-full aspect-square max-h-[400px]">
                      <Image
                        src={imageUrlRef.current}
                        alt="Uploaded"
                        fill
                        className="object-contain opacity-75"
                        unoptimized
                      />
                    </div>
                  </div>
                )
              })()}
              {imageFile2 && mode === 'compare' && (() => {
                // Create blob URL if not already created
                if (!imageUrlRef2.current) {
                  imageUrlRef2.current = URL.createObjectURL(imageFile2)
                }
                return (
                  <div className="relative rounded-lg overflow-hidden border-2 border-blue-500">
                    <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-semibold z-10">
                      Product B
                    </div>
                    <div className="relative w-full aspect-square max-h-[400px]">
                      <Image
                        src={imageUrlRef2.current}
                        alt="Uploaded"
                        fill
                        className="object-contain opacity-75"
                        unoptimized
                      />
                    </div>
                  </div>
                )
              })()}
            </div>
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
