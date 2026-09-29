import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemberAvatarStack } from "../../src/components/member-avatar-stack";
import { PEOPLE } from "../lib/fixtures";

const meta = {
  title: "Display/MemberAvatarStack",
  component: MemberAvatarStack,
  args: { members: PEOPLE.slice(0, 2) },
} satisfies Meta<typeof MemberAvatarStack>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Overflow: Story = { args: { members: PEOPLE } };

export const Empty: Story = { args: { members: [] } };
