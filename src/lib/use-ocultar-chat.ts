"use client";

import { useEffect } from "react";

const MENU_ABIERTO_ATTRIBUTE = "data-menu-abierto";

/** Oculta el chat de Botmaker mientras `activo` sea true (ej. el menú mobile abierto). Ver globals.css. */
export function useOcultarChat(activo: boolean) {
  useEffect(() => {
    if (!activo) return;
    document.body.setAttribute(MENU_ABIERTO_ATTRIBUTE, "");
    return () => document.body.removeAttribute(MENU_ABIERTO_ATTRIBUTE);
  }, [activo]);
}
