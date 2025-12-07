// src/lib/utils.ts
import { twMerge } from 'tailwind-merge';
export function cn(...classes: (string | undefined)[]) {
  return twMerge(...classes.filter(Boolean) as string[]);
}
