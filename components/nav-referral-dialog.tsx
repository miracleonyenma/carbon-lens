"use client";

import React, { useEffect, useState } from "react";
import ResponsiveDialog from "@/components/ui/aevr/responsive-dialog";
import { InfoBox } from "@/components/ui/aevr/info-box";
import { useAuth } from "@/components/providers/auth-provider";
import { PayIDService } from "@/utils/payid/payid-service";
import { sileo } from "sileo";
import { Button } from "@/components/ui/button";
import {
  TagIcon,
  CopyIcon,
  UsersIcon,
  CheckCircleIcon,
  GiftIcon,
  LinkIcon,
  ZapIcon,
} from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import BucketHamsterIcon from "./Icon/BucketHamster";
import { DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { DrawerDescription, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { usePersistedState } from "@/hooks/aevr/use-persisted-state";
import { formatDate } from "@/utils/aevr/date-formatter";
import useShare from "@/hooks/aevr/use-share";
import { Calligraph } from "calligraph";

interface NavReferralDialogProps {
  // open: boolean;
  // onOpenChange: (open: boolean) => void;
  className?: string;
}

interface ReferredUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  createdAt: string;
}

const REFERRAL_CUTOFF_DATE = new Date("2026-04-01T00:00:00.000Z").getTime();
const POINTS_PER_REFERRAL = 5;
const BONUS_POINTS = 10;

export const useNavReferralDialog = () => {
  const { setState: setNavReferralState, state: navReferralState } =
    usePersistedState<{ open: boolean }>(
      {
        open: false,
      },
      {
        storageKey: "nav-referral-dialog",
        enablePersistence: false,
      },
    );

  return {
    navReferralState,
    setNavReferralState,
  };
};

export function NavReferralDialog(
  {
    // open,
    // onOpenChange,
  }: NavReferralDialogProps,
) {
  const { user, refreshSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingReferrals, setFetchingReferrals] = useState(false);
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [retroactiveCode, setRetroactiveCode] = useState("");
  const { navReferralState, setNavReferralState } = useNavReferralDialog();
  const [pointsInfo, setPointsInfo] = useState({
    points: 0,
    bonusPoints: 0,
    pointsPerReferral: 0,
    totalReferred: 0,
    summary: "",
    endDate: "",
  });
  const { copy } = useShare();

  const hasPayTag = !!user?.payTag;

  const loadReferrals = async () => {
    setFetchingReferrals(true);
    try {
      const response = await fetch("/api/v1/user/referrals");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReferredUsers(data.data);
        }
      }
    } catch (e) {
      console.error("Failed to fetch referrals", e);
    } finally {
      setFetchingReferrals(false);
    }
  };

  const handleGenerateMagicLink = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const payIdService = new PayIDService();
      const response = await payIdService.requestOAuthMagicLink({
        email: user.email,
        shouldCreate: true,
        firstName: user.firstName,
        lastName: user.lastName,
      });

      if (response.success) {
        sileo.success({
          title: "Check your email",
          description: "We sent a secure link to activate your referral code.",
        });
        setNavReferralState({ open: false });
      } else {
        sileo.error({
          title: "Setup Failed",
          description: response.message || "Please try again later.",
        });
      }
    } catch {
      sileo.error({
        title: "An error occurred",
        description: "Could not process your request.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRetroactiveCode = async () => {
    if (!retroactiveCode.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/v1/user/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode: retroactiveCode.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        sileo.success({
          title: "Referral Applied",
          description: `You were referred by ${data.data.referredBy}.`,
        });

        if (user) {
          // Trigger a session refresh to pull the newly set string association
          refreshSession();
        }
        setRetroactiveCode("");
      } else {
        sileo.error({
          title: "Invalid Code",
          description:
            data.message || "That referral code could not be applied.",
        });
      }
    } catch {
      sileo.error({
        title: "Error",
        description: "Could not apply referral code.",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculatePoints: (referredUsers: ReferredUser[]) => {
    points: number;
    bonusPoints: number;
    pointsPerReferral: number;
    totalReferred: number;
    summary: string;
    endDate: string;
  } = (referredUsers) => {
    let points = BONUS_POINTS;
    for (const referredUser of referredUsers) {
      if (new Date(referredUser.createdAt).getTime() < REFERRAL_CUTOFF_DATE) {
        points += POINTS_PER_REFERRAL;
      }
    }
    if (referredUsers.length >= 10) {
      points += BONUS_POINTS;
    }
    if (user?.referredBy) {
      points += POINTS_PER_REFERRAL;
    }
    return {
      points,
      bonusPoints: BONUS_POINTS,
      pointsPerReferral: POINTS_PER_REFERRAL,
      totalReferred: referredUsers.length,
      summary: `You have referred ${referredUsers.length} users. You have earned ${points} points.`,
      endDate: formatDate(REFERRAL_CUTOFF_DATE, {
        formatStyle: "absolute",
      }),
    };
  };

  // Fetch referrals when dialog opens if they have a payTag
  useEffect(() => {
    if (navReferralState.open && hasPayTag) {
      loadReferrals();
    }
  }, [navReferralState.open, hasPayTag]);

  // calculate points after 1s delay after dialog opens
  useEffect(() => {
    if (navReferralState.open) {
      setTimeout(() => {
        setPointsInfo(calculatePoints(referredUsers));
      }, 1000);
    } else {
      setPointsInfo({
        points: 0,
        bonusPoints: 0,
        pointsPerReferral: 0,
        totalReferred: 0,
        summary: "",
        endDate: "",
      });
    }
  }, [navReferralState.open, referredUsers]);

  return (
    <ResponsiveDialog
      openPrompt={navReferralState.open}
      onOpenPromptChange={(v) => setNavReferralState({ open: !!v })}
      title="Refer a Friend"
      description="Invite your friends to Bucket to earn rewards together."
      dialogHeader={(isDesktop) => {
        const Header = isDesktop ? DialogHeader : DrawerHeader;
        const Title = isDesktop ? DialogTitle : DrawerTitle;
        const Description = isDesktop ? DialogDescription : DrawerDescription;

        return (
          <Header className="banner p-2">
            <div className="wrapper banner rounded-sm grid grid-cols-5 p-4 dark:bg-app-theme-950/50 bg-app-theme-100/80 w-full min-h-20">
              <div className="col-span-3 flex flex-col text-left gap-2">
                <div>
                  <Title className="text-foreground text-3xl">
                    Refer a Friend
                  </Title>

                  <Description className="text-foreground/60">
                    Invite your friends to Bucket to earn rewards together.
                  </Description>
                </div>
                <div className="flex gap-1 dark:bg-app-theme-950 border text-app-theme-50 border-app-theme-700 dark:border-app-theme-900/70 bg-app-theme-600 w-fit rounded-xl pl-3 p-1 items-center">
                  <span className="truncate font-mono font-bold">
                    <Calligraph>{user?.payTag || "- - - - - - "}</Calligraph>
                  </span>
                  <Button
                    className="p-2! h-fit rounded-2xl bg-app-theme-100 hover:bg-app-theme-100/80 text-app-theme-600"
                    onClick={() => user?.payTag && copy(user.payTag)}
                  >
                    <CopyIcon className="h-3! w-3!" strokeWidth={3} />
                  </Button>
                </div>
              </div>
              <div className="col-span-2 h-32">
                <BucketHamsterIcon className="h-44" palette="violet" />
              </div>
            </div>
          </Header>
        );
      }}
    >
      <div className="flex flex-col gap-6 px-4 pb-4">
        {/* If the user doesn't have a paytag, they can't refer anyone yet */}
        {!hasPayTag ? (
          <>
            <InfoBox
              type="warning"
              icon={<GiftIcon className="h-6 w-6 text-yellow-500" />}
              title="Setup your Referral Code"
              description="You need to link a PayID account before you can receive a referral code. Click below to securely generate one right now."
              actions={[
                {
                  name: loading ? "Generating..." : "Generate Referral Code",
                  onClick: handleGenerateMagicLink,
                  variant: "default",
                  disabled: loading,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any,
              ]}
            />
            {user?.referredBy && (
              <div className="flex items-center gap-2 rounded-xl border bg-green-50/50 p-4 text-green-700 dark:border-green-900/30 dark:bg-green-950/20 dark:text-green-400 mx-0">
                <CheckCircleIcon className="h-5 w-5" />
                <span className="text-sm font-medium">
                  You were referred by <strong>{user?.referredBy}</strong>
                </span>
              </div>
            )}
          </>
        ) : (
          /* If they DO have a PayTag, show the active dashboard */
          <div className="flex flex-col gap-4">
            <div className="points-info flex flex-col gap-4 justify-between sm:flex-row-reverse -mx-4 px-4">
              <div className="flex flex-col gap-1 items-center justify-center">
                <span className="text-8xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
                  <Calligraph>{pointsInfo.points}</Calligraph>
                </span>
                <span className="text-sm sm:text-xs sm:text-right font-medium text-muted-foreground uppercase tracking-wider">
                  Total Points
                </span>
              </div>

              {/* How it works section */}
              <div className="flex flex-col gap-4">
                <span className="text-sm text-muted-foreground">
                  How it works:
                </span>
                <ul className="flex flex-col gap-2 text-sm font-medium">
                  <li className="flex items-center gap-3">
                    <ZapIcon className="h-5 w-5 text-foreground" />
                    <span>Share your invite link</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <GiftIcon className="h-5 w-5 text-foreground" />
                    <span>
                      Your friend gets{" "}
                      <strong className="font-bold">
                        <Calligraph>{pointsInfo.bonusPoints}</Calligraph>{" "}
                        credits
                      </strong>{" "}
                      when they subscribe
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <UsersIcon className="h-5 w-5 text-foreground" />
                    <span>
                      You receive{" "}
                      <strong className="font-bold">
                        <Calligraph>{pointsInfo.pointsPerReferral}</Calligraph>{" "}
                        credits
                      </strong>{" "}
                      for each referral
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Invite Link */}
            <div className="flex flex-col gap-2   border-t border-dashed pt-2 -mx-4 px-4">
              <span className="text-sm text-muted-foreground">
                Your invite link:
              </span>
              <InputGroup>
                <InputGroupAddon className="text-muted-foreground pl-3">
                  <LinkIcon className="h-4 w-4" />
                </InputGroupAddon>
                <InputGroupInput
                  readOnly
                  value={`${typeof window !== "undefined" ? window.location.host : "bucket.app"}/r/${user.payTag}`}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    onClick={() =>
                      copy(
                        `${typeof window !== "undefined" ? window.location.origin : "https://bucket.app"}/r/${user.payTag}`,
                      )
                    }
                  >
                    Copy Link
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </div>

            {/* Retroactive Referral Submission (If they weren't referred) */}
            {!user.referredBy && (
              <div className="flex flex-col gap-2  -mx-4 px-4">
                <span className="text-sm font-medium">Were you referred?</span>
                <InputGroup>
                  <InputGroupAddon className="text-muted-foreground pl-3">
                    <TagIcon className="h-4 w-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    type="text"
                    placeholder="Enter a friend's PayTag code"
                    value={retroactiveCode}
                    onChange={(e) => setRetroactiveCode(e.target.value)}
                    disabled={loading}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      onClick={handleSubmitRetroactiveCode}
                      disabled={!retroactiveCode.trim() || loading}
                      variant="secondary"
                    >
                      Submit
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              </div>
            )}

            {/* Readonly Referenced By */}
            {user?.referredBy && (
              <div className="flex items-center gap-2 rounded-xl border bg-green-50/50 p-4 text-green-700 dark:border-green-900/30 dark:bg-green-950/20 dark:text-green-400 mx-0">
                <CheckCircleIcon className="h-5 w-5" />
                <span className="text-sm font-medium">
                  You were referred by <strong>{user?.referredBy}</strong>
                </span>
              </div>
            )}

            {/* Who I Referred List */}
            <div className="flex flex-col gap-4 border-t -mx-4 px-4">
              {fetchingReferrals ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : referredUsers.length === 0 ? (
                <div className="pt-4 text-center text-sm text-muted-foreground">
                  You haven&apos;t referred anyone yet. Share your code to get
                  started!
                </div>
              ) : (
                <div className="flex max-h-48 flex-col gap-2 overflow-y-auto pt-4">
                  {referredUsers.map((rUser) => (
                    <div
                      key={rUser._id}
                      className="flex items-center justify-between rounded-lg border bg-card p-3 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                          {rUser.firstName?.charAt(0) || rUser.email.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {rUser.firstName} {rUser.lastName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Joined{" "}
                            {new Date(rUser.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ResponsiveDialog>
  );
}
