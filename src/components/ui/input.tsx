import { cn } from "@/lib/utils";

/// shadcn-style form controls, matching the cms-field look via the same
/// design tokens. Use with <Label> for accessible field pairs.
export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-[10px] border border-[var(--color-line-strong)] bg-white px-3 py-2.5 min-h-[40px] text-[14px] text-[var(--color-ink)]",
        "transition-[border-color,box-shadow] duration-150 placeholder:text-[#a4aca7]",
        "hover:border-[#b6bdb7] focus-visible:outline-none focus-visible:border-[var(--color-brand)] focus-visible:shadow-[0_0_0_3px_var(--color-accent-ring)]",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-[10px] border border-[var(--color-line-strong)] bg-white px-3 py-2.5 text-[14px] text-[var(--color-ink)] resize-y leading-relaxed",
        "transition-[border-color,box-shadow] duration-150 placeholder:text-[#a4aca7]",
        "hover:border-[#b6bdb7] focus-visible:outline-none focus-visible:border-[var(--color-brand)] focus-visible:shadow-[0_0_0_3px_var(--color-accent-ring)]",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-[10px] border border-[var(--color-line-strong)] bg-white px-3 py-2.5 min-h-[40px] text-[14px] text-[var(--color-ink)] cursor-pointer",
        "transition-[border-color,box-shadow] duration-150",
        "hover:border-[#b6bdb7] focus-visible:outline-none focus-visible:border-[var(--color-brand)] focus-visible:shadow-[0_0_0_3px_var(--color-accent-ring)]",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-[13px] font-semibold text-[var(--color-ink-soft)]", className)} {...props} />;
}
