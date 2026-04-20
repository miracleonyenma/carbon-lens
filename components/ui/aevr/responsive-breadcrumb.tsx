"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface Crumb {
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  href: string;
  isLast: boolean;
}

interface ResponsiveBreadcrumbProps {
  crumbs: Crumb[];
  className?: string;
}

export function ResponsiveBreadcrumb({
  crumbs,
  className,
}: ResponsiveBreadcrumbProps) {
  if (crumbs.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-1 text-sm", className)}
    >
      {crumbs.map((crumb, i) => {
        const Icon = crumb.icon;
        return (
          <span key={crumb.href} className="flex items-center gap-1">
            {i > 0 && (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
            {crumb.isLast ? (
              <span className="flex items-center gap-1.5 font-medium text-foreground truncate">
                <Icon className="h-4 w-4 shrink-0 sm:hidden" />
                <span className="hidden sm:inline md:hidden">
                  {crumb.shortLabel}
                </span>
                <span className="hidden md:inline">{crumb.label}</span>
                <span className="sm:hidden">{crumb.shortLabel}</span>
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors truncate"
              >
                <Icon className="h-4 w-4 shrink-0 sm:hidden" />
                <span className="hidden sm:inline md:hidden">
                  {crumb.shortLabel}
                </span>
                <span className="hidden md:inline">{crumb.label}</span>
                <span className="sm:hidden">{crumb.shortLabel}</span>
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
