import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowUpDown, ExternalLink, PanelLeft, Plus } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../src/components/dropdown-menu";
import { IconButton } from "../../src/components/icon-button";
import { VariantGrid } from "../lib/variant-grid";

const VARIANTS = ["default", "secondary", "outline", "ghost"] as const;
const SIZES = ["icon-xs", "icon-sm", "icon", "icon-lg"] as const;

function PanelToggle() {
  const [pressed, setPressed] = useState(false);
  return (
    <IconButton
      label="Show panel"
      pressedLabel="Hide panel"
      pressed={pressed}
      onClick={() => setPressed(!pressed)}
    >
      <PanelLeft />
    </IconButton>
  );
}

const meta = {
  title: "Actions/IconButton",
  component: IconButton,
  parameters: { layout: "padded" },
  args: { label: "Add" },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: (args) => (
    <VariantGrid
      rows={VARIANTS}
      columns={SIZES}
      renderCell={(variant, size) => (
        <IconButton {...args} variant={variant} size={size}>
          <Plus />
        </IconButton>
      )}
    />
  ),
};

export const Toggle: Story = {
  render: () => <PanelToggle />,
};

export const MenuTrigger: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconButton label="Sort">
          <ArrowUpDown />
        </IconButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>Newest</DropdownMenuItem>
        <DropdownMenuItem>Oldest</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

export const Link: Story = {
  render: (args) => (
    <IconButton {...args} asChild variant="outline" label="Open docs">
      <a href="https://example.com" target="_blank" rel="noreferrer">
        <ExternalLink />
      </a>
    </IconButton>
  ),
};
