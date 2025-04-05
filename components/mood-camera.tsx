"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Camera, X } from "lucide-react"

interface MoodCameraProps {
  onCapture: (imageData: string) => void
  onCancel: () => void
  isAnalyzing: boolean
}

export default function MoodCamera({ onCapture, onCancel, isAnalyzing }: MoodCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        })
        setStream(mediaStream)

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      } catch (error) {
        console.error("Error accessing camera:", error)
      }
    }

    startCamera()

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const captureImage = () => {
    // Start countdown
    setCountdown(3)

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(countdownInterval)
          takePhoto()
          return null
        }
        return prev ? prev - 1 : null
      })
    }, 1000)
  }

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext("2d")

      if (context) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Convert canvas to data URL
        const imageData = canvas.toDataURL("image/jpeg")
        onCapture(imageData)
      }
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto rounded-t-lg" />
        <canvas ref={canvasRef} className="hidden" />

        {countdown && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-6xl font-bold text-white">{countdown}</div>
          </div>
        )}

        {isAnalyzing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <div className="text-xl font-medium text-white">Analyzing your mood...</div>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-black/30 text-white hover:bg-black/50 hover:text-white"
          onClick={onCancel}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-4 flex justify-center">
        <Button onClick={captureImage} disabled={isAnalyzing || countdown !== null} className="gap-2">
          <Camera className="h-5 w-5" />
          Capture Mood
        </Button>
      </div>
    </Card>
  )
}

