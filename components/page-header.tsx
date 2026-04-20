// ./apps/web/components/page-header.tsx

"use client";

import { motion, AnimatePresence } from "motion/react";
// import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavUser } from "@/components/nav-user";
import { BlurredBackground } from "@/components/ui/aevr/blurred-background";
import { SearchCommand } from "@/components/search-command";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Link from "next/link";
import React from "react";
import {
  BookmarkIcon,
  BriefcaseIcon,
  CreditCardIcon,
  HomeIcon,
  PaletteIcon,
  BellIcon,
  SettingsIcon,
  UserIcon,
  MonitorSmartphoneIcon,
  LinkIcon,
  InfoIcon,
  NewspaperIcon,
  UsersIcon,
  WalletIcon,
  UserPlusIcon,
  type LucideIcon,
} from "lucide-react";
import { NavReferralDialog } from "@/components/nav-referral-dialog";
import { TeamSwitcher } from "@/components/team-switcher";
import { ResponsiveBreadcrumb } from "./ui/aevr/responsive-breadcrumb";

// ── Segment config ──────────────────────────────────────────────────────────

type SegmentConfig = {
  label: string;
  shortLabel: string; // displayed on sm screens (truncated)
  icon: LucideIcon; // displayed on xs screens
};

const SEGMENTS: Record<string, SegmentConfig> = {
  dashboard: {
    label: "Home",
    shortLabel: "Home",
    icon: HomeIcon,
  },
  admin: {
    label: "Platform Admin",
    shortLabel: "Admin",
    icon: SettingsIcon,
  },
  plans: {
    label: "Plans",
    shortLabel: "Plans",
    icon: CreditCardIcon,
  },
  teams: {
    label: "Teams",
    shortLabel: "Teams",
    icon: UsersIcon,
  },
  users: {
    label: "Users",
    shortLabel: "Users",
    icon: UserIcon,
  },
  wallet: {
    label: "Wallet",
    shortLabel: "Wallet",
    icon: WalletIcon,
  },
  settings: {
    label: "Settings",
    shortLabel: "Settings",
    icon: SettingsIcon,
  },
  account: {
    label: "Account",
    shortLabel: "Account",
    icon: UserIcon,
  },
  appearance: {
    label: "Appearance",
    shortLabel: "Theme",
    icon: PaletteIcon,
  },
  notifications: {
    label: "Notifications",
    shortLabel: "Alerts",
    icon: BellIcon,
  },
  claim: {
    label: "Claim Rewards",
    shortLabel: "Claim",
    icon: BriefcaseIcon,
  },
  wallets: {
    label: "Wallet Manager",
    shortLabel: "Wallets",
    icon: WalletIcon,
  },
  new: {
    label: "New Team",
    shortLabel: "New",
    icon: UserPlusIcon,
  },
  join: {
    label: "Join Team",
    shortLabel: "Join",
    icon: LinkIcon,
  },
  profile: {
    label: "Profile",
    shortLabel: "Profile",
    icon: UserIcon,
  },
  devices: {
    label: "Connected Devices",
    shortLabel: "Devices",
    icon: MonitorSmartphoneIcon,
  },
  connect: {
    label: "Connect Device",
    shortLabel: "Connect",
    icon: LinkIcon,
  },
  about: {
    label: "About",
    shortLabel: "About",
    icon: InfoIcon,
  },
  catchup: {
    label: "AI Catch Up",
    shortLabel: "Catch Up",
    icon: NewspaperIcon,
  },
};

function fallbackConfig(seg: string): SegmentConfig {
  const label = seg
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return { label, shortLabel: label, icon: BookmarkIcon };
}

// ── Build crumbs ─────────────────────────────────────────────────────────────

// Single-char or known structural-only segments that add no value as crumbs
const SKIP_SEGMENTS = new Set(["b", "f"]);

// Looks like a MongoDB ObjectId or UUID — show truncated form
function isDynamicId(seg: string) {
  return /^[a-f0-9]{16,}$/i.test(seg) || /^[0-9a-f-]{32,}$/i.test(seg);
}

