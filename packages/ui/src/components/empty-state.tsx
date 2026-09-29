import type { LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "../lib/utils";
import { Button } from "./button";

export type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label?: string;
    onClick: () => void;
    variant?: ComponentProps<typeof Button>["variant"];
    icon?: LucideIcon;
    disabled?: boolean;
  };
  className?: string;
};

export function EmptyState({ title, description, icon: Icon, action, className }: EmptyStateProps) {
  const ActionIcon = action?.icon;

  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex h-full min-h-0 w-full min-w-0 flex-1 flex-col items-center justify-center gap-2.5 rounded-xl border border-border px-6 py-12 text-center text-balance",
        className,
      )}
    >
      <div className="flex max-w-sm flex-col items-center gap-2">
        {Icon ? (
          <div className="mb-2 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Icon className="size-4 text-muted-foreground" />
          </div>
        ) : null}
        <div className="text-sm font-medium tracking-tight">{title}</div>
        {description ? (
          <p className="text-sm/relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? (
        <Button
          size={action.label ? "sm" : "icon-sm"}
          variant={action.variant ?? "secondary"}
          disabled={action.disabled}
          onClick={action.onClick}
        >
          {ActionIcon ? <ActionIcon className="size-3.5" /> : null}
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
