"use client";

/// <reference path="../types/tanstack-table.d.ts" />

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  type Row,
  type TableOptions,
  useReactTable,
} from "@tanstack/react-table";
import type { ComponentProps } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { cn } from "../lib/utils";

const interactiveRowClassName = "cursor-pointer focus-visible:outline-none";

export type DataTableProps<TData, TValue = unknown> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  emptyMessage?: string;
  hideHeader?: boolean;
  tableOptions?: Omit<Partial<TableOptions<TData>>, "data" | "columns" | "getCoreRowModel">;
  wrapperClassName?: string;
  tableClassName?: string;
  tableHeaderClassName?: string;
  tableHeaderRowClassName?: string;
  headerCellClassName?: string;
  bodyCellClassName?: string;
  getRowProps?: (row: Row<TData>) => Omit<ComponentProps<"tr">, "children">;
};

export function DataTable<TData, TValue = unknown>({
  columns,
  data,
  emptyMessage = "No results.",
  hideHeader = false,
  tableOptions,
  wrapperClassName,
  tableClassName,
  tableHeaderClassName,
  tableHeaderRowClassName,
  headerCellClassName,
  bodyCellClassName,
  getRowProps,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    ...tableOptions,
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const rowModel = table.getRowModel().rows;
  const isEmpty = rowModel.length === 0;

  const tableInner = (
    <Table className={tableClassName}>
      {!hideHeader ? (
        <TableHeader className={tableHeaderClassName}>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className={tableHeaderRowClassName}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={cn(
                    headerCellClassName,
                    header.column.columnDef.meta?.headerClassName,
                  )}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
      ) : null}
      <TableBody>
        {isEmpty ? null : (
          rowModel.map((row) => {
            const extra = getRowProps?.(row);
            const { className: rowClassName, ...restExtra } = extra ?? {};
            return (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                {...restExtra}
                className={cn(
                  getRowProps ? interactiveRowClassName : undefined,
                  rowClassName,
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(bodyCellClassName, cell.column.columnDef.meta?.cellClassName)}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );

  return wrapperClassName || isEmpty ? (
    <div className={cn("overflow-hidden", isEmpty && "flex flex-col", wrapperClassName)}>
      {tableInner}
      {isEmpty ? (
        <div className="flex min-h-24 flex-1 items-center justify-center rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : null}
    </div>
  ) : (
    tableInner
  );
}
