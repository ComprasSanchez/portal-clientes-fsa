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
    useState<PortalExpedientesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setExpedientes(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    const loadExpedientes = async () => {
      try {
        setIsLoading(true);
        setError(null);

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
          setExpedientes(null);
          return;
        }

        if (response.status === 403) {
          setExpedientes(null);
          setError(await readErrorMessage(response));
          return;
        }

        if (!response.ok) {
          throw new Error(await readErrorMessage(response));
        }

        const data = (await response.json()) as PortalExpedientesResponse;
        setExpedientes(data);
      } catch (requestError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "No se pudieron cargar los expedientes.",
        );
      } finally {
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
