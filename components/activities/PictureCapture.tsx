"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, RotateCcw, Check, X, Loader2, Upload } from "lucide-react";

interface PictureCaptureProps {
  onPictureTaken: (pictureData: string) => Promise<void>;
  onSkip: () => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
}

export default function PictureCapture({
  onPictureTaken,
  onSkip,
  isLoading = false,
  title = "Add a picture to your activity",
  description = "Take a picture or upload one from your device",
}: PictureCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<
    "granted" | "denied" | "prompt"
  >("prompt");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      setError(null);

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Prefer back camera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setStream(mediaStream);
      setCameraPermission("granted");
      setIsStreamActive(true); // Set this immediately so the video element renders

      // Wait a bit for the video element to render, then set up the stream
      const setupVideoStream = () => {
        if (videoRef.current) {
          const video = videoRef.current;
          video.srcObject = mediaStream;

          // Set up event handlers
          const handleLoadedMetadata = () => {
            console.log(
              "Video metadata loaded, dimensions:",
              video.videoWidth,
              "x",
              video.videoHeight
            );
            setIsVideoReady(true);
          };

          const handleCanPlay = () => {
            console.log("Video can play");
          };

          const handleError = (e: string | Event) => {
            console.error("Video error:", e);
            setError("Video playback error. Please try again.");
            setIsStreamActive(false);
          };

          video.onloadedmetadata = handleLoadedMetadata;
          video.oncanplay = handleCanPlay;
          video.onerror = handleError;

          console.log("Video stream setup complete");
        } else {
          // Retry after a short delay if video element isn't ready
          setTimeout(setupVideoStream, 100);
        }
      };

      // Start the setup process
      setupVideoStream();
    } catch (err) {
      console.error("Error accessing camera:", err);
      setCameraPermission("denied");
      setIsStreamActive(false);

      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setError(
            "Camera access denied. Please enable camera permissions and try again."
          );
        } else if (err.name === "NotFoundError") {
          setError("No camera found. Please use the upload option instead.");
        } else {
          setError(
            "Failed to access camera. Please try uploading a picture instead."
          );
        }
      }
    }
  }, []);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsStreamActive(false);
      setIsVideoReady(false);
    }
  }, [stream]);

  // Capture photo from video stream
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    const imageData = canvas.toDataURL("image/jpeg", 0.8);
    setCapturedImage(imageData);
    stopCamera();
  }, [stopCamera]);

  // Handle file upload
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file.");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(
          "Image file is too large. Please select an image smaller than 5MB."
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCapturedImage(result);
        setError(null);
      };
      reader.readAsDataURL(file);
    },
    []
  );

  // Retake photo
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setError(null);
    setIsVideoReady(false);
    startCamera();
  }, [startCamera]);

  // Save photo
  const savePicture = useCallback(async () => {
    if (!capturedImage) return;

    try {
      await onPictureTaken(capturedImage);
    } catch (err) {
      console.error("Error saving picture:", err);
      setError("Failed to save picture. Please try again.");
    }
  }, [capturedImage, onPictureTaken]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="max-w-md mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {/* Camera/Image Display */}
      <Card>
        <CardContent className="p-4">
          <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
            {capturedImage ? (
              /* Captured Image Preview */
              <Image
                src={capturedImage}
                alt="Captured"
                width={400}
                height={300}
                className="w-full h-full object-cover"
              />
            ) : isStreamActive ? (
              /* Camera Stream */
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                onLoadedData={() => console.log("Video loaded data")}
              />
            ) : (
              /* Placeholder */
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center space-y-2">
                  <Camera className="w-12 h-12 mx-auto" />
                  <p className="text-sm">Camera preview</p>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        {capturedImage ? (
          /* Image Captured - Show Save/Retake Options */
          <div className="flex gap-3">
            <Button
              onClick={retakePhoto}
              variant="outline"
              size="lg"
              className="flex-1"
              disabled={isLoading}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Retake
            </Button>
            <Button
              onClick={savePicture}
              size="lg"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Save Picture
            </Button>
          </div>
        ) : (
          /* No Image - Show Capture/Upload Options */
          <div className="space-y-3">
            {isStreamActive ? (
              <Button
                onClick={capturePhoto}
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                <Camera className="w-4 h-4 mr-2" />
                Take Picture
              </Button>
            ) : (
              <Button
                onClick={startCamera}
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                <Camera className="w-4 h-4 mr-2" />
                Start Camera
              </Button>
            )}

            <div className="relative">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Picture
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* Skip Button */}
        <Button
          onClick={onSkip}
          variant="ghost"
          size="lg"
          className="w-full"
          disabled={isLoading}
        >
          <X className="w-4 h-4 mr-2" />
          Skip for now
        </Button>
      </div>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
