import type { Meta, StoryObj } from "@storybook/react-vite";
import { LogOut, UserCog } from "lucide-react";
import { DropdownMenuItem } from "../../src/components/dropdown-menu";
import { NavUser } from "../../src/components/nav-user";
import { Sidebar, SidebarFooter, SidebarProvider } from "../../src/components/sidebar";

const meta = {
  title: "Navigation/NavUser",
  component: NavUser,
  parameters: { layout: "fullscreen" },
  args: { name: "Alex Morgan", email: "alex@example.com", children: null },
  render: (args) => (
    <SidebarProvider className="h-96 min-h-0 transform-gpu overflow-hidden">
      <Sidebar collapsible="none" className="h-full">
        <SidebarFooter className="mt-auto">
          <NavUser {...args}>
            <DropdownMenuItem>
              <UserCog />
              Manage account
            </DropdownMenuItem>
            <DropdownMenuItem>
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </NavUser>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  ),
} satisfies Meta<typeof NavUser>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAvatar: Story = {
  args: { avatarUrl: "https://i.pravatar.cc/80?img=47" },
};
