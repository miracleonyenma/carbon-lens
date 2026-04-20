"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  SearchIcon,
  BarChart3,
  ScanLine,
  Clock,
  Camera,
  Leaf,
} from "lucide-react";

interface SearchCommandProps {
  variant?: "header" | "large";
}

const data = [
  {
    title: "Dashboard",
    description: "View your carbon footprint overview and trends",
    icon: BarChart3,
    url: "/dashboard",
  },
  {
    title: "Scan",
    description: "Upload a receipt or photo to analyze carbon footprint",
    icon: ScanLine,
    url: "/dashboard/scan",
  },
  {
    title: "Live Camera",
    description: "Real-time carbon detection using your camera",
    icon: Camera,
    url: "/dashboard/live",
  },
  {
    title: "History",
    description: "View all past scans and their carbon impact",
    icon: Clock,
    url: "/dashboard/history",
  },
];

export function SearchCommand({ variant = "header" }: SearchCommandProps) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  const quickActions = [
    {
      title: "Scan Receipt",
      description: "Upload a receipt or photo",
      icon: ScanLine,
      href: "/dashboard/scan",
    },
    {
      title: "Open Camera",
      description: "Live carbon detection",
      icon: Camera,
      href: "/dashboard/live",
    },
  ];

  return (
    <>
      {variant === "large" ? (
        <button
          onClick={() => setOpen(true)}
          className="group  bg-neutral-100 dark:bg-muted text-muted-foreground hover:bg-muted focus-visible:bg-background focus-visible:ring-primary relative mx-auto flex h-12 w-full max-w-2xl items-center justify-start rounded-full px-4 pl-12 text-base font-medium transition-colors focus-visible:ring-1 focus-visible:outline-hidden"
        >
          <div className="text-muted-foreground group-focus-within:text-primary absolute top-1/2 left-4 -translate-y-1/2 transition-colors">
            <SearchIcon className="h-5 w-5" />
          </div>
          Search Carbon Lens
          <kbd className="bg-muted pointer-events-none absolute top-1/2 right-4 hidden h-6 -translate-y-1/2 items-center gap-1 rounded border px-2 font-mono text-[11px] font-medium opacity-100 select-none sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="group bg-neutral-100 dark:bg-muted  text-muted-foreground hover:bg-muted focus-visible:bg-background focus-visible:ring-primary relative flex h-9 w-full items-center justify-start rounded-full px-4 text-sm font-medium transition-colors focus-visible:ring-1 focus-visible:outline-hidden sm:w-64 lg:w-80"
        >
          <SearchIcon className="mr-2 h-4 w-4" />
          <span className="hidden lg:inline-flex">Search Carbon Lens</span>
          <span className="lg:hidden">Search...</span>
          <kbd className="bg-neutral-50 dark:bg-muted pointer-events-none absolute top-1/2 right-2 hidden h-5 -translate-y-1/2 items-center gap-1 rounded-lg border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      )}

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {data.map((item) => (
              <CommandItem
                key={item.url}
                value={item.title}
                onSelect={() => {
                  runCommand(() => router.push(item.url));
                }}
              >
                <div className="text-muted-foreground mr-2 flex h-6 w-6 items-center justify-center">
                  <item.icon className="h-4 w-4" />
                </div>
                <span>{item.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Quick Actions">
            {quickActions.map((action) => (
              <CommandItem
                key={action.href}
                value={action.title}
                onSelect={() => {
                  runCommand(() => router.push(action.href));
                }}
              >
                <div className="text-muted-foreground mr-2 flex h-6 w-6 items-center justify-center">
                  <action.icon className="h-4 w-4" />
                </div>
                <span>{action.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
