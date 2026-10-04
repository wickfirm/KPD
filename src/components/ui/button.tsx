import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/// shadcn-style button. Rendered as a class helper so both <button> and
/// next/link can wear it: <button className={button()} /> / <Link className={button({ variant: "ghost" })} />.
export const button = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-[13.5px] font-semibold leading-none transition-[background,box-shadow,border-color,transform] duration-150 cursor-pointer select-none disabled:opacity-55 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ink)] active:translate-y-px",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)] hover:shadow-[0_4px_14px_rgba(16,26,22,0.16)] min-h-[38px] px-4 py-2.5",
        ghost: "bg-white text-[var(--color-ink)] border border-[var(--color-line-strong)] hover:bg-[var(--color-surface-soft)] hover:border-[#b6bdb7] min-h-[38px] px-4 py-2.5",
        outline: "bg-transparent text-[var(--color-ink)] border border-transparent hover:bg-black/5 min-h-[38px] px-4 py-2.5",
        danger: "bg-[var(--color-danger)] text-white hover:bg-[#99201a] hover:shadow-[0_4px_14px_rgba(179,38,30,0.25)] min-h-[38px] px-4 py-2.5",
        link: "bg-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-black/5 p-1.5",
      },
      size: {
        default: "",
        sm: "text-[12.5px] min-h-[32px] px-3 py-1.5",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export type ButtonVariants = VariantProps<typeof button>;

export function Button({ className, variant, size, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & ButtonVariants) {
  return <button className={cn(button({ variant, size }), className)} {...props} />;
}
