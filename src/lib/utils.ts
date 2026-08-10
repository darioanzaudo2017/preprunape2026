import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Parsea "YYYY-MM-DD" como fecha local evitando el corrimiento UTC→AR.
// new Date("2023-11-10") → UTC midnight → en AR muestra "2023-11-09".
// Esta función construye la fecha en timezone local directamente.
export function formatDate(str: string | null | undefined, fallback = 'Sin fecha'): string {
  if (!str) return fallback
  const plain = str.split('T')[0] // soporta tanto "YYYY-MM-DD" como ISO completo
  const [y, m, d] = plain.split('-').map(Number)
  if (!y || !m || !d) return fallback
  return new Date(y, m - 1, d).toLocaleDateString('es-AR')
}
