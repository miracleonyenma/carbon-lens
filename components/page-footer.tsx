"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import * as React from "react";

const NAV_LINKS = [
  { href: "/guides", label: "Guides", external: false },
  { href: "/api/v1/docs", label: "API Reference", external: false },
  { href: "/api/v1/openapi.json", label: "OpenAPI JSON", external: false },
  { href: "/terms", label: "Terms", external: false },
  { href: "/privacy", label: "Privacy", external: false },
  { href: "/legal", label: "Legal", external: false },
];

interface PageFooterProps {
  className?: string;
  children?: React.ReactNode;
}

export function PageFooter({ className, children }: PageFooterProps) {
  return (
    <motion.footer
      data-site-footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn("border-border/40 mt-auto border-t", className)}
    >
      {children}
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-baseline-last sm:justify-between">
        {/* Brand */}
        <div className="flex flex-col items-start gap-1">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/img/android-chrome-512x512.png"
              alt={`${process.env.NEXT_PUBLIC_APP_NAME || "Spindle"} logo`}
              width={28}
              height={28}
            />
            <span className="text-sm font-semibold tracking-tight">
              {process.env.NEXT_PUBLIC_APP_NAME || "Spindle"}
            </span>
          </Link>
          <span className="text-muted-foreground hidden text-xs sm:inline">
            Get structured web data.
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex flex-wrap items-center gap-4">
          {NAV_LINKS.map(({ href, label, external }) => (
            <Link
              key={href}
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Sitewide disclaimer */}
      <div className="border-border/20 mx-auto flex w-full max-w-4xl items-center justify-between gap-3 border-t px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-xs">
            &copy; {new Date().getFullYear()} {process.env.NEXT_PUBLIC_APP_NAME}
          </span>
        </div>
        <p className="text-muted-foreground mx-auto max-w-4xl text-center text-xs">
          Built with love by the community. Ready for your next big thing.{" "}
          <Link
            href="/legal"
            className="hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Legal
          </Link>
        </p>

        <ThemeToggle />
      </div>
    </motion.footer>
  );
}
