"use client";

import type { Column } from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { Button } from "./button";

type DataTableSortableHeaderProps<TData, TValue> = {
  label: string;
  column: Column<TData, TValue>;
};

export function DataTableSortableHeader<TData, TValue>({
  label,
  column,
}: DataTableSortableHeaderProps<TData, TValue>) {
  const isAscending = column.getIsSorted() === "asc";

  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      onClick={() => column.toggleSorting(isAscending)}
    >
      {label}
      {isAscending ? <ArrowUpIcon className="size-3.5" /> : <ArrowDownIcon className="size-3.5" />}
    </Button>
  );
}
