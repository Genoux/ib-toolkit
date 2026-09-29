import type { Meta, StoryObj } from "@storybook/react-vite";
import { NumberDot } from "../../src/components/number-dot";

const meta = {
  title: "Display/NumberDot",
  component: NumberDot,
  args: { count: 12 },
} satisfies Meta<typeof NumberDot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
