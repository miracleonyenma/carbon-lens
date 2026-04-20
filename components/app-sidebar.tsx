"use client";

import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { HomeIcon, PaintBucketIcon } from "lucide-react";

// This is sample data.
export const data = {
  teams: [
    {
      name: "Bucket",
      logo: <PaintBucketIcon strokeWidth={2} />,
      plan: "Production",
    },
  ],
  navMain: [
    {
      title: "Home",
      url: "/dashboard",
      icon: <HomeIcon strokeWidth={2} />,
      iconColor: "text-blue-600 dark:text-blue-400",
      activeIconColor: "text-blue-100 dark:text-blue-100",
      bgColor: "bg-blue-100 dark:bg-blue-900/40",
      activeBgColor: "bg-blue-600! dark:bg-blue-900/40",
    },
  ],
  projects: [],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="p-1">
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail className="bg-accent dark:bg-background" />
    </Sidebar>
  );
}
