"use client";

import { useState } from "react";
import { X } from "lucide-react";
import styles from "./ProfileView.module.scss";

type DomicilioFormData = {
  street: string;
  number: string;
  floor: string;
  apartment: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
};

const EMPTY_FORM: DomicilioFormData = {
  street: "",
  number: "",
  floor: "",
  apartment: "",
  city: "",
  province: "",
  postalCode: "",
  country: "Argentina",
};

// Orden y textos del formulario. `id` se mantiene igual que cuando el modal
// vivía dentro de ProfileView.
const FIELDS: Array<{
  field: keyof DomicilioFormData;
  id: string;
  label: string;
  required?: boolean;
}> = [
  { field: "street", id: "profile-address-street", label: "Calle", required: true },
  { field: "number", id: "profile-address-number", label: "Número", required: true },
  { field: "floor", id: "profile-address-floor", label: "Piso" },
  { field: "apartment", id: "profile-address-apartment", label: "Depto" },
  { field: "city", id: "profile-address-city", label: "Ciudad", required: true },
  { field: "province", id: "profile-address-province", label: "Provincia", required: true },
  { field: "postalCode", id: "profile-address-postal-code", label: "Código postal", required: true },
  { field: "country", id: "profile-address-country", label: "País" },
];

const readMutationError = async (response: Response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = (await response.json().catch(() => null)) as {
      error?: string;
      message?: string;
    } | null;

    return data?.message || data?.error || "No se pudo guardar el domicilio.";
  }

  return (
    (await response.text().catch(() => "")) || "No se pudo guardar el domicilio."
  );
};

const createPortalDomicilio = async (form: DomicilioFormData) => {
  const value = (field: keyof DomicilioFormData) => form[field].trim();

  if (FIELDS.some(({ field, required }) => required && !value(field))) {
    throw new Error(
      "Para guardar el domicilio completá calle, número, ciudad, provincia y código postal.",
    );
  }

  const response = await fetch("/api/portal/me/domicilios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      etiqueta: "Principal",
      calle: value("street"),
      numero: value("number"),
      piso: value("floor") || undefined,
      depto: value("apartment") || undefined,
      ciudad: value("city"),
      provincia: value("province"),
      codPostal: value("postalCode"),
      pais: value("country") || "Argentina",
      principal: true,
    }),
  });

  if (!response.ok) {
    throw new Error(await readMutationError(response));
  }
};

interface DomicilioFormModalProps {
  variant?: "cora" | "socios";
  onClose: () => void;
  /** Se llama después de guardar con éxito. El modal no se cierra solo. */
  onCreated: () => void | Promise<void>;
}

/**
 * Modal "Añadir nuevo domicilio". Montarlo solo cuando está abierto: el
 * formulario arranca vacío en cada apertura.
 */
export function DomicilioFormModal({
  variant = "socios",
  onClose,
  onCreated,
}: DomicilioFormModalProps) {
  const [form, setForm] = useState<DomicilioFormData>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (!isSaving) onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;

    try {
      setIsSaving(true);
      setError(null);
      await createPortalDomicilio(form);
      await onCreated();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo guardar el domicilio.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={`${styles.modalOverlay} ${
        variant === "socios" ? styles.profileViewSocios : styles.profileViewCora
      }`}
      onClick={handleClose}
    >
      <div
        className={styles.modalDialog}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="domicilio-modal-title"
      >
        <header className={styles.modalHeader}>
          <div>
            <h2 id="domicilio-modal-title" className={styles.modalTitle}>
              Añadir nuevo domicilio
            </h2>
            <p className={styles.modalSubtitle}>
              Cargá un domicilio nuevo para guardarlo como principal en el
              portal.
            </p>
          </div>

          <button
            type="button"
            className={styles.modalCloseButton}
            onClick={handleClose}
            aria-label="Cerrar formulario de domicilio"
          >
            <X size={22} />
          </button>
        </header>

        <form className={styles.modalForm} onSubmit={handleSubmit}>
          <div className={styles.addressGrid}>
            {FIELDS.map(({ field, id, label, required }) => (
              <div key={field} className={styles.fieldBlock}>
                <label className={styles.fieldLabel} htmlFor={id}>
                  {required ? `${label} *` : label}
                </label>
                <input
                  id={id}
                  type="text"
                  required={required}
                  pattern={required ? ".*\\S.*" : undefined}
                  className={styles.fieldInput}
                  value={form[field]}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      [field]: event.target.value,
                    }))
                  }
                />
              </div>
            ))}
          </div>

          {error ? (
            <p className={styles.profileFeedbackError} role="alert">
              {error}
            </p>
          ) : null}

          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={handleClose}
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.primaryAction}
              disabled={isSaving}
            >
              {isSaving ? "Guardando..." : "Guardar domicilio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
