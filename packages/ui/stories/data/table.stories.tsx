import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../src/components/table";

const ROWS = [
  { name: "Item A", status: "Active", score: 4.6 },
  { name: "Item B", status: "Archived", score: 3.9 },
  { name: "Item C", status: "Active", score: 4.2 },
];

const meta = {
  title: "Data/Table",
  component: Table,
  parameters: { layout: "padded" },
  render: (args) => (
    <Table {...args} className="w-xl">
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Score</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ROWS.map((row) => (
          <TableRow key={row.name}>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.status}</TableCell>
            <TableCell>{row.score}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
