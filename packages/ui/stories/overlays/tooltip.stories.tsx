import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../../src/components/button";
import { Tooltip } from "../../src/components/tooltip";

const meta = {
  title: "Overlays/Tooltip",
  component: Tooltip,
  args: {
    content: "Tooltip content",
    side: "top",
    children: <Button variant="outline">Hover me</Button>,
  },
  argTypes: { side: { control: "inline-radio", options: ["top", "right", "bottom", "left"] } },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
