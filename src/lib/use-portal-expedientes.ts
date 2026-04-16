"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  PortalExpedienteItem,
  PortalExpedientesResponse,
} from "@/types/portal-expedientes";

type UsePortalExpedientesOptions = {
  enabled?: boolean;
};

const MISSING_CLIENT_LINK_MESSAGE =
  "Tu usuario no tiene un cliente vinculado. Valida tu cuenta o comunicate con soporte para habilitar su cuenta.";

type ExpedientesErrorPayload = {
  error?: string;
  message?: string;
};

type ExpedientesCacheEntry = {
  payload: PortalExpedientesResponse | null;
  error: string | null;
  promise: Promise<PortalExpedientesResponse | null> | null;
};

const expedientesCache: ExpedientesCacheEntry = {
  payload: null,
  error: null,
  promise: null,
};

const getFriendlyErrorMessage = (
  response: Response,
  payload: ExpedientesErrorPayload | null,
  fallback: string,
) => {
  const rawMessage = payload?.message || payload?.error || fallback;

  if (
    response.status === 403 &&
    /usuario sin v[i\u00ed]nculo de cliente/i.test(rawMessage)
  ) {
    return MISSING_CLIENT_LINK_MESSAGE;
  }

  return rawMessage || "No se pudieron cargar los expedientes.";
};

const readErrorMessage = async (response: Response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = (await response
      .json()
      .catch(() => null)) as ExpedientesErrorPayload | null;

    return getFriendlyErrorMessage(
      response,
      data,
      "No se pudieron cargar los expedientes.",
    );
  }

  return getFriendlyErrorMessage(
    response,
    null,
    (await response.text().catch(() => "")) ||
      "No se pudieron cargar los expedientes.",
  );
};

const isActiveExpediente = (item: PortalExpedienteItem) => {
  const normalizedState = item.estado?.toUpperCase() ?? "";

  return normalizedState.includes("ACT") || normalizedState.includes("ABIER");
};

export const usePortalExpedientes = ({
  enabled = true,
}: UsePortalExpedientesOptions = {}) => {
  const [expedientes, setExpedientes] =
    useState<PortalExpedientesResponse | null>(expedientesCache.payload);
  const [isLoading, setIsLoading] = useState(
    enabled && !expedientesCache.payload && !expedientesCache.error,
  );
  const [error, setError] = useState<string | null>(expedientesCache.error);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    if (expedientesCache.payload || expedientesCache.error) {
      setExpedientes(expedientesCache.payload);
      setError(expedientesCache.error);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchExpedientes = async () => {
      const params = new URLSearchParams({
        accountKind: "CLIENTE",
        limit: "20",
        offset: "0",
      });

      const response = await fetch(
        `/api/portal/me/expedientes?${params.toString()}`,
        {
          cache: "no-store",
          signal: controller.signal,
        },
      );

      if (response.status === 401) {
        return null;
      }

      if (response.status === 403) {
        throw new Error(await readErrorMessage(response));
      }

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      return (await response.json()) as PortalExpedientesResponse;
    };

    const loadExpedientes = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!expedientesCache.promise) {
          expedientesCache.promise = fetchExpedientes();
        }

        const data = await expedientesCache.promise;
        expedientesCache.payload = data;
        expedientesCache.error = null;
        setExpedientes(data);
      } catch (requestError) {
        if (controller.signal.aborted) {
          return;
        }

        const nextError =
          requestError instanceof Error
            ? requestError.message
            : "No se pudieron cargar los expedientes.";

        expedientesCache.payload = null;
        expedientesCache.error = nextError;
        setError(nextError);
        setExpedientes(null);
      } finally {
        expedientesCache.promise = null;

        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadExpedientes();

    return () => {
      controller.abort();
    };
  }, [enabled]);

  const items = useMemo(() => expedientes?.data.items ?? [], [expedientes]);
  const activeExpediente = useMemo(
    () => items.find(isActiveExpediente) ?? items[0] ?? null,
    [items],
  );
  const activeCycle = activeExpediente?.cicloActual ?? null;

  return {
    expedientes,
    items,
    activeExpediente,
    activeCycle,
    currentCycleId: activeCycle?.cicloId ?? null,
    partial: expedientes?.partial ?? false,
    warnings: expedientes?.warnings ?? [],
    isLoading,
    error,
  };
};
