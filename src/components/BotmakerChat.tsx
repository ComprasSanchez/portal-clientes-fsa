"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const BOTMAKER_SCRIPT_ID = "botmaker-webchat-loader";
const BOTMAKER_SCRIPT_SRC =
  "https://go.botmaker.com/rest/webchat/p/I6GSOHZQO4/init.js";
const HIDE_BODY_ATTRIBUTE = "data-hide-botmaker";
const BOTTOM_NAV_BODY_ATTRIBUTE = "data-cora-bottom-nav";

// Controla si el widget de chat se carga. Poné
// NEXT_PUBLIC_SHOW_BOTMAKER_CHAT=false en el .env para desactivarlo por completo.
const SHOW_BOTMAKER_CHAT = process.env.NEXT_PUBLIC_SHOW_BOTMAKER_CHAT !== "false";

export function BotmakerChat() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!SHOW_BOTMAKER_CHAT || document.getElementById(BOTMAKER_SCRIPT_ID)) {
      return;
    }

    const script = document.createElement("script");
    script.id = BOTMAKER_SCRIPT_ID;
    script.src = BOTMAKER_SCRIPT_SRC;
    script.async = true;
    script.type = "text/javascript";

    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!SHOW_BOTMAKER_CHAT) {
      return;
    }

    const isMiHistorial =
      pathname === "/cora" && searchParams.get("view") === "mi-historial";

    document.body.toggleAttribute(HIDE_BODY_ATTRIBUTE, isMiHistorial);

    return () => {
      document.body.removeAttribute(HIDE_BODY_ATTRIBUTE);
    };
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!SHOW_BOTMAKER_CHAT) {
      return;
    }

    // El BottomNavBar mobile de CORA (ver BottomNavBar.tsx) se renderiza en
    // todas las vistas de /cora, asi que el chat tiene que correrse hacia
    // arriba para no quedar tapado por esa barra.
    const hasBottomNav = pathname === "/cora";

    document.body.toggleAttribute(BOTTOM_NAV_BODY_ATTRIBUTE, hasBottomNav);

    return () => {
      document.body.removeAttribute(BOTTOM_NAV_BODY_ATTRIBUTE);
    };
  }, [pathname]);

  return null;
}
