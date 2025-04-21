
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency in Indian Rupees (₹)
 * Uses Indian number formatting (e.g., 1,00,000 instead of 100,000)
 */
export function formatIndianCurrency(amount: number): string {
  // Convert to Indian format (e.g., 1,00,000 instead of 100,000)
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  
  return formatter.format(amount);
}
