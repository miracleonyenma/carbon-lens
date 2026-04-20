"use client";

import { useCallback, useState } from "react";
import { Upload, FileImage, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ReceiptUploadProps {
  onFileSelect: (file: File) => void;
  isAnalyzing: boolean;
}

export function ReceiptUpload({ onFileSelect, isAnalyzing }: ReceiptUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
      if (!allowedTypes.includes(file.type)) {
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        return;
      }

      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
      onFileSelect(file);
    },
    [onFileSelect],
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    },
    [handleFile],
  );

  const clearPreview = useCallback(() => {
    setPreview(null);
    setFileName(null);
  }, []);

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-12 text-center">
        <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-medium">Analyzing your receipt...</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Gemini is identifying items and calculating carbon footprints
        </p>
      </div>
    );
  }

  if (preview) {
    return (
      <div className="relative rounded-xl border bg-card p-4">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 z-10"
          onClick={clearPreview}
        >
          <X className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-4">
          <div className="relative h-32 w-24 flex-shrink-0 overflow-hidden rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Receipt preview"
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <p className="font-medium">{fileName}</p>
            <p className="text-sm text-muted-foreground">Ready to analyze</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <label
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition-colors",
        dragActive
          ? "border-primary bg-primary/10"
          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="hidden"
        onChange={handleChange}
      />
      <div className="mb-4 rounded-full bg-primary/10 p-4">
        {dragActive ? (
          <FileImage className="h-8 w-8 text-primary" />
        ) : (
          <Upload className="h-8 w-8 text-primary" />
        )}
      </div>
      <p className="text-lg font-medium">
        {dragActive ? "Drop your receipt here" : "Upload a receipt"}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Drag & drop or click to select. JPEG, PNG, or WebP up to 10MB.
      </p>
    </label>
  );
}
