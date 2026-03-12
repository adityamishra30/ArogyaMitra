import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string | null) {
  if (!dateString) return "Unknown Date";
  try {
    return format(parseISO(dateString), "MMM d, yyyy");
  } catch (e) {
    return dateString;
  }
}

export function formatDateTime(dateString?: string | null) {
  if (!dateString) return "Unknown Time";
  try {
    return format(parseISO(dateString), "MMM d, h:mm a");
  } catch (e) {
    return dateString;
  }
}
