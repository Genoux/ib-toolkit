import type { Meta, StoryObj } from "@storybook/react-vite";
import { toast } from "sonner";
import { Button } from "../../src/components/button";
import { Toaster } from "../../src/components/sonner";

const meta = {
  title: "Feedback/Toaster",
  component: Toaster,
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => toast("Message")}>
        Default
      </Button>
      <Button variant="outline" onClick={() => toast.success("Saved")}>
        Success
      </Button>
      <Button variant="outline" onClick={() => toast.error("Something went wrong")}>
        Error
      </Button>
    </div>
  ),
};
