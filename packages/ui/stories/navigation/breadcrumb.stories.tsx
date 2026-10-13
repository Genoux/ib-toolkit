import type { Meta, StoryObj } from "@storybook/react-vite";
import { Breadcrumb } from "../../src/components/breadcrumb";

const LEVELS = [
  { label: "Clients", href: "#clients" },
  { label: "Nutramax", href: "#nutramax" },
  {
    label: "NMAX - UGC brief - D1 - Nutramax BAU UGC Ads - Concept 3 - Wellness",
    href: "#campaign",
  },
  { label: "Jane Creator", href: "#creator" },
  { label: "Brief - Concept 3 - Wellness hooks and raw footage", href: "#folder" },
];

type StoryArgs = { depth: number };

const meta = {
  title: "Navigation/Breadcrumb",
  parameters: { layout: "padded" },
  args: { depth: LEVELS.length },
  argTypes: {
    depth: { control: { type: "range", min: 1, max: LEVELS.length, step: 1 } },
  },
  render: ({ depth }) => (
    <Breadcrumb links={LEVELS.slice(0, depth - 1)} page={LEVELS[depth - 1]?.label} />
  ),
} satisfies Meta<StoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
