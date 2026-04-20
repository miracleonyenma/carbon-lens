"use client";

import { Toaster } from "sileo";
import { useTheme } from "next-themes";

interface ThemedToasterProps {
  position?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
  offset?:
    | number
    | string
    | { top?: number; right?: number; bottom?: number; left?: number };
}

/**
 * Theme-aware Toaster component that adapts to light/dark mode
 * Uses CSS variables from globals.css for consistent styling
 */
export function ThemedToaster({
  position = "top-right",
  offset = 16,
}: ThemedToasterProps) {
  const { resolvedTheme } = useTheme();

  // Get computed CSS variable values
  const isDark = resolvedTheme === "dark";

  return (
    <Toaster
      position={position}
      offset={offset}
      options={{
        styles: {
          description: isDark ? "text-black/60!" : "",
        },
      }}
    />
  );
}
