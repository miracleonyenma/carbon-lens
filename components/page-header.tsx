"use client";

import { motion, AnimatePresence } from "motion/react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavUser } from "@/components/nav-user";
import { BlurredBackground } from "@/components/ui/aevr/blurred-background";
import { SearchCommand } from "@/components/search-command";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title?: string;
  children?: React.ReactNode;
  className?: string;
  options?: {
    showSidebarTrigger?: boolean;
    showThemeToggle?: boolean;
    showNavUser?: boolean;
    showSearch?: boolean;
  };
}

export function PageHeader({
  title,
  children,
  className,
  options = {
    showSidebarTrigger: false,
    showThemeToggle: true,
    showNavUser: true,
    showSearch: true,
  },
}: PageHeaderProps) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "sticky top-0 z-10 flex min-h-16 shrink-0 items-center gap-2 px-4",
        className,
      )}
    >
      {/* Semi-transparent tint behind the blur */}
      <div className="pointer-events-none absolute inset-0 -z-20 mask-[linear-gradient(to_bottom,black_60%,transparent_100%)]" />
      <BlurredBackground className="h-[150%]" />

      <AnimatePresence mode="popLayout">
        {options?.showSidebarTrigger && (
          <motion.div
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <SidebarTrigger className="-ml-1 hidden md:flex" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="popLayout">
        {title && (
          <motion.h1
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="text-xl font-bold"
          >
            {title}
          </motion.h1>
        )}
      </AnimatePresence>

      <motion.div
        layout
        className="ml-auto flex flex-1 items-center justify-end gap-2 sm:gap-4 md:flex-initial"
      >
        <AnimatePresence mode="popLayout">
          {options?.showSearch && (
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
    </motion.header>
  );
}
