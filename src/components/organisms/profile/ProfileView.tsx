"use client";

import { useMemo, useState } from "react";
import { Pencil, Save, UserRound, X } from "lucide-react";
import { ProfileField } from "@/components/molecules/home/ProfileField";
import styles from "./ProfileView.module.scss";

type ProfileData = {
  fullName: string;
  birthDate: string;
  identification: string;
  legalAddress: string;
  phone: string;
  residenceAddress: string;
  email: string;
  affiliateNumber: string;
};

const initialProfile: ProfileData = {
  fullName: "Luciana Ferreyra",
  birthDate: "14/09/1987",
  identification: "31.482.907",
  legalAddress: "Av. Colon 1845, Piso 3, Depto. B, Cordoba Capital, Cordoba",
  phone: "+54 9 351 612-4387",
  residenceAddress: "Pasaje Los Aromos 742, Barrio General Paz, Cordoba",
  email: "luciana.ferreyra@example.com",
  affiliateNumber: "AF-548213-09",
};

export function ProfileView() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(initialProfile);
  const [draft, setDraft] = useState(initialProfile);

  const initials = useMemo(() => {
    return profile.fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((name) => name[0]?.toUpperCase() ?? "")
      .join("");
  }, [profile.fullName]);

  const updateDraft = (field: keyof ProfileData, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleEdit = () => {
    setDraft(profile);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setDraft(profile);
    setIsEditing(false);
  };

  const handleSave = () => {
    setProfile(draft);
    setIsEditing(false);
  };

  const activeData = isEditing ? draft : profile;

  return (
    <section className={styles.profileView}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Mis datos</h1>
          <p className={styles.subtitle}>Informacion personal y de contacto</p>
        </div>

        <div className={styles.headerActions}>
          {isEditing ? (
            <>
              <button onClick={handleSave} className={styles.primaryButton}>
                <Save size={16} />
                Guardar
              </button>
              <button onClick={handleCancel} className={styles.secondaryButton}>
                <X size={16} />
                Cancelar
              </button>
            </>
          ) : (
            <button onClick={handleEdit} className={styles.primaryButton}>
              <Pencil size={16} />
              Editar
            </button>
          )}
        </div>
      </header>

      <article className={styles.card}>
        <div className={styles.profileTop}>
          <div className={styles.identityColumn}>
            <div className={styles.avatar}>{initials}</div>
          </div>

          <div className={styles.identityInfo}>
            <h2 className={styles.fullName}>{activeData.fullName}</h2>

            <div className={styles.sectionsGrid}>
              <section>
                <h3 className={styles.sectionTitle}>Mis datos personales</h3>
                <div className={styles.fieldsGrid}>
                  <ProfileField
                    label="Nombre"
                    value={activeData.fullName}
                    isEditing={isEditing}
                    onChange={(value) => updateDraft("fullName", value)}
                  />
                  <ProfileField
                    label="Fecha de nacimiento"
                    value={activeData.birthDate}
                    isEditing={isEditing}
                    onChange={(value) => updateDraft("birthDate", value)}
                  />
                  <ProfileField label="Identificacion" value={activeData.identification} readOnly />
                  <ProfileField
                    label="Domicilio Legal"
                    value={activeData.legalAddress}
                    isEditing={isEditing}
                    onChange={(value) => updateDraft("legalAddress", value)}
                  />
                </div>
              </section>

              <section>
                <h3 className={styles.sectionTitle}>Mis datos de contacto</h3>
                <div className={styles.fieldsGrid}>
                  <ProfileField
                    label="Numero de telefono"
                    value={activeData.phone}
                    isEditing={isEditing}
                    onChange={(value) => updateDraft("phone", value)}
                    type="tel"
                  />
                  <ProfileField
                    label="Domicilio de residencia"
                    value={activeData.residenceAddress}
                    isEditing={isEditing}
                    onChange={(value) => updateDraft("residenceAddress", value)}
                  />
                  <ProfileField
                    label="Mail de notificacion"
                    value={activeData.email}
                    isEditing={isEditing}
                    onChange={(value) => updateDraft("email", value)}
                    type="email"
                  />
                </div>
              </section>
            </div>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.affiliationCard}>
          <div>
            <p className={styles.affiliationLabel}>Numero de Afiliacion</p>
            <p className={styles.affiliationValue}>{profile.affiliateNumber}</p>
          </div>

          <UserRound size={28} className={styles.affiliationIcon} />
        </div>
      </article>
    </section>
  );
}
