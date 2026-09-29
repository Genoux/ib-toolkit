"use client";

import type { CSSProperties, ComponentProps, ReactNode } from "react";
import { cn } from "../lib/utils";
import { Separator } from "./separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "./sidebar";

type AppShellProps = {
  sidebarHeader: ReactNode;
  sidebar: ReactNode;
  sidebarFooter?: ReactNode;
  header?: ReactNode;
  children: ReactNode;
  variant?: ComponentProps<typeof Sidebar>["variant"];
  collapsible?: ComponentProps<typeof Sidebar>["collapsible"];
  sidebarWidth?: string;
  headerVariant?: keyof typeof HEADER_VARIANTS;
};

const HEADER_VARIANTS = {
  bordered: { header: "h-(--header-height) border-b", bar: "px-3", separator: "mx-2" },
  plain: { header: "h-14", bar: "px-4", separator: "mr-2" },
} as const;

function AppShellLogo({ children }: { children: ReactNode }) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="p-1.5">{children}</div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function AppShell({
  sidebarHeader,
  sidebar,
  sidebarFooter,
  header,
  children,
  variant = "sidebar",
  collapsible = "offcanvas",
  sidebarWidth = "220px",
  headerVariant = "bordered",
}: AppShellProps) {
  const headerStyle = HEADER_VARIANTS[headerVariant];
  return (
    <SidebarProvider
      className="h-svh overflow-hidden"
      style={
        {
          "--sidebar-width": sidebarWidth,
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <Sidebar variant={variant} collapsible={collapsible}>
        <SidebarHeader>{sidebarHeader}</SidebarHeader>
        <SidebarContent>{sidebar}</SidebarContent>
        {sidebarFooter ? <SidebarFooter>{sidebarFooter}</SidebarFooter> : null}
      </Sidebar>
      <SidebarInset
        className={
          variant === "inset"
            ? "max-h-[calc(100svh-1rem)] min-h-0 overflow-hidden"
            : "max-h-svh min-h-0 overflow-hidden"
        }
      >
        <header className={cn("flex shrink-0 items-center gap-2", headerStyle.header)}>
          <div className={cn("flex w-full items-center gap-1", headerStyle.bar)}>
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className={cn(headerStyle.separator, "data-[orientation=vertical]:h-4")}
            />
            {header ? <div className="flex w-full items-center justify-between">{header}</div> : null}
          </div>
        </header>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export { AppShell, AppShellLogo };
