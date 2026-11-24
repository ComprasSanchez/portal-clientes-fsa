"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

// Provisorio hasta tener back: lo abierto queda en este navegador, separado por cuenta.
const clave = (cuenta: string) => `fsa_calendario_abiertos_${cuenta}`;
const EVENTO = "fsa-calendario-abiertos";
// Si el navegador no deja guardar (modo privado), queda abierto solo mientras dure la visita.
const memoria = new Map<string, string>();

const leerCrudo = (cuenta: string): string => {
  try {
    return window.localStorage.getItem(clave(cuenta)) ?? memoria.get(clave(cuenta)) ?? "[]";
  } catch {
    return memoria.get(clave(cuenta)) ?? "[]";
  }
};

const parsear = (crudo: string): number[] => {
  try {
    const valor = JSON.parse(crudo);
    return Array.isArray(valor) ? valor.filter((d): d is number => Number.isInteger(d)) : [];
  } catch {
    return [];
  }
};

const suscribir = (aviso: () => void) => {
  window.addEventListener("storage", aviso);
  window.addEventListener(EVENTO, aviso);
  return () => {
    window.removeEventListener("storage", aviso);
    window.removeEventListener(EVENTO, aviso);
  };
};

/** Días del calendario que la cuenta ya abrió. `cargado` evita mostrar todo vencido antes de leer. */
export function useCalendarioAperturas(cuenta: string) {
  const crudo = useSyncExternalStore(
    suscribir,
    () => leerCrudo(cuenta),
    () => null,
  );
  const abiertos = useMemo(() => (crudo === null ? [] : parsear(crudo)), [crudo]);

  const marcarAbierto = useCallback(
    (dia: number) => {
      const actuales = parsear(leerCrudo(cuenta));
      if (actuales.includes(dia)) return;
      const nuevo = JSON.stringify([...actuales, dia]);
      memoria.set(clave(cuenta), nuevo);
      try {
        window.localStorage.setItem(clave(cuenta), nuevo);
      } catch {
        // Sin almacenamiento: queda en `memoria`.
      }
      window.dispatchEvent(new Event(EVENTO));
    },
    [cuenta],
  );

  // Para el modo prueba: vuelve todas las casillas a cerradas.
  const reiniciar = useCallback(() => {
    memoria.delete(clave(cuenta));
    try {
      window.localStorage.removeItem(clave(cuenta));
    } catch {
      // Sin almacenamiento: alcanza con limpiar `memoria`.
    }
    window.dispatchEvent(new Event(EVENTO));
  }, [cuenta]);

  return { abiertos, cargado: crudo !== null, marcarAbierto, reiniciar };
}
