"use client";

import * as React from "react";
import { XIcon } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { AnimatePresence, motion } from "motion/react";

import { PortalContainerProvider } from "./portal-container";
import { cn } from "../lib/utils";
import { EASING_FUNCTION } from "../lib/easing";

const DialogOpenContext = React.createContext(false);

function Dialog({
  open: controlledOpen,
  defaultOpen,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(
    defaultOpen ?? false
  );
  const isOpen = controlledOpen ?? uncontrolledOpen;

  const handleOpenChange = (next: boolean) => {
    setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  return (
    <DialogOpenContext.Provider value={isOpen}>
      <DialogPrimitive.Root
        data-slot="dialog"
        open={isOpen}
        onOpenChange={handleOpenChange}
        {...props}
      />
    </DialogOpenContext.Provider>
  );
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
}) {
  const isOpen = React.useContext(DialogOpenContext);
  const [portalContainer, setPortalContainer] = React.useState<HTMLElement | null>(null);

  return (
    <DialogPortal data-slot="dialog-portal" forceMount>
      {/* Overlay — separate AnimatePresence so it fades independently */}
      <AnimatePresence>
        {isOpen && (
          <DialogPrimitive.Overlay data-slot="dialog-overlay" asChild forceMount>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: EASING_FUNCTION.dialog }}
              style={{ willChange: "opacity" }}
              className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm supports-backdrop-filter:backdrop-blur-sm"
            />
          </DialogPrimitive.Overlay>
        )}
      </AnimatePresence>

      {/* Center with flex — avoid transform on the portal host (breaks Select/Popover positioning) */}
      <AnimatePresence>
        {isOpen && (
          <DialogPrimitive.Content
            data-slot="dialog-content"
            forceMount
            asChild
            {...props}
          >
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none">
              <div
                ref={setPortalContainer}
                className="pointer-events-none fixed inset-0 z-60 *:pointer-events-auto"
              />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: EASING_FUNCTION.dialog }}
                style={{ willChange: "opacity" }}
                className={cn(
                  "bg-background relative grid w-full max-w-[calc(100%-2rem)] gap-4 overflow-hidden rounded-lg border p-6 shadow-lg sm:max-w-lg",
                  className,
                )}
              >
              <PortalContainerProvider container={portalContainer}>
                <div
                  data-slot="dialog-body"
                  className="flex h-full min-h-0 w-full min-w-0 flex-col gap-4"
                >
                  {children}
                </div>
                {showCloseButton && (
                  <DialogPrimitive.Close
                    data-slot="dialog-close"
                    className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 z-10 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                  >
                    <XIcon />
                    <span className="sr-only">Close</span>
                  </DialogPrimitive.Close>
                )}
              </PortalContainerProvider>
              </motion.div>
            </div>
          </DialogPrimitive.Content>
        )}
      </AnimatePresence>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
