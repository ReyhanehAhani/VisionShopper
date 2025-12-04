"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Upload } from "lucide-react"

interface CameraCaptureProps {
  onImageCapture: (file: File) => void
  isProcessing?: boolean
}

export function CameraCapture({ onImageCapture, isProcessing = false }: CameraCaptureProps) {
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
    console.log("📁 [CAMERA] handleFileChange triggered")
    const file = e.target.files?.[0]
    if (file) {
      console.log("📁 [CAMERA] File selected:", file.name, file.type, file.size)
      handleImageSelect(file)
    } else {
      console.log("📁 [CAMERA] No file selected")
    }
  }

  const handleImageSelect = (file: File) => {
    console.log("🖼️ [CAMERA] handleImageSelect called with:", file.name, file.type)
    if (file.type.startsWith("image/")) {
      console.log("🖼️ [CAMERA] Valid image file, creating preview and calling onImageCapture")
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
        console.log("🖼️ [CAMERA] Preview created")
      }
      reader.readAsDataURL(file)
      
      // Pass to parent
      console.log("🖼️ [CAMERA] Calling onImageCapture callback")
      onImageCapture(file)
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
          <img
            src={preview}
            alt="Preview"
            className="w-full h-auto max-h-[400px] object-contain"
          />
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
            Scan Products
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
