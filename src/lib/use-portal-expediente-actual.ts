"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  PortalExpedienteActualCycle,
  PortalExpedienteActualCycleEnvelope,
  PortalExpedienteActualData,
  PortalExpedienteActualDetalle,
  PortalExpedienteActualResponse,
} from "@/types/portal-expediente-actual";
import type { PortalExpedienteCycle } from "@/types/portal-expedientes";

type UsePortalExpedienteActualOptions = {
  enabled?: boolean;
};

const MISSING_CLIENT_LINK_MESSAGE =
  "Tu usuario no tiene un cliente vinculado. Valida tu cuenta o comunicate con soporte para habilitar su cuenta.";
const NOT_FOUND_MESSAGE =
  "No encontramos un expediente actual disponible para este usuario.";

type ErrorPayload = {
  error?: string;
  message?: string;
};

type ExpedienteActualCacheEntry = {
  payload: PortalExpedienteActualResponse | null;
  error: string | null;
  isNotFound: boolean;
  promise: Promise<PortalExpedienteActualResponse | null> | null;
};

const expedienteActualCache: ExpedienteActualCacheEntry = {
  payload: null,
  error: null,
  isNotFound: false,
  promise: null,
};

const readString = (value: string | null | undefined) =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const getFriendlyErrorMessage = (
  response: Response,
  payload: ErrorPayload | null,
  fallback: string,
) => {
  const rawMessage = payload?.message || payload?.error || fallback;

  if (response.status === 404) {
    return NOT_FOUND_MESSAGE;
  }

  if (
    response.status === 403 &&
    /usuario sin v[i\u00ed]nculo de cliente/i.test(rawMessage)
  ) {
    return MISSING_CLIENT_LINK_MESSAGE;
  }

  return rawMessage || "No pudimos cargar el expediente actual.";
};

const readErrorMessage = async (response: Response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = (await response.json().catch(() => null)) as ErrorPayload | null;
    return getFriendlyErrorMessage(response, data, "No pudimos cargar el expediente actual.");
  }

  return getFriendlyErrorMessage(
    response,
    null,
    (await response.text().catch(() => "")) || "No pudimos cargar el expediente actual.",
  );
};

const normalizeCycle = (value: PortalExpedienteActualCycle | null | undefined): PortalExpedienteCycle | null => {
  if (!value) {
    return null;
  }

  return {
    cicloId: value.id,
    numeroCiclo: value.numeroCiclo,
    titulo: value.titulo,
    estado: value.estado,
    fechaInicioCiclo: value.fechaInicioCiclo,
    fechaEntregaObjetivo: value.fechaEntregaObjetivo,
    fechaInicioGestion: value.fechaInicioGestion ?? "",
    updatedAt: value.updatedAt,
  };
};

const normalizeCycles = (value: PortalExpedienteActualCycle[] | null | undefined) =>
  Array.isArray(value)
    ? value
        .map((item) => normalizeCycle(item))
        .filter((item): item is PortalExpedienteCycle => item !== null)
    : [];

export const usePortalExpedienteActual = ({
  enabled = true,
}: UsePortalExpedienteActualOptions = {}) => {
  const [payload, setPayload] = useState<PortalExpedienteActualResponse | null>(
    expedienteActualCache.payload,
  );
  const [isLoading, setIsLoading] = useState(
    enabled &&
      !expedienteActualCache.payload &&
      !expedienteActualCache.error &&
      !expedienteActualCache.isNotFound,
  );
  const [error, setError] = useState<string | null>(expedienteActualCache.error);
  const [isNotFound, setIsNotFound] = useState(expedienteActualCache.isNotFound);

  const loadExpedienteActual = useCallback(async (signal?: AbortSignal, force = false) => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    if (
      !force &&
      (expedienteActualCache.payload ||
        expedienteActualCache.error ||
        expedienteActualCache.isNotFound)
    ) {
      setPayload(expedienteActualCache.payload);
      setError(expedienteActualCache.error);
      setIsNotFound(expedienteActualCache.isNotFound);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsNotFound(false);

    try {
      if (!expedienteActualCache.promise || force) {
        expedienteActualCache.promise = fetch("/api/portal/me/expediente-actual", {
          cache: "no-store",
          signal,
        }).then(async (response) => {
          if (response.status === 404) {
            expedienteActualCache.payload = null;
            expedienteActualCache.error = null;
            expedienteActualCache.isNotFound = true;
            return null;
          }

          if (!response.ok) {
            throw new Error(await readErrorMessage(response));
          }

          const data = (await response.json()) as PortalExpedienteActualResponse;
          expedienteActualCache.payload = data;
          expedienteActualCache.error = null;
          expedienteActualCache.isNotFound = false;
          return data;
        });
      }

      const data = await expedienteActualCache.promise;
      setPayload(data);
      setError(expedienteActualCache.error);
      setIsNotFound(expedienteActualCache.isNotFound);
    } catch (requestError) {
      if (signal?.aborted) {
        return;
      }

      const nextError =
        requestError instanceof Error
          ? requestError.message
          : "No pudimos cargar el expediente actual.";

      expedienteActualCache.payload = null;
      expedienteActualCache.error = nextError;
      expedienteActualCache.isNotFound = false;
      setPayload(null);
      setError(nextError);
      setIsNotFound(false);
    } finally {
      expedienteActualCache.promise = null;

      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, [enabled]);

  useEffect(() => {
    const controller = new AbortController();
    void loadExpedienteActual(controller.signal);

    return () => controller.abort();
  }, [loadExpedienteActual]);

  const expedienteData = useMemo<PortalExpedienteActualData | null>(() => payload?.data ?? null, [payload]);
  const detalle = useMemo<PortalExpedienteActualDetalle | null>(() => expedienteData?.detalle ?? null, [expedienteData]);
  const cicloActual = useMemo<PortalExpedienteActualCycleEnvelope | null>(() => detalle?.cicloActual ?? null, [detalle]);
  const currentCycle = useMemo(
    () => normalizeCycle(cicloActual?.ciclo ?? null),
    [cicloActual],
  );
  const pastCycles = useMemo(
    () => normalizeCycles(detalle?.ciclosPasados ?? []),
    [detalle],
  );

  return {
    expedienteActual: payload,
    expedienteData,
    detalle,
    expediente: detalle?.expediente ?? null,
    cliente: detalle?.cliente ?? null,
    contacto: detalle?.contacto ?? null,
    domicilioEntrega: detalle?.domicilioEntrega ?? null,
    sucursalEntrega: detalle?.sucursalEntrega ?? null,
    medico: detalle?.medico ?? null,
    cicloActual,
    cycleEvents: cicloActual?.eventos ?? [],
    cycleItems: cicloActual?.items ?? [],
    currentCycle,
    pastCycles,
    expedienteItems: detalle?.expediente.items ?? [],
    cicloItemsCount: cicloActual?.items.length ?? 0,
    treatmentItemsNotInCycleCount: 0,
    generatedAt: readString(payload?.generatedAt),
    schemaVersion: readString(payload?.schemaVersion),
    partial: payload?.partial ?? false,
    warnings: payload?.warnings ?? [],
    isLoading,
    error,
    isNotFound,
    refresh: () => loadExpedienteActual(undefined, true),
  };
};