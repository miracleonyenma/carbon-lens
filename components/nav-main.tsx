"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: React.ReactNode;
    isActive?: boolean;
    iconColor?: string;
    bgColor?: string;
    activeIconColor?: string;
    activeBgColor?: string;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = pathname === item.url;
          return (
            <SidebarMenuItem key={item.title}>
              {item.items && item.items.length > 0 ? (
                <Collapsible
                  asChild
                  defaultOpen={item.isActive}
                  className="group/collapsible"
                >
                  <div>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        className="group/button h-12 rounded-full p-0 group-data-[collapsible=icon]:size-12! group-data-[collapsible=icon]:p-0! hover:bg-transparent hover:text-inherit data-[active=true]:bg-transparent data-[active=true]:text-inherit"
                        isActive={isActive}
                      >
                        <div
                          className={`flex h-12 min-w-12 items-center justify-center rounded-full transition-colors ${
                            item.bgColor || "bg-blue-100 dark:bg-blue-900/40"
                          }`}
                        >
                          <span
                            className={`flex items-center justify-center ${
                              item.iconColor ||
                              "text-blue-600 dark:text-blue-400"
                            }`}
                          >
                            {item.icon}
                          </span>
                        </div>
                        <span className="font-medium group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                        <ArrowRightIcon
                          strokeWidth={2}
                          className="mr-3 ml-auto transition-transform duration-200 group-data-[collapsible=icon]:hidden group-data-[state=open]/collapsible:rotate-90"
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              className="rounded-full"
                              isActive={pathname === subItem.url}
                            >
                              <Link href={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ) : (
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  className={`group/button h-12 overflow-hidden rounded-full p-0 pl-1! group-data-[collapsible=icon]:size-12! group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:pl-1! hover:bg-transparent hover:text-inherit data-[active=true]:bg-transparent data-[active=true]:text-inherit ${
                    isActive ? "dark:bg-muted! bg-white!" : ""
                  }`}
                  isActive={isActive}
                >
                  <Link href={item.url} className="flex w-full items-center">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
                        isActive
                          ? item.activeBgColor
                          : item.bgColor || "bg-blue-100 dark:bg-blue-900/40"
                      }`}
                    >
                      <span
                        className={`flex items-center justify-center ${
                          isActive
                            ? item.activeIconColor
                            : item.iconColor ||
                              "text-blue-600 dark:text-blue-400"
                        }`}
                      >
                        {item.icon}
                      </span>
                    </div>
                    <span
                      className={`font-medium whitespace-nowrap group-data-[collapsible=icon]:hidden ${"text-foreground"}`}
                    >
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
