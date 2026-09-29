import type { Meta, StoryObj } from "@storybook/react-vite";
import { SectionSpinner, Spinner } from "../../src/components/spinner";

const meta = {
  title: "Feedback/Spinner",
  component: Spinner,
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Section: Story = {
  render: () => (
    <div className="flex h-40 w-80 rounded-lg border">
      <SectionSpinner />
    </div>
  ),
};
