import type { Meta, StoryObj } from "@storybook/react-vite";
import { Separator } from "../../src/components/separator";

const meta = {
  title: "Display/Separator",
  component: Separator,
  args: { orientation: "horizontal" },
  argTypes: { orientation: { control: "inline-radio", options: ["horizontal", "vertical"] } },
  render: (args) => (
    <div className="flex h-16 w-64 items-center justify-center">
      <Separator {...args} />
    </div>
  ),
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {};

export const Vertical: Story = { args: { orientation: "vertical" } };
