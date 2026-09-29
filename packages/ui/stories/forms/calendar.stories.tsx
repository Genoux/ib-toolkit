import type { Meta, StoryObj } from "@storybook/react-vite";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "../../src/components/button";
import { Calendar } from "../../src/components/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../src/components/popover";

const meta = {
  title: "Forms/Calendar",
  component: Calendar,
  args: { mode: "single", captionLayout: "label" },
  argTypes: { captionLayout: { control: "inline-radio", options: ["label", "dropdown"] } },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [date, setDate] = useState<Date | undefined>();
    return <Calendar {...args} mode="single" selected={date} onSelect={setDate} />;
  },
};

export const InPopover: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>();
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-56 justify-start font-normal">
            <CalendarIcon />
            {date ? date.toLocaleDateString() : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={date} onSelect={setDate} captionLayout="dropdown" />
        </PopoverContent>
      </Popover>
    );
  },
};
