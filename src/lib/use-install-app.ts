"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Evento de Chrome/Android (no está en los tipos del DOM de TypeScript). */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * - `prompt`: el navegador permite instalar con un botón (Chrome/Edge/Samsung en Android).
 * - `ios`: iPhone/iPad, solo se puede desde Compartir → "Agregar a inicio".
 * - `hidden`: ya está instalada, la cerraron hace poco o el navegador no lo soporta.
 */
export type InstallAppMode = "prompt" | "ios" | "hidden";

const DISMISSED_KEY = "fsa_install_app_dismissed_at";
const DISMISS_DAYS = 14;

type WindowWithInstallPrompt = Window & { __fsaInstallPrompt?: BeforeInstallPromptEvent };

// `beforeinstallprompt` se dispara una sola vez al cargar la página, a veces antes de
// que cargue este módulo. Si ya pasó, lo guardó el script de `app/layout.tsx` en
// `window.__fsaInstallPrompt`; si no, se escucha acá.
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
let dismissed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

if (typeof window !== "undefined") {
  deferredPrompt = (window as WindowWithInstallPrompt).__fsaInstallPrompt ?? null;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    installed = true;
    notify();
  });
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

// iPadOS se presenta como Mac: se distingue por la pantalla táctil.
const isIos = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const wasDismissedRecently = () => {
  try {
    const value = Number(localStorage.getItem(DISMISSED_KEY));
    return Boolean(value) && Date.now() - value < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
};

const getMode = (): InstallAppMode => {
  if (installed || dismissed || isStandalone() || wasDismissedRecently()) return "hidden";
  if (isIos()) return "ios";
  return deferredPrompt ? "prompt" : "hidden";
};

// En el servidor no se sabe el dispositivo: no se muestra hasta hidratar.
const getServerMode = (): InstallAppMode => "hidden";

/** Estado del aviso "Agregar a la pantalla de inicio" y sus acciones. */
export function useInstallApp() {
  const mode = useSyncExternalStore(subscribe, getMode, getServerMode);

  const install = useCallback(async () => {
    const event = deferredPrompt;
    if (!event) return;
    await event.prompt();
    const { outcome } = await event.userChoice;
    // El evento sirve una sola vez.
    deferredPrompt = null;
    delete (window as WindowWithInstallPrompt).__fsaInstallPrompt;
    if (outcome === "accepted") installed = true;
    notify();
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      // Sin almacenamiento (ej. navegación privada): solo se oculta en esta visita.
    }
    dismissed = true;
    notify();
  }, []);

  return { mode, install, dismiss };
}
