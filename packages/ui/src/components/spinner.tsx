import { Loader2 } from "lucide-react";
import { cn } from "../lib/utils";

export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <Loader2
      className={cn("size-4 animate-spin text-muted-foreground", className)}
      role="status"
      aria-label={label}
    />
  );
}

/** Section / tab / panel loading when page chrome is already visible. */
export function SectionSpinner() {
  return (
    <div className="flex h-full min-h-[200px] flex-1 items-center justify-center">
      <Spinner className="size-4" />
    </div>
  );
}
