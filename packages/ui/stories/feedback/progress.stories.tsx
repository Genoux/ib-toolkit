import type { Meta, StoryObj } from "@storybook/react-vite";
import { Progress } from "../../src/components/progress";

const meta = {
  title: "Feedback/Progress",
  component: Progress,
  args: { value: 62 },
  argTypes: { value: { control: { type: "range", min: 0, max: 100 } } },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
