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
import { SearchIcon, UserIcon } from "lucide-react";

interface SearchCommandProps {
  variant?: "header" | "large";
}

const data = [
  {
    title: "Personal info",
    description: "Update your name, email, and contact information",
    icon: UserIcon,
    url: "/dashboard/personal-info",
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
      title: "Personal info",
      description: "Update your name, email, and contact information",
      icon: UserIcon,
      href: "/dashboard/personal-info",
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
          Search Bucket
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
          <span className="hidden lg:inline-flex">Search Bucket</span>
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
