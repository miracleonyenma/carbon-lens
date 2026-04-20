"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings, Key, ExternalLink, Check, X } from "lucide-react";
import { usePersistedState } from "@/hooks/aevr/use-persisted-state";

export function useGeminiKey() {
  const [key, setKey] = usePersistedState<string>("gemini-api-key", "");
  return { key, setKey };
}

export function ApiKeyDialog({ children }: { children?: React.ReactNode }) {
  const { key, setKey } = useGeminiKey();
  const [input, setInput] = useState(key);
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setKey(input.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setOpen(false);
    }, 1000);
  };

  const handleClear = () => {
    setInput("");
    setKey("");
  };

  const hasKey = !!key;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Gemini API Key
          </DialogTitle>
          <DialogDescription>
            Bring your own Google Gemini API key for unlimited scanning. Your
            key is stored locally in your browser and never sent to our servers
            — it goes directly to Google.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <div className="relative">
              <Input
                id="api-key"
                type="password"
                placeholder="AIza..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="pr-10"
              />
              {hasKey && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={handleClear}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {hasKey ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Check className="h-3 w-3" />
                  Key configured
                </span>
              ) : (
                "No key set — using shared quota (may hit rate limits)"
              )}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Get a free API key
              <ExternalLink className="h-3 w-3" />
            </a>

            <Button
              onClick={handleSave}
              disabled={saved}
              size="sm"
              className="gap-2"
            >
              {saved ? (
                <>
                  <Check className="h-4 w-4" />
                  Saved
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
