import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/// Tailwind-aware class combiner (the shadcn/ui convention).
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
