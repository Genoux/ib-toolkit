import type { Meta, StoryObj } from "@storybook/react-vite";
import { BarChart3, Home, Inbox, Settings } from "lucide-react";
import { useState } from "react";
import { AppNav, type AppNavItem } from "../../src/components/app-nav";
import { Sidebar, SidebarContent, SidebarProvider } from "../../src/components/sidebar";
import { renderNavButton } from "../lib/nav-button";

const NAV_ITEMS: AppNavItem[] = [
  { title: "Home", icon: Home },
  { title: "Inbox", icon: Inbox },
  { title: "Reports", icon: BarChart3 },
  { title: "Settings", icon: Settings, disabled: true },
];

function NavPreview({ items }: { items: AppNavItem[] }) {
  const [activeTitle, setActiveTitle] = useState(items[0]?.title);
  return (
    <SidebarProvider className="h-72 min-h-0 transform-gpu overflow-hidden">
      <Sidebar collapsible="none" className="h-full">
        <SidebarContent>
          <AppNav
            items={items.map((item) => ({ ...item, isActive: item.title === activeTitle }))}
            renderLink={renderNavButton((item) => setActiveTitle(item.title))}
          />
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
}

const meta = {
  title: "Navigation/AppNav",
  component: AppNav,
  parameters: { layout: "fullscreen" },
  args: { items: NAV_ITEMS, renderLink: renderNavButton(() => undefined) },
  render: ({ items }) => <NavPreview items={items} />,
} satisfies Meta<typeof AppNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithDisabledItem: Story = {
  args: { items: NAV_ITEMS.map((item, index) => ({ ...item, disabled: index === 1 })) },
};
