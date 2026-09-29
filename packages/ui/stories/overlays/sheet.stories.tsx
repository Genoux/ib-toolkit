import type { Meta, StoryObj } from "@storybook/react-vite";
import { X } from "lucide-react";
import { Button } from "../../src/components/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../src/components/sheet";
import { Skeleton } from "../../src/components/skeleton";

const SIDES = ["top", "right", "bottom", "left"] as const;

const meta = {
  title: "Overlays/Sheet",
  component: SheetContent,
  args: { side: "right" },
  argTypes: { side: { control: "inline-radio", options: SIDES } },
  render: ({ side }) => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open sheet</Button>
      </SheetTrigger>
      <SheetContent side={side} className="gap-0 p-0">
        <SheetHeader className="border-b p-4">
          <div className="flex items-center justify-between gap-3">
            <SheetTitle>Title</SheetTitle>
            <SheetClose asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Close" className="-me-2">
                <X />
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>
        <div className="flex flex-col gap-2 p-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </SheetContent>
    </Sheet>
  ),
} satisfies Meta<typeof SheetContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Left: Story = { args: { side: "left" } };
