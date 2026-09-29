import type { Meta, StoryObj } from "@storybook/react-vite";
import { PersonIdentity } from "../../src/components/person-identity";
import { PEOPLE } from "../lib/fixtures";

const [personWithImage, , , , personWithoutImage] = PEOPLE;

const meta = {
  title: "Display/PersonIdentity",
  component: PersonIdentity,
  args: { name: personWithImage?.name ?? "", imageUrl: personWithImage?.imageUrl },
} satisfies Meta<typeof PersonIdentity>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutImage: Story = {
  args: { name: personWithoutImage?.name ?? "", imageUrl: null },
};
