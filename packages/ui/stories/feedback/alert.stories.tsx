import type { Meta, StoryObj } from "@storybook/react-vite";
import { Alert, AlertDescription, AlertTitle } from "../../src/components/alert";

const meta = {
  title: "Feedback/Alert",
  component: Alert,
  args: { variant: "default" },
  argTypes: { variant: { control: "inline-radio", options: ["default", "destructive"] } },
  render: (args) => (
    <Alert {...args} className="w-md">
      <AlertTitle>Title</AlertTitle>
      <AlertDescription>Supporting description.</AlertDescription>
    </Alert>
  ),
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Destructive: Story = { args: { variant: "destructive" } };
