"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import {
  NavReferralDialog,
  useNavReferralDialog,
} from "@/components/nav-referral-dialog";
import { usePathname } from "next/navigation";

export function OnboardingReferralCatch() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const { navReferralState, setNavReferralState } = useNavReferralDialog();

  useEffect(() => {
    // Only process this logic once auth is loaded and user exists
    if (isLoading || !user) return;

    // Check if the user is completely unassociated (no payTag, no referredBy)
    // This typically means they are a brand new user who just signed up via OTP/MagicLink/PayID
    // and skipped the standard /register form which asks for a referral code.
    const isNewAndUnlinked = !user.payTag && !user.referredBy;

    if (isNewAndUnlinked) {
      // Small timeout to let the primary page layout render smoothly before intercepting
      const timer = setTimeout(() => {
        setNavReferralState({ open: true });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading, pathname]);

  if (!user || (!user.payTag && !user.referredBy && !navReferralState.open)) {
    return null;
  }

  return <NavReferralDialog />;
}
