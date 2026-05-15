"use client";

import { useEffect } from "react";

const BOTMAKER_SCRIPT_ID = "botmaker-webchat-loader";
const BOTMAKER_SCRIPT_SRC =
  "https://go.botmaker.com/rest/webchat/p/I6GSOHZQO4/init.js";

export function BotmakerChat() {
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

  return null;
}
