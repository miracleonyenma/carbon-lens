"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { useAuth } from "@/components/providers/auth-provider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  NavReferralDialog,
  useNavReferralDialog,
} from "@/components/nav-referral-dialog";
import {
  BadgeCheckIcon,
  BellIcon,
  ChevronsUpDownIcon,
  CreditCardIcon,
  LogOutIcon,
  GiftIcon,
  CopyIcon,
} from "lucide-react";
import { Calligraph } from "calligraph";
import { Button } from "./ui/button";
import useShare from "@/hooks/aevr/use-share";

interface NavUserProps {
  variant?: "sidebar" | "header";
  className?: string;
}

export function NavUser({ variant = "sidebar", className }: NavUserProps) {
  const { isMobile } = useSidebar();
  const { user, isLoading, logout } = useAuth();
  const { copy } = useShare();
  const { navReferralState, setNavReferralState } = useNavReferralDialog();

  if (isLoading) {
    if (variant === "header") {
      return <Skeleton className="h-8 w-8 rounded-full" />;
    }
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="rounded-full">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="grid flex-1 gap-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="ml-auto size-4" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Fallback if no user - usually this component should be protected or hidden
  // but for safety we show a placeholder or nothing
  if (!user) {
    return null;
  }

  // Use name/email from real user data. Avatar falls back to initials
  const displayName = user.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : user.email;
  const displayEmail = user.email;
  const avatarSrc = user.picture || "";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleReferralBoxOpen = () => {
    setNavReferralState({ open: true });
  };

  const dropdownContent = (
    <DropdownMenuContent
      className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
      side={
        variant === "sidebar" && isMobile
          ? "bottom"
          : variant === "sidebar"
            ? "right"
            : "bottom"
      }
      align="end"
      sideOffset={4}
    >
      <DropdownMenuLabel className="p-0 font-normal">
        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src={avatarSrc} alt={displayName} />
            <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{displayName}</span>
            <span className="truncate text-xs">{displayEmail}</span>
            {user.payTag && (
              <div className="flex gap-2 justify-between items-center">
                <span className="truncate text-xs">{user.payTag}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                  onClick={() => copy(user.payTag!)}
                >
                  <CopyIcon className="h-3! w-3!" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          onClick={handleReferralBoxOpen}
          className="cursor-pointer"
        >
          <GiftIcon />
          <span>
            <Calligraph>
              {user.payTag ? "My Referrals" : "Get Referral Code"}
            </Calligraph>
          </span>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem>
          <BadgeCheckIcon />
          Account
        </DropdownMenuItem>
        <DropdownMenuItem>
          <CreditCardIcon />
          Billing
        </DropdownMenuItem>
        <DropdownMenuItem>
          <BellIcon />
          Notifications
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={logout}>
        <LogOutIcon />
        Log out
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

  if (variant === "header") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger className={className} asChild>
          <button className="ring-ring flex h-8 w-8 items-center justify-center rounded-full outline-hidden hover:opacity-80 focus-visible:ring-2">
            <Avatar className="h-8 w-8 rounded-full">
              <AvatarImage src={avatarSrc} alt={displayName} />
              <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        {dropdownContent}
      </DropdownMenu>
    );
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem className="shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className={`data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground rounded-full group-data-[collapsible=icon]:h-12! group-data-[collapsible=icon]:w-12! ${className || ""}`}
              >
                <Avatar className="h-8 w-8 rounded-full group-data-[collapsible=icon]:h-11 group-data-[collapsible=icon]:w-11">
                  <AvatarImage src={avatarSrc} alt={displayName} />
                  <AvatarFallback className="rounded-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-xs">{displayEmail}</span>
                </div>
                <ChevronsUpDownIcon className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            {dropdownContent}
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <NavReferralDialog />
    </>
  );
}
