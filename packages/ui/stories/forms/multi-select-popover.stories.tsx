import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { MultiSelectPopover } from "../../src/components/multi-select-popover";
import { OPTIONS, PEOPLE_OPTIONS } from "../lib/fixtures";

const meta = {
  title: "Forms/MultiSelectPopover",
  component: MultiSelectPopover,
  args: { placeholder: "Option", options: OPTIONS, selectedValues: [], onChange: () => {} },
  render: ({ selectedValues: initialValues, ...args }) => {
    const [selectedValues, setSelectedValues] = useState(initialValues);
    return (
      <MultiSelectPopover {...args} selectedValues={selectedValues} onChange={setSelectedValues} />
    );
  },
} satisfies Meta<typeof MultiSelectPopover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAvatars: Story = {
  args: {
    placeholder: "Person",
    options: PEOPLE_OPTIONS,
    selectedValues: [PEOPLE_OPTIONS[0]?.value ?? ""],
  },
};
