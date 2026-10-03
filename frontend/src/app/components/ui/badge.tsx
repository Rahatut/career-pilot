import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground border border-border",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-border bg-transparent text-foreground",
        success: "bg-success text-success-border",
        info: "bg-info text-info-border",
        coral: "bg-[var(--chart-1)] text-primary-foreground",
        forest: "bg-[var(--chart-2)] text-primary-foreground",
        cream: "bg-accent text-accent-foreground",
        peach: "bg-[var(--chart-4)] text-primary-foreground",
        mint: "bg-[var(--chart-5)] text-primary-foreground",
        yellow: "bg-[var(--chart-6)] text-primary-foreground",
        mustard: "bg-[var(--chart-7)] text-primary-foreground",
      },
      size: {
        default: "h-5 px-2.5 py-0.5",
        sm: "h-4 px-2 py-0",
        lg: "h-6 px-3 py-0.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Badge({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Badge, badgeVariants };