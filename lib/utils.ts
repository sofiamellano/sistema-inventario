import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calcularCostoPromedioPonderado(
  cantidadAnterior: number,
  costoAnterior: number,
  cantidadNueva: number,
  costoNuevo: number
): number {
  const totalAnterior = cantidadAnterior * costoAnterior;
  const totalNuevo = cantidadNueva * costoNuevo;
  const cantidadTotal = cantidadAnterior + cantidadNueva;
  if (cantidadTotal === 0) return 0;
  return Number(((totalAnterior + totalNuevo) / cantidadTotal).toFixed(2));
}

