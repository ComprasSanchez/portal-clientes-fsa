"use client";

import { useState } from "react";
import { CircleCheckBig, LoaderCircle, ShieldCheck } from "lucide-react";
import s from "./ConvenioVerificacionModal.module.scss";

interface PhoneContact {
  id?: string;
  valor?: string;
  principal?: boolean;
  verificado?: boolean;
}

interface ConvenioVerificacionModalProps {
  convenio: string;
  documentNumber: string | null;
  userName: string;
  principalPhone: PhoneContact | null;
  phoneVerified: boolean;
  onVerified: () => void;
}

function splitUserName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return { nombre: parts[0] ?? "", apellido: parts.slice(1).join(" ") || (parts[0] ?? "") };
}

export function ConvenioVerificacionModal({
  convenio,
  documentNumber,
  userName,
  principalPhone,
  phoneVerified,
  onVerified,
}: ConvenioVerificacionModalProps) {
  const [phone, setPhone] = useState(() => principalPhone?.valor ?? "");
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [codigo, setCodigo] = useState("");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetError = () => setError(null);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentNumber || !phone.trim()) return;
    setLoading(true);
    resetError();
    const { nombre, apellido } = splitUserName(userName);
    try {
      const res = await fetch("/api/legacy/clientes/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Documento: documentNumber,
          Nombre: nombre,
          Apellido: apellido,
          Telefono: phone.trim(),
          convenio,
          canal: "CONVENIO",
          aceptaTerminos: true,
        }),
      });
      const data = await res.json().catch(() => null) as { pending_id?: number; error?: string } | null;
      if (!res.ok || !data?.pending_id) {
        setError("No pudimos enviar el código. Revisá el número e intentá de nuevo.");
        return;
      }
      setPendingId(data.pending_id);
      setStep("otp");
      setCodigo("");
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingId) return;
    setLoading(true);
    resetError();
    try {
      const res = await fetch("/api/legacy/clientes/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pending_id: pendingId, codigo: codigo.trim() }),
      });
      const data = await res.json().catch(() => null) as { ok?: boolean; error?: string } | null;
      if (!res.ok) {
        setError(
          data?.error === "codigo_incorrecto"
            ? "El código es incorrecto. Revisalo e intentá de nuevo."
            : data?.error === "codigo_expirado"
            ? "El código expiró. Volvé al paso anterior."
            : "No pudimos verificar el código. Intentá de nuevo."
        );
        return;
      }

      localStorage.setItem(`convenio_reg_${convenio}`, "1");

      // Disparar verificación de teléfono en el portal si aún no está verificado
      if (!phoneVerified && principalPhone?.id) {
        if (
          principalPhone.valor?.startsWith("+54") &&
          !principalPhone.valor?.startsWith("+549")
        ) {
          const normalizedValor = "+549" + principalPhone.valor.slice(3);
          await fetch(`/api/portal/me/contactos/${principalPhone.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tipo: "TELEFONO",
              valor: normalizedValor,
              regionIso2: "AR",
              principal: principalPhone.principal ?? false,
              verificado: principalPhone.verificado ?? false,
            }),
          });
        }
        void fetch(`/api/portal/me/contactos/${principalPhone.id}/verificar`, {
          method: "POST",
          headers: { Accept: "application/json" },
        });
      }

      onVerified();
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.overlay}>
      <div className={s.modal} role="dialog" aria-modal="true" aria-labelledby="convenio-modal-title">
        <div className={s.iconWrap}>
          <ShieldCheck size={28} />
        </div>

        <h2 id="convenio-modal-title" className={s.title}>
          Verificá tu número de teléfono
        </h2>
        <p className={s.subtitle}>
          Para activar tu cuenta en el convenio{" "}
          <strong>{convenio}</strong>, confirmá tu teléfono con el código que te enviamos.
        </p>

        {step === "form" ? (
          <form onSubmit={(e) => void handleStart(e)} className={s.form}>
            <div className={s.field}>
              <label className={s.label} htmlFor="conv-phone">
                Teléfono celular
              </label>
              <input
                id="conv-phone"
                className={s.input}
                type="tel"
                inputMode="tel"
                placeholder="Ej: 3871234567"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); resetError(); }}
                disabled={loading}
                autoFocus
              />
              <span className={s.hint}>Recibirás un código en este número.</span>
            </div>
            {error && <p className={s.errorMsg}>{error}</p>}
            <button
              type="submit"
              className={s.primaryButton}
              disabled={loading || !phone.trim()}
            >
              {loading
                ? <><LoaderCircle className={s.spin} size={16} /> Enviando...</>
                : "Recibir código de verificación"}
            </button>
          </form>
        ) : (
          <form onSubmit={(e) => void handleConfirm(e)} className={s.form}>
            <div className={s.otpInfo}>
              <CircleCheckBig size={16} className={s.otpInfoIcon} />
              <span>Código enviado a <strong>{phone}</strong></span>
            </div>
            <div className={s.field}>
              <label className={s.label} htmlFor="conv-otp">
                Código de verificación
              </label>
              <input
                id="conv-otp"
                className={s.otpInput}
                type="text"
                inputMode="numeric"
                placeholder="• • • • • •"
                maxLength={8}
                value={codigo}
                onChange={(e) => { setCodigo(e.target.value.replace(/\D/g, "")); resetError(); }}
                disabled={loading}
                autoFocus
                autoComplete="one-time-code"
              />
            </div>
            {error && <p className={s.errorMsg}>{error}</p>}
            <button
              type="submit"
              className={s.primaryButton}
              disabled={loading || codigo.length < 4}
            >
              {loading
                ? <><LoaderCircle className={s.spin} size={16} /> Verificando...</>
                : "Confirmar"}
            </button>
            <button
              type="button"
              className={s.backLink}
              onClick={() => { setStep("form"); resetError(); setCodigo(""); }}
              disabled={loading}
            >
              Cambiar número
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
