import type { Meta, StoryObj } from "@storybook/react-vite";
import { PlatformDisclaimer } from "../../src/components/platform-disclaimer";

const meta = {
  title: "Feedback/PlatformDisclaimer",
  component: PlatformDisclaimer,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Fixed to the bottom-right corner and fades in after a 2 second delay. Dismissing stores `cookieName` for 7 days, so the story stays hidden until that cookie is cleared or `cookieName` changes.",
      },
    },
  },
  args: {
    title: "Title",
    description: "Supporting description.",
    cookieName: "storybook-platform-disclaimer",
  },
  render: (args) => (
    <div className="h-96 w-full">
      <PlatformDisclaimer {...args} />
    </div>
  ),
} satisfies Meta<typeof PlatformDisclaimer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
