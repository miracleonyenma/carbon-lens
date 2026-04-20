"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ScanLine,
  Type,
  Camera,
  Leaf,
  Settings,
  Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ReceiptUpload } from "@/components/carbon/receipt-upload";
import { ScanResult } from "@/components/carbon/scan-result";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiKeyDialog, useGeminiKey } from "@/components/carbon/api-key-dialog";
import { useLocalReceipts } from "@/hooks/use-local-receipts";

interface ReceiptData {
  storeName?: string;
  receiptDate?: string;
  items: {
    name: string;
    quantity: number;
    unit: string;
    category: string;
    carbonKg: number;
    impactLevel: "low" | "medium" | "high";
    suggestedSwap?: string;
    swapSavingsKg?: number;
  }[];
  totalCarbonKg: number;
  totalItems: number;
  insights?: string;
}

export default function ScanPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ReceiptData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [itemsText, setItemsText] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { key: geminiKey } = useGeminiKey();
  const { addReceipt } = useLocalReceipts();

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

  const handleFileSelect = useCallback(
    async (file: File) => {
      setIsAnalyzing(true);
      setError(null);
      setErrorCode(null);
      setResult(null);

      try {
        const formData = new FormData();
        formData.append("receipt", file);

        const headers: Record<string, string> = {};
        if (geminiKey) headers["x-gemini-key"] = geminiKey;

        const res = await fetch("/api/v1/receipts/scan", {
          method: "POST",
          headers,
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          setErrorCode(data.code || null);
          if (
            (data.code === "RATE_LIMIT" || data.code === "SERVICE_BUSY") &&
            data.retryAfter
          ) {
            setCooldown(data.retryAfter);
          }
          throw new Error(data.error || "Failed to analyze");
        }

        setResult(data.receipt);

        // Save locally if this was an anonymous scan
        if (data.anonymous) {
          addReceipt(data.receipt);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setIsAnalyzing(false);
      }
    },
    [geminiKey, addReceipt]
  );

  const handleTextSubmit = useCallback(async () => {
    if (!itemsText.trim() || cooldown > 0) return;

    setIsAnalyzing(true);
    setError(null);
    setErrorCode(null);
    setResult(null);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (geminiKey) headers["x-gemini-key"] = geminiKey;

      const res = await fetch("/api/v1/receipts/scan", {
        method: "POST",
        headers,
        body: JSON.stringify({ items: itemsText }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorCode(data.code || null);
        if (
          (data.code === "RATE_LIMIT" || data.code === "SERVICE_BUSY") &&
          data.retryAfter
        ) {
          setCooldown(data.retryAfter);
        }
        throw new Error(data.error || "Failed to analyze items");
      }

      setResult(data.receipt);

      // Save locally if this was an anonymous scan
      if (data.anonymous) {
        addReceipt(data.receipt);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsAnalyzing(false);
    }
  }, [itemsText, geminiKey, addReceipt]);

  const handleReset = useCallback(() => {
    setResult(null);
    setError(null);
    setErrorCode(null);
    setItemsText("");
  }, []);

  return (
    <div className="w-full mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Scan Items</h1>
          <ApiKeyDialog>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </ApiKeyDialog>
        </div>
        <p className="mt-1 text-muted-foreground">
          Upload a photo of anything — receipts, products, meals — or type your
          items to see their carbon footprint
        </p>
        <Link
          href="/dashboard/live"
          className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          <Camera className="h-4 w-4" />
          Try Live Camera instead
        </Link>
      </div>

      {result ? (
        <div className="space-y-6">
          <ScanResult {...result} />
          <div className="flex gap-3">
            <Button onClick={handleReset} variant="outline">
              Scan Another
            </Button>
            <Link href="/dashboard">
              <Button>View Dashboard</Button>
            </Link>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Tabs defaultValue="photo" className="w-full">
            <TabsList className="mb-6 w-full">
              <TabsTrigger value="photo" className="flex-1 gap-2">
                <ScanLine className="h-4 w-4" />
                Photo
              </TabsTrigger>
              <TabsTrigger value="text" className="flex-1 gap-2">
                <Type className="h-4 w-4" />
                Type Items
              </TabsTrigger>
            </TabsList>

            <TabsContent value="photo">
              <ReceiptUpload
                onFileSelect={handleFileSelect}
                isAnalyzing={isAnalyzing}
              />
            </TabsContent>

            <TabsContent value="text" className="space-y-4">
              <Textarea
                placeholder={`Type or paste your items, one per line:\n\n1 kg chicken breast\n2 liters milk\n500g ground beef\n1 loaf bread\n1 bag spinach`}
                value={itemsText}
                onChange={(e) => setItemsText(e.target.value)}
                rows={10}
                className="resize-none"
                disabled={isAnalyzing}
              />
              <Button
                onClick={handleTextSubmit}
                disabled={!itemsText.trim() || isAnalyzing || cooldown > 0}
                className="w-full gap-2"
              >
                {isAnalyzing ? (
                  <>Analyzing...</>
                ) : cooldown > 0 ? (
                  <>Wait {cooldown}s</>
                ) : (
                  <>
                    <Leaf className="h-4 w-4" />
                    Analyze Carbon Footprint
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4"
            >
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
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
