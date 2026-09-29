import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../src/components/select";
import { OPTIONS } from "../lib/fixtures";

const meta = {
  title: "Forms/Select",
  component: Select,
  args: { clearable: false, disabled: false },
  render: (args) => {
    const [value, setValue] = useState("");
    return (
      <div className="w-64">
        <Select {...args} value={value} onValueChange={setValue}>
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Clearable: Story = { args: { clearable: true } };

export const Disabled: Story = { args: { disabled: true } };
