import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox } from "../../src/components/checkbox";
import { Label } from "../../src/components/label";

const meta = {
  title: "Forms/Checkbox",
  component: Checkbox,
  args: { id: "checkbox", disabled: false },
  render: (args) => (
    <div className="flex items-center gap-2">
      <Checkbox {...args} />
      <Label htmlFor={args.id}>Label</Label>
    </div>
  ),
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = { args: { defaultChecked: true } };

export const Disabled: Story = { args: { disabled: true } };
