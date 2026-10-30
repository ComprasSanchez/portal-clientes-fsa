"use client";

import { useState, type FormEvent } from "react";
import Alert from "@/components/atoms/alert/alert";
import PortalButton from "@/components/atoms/button/button";
import { dniValido } from "@/lib/evento-stands";
import { toneClass, type UiTone } from "@/types/ui-tone";
import styles from "./premio-pin-form.module.scss";

type PremioPinFormProps = {
  /** Devuelve un mensaje de error, o null si salió bien. */
  onSubmit: (pin: string, dni?: string) => Promise<string | null>;
  /** Pide también el DNI de quien retira (un premio por DNI). */
  pedirDni?: boolean;
  tone?: UiTone;
};

/**
 * Lo usa el personal del stand de premios: carga su PIN (y, si se pide, el DNI
 * de quien retira) para marcar la entrega.
 */
export default function PremioPinForm({
  onSubmit,
  pedirDni = false,
  tone = "socios",
}: PremioPinFormProps) {
  const [dni, setDni] = useState("");
  const [pin, setPin] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listo = (!pedirDni || dniValido(dni)) && pin.length >= 4;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (enviando || !listo) return;
    setEnviando(true);
    setError(null);
    const mensaje = await onSubmit(pin, pedirDni ? dni : undefined);
    setEnviando(false);
    if (mensaje) {
      setError(mensaje);
      setPin("");
    }
  };

  return (
    <form className={`${styles.form} ${toneClass(tone)}`} onSubmit={handleSubmit}>
      <p className={styles.title}>Para el personal</p>
      {pedirDni && (
        <>
          <label className={styles.label} htmlFor="premio-dni">
            DNI de quien retira
            <span className={styles.hint}>Pedí el DNI y verificá que sea de la persona.</span>
          </label>
          <input
            id="premio-dni"
            className={`${styles.input} ${styles.dni}`}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={9}
            value={dni}
            onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))}
          />
        </>
      )}
      <label className={styles.label} htmlFor="premio-pin">
        PIN de entrega
      </label>
      <input
        id="premio-pin"
        className={styles.input}
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={8}
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
        aria-invalid={!!error}
      />
      {error && <Alert color="warning">{error}</Alert>}
      <PortalButton type="submit" tone={tone} disabled={enviando || !listo}>
        {enviando ? "Confirmando…" : "Confirmar entrega"}
      </PortalButton>
    </form>
  );
}