function buildCrumbs(pathname: string) {
  const segments = pathname.replace(/^\//, "").split("/").filter(Boolean);
  let accumulated = "";
  const crumbs = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    accumulated += `/${seg}`;

    // Skip structural noise segments
    if (SKIP_SEGMENTS.has(seg)) continue;

    const config = SEGMENTS[seg] ?? fallbackConfig(seg);

    // For dynamic IDs, shorten the label
    const label = isDynamicId(seg) ? seg.slice(0, 8) + "…" : config.label;
    const shortLabel = isDynamicId(seg)
      ? seg.slice(0, 6) + "…"
      : config.shortLabel;

    crumbs.push({
      ...config,
      label,
      shortLabel,
      href: accumulated,
      isLast: false, // set below
    });
  }

  // Mark last
  for (let i = 0; i < crumbs.length; i++) {
    crumbs[i].isLast = i === crumbs.length - 1;
  }

  return crumbs;
}

// ── Types ────────────────────────────────────────────────────────────────────

type HideOptions = {
  showPaths?: string[];
  hidePaths?: string[];
};

interface PageHeaderProps {
  title?: string;
  children?: React.ReactNode;
  className?: string;
  options?: {
    showLogo?: boolean;
    logoPath?: string;
    showTeamSwitcher?: boolean;
    showSidebarTrigger?: boolean;
    showThemeToggle?: boolean;
    showNavUser?: boolean;
    showSearch?: boolean | HideOptions;
    showBreadcrumbs?: boolean;
  };
}

// ── Component ────────────────────────────────────────────────────────────────

export function PageHeader({
  title,
  children,
  className,
  options = {
    logoPath: "/",
    showLogo: true,
    showSidebarTrigger: false,
    showThemeToggle: true,
    showNavUser: true,
    showSearch: true,
    showBreadcrumbs: true,
  },
}: PageHeaderProps) {
  const pathname = usePathname();

  const shouldShowSearch = () => {
    if (typeof options?.showSearch === "boolean") return options.showSearch;
    return (
      options?.showSearch?.showPaths?.includes(pathname) ||
      options?.showSearch?.hidePaths?.includes(pathname) === false
    );
  };

  const crumbs = buildCrumbs(pathname);
  const showBreadcrumbs =
    options?.showBreadcrumbs !== false && crumbs.length > 0;

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={cn("sticky top-0 z-50 px-4", className)}
      >
        {/* Backdrop */}
        <div className="bg-background pointer-events-none absolute inset-0 -z-20 mask-[linear-gradient(to_bottom,rgba(0,0,0,0.35)_0%,transparent_100%)]" />
        <BlurredBackground className="h-[150%]" />

        <div className="wrapper mx-auto flex min-h-16 max-w-5xl shrink-0 items-center gap-2 lg:py-6">
          {/* Logo / Team Switcher */}
          <AnimatePresence mode="sync">
            {options?.showTeamSwitcher ? (
              <motion.div
                key="team-switcher"
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="-ml-2 shrink-0"
              >
                <TeamSwitcher teams={[]} />
              </motion.div>
            ) : options?.showLogo ? (
              <motion.div
                key="logo"
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="mr-2 shrink-0"
              >
                <Link href={options?.logoPath || "/"}>
                  <Image
                    src="/img/android-chrome-512x512.png"
                    alt="Logo"
                    width={32}
                    height={32}
                  />
                </Link>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Sidebar trigger */}
          <AnimatePresence mode="popLayout">
            {options?.showSidebarTrigger && (
              <motion.div
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* <SidebarTrigger className="-ml-1 hidden md:flex" /> */}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Breadcrumbs / title */}
          <AnimatePresence mode="popLayout">
            {showBreadcrumbs ? (
              <motion.div
                key="breadcrumbs"
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="min-w-0 flex-1 md:flex-initial"
              >
                <ResponsiveBreadcrumb crumbs={crumbs} />
              </motion.div>
            ) : (
              title && (
                <motion.h1
                  key="title"
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="truncate text-xl font-bold"
                >
                  {title}
                </motion.h1>
              )
            )}
          </AnimatePresence>

          {/* Right-side actions */}
          <motion.div
            layout
            className="ml-auto flex flex-1 items-center justify-end gap-2 sm:gap-4 md:flex-initial"
          >
            <AnimatePresence mode="popLayout">
              {shouldShowSearch() && (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="grow"
                >
                  <SearchCommand variant="header" />
                </motion.div>
              )}
            </AnimatePresence>

            {children}

            <AnimatePresence mode="popLayout">
              {options?.showThemeToggle && (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center"
                >
                  <ThemeToggle />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="popLayout">
              {options?.showNavUser && (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <NavUser variant="header" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.header>
      <NavReferralDialog />
    </>
  );
}
