import type { Meta, StoryObj } from "@storybook/react-vite";
import { LabeledField } from "../../src/components/labeled-field";

const meta = {
  title: "Display/LabeledField",
  component: LabeledField,
  args: { label: "Label", value: "Value" },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LabeledField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongValue: Story = {
  args: { value: "A longer value that wraps when space runs out" },
};
