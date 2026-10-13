"use client";

import * as React from "react";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { Slot } from "radix-ui";

import { cn } from "../lib/utils";
import { TooltipContent, TooltipRoot, TooltipTrigger } from "./tooltip";

function Breadcrumb({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      aria-label="breadcrumb"
      data-slot="breadcrumb"
      className={cn("min-w-0", className)}
      {...props}
    />
  );
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "text-muted-foreground flex items-center gap-1 text-sm",
        className,
      )}
      {...props}
    />
  );
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 has-data-[slot=breadcrumb-page]:min-w-20 has-data-[slot=breadcrumb-page]:shrink",
        className,
      )}
      {...props}
    />
  );
}

function BreadcrumbLink({
  asChild,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot.Root : "a";

  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn("block max-w-40 truncate py-1 px-1.5 rounded-md hover:text-foreground hover:bg-muted-foreground/5 transition-colors", className)}
      {...props}
    />
  );
}

function BreadcrumbPage({ className, children, ...props }: React.ComponentProps<"span">) {
  const pageRef = React.useRef<HTMLSpanElement>(null);
  const [tooltipOpen, setTooltipOpen] = React.useState(false);

  return (
    <TooltipRoot
      open={tooltipOpen}
      onOpenChange={(open) => {
        const page = pageRef.current;
        setTooltipOpen(open && !!page && page.scrollWidth > page.clientWidth);
      }}
    >
      <TooltipTrigger asChild>
        <span
          data-slot="breadcrumb-page"
          role="link"
          aria-disabled="true"
          aria-current="page"
          className={cn("block truncate py-1 px-1.5 text-foreground font-normal", className)}
          {...props}
          ref={pageRef}
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent>{children}</TooltipContent>
    </TooltipRoot>
  );
}

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg]:size-3.5", className)}
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  );
}

function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More</span>
    </span>
  );
}

export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
};
