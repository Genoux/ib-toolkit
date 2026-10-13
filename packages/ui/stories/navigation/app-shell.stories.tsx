import type { Meta, StoryObj } from "@storybook/react-vite";
import { BarChart3, Home, Inbox, LogOut, MoreHorizontal, Settings, UserCog } from "lucide-react";
import { type ComponentProps, type ReactNode, useState } from "react";
import { AppNav, type AppNavItem } from "../../src/components/app-nav";
import { AppShell, AppShellLogo } from "../../src/components/app-shell";
import { Breadcrumb } from "../../src/components/breadcrumb";
import { Button } from "../../src/components/button";
import { DropdownMenuItem } from "../../src/components/dropdown-menu";
import { NavUser } from "../../src/components/nav-user";
import { Skeleton } from "../../src/components/skeleton";
import { renderNavButton } from "../lib/nav-button";

const NAV_ITEMS: AppNavItem[] = [
  { title: "Home", icon: Home },
  { title: "Inbox", icon: Inbox },
  { title: "Reports", icon: BarChart3 },
  { title: "Settings", icon: Settings },
];

type StoryArgs = Pick<ComponentProps<typeof AppShell>, "variant" | "headerVariant" | "collapsible">;

function AppShellPreview({
  variant,
  headerVariant,
  collapsible,
  header,
}: StoryArgs & { header?: ReactNode }) {
  const [activeTitle, setActiveTitle] = useState(NAV_ITEMS[0]?.title);
  return (
    <AppShell
      variant={variant}
      headerVariant={headerVariant}
      collapsible={collapsible}
      sidebarHeader={
        <AppShellLogo>
          <div className="size-[18px] rounded-md bg-foreground" />
        </AppShellLogo>
      }
      sidebar={
        <AppNav
          items={NAV_ITEMS.map((item) => ({ ...item, isActive: item.title === activeTitle }))}
          renderLink={renderNavButton((item) => setActiveTitle(item.title))}
        />
      }
      sidebarFooter={
        <NavUser name="Alex Morgan" email="alex@example.com">
          <DropdownMenuItem>
            <UserCog />
            Manage account
          </DropdownMenuItem>
          <DropdownMenuItem>
            <LogOut />
            Sign out
          </DropdownMenuItem>
        </NavUser>
      }
      header={header ?? <span className="text-sm font-medium">{activeTitle}</span>}
    >
      <div className="flex flex-col gap-3 p-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    </AppShell>
  );
}

const meta = {
  title: "Navigation/AppShell",
  parameters: { layout: "fullscreen" },
  globals: { viewport: { value: "desktop", isRotated: false } },
  args: { variant: "sidebar", headerVariant: "bordered", collapsible: "offcanvas" },
  argTypes: {
    variant: { control: "inline-radio", options: ["sidebar", "floating", "inset"] },
    headerVariant: { control: "inline-radio", options: ["bordered", "plain"] },
    collapsible: { control: "inline-radio", options: ["offcanvas", "icon", "none"] },
  },
  render: ({ variant = "sidebar", headerVariant = "bordered", collapsible = "offcanvas" }) => (
    <AppShellPreview variant={variant} headerVariant={headerVariant} collapsible={collapsible} />
  ),
} satisfies Meta<StoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Floating: Story = { args: { variant: "floating", headerVariant: "plain" } };

export const Inset: Story = { args: { variant: "inset" } };

export const WithBreadcrumb: Story = {
  render: ({ variant = "sidebar", headerVariant = "bordered", collapsible = "offcanvas" }) => (
    <AppShellPreview
      variant={variant}
      headerVariant={headerVariant}
      collapsible={collapsible}
      header={
        <>
          <Breadcrumb
            links={[
              { label: "Clients", href: "#clients" },
              { label: "Nutramax", href: "#nutramax" },
              {
                label: "NMAX - UGC brief - D1 - Nutramax BAU UGC Ads - Concept 3 - Wellness",
                href: "#campaign",
              },
              { label: "Jane Creator", href: "#creator" },
            ]}
            page="Brief - Concept 3 - Wellness hooks and raw footage"
          />
          <Button variant="dots" aria-label="Actions">
            <MoreHorizontal />
          </Button>
        </>
      }
    />
  ),
};
