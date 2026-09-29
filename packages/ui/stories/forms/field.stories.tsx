import type { Meta, StoryObj } from "@storybook/react-vite";
import { Field, FieldDescription, FieldError, FieldLabel } from "../../src/components/field";
import { Input } from "../../src/components/input";

type FieldStoryArgs = { label: string; description: string; error: string };

const meta = {
  title: "Forms/Field",
  component: Field,
  args: { label: "Label", description: "Supporting description.", error: "" },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Field> & { args: FieldStoryArgs };

export default meta;
type Story = StoryObj<FieldStoryArgs>;

export const Default: Story = {
  render: ({ label, description, error }) => (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor="field-input">{label}</FieldLabel>
      <Input id="field-input" aria-invalid={Boolean(error)} />
      {description && <FieldDescription>{description}</FieldDescription>}
      {error && <FieldError errors={[{ message: error }]} />}
    </Field>
  ),
};

export const WithError: Story = { ...Default, args: { error: "Error message" } };
