"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type SessionResponse = {
  ok?: boolean;
  authenticated?: boolean;
  expiresAt?: number | null;
};

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
      router.replace(`/?redirectTo=${encodeURIComponent(redirectTo)}`);
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

        timeoutRef.current = window.setTimeout(() => {
          void redirectToLogin();
        }, remainingMs);
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