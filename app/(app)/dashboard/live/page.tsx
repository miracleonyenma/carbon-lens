"use client";

import { LiveCamera } from "@/components/carbon/live-camera";
import { ApiKeyDialog } from "@/components/carbon/api-key-dialog";
import { Camera, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LiveCameraPage() {
  return (
    <div className="flex mx-auto max-w-5xl w-full flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
          <Camera className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Live Camera</h1>
          <p className="text-sm text-muted-foreground">
            Point your camera at any item to instantly estimate its carbon
            footprint
          </p>
        </div>
        <ApiKeyDialog>
          <Button variant="ghost" size="icon" className="shrink-0">
            <Settings className="h-4 w-4" />
          </Button>
        </ApiKeyDialog>
      </div>

      <LiveCamera />
    </div>
  );
}
