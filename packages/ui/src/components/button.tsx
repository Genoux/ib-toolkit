import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "../lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90!",
        outline:
          "border bg-background hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
        dots: "self-center border-0 text-muted-foreground hover:bg-muted hover:text-foreground in-data-row:opacity-0 [[data-row]:hover_&]:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 data-[state=open]:bg-muted data-[state=open]:text-foreground [&_svg:not([class*='size-'])]:size-3.5",
      },
      // shortcut: an icon is assumed to lead because CSS can't see text nodes; adopt shadcn's data-icon="inline-end" once trailing icons exist
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:pl-3",
        xs: "h-6 gap-1 px-2 text-xs has-[>svg]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:pl-2.5",
        lg: "h-10 px-6 has-[>svg]:pl-4",
        icon: "size-9",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7",
        "icon-lg": "size-10",
      },
    },
    compoundVariants: [
      {
        variant: "dots",
        class: "size-6 p-0 has-[>svg]:pl-0",
      },
      {
        variant: "secondary",
        size: ["icon", "icon-xs", "icon-sm", "icon-lg"],
        class: "hover:bg-secondary-foreground/8",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
