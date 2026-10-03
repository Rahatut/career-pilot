import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full rounded-sm bg-input-background border border-input-border text-foreground text-body-md placeholder:text-muted-foreground transition-colors",
        "file:border-0 file:bg-transparent file:text-foreground file:font-medium",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-input-focus focus-visible:ring-offset-0",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        className,
      )}
      {...props}
    />
  );
}

export { Input };