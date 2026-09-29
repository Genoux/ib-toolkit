import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "../../src/components/badge";

const VARIANTS = ["default", "secondary", "outline"] as const;

const meta = {
  title: "Display/Badge",
  component: Badge,
  args: { children: "Badge" },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: ({ children }) => (
    <div className="flex items-center gap-2">
      {VARIANTS.map((variant) => (
        <Badge key={variant} variant={variant}>
          {children}
        </Badge>
      ))}
    </div>
  ),
};
