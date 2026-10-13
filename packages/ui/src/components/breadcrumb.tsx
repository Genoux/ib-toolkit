"use client";

import * as React from "react";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { Slot } from "radix-ui";

import { cn } from "../lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { TooltipContent, TooltipRoot, TooltipTrigger } from "./tooltip";

type BreadcrumbLinkItem = { label: React.ReactNode; href: string };

// The element is rendered through Slot and asChild, so it must forward props and ref.
type RenderBreadcrumbLink<Link extends BreadcrumbLinkItem> = (
  link: Link,
  content: React.ReactNode,
) => React.ReactElement;

const MAX_INLINE_LINKS = 2;
// From md the sidebar takes 16rem, which leaves too little header room for inline links until lg.
const DESKTOP_ONLY = "hidden lg:inline-flex";

const renderAnchor: RenderBreadcrumbLink<BreadcrumbLinkItem> = (link, content) => (
  <a href={link.href}>{content}</a>
);

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5",
        className,
      )}
      {...props}
    />
  );
}

function BreadcrumbSeparator({ className }: { className?: string }) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg]:size-3.5", className)}
    >
      <ChevronRight />
    </li>
  );
}

function TruncationTooltip({
  content,
  children,
}: {
  content: React.ReactNode;
  children: React.ReactElement;
}) {
  // Radix types the trigger ref as a button; with asChild it lands on the span or anchor child.
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [tooltipOpen, setTooltipOpen] = React.useState(false);

  return (
    <TooltipRoot
      open={tooltipOpen}
      onOpenChange={(open) => {
        const trigger = triggerRef.current;
        setTooltipOpen(open && !!trigger && trigger.scrollWidth > trigger.clientWidth);
      }}
    >
      <TooltipTrigger asChild ref={triggerRef}>
        {children}
      </TooltipTrigger>
      <TooltipContent>{content}</TooltipContent>
    </TooltipRoot>
  );
}

function BreadcrumbPage({ children }: { children: React.ReactNode }) {
  return (
    <TruncationTooltip content={children}>
      <span
        data-slot="breadcrumb-page"
        role="link"
        aria-disabled="true"
        aria-current="page"
        className="block truncate py-1 px-1.5 text-foreground font-normal"
      >
        {children}
      </span>
    </TruncationTooltip>
  );
}

function BreadcrumbMenu<Link extends BreadcrumbLinkItem>({
  links,
  renderLink,
  className,
}: {
  links: Link[];
  renderLink: RenderBreadcrumbLink<Link>;
  className: string;
}) {
  return (
    <>
      <BreadcrumbItem className={className}>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Show more breadcrumbs"
            className="flex h-7 items-center rounded-md px-1.5 hover:text-foreground hover:bg-muted-foreground/5 transition-colors"
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-w-72">
            {links.map((link) => (
              <DropdownMenuItem key={link.href} asChild>
                {renderLink(link, link.label)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </BreadcrumbItem>
      <BreadcrumbSeparator className={className} />
    </>
  );
}

function Breadcrumb<Link extends BreadcrumbLinkItem>({
  links = [],
  page,
  renderLink = renderAnchor,
  className,
}: {
  links?: Link[];
  page: React.ReactNode;
  renderLink?: RenderBreadcrumbLink<Link>;
  className?: string;
}) {
  const renderInlineLink = (link: Link) => (
    <React.Fragment key={link.href}>
      <BreadcrumbItem className={DESKTOP_ONLY}>
        <TruncationTooltip content={link.label}>
          <Slot.Root
            data-slot="breadcrumb-link"
            className="block max-w-40 truncate py-1 px-1.5 rounded-md hover:text-foreground hover:bg-muted-foreground/5 transition-colors"
          >
            {renderLink(link, link.label)}
          </Slot.Root>
        </TruncationTooltip>
      </BreadcrumbItem>
      <BreadcrumbSeparator className={DESKTOP_ONLY} />
    </React.Fragment>
  );

  return (
    <nav aria-label="breadcrumb" data-slot="breadcrumb" className={cn("min-w-0", className)}>
      <ol
        data-slot="breadcrumb-list"
        className="text-muted-foreground flex items-center gap-1 text-sm"
      >
        {links.length > 0 && (
          <BreadcrumbMenu links={links} renderLink={renderLink} className="lg:hidden" />
        )}
        {links.length > MAX_INLINE_LINKS ? (
          <>
            {links.slice(0, 1).map(renderInlineLink)}
            <BreadcrumbMenu
              links={links.slice(1, -1)}
              renderLink={renderLink}
              className={DESKTOP_ONLY}
            />
            {links.slice(-1).map(renderInlineLink)}
          </>
        ) : (
          links.map(renderInlineLink)
        )}
        <BreadcrumbItem className="min-w-20 shrink">
          <BreadcrumbPage>{page}</BreadcrumbPage>
        </BreadcrumbItem>
      </ol>
    </nav>
  );
}

export { Breadcrumb };
export type { BreadcrumbLinkItem };
