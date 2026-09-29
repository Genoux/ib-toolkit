import type { Ref } from "react";
import { cn } from "../lib/utils";

export function LoadMoreSentinel({
  sentinelRef,
  className,
}: {
  sentinelRef: Ref<HTMLDivElement>;
  className?: string;
}) {
  return <div ref={sentinelRef} className={cn("h-px w-full shrink-0", className)} aria-hidden />;
}
