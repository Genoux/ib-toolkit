import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "../../src/components/avatar";
import { PEOPLE } from "../lib/fixtures";

const [firstPerson] = PEOPLE;

const meta = {
  title: "Display/Avatar",
  component: Avatar,
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src={firstPerson?.imageUrl ?? undefined} alt={firstPerson?.name} />
      <AvatarFallback>AM</AvatarFallback>
    </Avatar>
  ),
};

export const Fallback: Story = {
  render: () => (
    <Avatar>
      <AvatarFallback>CK</AvatarFallback>
    </Avatar>
  ),
};

export const Group: Story = {
  render: () => (
    <AvatarGroup>
      {PEOPLE.slice(0, 3).map((person) => (
        <Avatar key={person.id}>
          <AvatarImage src={person.imageUrl ?? undefined} alt={person.name} />
          <AvatarFallback>{person.name.slice(0, 2)}</AvatarFallback>
        </Avatar>
      ))}
      <AvatarGroupCount>+2</AvatarGroupCount>
    </AvatarGroup>
  ),
};
