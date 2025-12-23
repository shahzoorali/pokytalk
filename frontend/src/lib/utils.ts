import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

export function calculateAge(birthYear: number): number {
  const currentYear = new Date().getFullYear()
  return currentYear - birthYear
}

export function getCurrentYear(): number {
  return new Date().getFullYear()
}

export function generateYears(): number[] {
  const currentYear = getCurrentYear()
  const years: number[] = []
  for (let year = currentYear - 13; year >= currentYear - 100; year--) {
    years.push(year)
  }
  return years
}

export function getCountryName(countryCode: string): string {
  if (!countryCode) return ''
  
  // Import COUNTRIES dynamically to avoid circular dependency
  const { COUNTRIES } = require('./countries')
  const country = COUNTRIES.find((c: { code: string }) => c.code === countryCode)
  return country ? country.name : countryCode
}
