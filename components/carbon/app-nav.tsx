"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ScanLine, Clock, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/dashboard/scan", label: "Scan", icon: ScanLine },
  { href: "/dashboard/history", label: "History", icon: Clock },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b px-4">
      <div className="mx-auto flex max-w-6xl items-center gap-1">
        <Link
          href="/dashboard"
          className="mr-4 flex items-center gap-2 py-3 font-bold"
        >
          <Leaf className="h-5 w-5 text-primary" />
          <span className="hidden sm:inline">Carbon Lens</span>
        </Link>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
