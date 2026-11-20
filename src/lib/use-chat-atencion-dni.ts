"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    BOTMAKER_ACTION?: { onload?: () => void };
    bmInfo?: () => { platformContactId?: string } | undefined;
    bmSetVariables?: (variables: Record<string, string>) => void;
  }
}

// Páginas que exigen sesión (ver middleware.ts): ahí se le pasa el DNI al bot.
const RUTAS_CON_SESION = ["/socios", "/cora"];
const ESPERA_CONTACTO_MS = 1000;
const INTENTOS_CONTACTO = 30;
// El chat recién existe en Botmaker cuando la persona escribe: se reintenta ~5 min.
const ESPERA_CHAT_MS = 15000;
const INTENTOS_CHAT = 20;

function leerContactId(): string | null {
  try {
    return window.bmInfo?.()?.platformContactId || null;
  } catch {
    return null;
  }
}

function conSesion(pathname: string): boolean {
  return RUTAS_CON_SESION.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

/** Le pasa al chat de Botmaker el DNI del cliente logueado (lo pone el BFF desde la sesión). */
export function useChatAtencionDni(pathname: string, activo: boolean) {
  const [chatListo, setChatListo] = useState(false);
  const vinculadoRef = useRef<string | null>(null);

  // Tiene que quedar definido antes de que cargue el script del chat.
  useEffect(() => {
    if (!activo || window.bmInfo) return;
    window.BOTMAKER_ACTION = {
      ...window.BOTMAKER_ACTION,
      onload: () => setChatListo(true),
    };
  }, [activo]);

  useEffect(() => {
    // bmInfo ya existe si el chat cargó antes de montar este hook.
    if (!activo || (!chatListo && !window.bmInfo)) return;

    if (!conSesion(pathname)) {
      // Salió de la zona con sesión (ej. cerró sesión): el chat deja de saber quién es.
      if (vinculadoRef.current) {
        window.bmSetVariables?.({ DNI: "" });
        vinculadoRef.current = null;
      }
      return;
    }

    let cancelado = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const reintentar = (fn: () => Promise<void>, ms: number) => {
      timer = setTimeout(() => void fn(), ms);
    };

    const vincular = async (intentoContacto: number, intentoChat: number) => {
      if (cancelado) return;
      const contactId = leerContactId();
      if (!contactId) {
        if (intentoContacto < INTENTOS_CONTACTO) {
          reintentar(() => vincular(intentoContacto + 1, intentoChat), ESPERA_CONTACTO_MS);
        }
        return;
      }
      if (vinculadoRef.current === contactId) return;

      try {
        const res = await fetch("/api/portal/me/chat-atencion", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contactId }),
        });
        if (cancelado) return;
        if (res.ok) {
          vinculadoRef.current = contactId;
        } else if (res.status === 404 && intentoChat < INTENTOS_CHAT) {
          reintentar(() => vincular(intentoContacto, intentoChat + 1), ESPERA_CHAT_MS);
        }
      } catch {
        // Si falla, el chat sigue como siempre (pide el DNI).
      }
    };

    void vincular(0, 0);

    return () => {
      cancelado = true;
      if (timer) clearTimeout(timer);
    };
  }, [activo, chatListo, pathname]);
}
