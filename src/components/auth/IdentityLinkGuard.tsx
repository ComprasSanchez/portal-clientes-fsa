"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type IdentityLinkStatusResponse = {
  ok?: boolean;
  link?: {
    linked?: boolean;
  };
};

type SessionResponse = {
  authenticated?: boolean;
};

export function IdentityLinkGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const redirectingRef = useRef(false);
  const lastCheckedKeyRef = useRef<string | null>(null);
  const currentQuery = searchParams.toString();

  useEffect(() => {
    const routeKey = `${pathname}?${currentQuery}`;
    if (lastCheckedKeyRef.current === routeKey) {
      return;
    }
    lastCheckedKeyRef.current = routeKey;

    const redirectToIdentityLink = () => {
      if (redirectingRef.current) {
        return;
      }

      redirectingRef.current = true;
      const redirectTo = `${pathname}${currentQuery ? `?${currentQuery}` : ""}`;
      router.replace(
        `/?identityLink=pending&redirectTo=${encodeURIComponent(redirectTo)}`,
      );
    };

    const verifyIdentityLink = async () => {
      try {
        const sessionResponse = await fetch("/api/auth/session", {
          cache: "no-store",
        });

        if (!sessionResponse.ok) {
          return;
        }

        const sessionData = (await sessionResponse.json()) as SessionResponse;
        if (!sessionData.authenticated) {
          return;
        }

        const response = await fetch(
          "/api/v2/auth/identity-link/status?accountKind=CLIENTE",
          {
            cache: "no-store",
            credentials: "include",
          },
        );

        if (response.status === 403) {
          redirectToIdentityLink();
          return;
        }

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as IdentityLinkStatusResponse;

        if (!data.link?.linked) {
          redirectToIdentityLink();
        }
      } catch {
        // Ignore transient guard failures.
      }
    };

    void verifyIdentityLink();
  }, [currentQuery, pathname, router]);

  return null;
}
