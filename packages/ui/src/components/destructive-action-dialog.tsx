"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";

interface DestructiveActionDialogBaseProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  onConfirm: () => void;
  isPending?: boolean;
  cancelLabel?: string;
  confirmLabel?: string;
  pendingLabel?: string;
}

export type DestructiveActionDialogProps =
  | (DestructiveActionDialogBaseProps & {
      variant?: "simple";
      resourceName?: never;
    })
  | (DestructiveActionDialogBaseProps & {
      variant: "typed";
      resourceName: string;
    });

/**
 * The confirm button does not close the dialog: the caller closes it through `onOpenChange`
 * once the action succeeds, so a pending or failed action keeps it open.
 */
export function DestructiveActionDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  isPending = false,
  cancelLabel = "Cancel",
  confirmLabel = "Delete",
  pendingLabel = "Deleting...",
  variant = "simple",
  resourceName,
}: DestructiveActionDialogProps) {
  const [typed, setTyped] = useState("");
  const requiredPhrase = variant === "typed" ? `DELETE ${resourceName}` : "";
  const canConfirm = !isPending && (variant === "simple" || typed === requiredPhrase);

  function handleOpenChange(next: boolean) {
    if (!next && isPending) return;
    if (!next) setTyped("");
    onOpenChange(next);
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground text-sm text-balance">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {variant === "typed" ? (
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">
                Type{" "}
                <span className="font-mono font-semibold tracking-wide text-foreground">
                  {requiredPhrase}
                </span>{" "}
                to confirm
              </Label>
              <Input
                autoCapitalize="off"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={requiredPhrase}
                autoComplete="off"
                spellCheck={false}
                className="text-foreground"
                onPointerDown={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{cancelLabel}</AlertDialogCancel>
          <Button disabled={!canConfirm} onClick={onConfirm}>
            {isPending ? pendingLabel : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
