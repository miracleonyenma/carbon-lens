"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EcoScoreRing, TierBadge } from "./leaderboard-badges";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocalReceipts } from "@/hooks/use-local-receipts";
import { computeEcoScore, TIER_CONFIG } from "@/lib/eco-score";
import { Loader2, Trophy, Pencil } from "lucide-react";

interface SubmitScoreDialogProps {
  onSubmitted?: () => void;
  children?: React.ReactNode;
  /** If set, the user already has a leaderboard entry — show "edit" mode */
  existingNickname?: string;
}

export function SubmitScoreDialog({
  onSubmitted,
  children,
  existingNickname,
}: SubmitScoreDialogProps) {
  const { user } = useAuth();
  const { receipts: localReceipts } = useLocalReceipts();
  const isAuthenticated = !!user;
  const isEditing = !!existingNickname;

  const [open, setOpen] = useState(false);
  const [nickname, setNickname] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync nickname from props/user when dialog opens
  useEffect(() => {
    if (open) {
      setNickname(
        existingNickname ||
          (user?.firstName
            ? `${user.firstName}${
                user.lastName ? ` ${user.lastName.charAt(0)}.` : ""
              }`
            : "")
      );
      setError(null);
    }
  }, [open, existingNickname, user?.firstName, user?.lastName]);

  // Compute preview score from local receipts
  const previewScore = computeEcoScore({
    items: localReceipts.flatMap((r) => r.items),
    totalScans: localReceipts.length,
    scanDates: localReceipts.map((r) => r.createdAt),
  });

  const handleSubmit = async () => {
    setError(null);
    const trimmed = nickname.trim();

    if (!trimmed) {
      setError("Please enter a display name");
      return;
    }

    if (!/^[a-zA-Z0-9 _-]+$/.test(trimmed)) {
      setError("Only letters, numbers, spaces, hyphens, and underscores");
      return;
    }

    setSubmitting(true);

    try {
      const body: Record<string, unknown> = { nickname: trimmed };

      if (!isAuthenticated) {
        // Include client-computed scores for community submission
        body.ecoScore = previewScore.ecoScore;
        body.totalScans = localReceipts.length;
        body.totalItems = previewScore.totalItems;
        body.lowImpactRatio = previewScore.lowImpactRatio;
        body.avgCarbonPerItem = previewScore.avgCarbonPerItem;
        body.streakWeeks = previewScore.streakWeeks;
      }

      const res = await fetch("/api/v1/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to submit");
        return;
      }

      setOpen(false);
      onSubmitted?.();
    } catch {
      setError("Network error, please try again");
    } finally {
      setSubmitting(false);
    }
  };

  const hasData = isAuthenticated || localReceipts.length > 0;

  const triggerButton = children || (
    <Button variant={isEditing ? "outline" : "default"} className="gap-2">
      {isEditing ? (
        <>
          <Pencil className="h-4 w-4" />
          Edit Display Name
        </>
      ) : (
        <>
          <Trophy className="h-4 w-4" />
          Submit Score
        </>
      )}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Update Display Name" : "Join the Leaderboard"}
          </DialogTitle>
        </DialogHeader>

        {!hasData ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Scan at least one receipt to join the leaderboard.
          </div>
        ) : (
          <div className="space-y-6 py-2">
            {/* Score preview */}
            <div className="flex items-center gap-6">
              <EcoScoreRing
                score={previewScore.ecoScore}
                tier={previewScore.tier}
              />
              <div className="space-y-1">
                <TierBadge tier={previewScore.tier} />
                <p className="text-sm text-muted-foreground">
                  {TIER_CONFIG[previewScore.tier].emoji}{" "}
                  {previewScore.totalItems} items across{" "}
                  {isAuthenticated ? "your" : localReceipts.length} scans
                </p>
                {isAuthenticated && (
                  <p className="text-xs text-muted-foreground">
                    Score updates automatically with each scan
                  </p>
                )}
              </div>
            </div>

            {/* Nickname */}
            <div className="space-y-2">
              <Label htmlFor="lb-nickname">Display Name</Label>
              <Input
                id="lb-nickname"
                placeholder="EcoChampion"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={24}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                {isAuthenticated
                  ? "Your score is verified from your account data"
                  : "Community entries are marked as unverified"}
              </p>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting
                ? "Saving..."
                : isEditing
                ? "Update Name"
                : "Submit Score"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
