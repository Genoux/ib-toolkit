import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../../src/components/button";

const VARIANTS = ["default", "secondary", "outline", "ghost", "link"] as const;
const SIZES = ["xs", "sm", "default", "lg"] as const;

const meta = {
  title: "Actions/Button",
  component: Button,
  parameters: { layout: "padded" },
  args: { children: "Button", disabled: false },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: ({ children, disabled }) => (
    <div className="flex flex-wrap items-center gap-3">
      {VARIANTS.map((variant) => (
        <Button key={variant} variant={variant} disabled={disabled}>
          {children}
        </Button>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: ({ children, variant, disabled }) => (
    <div className="flex flex-wrap items-center gap-3">
      {SIZES.map((size) => (
        <Button key={size} variant={variant} size={size} disabled={disabled}>
          {children}
        </Button>
      ))}
    </div>
  ),
};
