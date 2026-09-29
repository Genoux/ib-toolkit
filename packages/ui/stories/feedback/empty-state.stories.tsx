import type { Meta, StoryObj } from "@storybook/react-vite";
import { Inbox } from "lucide-react";
import { fn } from "storybook/test";
import { EmptyState } from "../../src/components/empty-state";

type EmptyStateStoryArgs = {
  title: string;
  description: string;
  showIcon: boolean;
  showAction: boolean;
};

const meta = {
  title: "Feedback/EmptyState",
  component: EmptyState,
  args: {
    title: "No items yet",
    description: "Items you create will appear here.",
    showIcon: true,
    showAction: true,
  },
  render: ({ title, description, showIcon, showAction }) => (
    <div className="flex h-64 w-md">
      <EmptyState
        title={title}
        description={description || undefined}
        icon={showIcon ? Inbox : undefined}
        action={showAction ? { label: "Create item", onClick: fn() } : undefined}
      />
    </div>
  ),
} satisfies Meta<EmptyStateStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutAction: Story = { args: { showAction: false } };

export const Minimal: Story = { args: { description: "", showIcon: false, showAction: false } };
