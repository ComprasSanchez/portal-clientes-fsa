"use client";

import { useEffect, useRef, useState } from "react";
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
  onLogout: () => void;
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
  onLogout,
}: ConvenioVerificacionModalProps) {
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"form" | "waiting">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const autoRegistered = useRef(false);

  useEffect(() => {
    if (step === "form") phoneRef.current?.focus();
  }, [step]);

  // Poll CRM every 4s until the convenio field is set on the client record
  useEffect(() => {
    if (step !== "waiting" || !documentNumber) return;

    const interval = setInterval(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/legacy/cliente/${encodeURIComponent(documentNumber)}`);
          const data = await res.json().catch(() => null) as { found?: boolean; convenio?: string | null } | null;
          if (data?.found && data.convenio?.toUpperCase() === convenio) {
            clearInterval(interval);
            if (!phoneVerified && principalPhone?.id) {
              await fetch(`/api/portal/me/contactos/${principalPhone.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  tipo: "TELEFONO",
                  valor: `+549${phone.trim()}`,
                  regionIso2: "AR",
                  principal: principalPhone.principal ?? false,
                  verificado: principalPhone.verificado ?? false,
                }),
              });
              void fetch(`/api/portal/me/contactos/${principalPhone.id}/verificar`, {
                method: "POST",
                headers: { Accept: "application/json" },
              });
            }
            onVerified();
          }
        } catch {
          // ignore transient poll errors
        }
      })();
    }, 4000);

    return () => clearInterval(interval);
  }, [step, documentNumber, convenio, phone, phoneVerified, principalPhone, onVerified]);

  // Cliente ya verificado: registrar convenio sin OTP ni WhatsApp
  useEffect(() => {
    if (!phoneVerified || !documentNumber || !principalPhone?.valor) return;
    if (autoRegistered.current) return;
    autoRegistered.current = true;

    const { nombre, apellido } = splitUserName(userName);
    setLoading(true);

    void (async () => {
      try {
        const res = await fetch("/api/legacy/clientes/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            Documento: documentNumber,
            Nombre: nombre,
            Apellido: apellido,
            Telefono: principalPhone.valor,
            convenio,
            canal: "CONVENIO",
            aceptaTerminos: true,
            __updateTelefono: false,
          }),
        });
        if (res.ok) {
          onVerified();
        } else {
          setError("No se pudo registrar el convenio. Intentá de nuevo.");
        }
      } catch {
        setError("Error de conexión.");
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneVerified, documentNumber, principalPhone?.valor]);

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
          Telefono: `+549${phone.trim()}`,
          convenio,
          canal: "CONVENIO",
          aceptaTerminos: true,
        }),
      });
      const data = await res.json().catch(() => null) as { pending_id?: number; error?: string } | null;
      if (!res.ok || !data?.pending_id) {
        setError("No pudimos enviar el mensaje. Revisá el número e intentá de nuevo.");
        return;
      }
      setStep("waiting");
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
          <strong>{convenio}</strong>, confirmá tu teléfono vía WhatsApp.
        </p>

        <p className={s.accountHint}>
          ¿No es tu cuenta?{" "}
          <button type="button" className={s.logoutLink} onClick={onLogout}>
            Cerrar sesión
          </button>
        </p>

        {step === "form" ? (
          <form onSubmit={(e) => void handleStart(e)} className={s.form}>
            <div className={s.field}>
              <label className={s.label} htmlFor="conv-phone">
                Teléfono celular
              </label>
              <div className={s.phoneInputWrap}>
                <span className={s.phonePrefix}>+549</span>
                <input
                  ref={phoneRef}
                  id="conv-phone"
                  className={s.phoneInput}
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "")); resetError(); }}
                  disabled={loading}
                />
              </div>
              <span className={s.hint}>Recibirás un mensaje de WhatsApp en este número.</span>
            </div>
            {error && <p className={s.errorMsg}>{error}</p>}
            <button
              type="submit"
              className={s.primaryButton}
              disabled={loading || !phone.trim()}
            >
              {loading
                ? <><LoaderCircle className={s.spin} size={16} /> Enviando...</>
                : "Recibir mensaje de verificación"}
            </button>
          </form>
        ) : (
          <div className={s.form}>
            <div className={s.otpInfo}>
              <CircleCheckBig size={16} className={s.otpInfoIcon} />
              <span>Mensaje enviado a <strong>+549{phone}</strong></span>
            </div>
            <div className={s.waitingState}>
              <LoaderCircle className={s.spin} size={18} />
              <span>Esperando confirmación...</span>
            </div>
            <p className={s.waitingHint}>
              Tocá el botón <strong>Validar</strong> en el mensaje de WhatsApp para confirmar tu número.
            </p>
            <button
              type="button"
              className={s.backLink}
              onClick={() => { setStep("form"); resetError(); }}
            >
              Cambiar número
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
