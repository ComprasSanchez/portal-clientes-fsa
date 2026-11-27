"use client";

import { useEffect, useState } from "react";
import { consultarPermisoClaves, consultarPermisoIdentidad } from "@/lib/auth-nuevo";
import { consultarPermisoCalendario } from "@/lib/calendario-admin";
import { consultarPermisoEntrega } from "@/lib/entrega-regalos";

// Permiso de una herramienta de Colaboradores. Ante un error, no.
const usePermiso = (
  consultarPermiso: () => Promise<{ habilitado: boolean }>,
  esColaborador: boolean,
  isColaboradorLoading: boolean,
) => {
  const [respuesta, setRespuesta] = useState<boolean | null>(null);
  const consultar = esColaborador && !isColaboradorLoading;

  useEffect(() => {
    if (!consultar) return;
    let cancelado = false;
    consultarPermiso()
      .then((r) => !cancelado && setRespuesta(r.habilitado === true))
      .catch(() => !cancelado && setRespuesta(false));
    return () => {
      cancelado = true;
    };
  }, [consultar, consultarPermiso]);

  return {
    habilitado: consultar && respuesta === true,
    isLoading: isColaboradorLoading || (consultar && respuesta === null),
  };
};

// Si el colaborador puede darle una contraseña nueva a un socio.
export const usePermisoClaves = (esColaborador: boolean, isColaboradorLoading: boolean) => {
  const { habilitado, isLoading } = usePermiso(consultarPermisoClaves, esColaborador, isColaboradorLoading);
  return { puedeCambiarClaves: habilitado, isLoading };
};

// Si el colaborador puede validar la identidad de un socio en la sucursal.
export const usePermisoIdentidad = (esColaborador: boolean, isColaboradorLoading: boolean) => {
  const { habilitado, isLoading } = usePermiso(consultarPermisoIdentidad, esColaborador, isColaboradorLoading);
  return { puedeValidarIdentidades: habilitado, isLoading };
};

// Si el colaborador puede cargar el contenido del calendario de fin de año.
export const usePermisoCalendario = (esColaborador: boolean, isColaboradorLoading: boolean) => {
  const { habilitado, isLoading } = usePermiso(consultarPermisoCalendario, esColaborador, isColaboradorLoading);
  return { puedeCargarCalendario: habilitado, isLoading };
};

// Si el colaborador puede entregar regalos del calendario con su QR.
export const usePermisoEntrega = (esColaborador: boolean, isColaboradorLoading: boolean) => {
  const { habilitado, isLoading } = usePermiso(consultarPermisoEntrega, esColaborador, isColaboradorLoading);
  return { puedeEntregarRegalos: habilitado, isLoading };
};
