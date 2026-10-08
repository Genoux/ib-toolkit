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

export const CustomLabel: Story = {
  args: {
    placeholder: "Select a person",
    options: PEOPLE_OPTIONS,
    selectedValues: [PEOPLE_OPTIONS[0]?.value ?? ""],
    renderLabel: (selectedOptions) =>
      `${selectedOptions.length} ${selectedOptions.length === 1 ? "person" : "people"} selected`,
  },
};

export const Searchable: Story = {
  args: { searchable: true, searchPlaceholder: "Search options…" },
};

export const WithDisabledOption: Story = {
  args: {
    options: OPTIONS.map((option, index) => (index === 1 ? { ...option, disabled: true } : option)),
  },
};
