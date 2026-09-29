import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { SearchInput } from "../../src/components/search-input";

const meta = {
  title: "Forms/SearchInput",
  component: SearchInput,
  args: { value: "", onChange: () => {}, placeholder: "Search", isLoading: false },
  render: ({ value: initialValue, ...args }) => {
    const [value, setValue] = useState(initialValue);
    return <SearchInput {...args} value={value} onChange={setValue} />;
  },
} satisfies Meta<typeof SearchInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = { args: { value: "Query" } };

export const Loading: Story = { args: { value: "Query", isLoading: true } };
