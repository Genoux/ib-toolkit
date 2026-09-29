import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ColumnDef, getSortedRowModel, type SortingState } from "@tanstack/react-table";
import { useState } from "react";
import { DataTable } from "../../src/components/data-table";
import { DataTableShell } from "../../src/components/data-table-shell";
import { DataTableSortableHeader } from "../../src/components/data-table-sortable-header";
import { MemberAvatarStack } from "../../src/components/member-avatar-stack";
import { PersonIdentity } from "../../src/components/person-identity";
import { PEOPLE } from "../lib/fixtures";

const ROWS = PEOPLE.slice(0, 4).map((owner, index) => ({
  id: `item-${index + 1}`,
  title: `Item ${String.fromCharCode(65 + index)}`,
  owner,
  score: [4.6, 3.9, 4.2, 2.8][index] ?? 0,
  members: PEOPLE.slice(0, index + 1),
}));

type Row = (typeof ROWS)[number];

const COLUMNS: ColumnDef<Row>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => <DataTableSortableHeader label="Name" column={column} />,
  },
  {
    id: "owner",
    header: "Owner",
    cell: ({ row }) => (
      <PersonIdentity name={row.original.owner.name} imageUrl={row.original.owner.imageUrl} />
    ),
  },
  {
    accessorKey: "score",
    header: ({ column }) => <DataTableSortableHeader label="Score" column={column} />,
  },
  {
    id: "members",
    header: "Members",
    cell: ({ row }) => <MemberAvatarStack members={row.original.members} />,
  },
];

const meta = {
  title: "Data/DataTable",
  component: DataTable,
  parameters: { layout: "padded" },
  args: { columns: COLUMNS as ColumnDef<unknown>[], data: ROWS, hideHeader: false },
  render: ({ data, ...args }) => {
    const [sorting, setSorting] = useState<SortingState>([]);
    return (
      <DataTableShell className="w-2xl">
        <DataTable
          {...args}
          columns={COLUMNS}
          data={data as Row[]}
          tableOptions={{
            state: { sorting },
            onSortingChange: setSorting,
            getSortedRowModel: getSortedRowModel(),
          }}
        />
      </DataTableShell>
    );
  },
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Sortable: Story = {};

export const Empty: Story = { args: { data: [], emptyMessage: "No results." } };
