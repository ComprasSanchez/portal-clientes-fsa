"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type SessionResponse = {
  ok?: boolean;
  authenticated?: boolean;
  expiresAt?: number | null;
};

// setTimeout acepta como máximo ~24,8 días; con más (ej. sesión "recordada" de
// 30 días) el navegador lo dispara al instante y cerraba la sesión enseguida.
const MAX_TIMEOUT_MS = 2_147_483_647;

export function SessionExpiryGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timeoutRef = useRef<number | null>(null);
  const redirectingRef = useRef(false);

  useEffect(() => {
    const clearScheduledCheck = () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const redirectToLogin = async () => {
      if (redirectingRef.current) {
        return;
      }

      redirectingRef.current = true;

      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          cache: "no-store",
        });
      } catch {
        // Ignore logout transport failures and still redirect.
      }

      const currentQuery = searchParams.toString();
      const redirectTo = `${pathname}${currentQuery ? `?${currentQuery}` : ""}`;
      // sessionExpired=1: el login no tiene que mandar de vuelta a /socios solo
      // porque exista la cookie (puede ser una sesión que ya no sirve) — sin
      // esto se armaba un bucle de recargas.
      router.replace(
        `/?sessionExpired=1&redirectTo=${encodeURIComponent(redirectTo)}`,
      );
      router.refresh();
    };

    const syncSessionExpiry = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as SessionResponse;

        if (!data.authenticated) {
          await redirectToLogin();
          return;
        }

        clearScheduledCheck();

        if (typeof data.expiresAt !== "number" || !Number.isFinite(data.expiresAt)) {
          return;
        }

        const remainingMs = data.expiresAt - Date.now();

        if (remainingMs <= 0) {
          await redirectToLogin();
          return;
        }

        // Si vence antes del máximo, se cierra al vencer; si no, al cumplirse el
        // máximo se vuelve a consultar (la sesión pudo renovarse mientras tanto).
        timeoutRef.current = window.setTimeout(
          () => {
            void (remainingMs <= MAX_TIMEOUT_MS ? redirectToLogin() : syncSessionExpiry());
          },
          Math.min(remainingMs, MAX_TIMEOUT_MS),
        );
      } catch {
        // Ignore transient session-sync failures.
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncSessionExpiry();
      }
    };

    void syncSessionExpiry();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearScheduledCheck();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pathname, router, searchParams]);

  return null;
}