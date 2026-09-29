import type { ReactNode } from "react";

export function VariantGrid<Row extends string, Column extends string>({
  rows,
  columns,
  renderCell,
}: {
  rows: readonly Row[];
  columns: readonly Column[];
  renderCell: (row: Row, column: Column) => ReactNode;
}) {
  return (
    <div
      className="grid items-center gap-x-6 gap-y-4"
      style={{ gridTemplateColumns: `6rem repeat(${columns.length}, auto)` }}
    >
      <span />
      {columns.map((column) => (
        <code key={column} className="text-xs text-muted-foreground">
          {column}
        </code>
      ))}
      {rows.map((row) => (
        <div key={row} className="contents">
          <code className="text-xs text-muted-foreground">{row}</code>
          {columns.map((column) => (
            <div key={column}>{renderCell(row, column)}</div>
          ))}
        </div>
      ))}
    </div>
  );
}
