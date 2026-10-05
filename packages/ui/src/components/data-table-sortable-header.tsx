"use client";

import type { Column } from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

type DataTableSortableHeaderProps<TData, TValue> = {
  label: string;
  column: Column<TData, TValue>;
};

// Not `Button size="xs"`: its fixed height and padding made sortable header rows 8px taller
// than plain-text ones and indented their labels. Padding cancelled by equal negative margins
// keeps the ghost hover pill while laying out exactly like a plain-text header.
export function DataTableSortableHeader<TData, TValue>({
  label,
  column,
}: DataTableSortableHeaderProps<TData, TValue>) {
  const isAscending = column.getIsSorted() === "asc";

  return (
    <button
      type="button"
      onClick={() => column.toggleSorting(isAscending)}
      className="-mx-2 -my-1 inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-1 transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:hover:bg-accent/50"
    >
      {label}
      {isAscending ? <ArrowUpIcon className="size-3" /> : <ArrowDownIcon className="size-3" />}
    </button>
  );
}
