"use client";

import { useCallback, useEffect, useRef } from "react";
import Script from "next/script";
import { Loader2 } from "lucide-react";
import styles from "./google-signin-button.module.scss";

type GoogleCredentialResponse = { credential?: string };

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    ux_mode?: "popup" | "redirect";
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleAccountsId } };
  }
}

const MAX_WIDTH = 400;

type GoogleSigninButtonProps = {
  /** ID del cliente web de Google Cloud. */
  clientId: string;
  /** Recibe el ID token de Google. */
  onCredential: (idToken: string) => void;
  loading?: boolean;
  disabled?: boolean;
};

/** Botón oficial de Google (Google Identity Services): devuelve el ID token sin salir de la página. */
export default function GoogleSigninButton({
  clientId,
  onCredential,
  loading = false,
  disabled = false,
}: GoogleSigninButtonProps) {
  const contenedor = useRef<HTMLDivElement>(null);
  const alRecibir = useRef(onCredential);

  useEffect(() => {
    alRecibir.current = onCredential;
  }, [onCredential]);

  const dibujar = useCallback(() => {
    const gis = window.google?.accounts?.id;
    const nodo = contenedor.current;
    if (!gis || !nodo || !clientId) return;
    gis.initialize({
      client_id: clientId,
      callback: ({ credential }) => {
        if (credential) alRecibir.current(credential);
      },
      ux_mode: "popup",
      auto_select: false,
    });
    nodo.replaceChildren();
    gis.renderButton(nodo, {
      type: "standard",
      theme: "outline",
      size: "large",
      shape: "pill",
      text: "continue_with",
      logo_alignment: "center",
      locale: "es",
      width: Math.min(nodo.offsetWidth || MAX_WIDTH, MAX_WIDTH),
    });
  }, [clientId]);

  if (!clientId) return null;

  const estado = loading ? styles.hidden : disabled ? styles.blocked : "";

  return (
    <div className={styles.wrapper} aria-busy={loading}>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={dibujar} />
      <div ref={contenedor} className={`${styles.button} ${estado}`} />
      {loading && (
        <span className={styles.overlay}>
          <Loader2 size={20} className={styles.spinner} aria-hidden />
          Ingresando con Google…
        </span>
      )}
    </div>
  );
}
