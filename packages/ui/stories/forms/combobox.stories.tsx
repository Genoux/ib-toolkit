import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import {
  Combobox,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxLimitedValue,
  ComboboxList,
  useComboboxAnchor,
} from "../../src/components/combobox";
import { OPTION_LABELS } from "../lib/fixtures";

function MultipleCombobox() {
  const [values, setValues] = useState<string[]>([OPTION_LABELS[0] ?? ""]);
  const anchor = useComboboxAnchor();
  return (
    <div className="w-80">
      <Combobox
        items={OPTION_LABELS}
        multiple
        value={values}
        onValueChange={(value) => setValues(value as string[])}
      >
        <ComboboxChips ref={anchor}>
          <ComboboxLimitedValue values={values} />
          <ComboboxChipsInput placeholder="Search options..." />
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>No options found.</ComboboxEmpty>
          <ComboboxList>
            {(option: string) => (
              <ComboboxItem key={option} value={option}>
                {option}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

const meta = {
  title: "Forms/Combobox",
  component: Combobox,
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Multiple: Story = { render: () => <MultipleCombobox /> };
