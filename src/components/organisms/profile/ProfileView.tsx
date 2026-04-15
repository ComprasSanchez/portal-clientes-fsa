"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Search, UserRound, X } from "lucide-react";
import { ProfileField } from "@/components/molecules/home/ProfileField";
import { getPortalPerfilDetails } from "@/lib/portal-profile";
import type { PortalPerfilResponse } from "@/types/portal-profile";
import styles from "./ProfileView.module.scss";

type ProfileData = {
  fullName: string;
  birthDate: string;
  identification: string;
  legalAddress: string;
  phone: string;
  residenceAddress: string;
  email: string;
  affiliateNumber: string | null;
};

type ProfileViewProps = {
  perfil: PortalPerfilResponse | null;
  variant?: "cora" | "socios";
};

type AffiliationFormData = {
  providerName: string;
  affiliateNumber: string;
  startsAt: string;
  endsAt: string;
  notes: string;
  isCurrent: boolean;
  isHolder: boolean;
  isPrimary: boolean;
};

type LocalAffiliationPreview = {
  providerName: string;
  affiliateNumber: string;
};

const initialAffiliationForm: AffiliationFormData = {
  providerName: "",
  affiliateNumber: "",
  startsAt: "",
  endsAt: "",
  notes: "",
  isCurrent: true,
  isHolder: true,
  isPrimary: false,
};

