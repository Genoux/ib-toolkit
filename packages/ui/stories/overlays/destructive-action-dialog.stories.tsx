import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "../../src/components/button";
import { DestructiveActionDialog } from "../../src/components/destructive-action-dialog";

type DemoArgs = { typed: boolean; isPending: boolean; startOpen?: boolean };

function DestructiveActionDialogDemo({ typed, isPending, startOpen = false }: DemoArgs) {
  const [open, setOpen] = useState(startOpen);
  const shared = {
    open,
    onOpenChange: setOpen,
    title: "Delete item?",
    description: "This cannot be undone.",
    onConfirm: () => setOpen(false),
    isPending,
  };
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open dialog
      </Button>
      {typed ? (
        <DestructiveActionDialog {...shared} variant="typed" resourceName="Item A" />
      ) : (
        <DestructiveActionDialog {...shared} />
      )}
    </>
  );
}

const meta = {
  title: "Overlays/DestructiveActionDialog",
  args: { typed: false, isPending: false },
  render: (args) => <DestructiveActionDialogDemo {...args} />,
} satisfies Meta<DemoArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Typed: Story = { args: { typed: true } };

// Confirm never closes the dialog itself; while pending it stays open with the pending label.
export const Pending: Story = { args: { isPending: true, startOpen: true } };
