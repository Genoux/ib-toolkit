import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { toggleMultiSelectValue } from "../../src/components/multi-select-popover";
import { TogglePills } from "../../src/components/toggle-pills";
import { OPTION_LABELS } from "../lib/fixtures";

const meta = {
  title: "Forms/TogglePills",
  component: TogglePills,
  args: { options: OPTION_LABELS, selected: [], onToggle: () => {} },
  render: ({ selected: initialSelected, ...args }) => {
    const [selected, setSelected] = useState(initialSelected);
    return (
      <div className="w-md">
        <TogglePills
          {...args}
          selected={selected}
          onToggle={(value) => setSelected((current) => toggleMultiSelectValue(current, value))}
        />
      </div>
    );
  },
} satisfies Meta<typeof TogglePills>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { selected: [OPTION_LABELS[0] ?? ""] } };
