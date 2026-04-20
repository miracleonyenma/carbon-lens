"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ImpactBadge } from "@/components/carbon/impact-badge";
import {
  Camera,
  CameraOff,
  Scan,
  Loader2,
  RotateCcw,
  Leaf,
  ArrowRight,
  Key,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ApiKeyDialog, useGeminiKey } from "@/components/carbon/api-key-dialog";

interface DetectedItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  carbonKg: number;
  impactLevel: "low" | "medium" | "high";
  suggestedSwap: string;
  swapSavingsKg: number;
}

interface CameraResult {
  items: DetectedItem[];
  totalCarbonKg: number;
  totalItems: number;
  insights: string;
}

export function LiveCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { key: geminiKey } = useGeminiKey();

  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<CameraResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  );

  // Cooldown timer tick
  useEffect(() => {
    if (cooldown <= 0) {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
      return;
    }
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [cooldown > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsStreaming(true);
    } catch {
      setError(
        "Could not access camera. Please grant camera permission and try again."
      );
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || cooldown > 0) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Scale down for faster transfer & analysis
      const maxWidth = 640;
      const scale = Math.min(1, maxWidth / video.videoWidth);
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.6);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (geminiKey) {
        headers["x-gemini-key"] = geminiKey;
      }

      const response = await fetch("/api/v1/receipts/camera", {
        method: "POST",
        headers,
        body: JSON.stringify({
          frame: dataUrl,
          mimeType: "image/jpeg",
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        setErrorCode(err.code || null);
        if (err.code === "RATE_LIMIT" && err.retryAfter) {
          setCooldown(err.retryAfter);
        }
        throw new Error(err.error || "Analysis failed");
      }

      const data = await response.json();
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze frame");
    } finally {
      setIsAnalyzing(false);
    }
  }, [geminiKey, cooldown]);

  const switchCamera = useCallback(() => {
    stopCamera();
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }, [stopCamera]);

  // Restart camera when facing mode changes
  useEffect(() => {
    if (isStreaming) {
      startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const clearResult = () => {
    setResult(null);
    setError(null);
    setErrorCode(null);
  };

  return (
    <div className="space-y-4">
      {/* Camera View */}
      <Card className="overflow-hidden">
        <CardContent className="p-0 relative">
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />

            {!isStreaming && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-muted/80">
                <Camera className="h-16 w-16 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">
                  Point your camera at any item to analyze its carbon footprint
                </p>
                <Button onClick={startCamera} size="lg">
                  <Camera className="mr-2 h-4 w-4" />
                  Start Camera
                </Button>
              </div>
            )}

            {isAnalyzing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="flex flex-col items-center gap-3 text-white">
                  <div className="relative">
                    <Scan className="h-16 w-16 animate-pulse" />
                    <Loader2 className="h-8 w-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
                  </div>
                  <p className="text-sm font-medium">
                    Analyzing carbon footprint...
                  </p>
                </div>
              </div>
            )}

            {/* Camera Controls */}
            {isStreaming && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={switchCamera}
                  className="rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  onClick={captureAndAnalyze}
                  disabled={isAnalyzing || cooldown > 0}
                  className="rounded-full px-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isAnalyzing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : cooldown > 0 ? (
                    <>{cooldown}s</>
                  ) : (
                    <Scan className="mr-2 h-4 w-4" />
                  )}
                  {cooldown > 0 ? "Wait" : "Scan"}
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={stopCamera}
                  className="rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white"
                >
                  <CameraOff className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-sm text-destructive font-medium">{error}</p>
            {(errorCode === "RATE_LIMIT" || errorCode === "NO_API_KEY") && (
              <div className="mt-3 flex items-center gap-2">
                <ApiKeyDialog>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Key className="h-3.5 w-3.5" />
                    Add your API key
                  </Button>
                </ApiKeyDialog>
                <span className="text-xs text-muted-foreground">
                  Free at{" "}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    aistudio.google.com
                  </a>
                </span>
              </div>
            )}
            {errorCode === "INVALID_KEY" && (
              <div className="mt-3">
                <ApiKeyDialog>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Key className="h-3.5 w-3.5" />
                    Update your API key
                  </Button>
                </ApiKeyDialog>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Summary */}
            <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-full">
                      <Leaf className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-semibold">
                        {result.totalItems} item
                        {result.totalItems !== 1 ? "s" : ""} detected
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Total: {result.totalCarbonKg} kg CO₂e
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={clearResult}>
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <div className="grid gap-2">
              {result.items.map((item, i) => (
                <motion.div
                  key={`${item.name}-${i}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {item.name}
                            </span>
                            <ImpactBadge level={item.impactLevel} />
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.carbonKg} kg CO₂e · {item.category}
                          </p>
                        </div>
                        {item.suggestedSwap && (
                          <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">
                            <ArrowRight className="h-3 w-3" />
                            <span className="truncate max-w-[120px]">
                              {item.suggestedSwap}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Insights */}
            {result.insights && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">
                    💡 {result.insights}
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
