import type { ComponentProps } from "react";
import { cn } from "../lib/utils";

export function DataTableShell({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("min-h-0 min-w-0 overflow-auto pb-6 pr-4", className)} {...props} />;
}
