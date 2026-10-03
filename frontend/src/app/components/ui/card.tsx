import * as React from "react";

import { cn } from "./utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-lg border",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 p-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <h4
      data-slot="card-title"
      className={cn("leading-none", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-muted-foreground text-body-md", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("p-6 [&:last-child]:pb-6", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center p-6 [.border-t]:pt-6", className)}
      {...props}
    />
  );
}

/* Signature card variants per DESIGN.md */
function SignatureCard({
  className,
  variant = "default",
  children,
  ...props
}: React.ComponentProps<"div"> & { variant?: "coral" | "forest" | "dark" | "cream" | "peach" | "mint" | "yellow" | "mustard" }) {
  const variants = {
    default: "bg-card text-card-foreground border border-border rounded-lg",
    coral: "bg-[var(--chart-1)] text-primary-foreground rounded-lg shadow-none",
    forest: "bg-[var(--chart-2)] text-primary-foreground rounded-lg shadow-none",
    dark: "bg-surface-dark text-on-dark rounded-lg shadow-none",
    cream: "bg-accent text-accent-foreground rounded-md shadow-none",
    peach: "bg-[var(--chart-4)] text-primary-foreground rounded-md shadow-none",
    mint: "bg-[var(--chart-5)] text-primary-foreground rounded-md shadow-none",
    yellow: "bg-[var(--chart-6)] text-primary-foreground rounded-md shadow-none",
    mustard: "bg-[var(--chart-7)] text-primary-foreground rounded-md shadow-none",
  };

  const paddings = {
    default: "p-6",
    coral: "p-12",
    forest: "p-12",
    dark: "p-12",
    cream: "p-6",
    peach: "p-4",
    mint: "p-4",
    yellow: "p-4",
    mustard: "p-4",
  };

  return (
    <div
      data-slot="signature-card"
      className={cn(variants[variant], paddings[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}

/* Demo grid card - uneven heights, product UI fragments */
function DemoCard({
  className,
  surface = "canvas",
  children,
  ...props
}: React.ComponentProps<"div"> & { surface?: "canvas" | "peach" | "mint" | "cream" | "yellow" | "mustard" }) {
  const surfaces = {
    canvas: "bg-card text-card-foreground",
    peach: "bg-[var(--chart-4)] text-primary-foreground",
    mint: "bg-[var(--chart-5)] text-primary-foreground",
    cream: "bg-accent text-accent-foreground",
    yellow: "bg-[var(--chart-6)] text-primary-foreground",
    mustard: "bg-[var(--chart-7)] text-primary-foreground",
  };

  return (
    <div
      data-slot="demo-card"
      className={cn(surfaces[surface], "rounded-md p-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/* Article card for content grids */
function ArticleCard({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="article-card"
      className={cn("bg-card text-card-foreground rounded-md p-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/* Feature card with tabbed layout */
function FeatureCard({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="feature-card"
      className={cn("bg-muted rounded-lg p-8", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/* CTA band - light gray section */
function CTABand({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="cta-band"
      className={cn("bg-border/50 text-foreground rounded-lg p-12", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  SignatureCard,
  DemoCard,
  ArticleCard,
  FeatureCard,
  CTABand,
};