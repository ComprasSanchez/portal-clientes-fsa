"use client";

import { useMemo } from "react";
import {
  pickPreferredAfiliacion,
  pickPreferredContacto,
  pickPreferredDomicilio,
} from "@/lib/portal-profile";
import type { PortalPerfilResponse } from "@/types/portal-profile";

/**
 * Deriva del perfil los contactos/domicilios/afiliaciones "preferidos" que
 * usan tanto la gestion de pedidos existentes como el alta de uno nuevo.
 */
export function usePreferredPortalProfile(perfil: PortalPerfilResponse | null) {
  const contactos = useMemo(
    () => (Array.isArray(perfil?.contactos) ? perfil.contactos : []),
    [perfil],
  );
  const afiliaciones = useMemo(
    () => (Array.isArray(perfil?.afiliaciones) ? perfil.afiliaciones : []),
    [perfil],
  );
  const domicilios = useMemo(
    () => (Array.isArray(perfil?.domicilios) ? perfil.domicilios : []),
    [perfil],
  );

  const verifiedContacts = useMemo(
    () => contactos.filter((contacto) => contacto.id && contacto.verificado === true),
    [contactos],
  );

  const preferredVerifiedContact = useMemo(() => {
    const preferredEmail = pickPreferredContacto(verifiedContacts, "EMAIL");
    const preferredPhone = pickPreferredContacto(verifiedContacts, "TELEFONO");

    return preferredPhone ?? preferredEmail ?? verifiedContacts[0] ?? null;
  }, [verifiedContacts]);

  const preferredAfiliacion = useMemo(
    () => pickPreferredAfiliacion(afiliaciones),
    [afiliaciones],
  );
  const preferredDomicilio = useMemo(
    () => pickPreferredDomicilio(domicilios),
    [domicilios],
  );

  return {
    contactos,
    afiliaciones,
    domicilios,
    verifiedContacts,
    hasVerifiedContact: verifiedContacts.length > 0,
    preferredVerifiedContact,
    preferredAfiliacion,
    preferredAfiliacionId: preferredAfiliacion?.obraSocialId ?? "",
    preferredDomicilio,
    preferredDomicilioId: preferredDomicilio?.id ?? "",
  };
}