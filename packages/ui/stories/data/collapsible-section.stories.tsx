import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronDownIcon } from "lucide-react";
import {
  CollapsibleContent,
  CollapsibleSection,
  CollapsibleTrigger,
} from "../../src/components/collapsible-section";

const meta = {
  title: "Data/CollapsibleSection",
  component: CollapsibleSection,
  args: { defaultOpen: false, children: null },
  render: (args) => (
    <CollapsibleSection {...args} className="w-md">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium"
        >
          Section
          <ChevronDownIcon className="size-4 text-muted-foreground" />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <p className="px-4 py-3 text-sm text-muted-foreground">Section content</p>
      </CollapsibleContent>
    </CollapsibleSection>
  ),
} satisfies Meta<typeof CollapsibleSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OpenByDefault: Story = { args: { defaultOpen: true } };
