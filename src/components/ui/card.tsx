import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/// shadcn-style surface + badge primitives on the admin design tokens.
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[16px] border border-[var(--color-line)] bg-white shadow-[0_1px_2px_rgba(16,26,22,0.04),0_8px_24px_rgba(16,26,22,0.03)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1 p-6 pb-2", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-[16px] font-semibold tracking-tight text-[var(--color-ink)]", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-2", className)} {...props} />;
}

const badge = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11.5px] font-bold tracking-[0.02em] whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "border-[var(--color-line)] bg-[var(--color-surface-soft)] text-[var(--color-ink-soft)]",
        success: "border-[#cde8d6] bg-[var(--color-ok-soft)] text-[var(--color-ok)]",
        warning: "border-[#f0e2bd] bg-[var(--color-warn-soft)] text-[var(--color-warn)]",
        danger: "border-[#f2c9c6] bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
        info: "border-[#cfe0f7] bg-[var(--color-info-soft)] text-[var(--color-info)]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badge>) {
  return <span className={cn(badge({ variant }), className)} {...props} />;
}
