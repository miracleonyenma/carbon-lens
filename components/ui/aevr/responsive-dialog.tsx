"use client";

import React, { ReactNode, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/aevr/use-media-query";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface ResponsiveDialogProps {
  title?: string | null;
  description?: string | null;
  dialogHeader?: ReactNode | ((isDesktop: boolean) => ReactNode);
  drawerClose?: ReactNode;
  trigger?: ReactNode;
  children?: ReactNode;
  openPrompt?: boolean;
  onOpenPromptChange?: (open?: boolean) => void;
}

const ResponsiveDialog: React.FC<ResponsiveDialogProps> = ({
  children,
  trigger,
  openPrompt,
  title,
  description,
  dialogHeader,
  drawerClose,
  onOpenPromptChange,
}) => {
  const [internalOpen, setInternalOpen] = useState(openPrompt || false);
  const isControlled = openPrompt !== undefined;
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const dialogOpen = isControlled ? openPrompt : internalOpen;

  const headerContent =
    typeof dialogHeader === "function" ? dialogHeader(isDesktop) : dialogHeader;

  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    if (onOpenPromptChange) {
      onOpenPromptChange(newOpen);
    }
  };

  if (isDesktop) {
    return (
      <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent
          className={`max-h-[90vh] p-0 max-w-4xl ${
            title != null || description != null ? "" : "gap-0"
          }`}
        >
          {headerContent ? (
            headerContent
          ) : (
            <DialogHeader className="p-4">
              {title != null && (
                <DialogTitle>{title || "Heads Up!"}</DialogTitle>
              )}
              {description != null && (
                <DialogDescription>
                  {description ||
                    "Here's some important information or action you need to review and take"}
                </DialogDescription>
              )}
            </DialogHeader>
          )}
          <ScrollArea className="max-h-[calc(90vh-5.35rem)]">
            {children}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer
      shouldScaleBackground
      open={dialogOpen}
      onOpenChange={handleOpenChange}
    >
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent className="max-h-[95%]">
        <div className="wrapper overflow-y-auto -mt-6 overflow-x-clip">
          {headerContent ? (
            headerContent
          ) : (
            <DrawerHeader
              className={`text-left ${
                title != null || description != null ? "p-6" : "p-0"
              }`}
            >
              {title != null && (
                <DrawerTitle>{title || "Heads Up!"}</DrawerTitle>
              )}
              {description != null && (
                <DrawerDescription>
                  {description ||
                    "Here's some important information or action you need to review and take"}
                </DrawerDescription>
              )}
            </DrawerHeader>
          )}
          <div className="px-4 -mx-4">{children}</div>
          {drawerClose && (
            <DrawerFooter className="flex flex-row gap-4">
              <DrawerClose asChild>{drawerClose}</DrawerClose>
            </DrawerFooter>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ResponsiveDialog;