export function ProfileView({ perfil, variant = "socios" }: ProfileViewProps) {
  const [isAffiliationModalOpen, setIsAffiliationModalOpen] = useState(false);
  const [affiliationForm, setAffiliationForm] = useState<AffiliationFormData>(initialAffiliationForm);
  const [localAffiliationPreview, setLocalAffiliationPreview] = useState<LocalAffiliationPreview | null>(null);

  const profile = useMemo<ProfileData>(() => {
    const details = getPortalPerfilDetails(perfil);

    return {
      fullName: details.displayName,
      birthDate: details.birthDate,
      identification: details.documentNumber ?? "Sin dato",
      legalAddress: details.legalAddress,
      phone: details.phone ?? "Sin dato",
      residenceAddress: details.residenceAddress,
      email: details.email ?? "Sin dato",
      affiliateNumber: details.affiliateNumber,
    };
  }, [perfil]);

  const displayedAffiliateNumber = localAffiliationPreview?.affiliateNumber ?? profile.affiliateNumber;
  const hasAffiliateNumber = Boolean(displayedAffiliateNumber?.trim());
  const hasPendingAffiliationPreview = Boolean(localAffiliationPreview);
  const isSociosVariant = variant === "socios";
  const isAffiliationFormValid =
    affiliationForm.providerName.trim().length > 0 && affiliationForm.affiliateNumber.trim().length > 0;

  const initials = useMemo(() => {
    return profile.fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((name) => name[0]?.toUpperCase() ?? "")
      .join("");
  }, [profile.fullName]);

  const handleOpenAffiliationModal = () => {
    setIsAffiliationModalOpen(true);
  };

  const handleCloseAffiliationModal = () => {
    setIsAffiliationModalOpen(false);
    setAffiliationForm(initialAffiliationForm);
  };

  const handleAffiliationInputChange = <T extends keyof AffiliationFormData>(
    field: T,
    value: AffiliationFormData[T],
  ) => {
    setAffiliationForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleAffiliationSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAffiliationFormValid) {
      return;
    }

    setLocalAffiliationPreview({
      providerName: affiliationForm.providerName.trim(),
      affiliateNumber: affiliationForm.affiliateNumber.trim(),
    });
    handleCloseAffiliationModal();
  };

  return (
    <section className={styles.profileView}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Mis datos</h1>
          <p className={styles.subtitle}>Informacion personal y de contacto</p>
        </div>
      </header>

      <article className={styles.card}>
        <div className={styles.profileTop}>
          <div className={styles.identityColumn}>
            <div className={styles.avatar}>{initials}</div>
          </div>

          <div className={styles.identityInfo}>
            <h2 className={styles.fullName}>{profile.fullName}</h2>

            <div className={styles.sectionsGrid}>
              <section>
                <h3 className={styles.sectionTitle}>Mis datos personales</h3>
                <div className={styles.fieldsGrid}>
                  <ProfileField
                    label="Nombre"
                    value={profile.fullName}
                  />
                  <ProfileField
                    label="Fecha de nacimiento"
                    value={profile.birthDate}
                  />
                  <ProfileField label="Identificacion" value={profile.identification} readOnly />
                  <ProfileField
                    label="Domicilio Legal"
                    value={profile.legalAddress}
                  />
                </div>
              </section>

              <section>
                <h3 className={styles.sectionTitle}>Mis datos de contacto</h3>
                <div className={styles.fieldsGrid}>
                  <ProfileField
                    label="Numero de telefono"
                    value={profile.phone}
                    type="tel"
                  />
                  <ProfileField
                    label="Domicilio de residencia"
                    value={profile.residenceAddress}
                  />
                  <ProfileField
                    label="Mail de notificacion"
                    value={profile.email}
                    type="email"
                  />
                </div>
              </section>
            </div>
          </div>
        </div>

        <div className={styles.divider} />

        <div
          className={`${styles.affiliationCard} ${
            isSociosVariant ? styles.affiliationCardSocios : styles.affiliationCardCora
          }`}
        >
          <div className={styles.affiliationContent}>
            {isSociosVariant ? (
              <>
                <p className={styles.affiliationLabel}>
                  {hasAffiliateNumber ? "Numero de afiliacion" : "Estado de afiliacion"}
                </p>
                <p className={styles.affiliationValue}>
                  {hasAffiliateNumber ? displayedAffiliateNumber : "Sin numero de afiliado"}
                </p>
                {hasPendingAffiliationPreview ? (
                  <p className={styles.affiliationHint}>
                    Obra social cargada: {localAffiliationPreview?.providerName}. Esta actualizacion es local hasta conectar el backend.
                  </p>
                ) : null}
                {!hasAffiliateNumber ? (
                  <p className={styles.affiliationHint}>
                    Todavia no registramos una obra social asociada para este perfil.
                  </p>
                ) : null}
                <button
                  type="button"
                  className={styles.affiliationAction}
                  onClick={handleOpenAffiliationModal}
                >
                  {hasAffiliateNumber ? "Agregar nueva afiliacion" : "Agregar obra social"}
                </button>
              </>
            ) : (
              <>
                <p className={styles.affiliationLabelCora}>Numero de Afiliacion</p>
                <p className={styles.affiliationValueCora}>
                  {hasAffiliateNumber ? displayedAffiliateNumber : "Sin numero de afiliado"}
                </p>
              </>
            )}
          </div>

          <UserRound
            size={28}
            className={isSociosVariant ? styles.affiliationIcon : styles.affiliationIconCora}
          />
        </div>
      </article>

      {isSociosVariant && isAffiliationModalOpen ? (
        <div className={styles.modalOverlay} onClick={handleCloseAffiliationModal}>
          <div
            className={styles.modalDialog}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="affiliation-modal-title"
          >
            <header className={styles.modalHeader}>
              <div>
                <h2 id="affiliation-modal-title" className={styles.modalTitle}>
                  Agregar Nueva Afiliacion
                </h2>
                <p className={styles.modalSubtitle}>
                  Completa los datos de la obra social para este cliente.
                </p>
              </div>

              <button
                type="button"
                className={styles.modalCloseButton}
                onClick={handleCloseAffiliationModal}
                aria-label="Cerrar formulario de afiliacion"
              >
                <X size={22} />
              </button>
            </header>

            <form className={styles.modalForm} onSubmit={handleAffiliationSubmit}>
              <div className={styles.fieldBlock}>
                <label className={styles.fieldLabel} htmlFor="providerName">
                  Buscar Obra Social *
                </label>
                <div className={styles.searchRow}>
                  <input
                    id="providerName"
                    type="text"
                    value={affiliationForm.providerName}
                    onChange={(event) => handleAffiliationInputChange("providerName", event.target.value)}
                    className={styles.fieldInput}
                    placeholder="Ej: OSDE, Swiss Medical, PAMI..."
                  />
                  <button type="button" className={styles.searchButton}>
                    <Search size={16} />
                    Buscar
                  </button>
                </div>
              </div>

              <div className={styles.fieldBlock}>
                <label className={styles.fieldLabel} htmlFor="affiliateNumber">
                  Numero de Afiliado *
                </label>
                <input
                  id="affiliateNumber"
                  type="text"
                  value={affiliationForm.affiliateNumber}
                  onChange={(event) => handleAffiliationInputChange("affiliateNumber", event.target.value)}
                  className={styles.fieldInput}
                  placeholder="Ej: 123456789"
                />
              </div>

              <div className={styles.dateGrid}>
                <div className={styles.fieldBlock}>
                  <label className={styles.fieldLabel} htmlFor="startsAt">
                    Desde
                  </label>
                  <div className={styles.inputWithIcon}>
                    <input
                      id="startsAt"
                      type="text"
                      value={affiliationForm.startsAt}
                      onChange={(event) => handleAffiliationInputChange("startsAt", event.target.value)}
                      className={styles.fieldInput}
                      placeholder="dd/mm/aaaa"
                    />
                    <CalendarDays size={18} className={styles.fieldIcon} />
                  </div>
                </div>

                <div className={styles.fieldBlock}>
                  <label className={styles.fieldLabel} htmlFor="endsAt">
                    Hasta
                  </label>
                  <div className={styles.inputWithIcon}>
                    <input
                      id="endsAt"
                      type="text"
                      value={affiliationForm.endsAt}
                      onChange={(event) => handleAffiliationInputChange("endsAt", event.target.value)}
                      className={styles.fieldInput}
                      placeholder="dd/mm/aaaa"
                    />
                    <CalendarDays size={18} className={styles.fieldIcon} />
                  </div>
                </div>
              </div>

              <div className={styles.fieldBlock}>
                <label className={styles.fieldLabel} htmlFor="notes">
                  Notas
                </label>
                <textarea
                  id="notes"
                  value={affiliationForm.notes}
                  onChange={(event) => handleAffiliationInputChange("notes", event.target.value)}
                  className={styles.fieldTextarea}
                  placeholder="Observaciones adicionales sobre la afiliacion"
                  rows={4}
                />
              </div>

              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={affiliationForm.isCurrent}
                    onChange={(event) => handleAffiliationInputChange("isCurrent", event.target.checked)}
                  />
                  Afiliacion vigente
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={affiliationForm.isHolder}
                    onChange={(event) => handleAffiliationInputChange("isHolder", event.target.checked)}
                  />
                  Es titular
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={affiliationForm.isPrimary}
                    onChange={(event) => handleAffiliationInputChange("isPrimary", event.target.checked)}
                  />
                  Marcar como afiliacion principal
                </label>
              </div>

              <p className={styles.modalNote}>
                Esta carga se refleja solo en pantalla hasta conectar el guardado con backend.
              </p>

              <footer className={styles.modalFooter}>
                <button type="button" className={styles.secondaryAction} onClick={handleCloseAffiliationModal}>
                  Cancelar
                </button>
                <button type="submit" className={styles.primaryAction} disabled={!isAffiliationFormValid}>
                  Guardar Afiliacion
                </button>
              </footer>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
