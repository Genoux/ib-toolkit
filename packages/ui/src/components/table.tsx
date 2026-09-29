"use client";

import * as React from "react";

import { cn } from "../lib/utils";

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full min-h-0 overflow-x-auto rounded-[inherit]"
    >
      <table
        data-slot="table"
        className={cn(
          "w-full border-separate border-spacing-x-0 border-spacing-y-1.5 text-sm",
          "[&_tbody_tr>td:first-child]:rounded-l-xl [&_tbody_tr>td:last-child]:rounded-r-xl",
          "[&_tbody_tr:hover>td]:bg-muted/50 [&_tbody_tr:focus-within>td]:bg-muted/50",
          "[&_tbody_tr[data-state=selected]>td]:bg-muted",
          "[&_tbody_tr>td]:transition-[background-color,color]",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        "[&_tr]:cursor-default",
        className,
      )}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={className}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      data-row
      className={cn(
        "group",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "px-2 pb-2 text-left align-middle text-xs font-medium whitespace-nowrap text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}

export { Table, TableHeader, TableBody, TableHead, TableRow, TableCell };
