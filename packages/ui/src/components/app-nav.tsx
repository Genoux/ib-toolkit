"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactElement, ReactNode } from "react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./sidebar";

type AppNavItem = {
  title: string;
  icon: LucideIcon;
  isActive?: boolean;
  disabled?: boolean;
};

type AppNavProps<Item extends AppNavItem> = {
  items: Item[];
  renderLink: (item: Item, content: ReactNode) => ReactElement;
};

function AppNav<Item extends AppNavItem>({ items, renderLink }: AppNavProps<Item>) {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={item.isActive}
                aria-disabled={item.disabled}
                className={item.disabled ? "opacity-50" : undefined}
              >
                {renderLink(
                  item,
                  <>
                    <item.icon />
                    <span>{item.title}</span>
                  </>,
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export { AppNav };
export type { AppNavItem };
