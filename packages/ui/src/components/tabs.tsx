"use client";

import { Tabs as TabsPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "../lib/utils";
import { NumberDot } from "./number-dot";

export type TabDefinition = {
  value: string;
  label: string;
  count?: number;
  disabled?: boolean;
};

const triggerClassName =
  "inline-flex h-auto flex-none items-center justify-center gap-1.5 rounded-full border border-transparent bg-transparent px-3 py-1.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-all hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-linear-to-b data-[state=active]:from-muted/90 data-[state=active]:via-muted data-[state=active]:to-muted/75 data-[state=active]:text-foreground dark:data-[state=active]:from-muted/80 dark:data-[state=active]:to-muted/60";

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col gap-2", className)} {...props} />
  );
}

/** Works without `TabsContent` too, as a filter bar driven by `value`/`onValueChange` on `Tabs`. */
function TabsList({
  tabs,
  className,
  ...props
}: Omit<React.ComponentProps<typeof TabsPrimitive.List>, "children"> & { tabs: TabDefinition[] }) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn("inline-flex w-fit shrink-0 items-center gap-1", className)}
      {...props}
    >
      {tabs.map((tab) => (
        <TabsPrimitive.Trigger
          key={tab.value}
          value={tab.value}
          disabled={tab.disabled}
          data-slot="tabs-trigger"
          className={triggerClassName}
        >
          {tab.label}
          {tab.count != null && tab.count > 0 ? <NumberDot count={tab.count} /> : null}
        </TabsPrimitive.Trigger>
      ))}
    </TabsPrimitive.List>
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("mt-0 flex min-h-0 flex-1 flex-col text-sm outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList };
