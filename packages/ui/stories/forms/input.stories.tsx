import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "../../src/components/input";

const meta = {
  title: "Forms/Input",
  component: Input,
  args: { placeholder: "Placeholder", disabled: false, "aria-invalid": false },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = { args: { disabled: true, defaultValue: "Disabled value" } };

export const Invalid: Story = { args: { "aria-invalid": true, defaultValue: "Invalid value" } };
