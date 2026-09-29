import type * as React from "react";
import { cn } from "../lib/utils";
import { Button } from "./button";
import { Tooltip } from "./tooltip";

type ToggleProps =
  | { pressed?: undefined; pressedLabel?: undefined }
  | { pressed: boolean; pressedLabel: string };

type IconButtonProps = Omit<React.ComponentProps<typeof Button>, "aria-label" | "aria-pressed"> &
  ToggleProps & {
    label: string;
    tooltipSide?: React.ComponentProps<typeof Tooltip>["side"];
  };

// Menu and popover triggers get data-state="open" from Radix; open reads as "on", like a pressed toggle.
const openTriggerClassName =
  "data-[state=open]:bg-primary data-[state=open]:text-primary-foreground data-[state=open]:hover:bg-primary/90";

// Toggles name the next action ("Show filters" / "Hide filters") instead of setting aria-pressed:
// a label that already states the result would be read as "Hide filters, pressed".
function IconButton({
  label,
  pressed,
  pressedLabel,
  tooltipSide,
  variant = "secondary",
  size = "icon",
  asChild,
  type,
  className,
  ...props
}: IconButtonProps) {
  const currentLabel = pressed ? pressedLabel : label;
  const toggleVariant = pressed ? "default" : "secondary";
  return (
    <Tooltip content={currentLabel} side={tooltipSide}>
      <Button
        aria-label={currentLabel}
        variant={pressed === undefined ? variant : toggleVariant}
        size={size}
        asChild={asChild}
        type={asChild ? type : (type ?? "button")}
        className={cn(openTriggerClassName, className)}
        {...props}
      />
    </Tooltip>
  );
}

export { IconButton };
