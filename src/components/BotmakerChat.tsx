"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const BOTMAKER_SCRIPT_ID = "botmaker-webchat-loader";
const BOTMAKER_SCRIPT_SRC =
  "https://go.botmaker.com/rest/webchat/p/I6GSOHZQO4/init.js";
const HIDE_BODY_ATTRIBUTE = "data-hide-botmaker";

export function BotmakerChat() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (document.getElementById(BOTMAKER_SCRIPT_ID)) {
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
    const isMiHistorial =
      pathname === "/cora" && searchParams.get("view") === "mi-historial";

    document.body.toggleAttribute(HIDE_BODY_ATTRIBUTE, isMiHistorial);

    return () => {
      document.body.removeAttribute(HIDE_BODY_ATTRIBUTE);
    };
  }, [pathname, searchParams]);

  return null;
}
