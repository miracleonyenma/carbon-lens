"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Leaf } from "lucide-react";
import * as React from "react";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", external: false },
  { href: "/dashboard/scan", label: "Scan", external: false },
  { href: "/dashboard/climate", label: "Climate Stats", external: false },
];

const DATA_SOURCES = [
  {
    href: "https://gml.noaa.gov/ccgg/trends/",
    label: "NOAA GML",
    description: "CO₂",
  },
  {
    href: "https://data.giss.nasa.gov/gistemp/",
    label: "NASA GISS",
    description: "Temperature",
  },
  {
    href: "https://www.iea.org/data-and-statistics",
    label: "IEA · IRENA",
    description: "Renewables",
  },
  {
    href: "https://climate.nasa.gov/vital-signs/ice-sheets/",
    label: "NASA GRACE-FO",
    description: "Ice loss",
  },
  {
    href: "https://www.globalforestwatch.org/",
    label: "Global Forest Watch",
    description: "Forest loss",
  },
  {
    href: "https://www.iucnredlist.org/",
    label: "IUCN Red List",
    description: "Species",
  },
  {
    href: "https://www.oecd.org/en/topics/plastics.html",
    label: "OECD · UNEP",
    description: "Plastics",
  },
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
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
        {/* Brand */}
        <div className="flex flex-col items-start gap-1">
          <Link href="/" className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold tracking-tight">
              Carbon Lens
            </span>
          </Link>
          <span className="text-muted-foreground text-xs max-w-48">
            AI-powered carbon footprint tracking for everyday purchases.
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            App
          </span>
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Data sources */}
        <nav className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Data Sources
          </span>
          {DATA_SOURCES.map(({ href, label, description }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              title={description}
            >
              {label}{" "}
              <span className="text-muted-foreground/60 text-xs">
                ({description})
              </span>
            </a>
          ))}
        </nav>
      </div>

      {/* Bottom bar */}
      <div className="border-border/20 mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
        <div>
          <span className="text-muted-foreground text-xs">
            &copy; {new Date().getFullYear()} Carbon Lens · Powered by{" "}
            <a
              href="https://ai.google.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground underline underline-offset-2 transition-colors"
            >
              Google Gemini
            </a>
          </span>
          <p className="text-muted-foreground text-xs">
            Carbon estimates are AI-generated approximations, not precise
            lifecycle assessments.
          </p>
        </div>
        <ThemeToggle />
      </div>
    </motion.footer>
  );
}
