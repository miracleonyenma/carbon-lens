"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, ScanLine, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ReceiptUpload } from "@/components/carbon/receipt-upload";
import { ScanResult } from "@/components/carbon/scan-result";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [itemsText, setItemsText] = useState("");

  const handleFileSelect = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("receipt", file);

      const res = await fetch("/api/v1/receipts/scan", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze receipt");
      }

      setResult(data.receipt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleTextSubmit = useCallback(async () => {
    if (!itemsText.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/v1/receipts/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsText }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze items");
      }

      setResult(data.receipt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsAnalyzing(false);
    }
  }, [itemsText]);

  const handleReset = useCallback(() => {
    setResult(null);
    setError(null);
    setItemsText("");
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Scan Receipt</h1>
        <p className="mt-1 text-muted-foreground">
          Upload a receipt photo or type your items to see their carbon footprint
        </p>
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
                disabled={!itemsText.trim() || isAnalyzing}
                className="w-full gap-2"
              >
                {isAnalyzing ? (
                  <>Analyzing...</>
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
              className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"
            >
              {error}
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function Leaf(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}
