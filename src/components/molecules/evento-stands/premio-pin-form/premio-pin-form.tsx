"use client";

import { useState, type FormEvent } from "react";
import Alert from "@/components/atoms/alert/alert";
import PortalButton from "@/components/atoms/button/button";
import { toneClass, type UiTone } from "@/types/ui-tone";
import styles from "./premio-pin-form.module.scss";

type PremioPinFormProps = {
  /** Devuelve un mensaje de error, o null si salió bien. */
  onSubmit: (pin: string) => Promise<string | null>;
  tone?: UiTone;
};

/** Lo usa el personal del stand de premios: ingresa su PIN para marcar la entrega. */
export default function PremioPinForm({ onSubmit, tone = "socios" }: PremioPinFormProps) {
  const [pin, setPin] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (enviando || pin.length < 4) return;
    setEnviando(true);
    setError(null);
    const mensaje = await onSubmit(pin);
    setEnviando(false);
    if (mensaje) {
      setError(mensaje);
      setPin("");
    }
  };

  return (
    <form className={`${styles.form} ${toneClass(tone)}`} onSubmit={handleSubmit}>
      <label className={styles.label} htmlFor="premio-pin">
        Para el personal: ingresá el PIN de entrega
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
      <PortalButton type="submit" tone={tone} disabled={enviando || pin.length < 4}>
        {enviando ? "Confirmando…" : "Confirmar entrega"}
      </PortalButton>
    </form>
  );
}
