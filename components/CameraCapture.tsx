"use client"

import { useRef, useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Camera, Upload } from "lucide-react"

interface CameraCaptureProps {
  onImageCapture: (file: File) => void
  isProcessing?: boolean
  label?: string
}

export function CameraCapture({ onImageCapture, isProcessing = false, label = "Product" }: CameraCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  // Log when component mounts/remounts
  useEffect(() => {
    console.log("🎥 [CAMERA] Component mounted/remounted")
    // Ensure file inputs are reset
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = ""
    }
    setPreview(null)
  }, [])


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("📁 [CAMERA] handleFileChange triggered, isProcessing:", isProcessing)
    const file = e.target.files?.[0]
    if (file) {
      console.log("📁 [CAMERA] File selected:", file.name, file.type, file.size)
      handleImageSelect(file)
    } else {
      console.log("📁 [CAMERA] No file selected or file selection cancelled")
      // Reset input value if no file selected
      if (e.target) {
        e.target.value = ""
      }
    }
  }

  const handleImageSelect = (file: File) => {
    console.log("🖼️ [CAMERA] handleImageSelect called with:", file.name, file.type)
    
    // Don't process if already processing
    if (isProcessing) {
      console.warn("⚠️ [CAMERA] Already processing, ignoring file selection")
      return
    }
    
    if (file.type.startsWith("image/")) {
      console.log("🖼️ [CAMERA] Valid image file, calling onImageCapture immediately")
      
      // IMPORTANT: Call parent callback FIRST to update state immediately
      // This prevents the component from being unmounted before the callback completes
      try {
        onImageCapture(file)
        console.log("✅ [CAMERA] onImageCapture callback completed successfully")
      } catch (error) {
        console.error("❌ [CAMERA] Error in onImageCapture callback:", error)
        return // Don't create preview if callback fails
      }
      
      // Create preview after callback (non-blocking, won't show if component unmounts)
      const reader = new FileReader()
      reader.onloadend = () => {
        // Only set preview if component is still mounted and not processing
        if (!isProcessing) {
          setPreview(reader.result as string)
          console.log("🖼️ [CAMERA] Preview created")
        }
      }
      reader.onerror = () => {
        console.error("❌ [CAMERA] Error reading file for preview")
      }
      reader.readAsDataURL(file)
    } else {
      console.error("❌ [CAMERA] Invalid file type:", file.type)
    }
  }

  const handleCameraClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    console.log("📷 [CAMERA] Camera button clicked")
    // Clear value first to ensure onChange fires even if same file selected
    if (cameraInputRef.current) {
      cameraInputRef.current.value = ""
    }
    cameraInputRef.current?.click()
  }

  const handleGalleryClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    console.log("📂 [CAMERA] Gallery button clicked")
    // Clear value first to ensure onChange fires even if same file selected
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    fileInputRef.current?.click()
  }

  const handleRetry = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (cameraInputRef.current) cameraInputRef.current.value = ""
  }

  return (
    <div className="w-full space-y-4">
      {preview && (
        <div className="relative w-full rounded-lg overflow-hidden border-2 border-primary">
          <div className="relative w-full aspect-square max-h-[400px]">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          {!isProcessing && (
            <Button
              type="button"
              onClick={handleRetry}
              variant="outline"
              className="absolute top-2 right-2"
              size="sm"
            >
              Retry
            </Button>
          )}
        </div>
      )}

      {!preview && !isProcessing && (
        <div className="flex flex-col gap-4">
          <Button
            type="button"
            onClick={handleCameraClick}
            size="lg"
            className="h-16 text-lg font-semibold w-full"
            disabled={isProcessing}
          >
            <Camera className="mr-2 h-6 w-6" />
            Scan {label}
          </Button>

          <Button
            type="button"
            onClick={handleGalleryClick}
            variant="outline"
            size="lg"
            className="h-14 text-base w-full"
            disabled={isProcessing}
          >
            <Upload className="mr-2 h-5 w-5" />
            Choose from Gallery
          </Button>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={isProcessing}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        disabled={isProcessing}
      />
    </div>
  )
}
