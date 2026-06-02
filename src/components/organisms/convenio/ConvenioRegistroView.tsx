"use client";

import { useState } from "react";
import s from "./ConvenioRegistroView.module.scss";

type ClienteEncontrado = {
  nombre: string;
  documento: string;
};

type DniStep = { kind: "dni" };
type FormStep = {
  kind: "form";
  documento: string;
  encontrado: boolean;
  cliente?: ClienteEncontrado;
};
type OtpStep = {
  kind: "otp";
  pendingId: number;
  telefono: string;
};
type SuccessStep = { kind: "success" };

type FlowState = DniStep | FormStep | OtpStep | SuccessStep;

type BuscarClienteResponse = {
  found: boolean;
  clientes?: Array<{ nombre: string; documento: string }>;
};

type StartResponse = {
  pending_id?: number;
  error?: string;
};

type ConfirmResponse = {
  ok?: boolean;
  error?: string;
};

function splitNombre(nombreCompleto: string) {
  const parts = nombreCompleto.trim().split(/\s+/);
  return {
    nombre: parts[0] ?? "",
    apellido: parts.slice(1).join(" ") || "",
  };
}

function primerNombre(nombreCompleto: string) {
  return nombreCompleto.trim().split(/\s+/)[0] ?? nombreCompleto;
}

export function ConvenioRegistroView({ convenio }: { convenio: string }) {
  const [flow, setFlow] = useState<FlowState>({ kind: "dni" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 — DNI
  const [dni, setDni] = useState("");

  // Step 2 — Form (nuevos campos para usuarios nuevos)
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [acepta, setAcepta] = useState(false);

  // Step 3 — OTP
  const [codigo, setCodigo] = useState("");

  const resetError = () => setError(null);

  async function handleBuscarDni(e: React.FormEvent) {
    e.preventDefault();
    resetError();
    const docLimpio = dni.trim().replace(/\D/g, "");
    if (!docLimpio) {
      setError("Ingresá un número de documento válido.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/legacy/cliente/${encodeURIComponent(docLimpio)}`);
      const data: BuscarClienteResponse = await res.json();

      if (data.found && data.clientes && data.clientes.length > 0) {
        const cliente = data.clientes[0];
        setFlow({
          kind: "form",
          documento: docLimpio,
          encontrado: true,
          cliente: { nombre: cliente.nombre, documento: cliente.documento },
        });
      } else {
        setFlow({ kind: "form", documento: docLimpio, encontrado: false });
      }
    } catch {
      setError("No pudimos verificar tu documento. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    resetError();

    if (flow.kind !== "form") return;

    if (!acepta) {
      setError("Necesitás aceptar los términos para continuar.");
      return;
    }

    const telefonoLimpio = telefono.trim();
    if (!telefonoLimpio) {
      setError("Ingresá tu número de teléfono.");
      return;
    }

    let nombreFinal = nombre.trim();
    let apellidoFinal = apellido.trim();

    if (flow.encontrado && flow.cliente) {
      const partes = splitNombre(flow.cliente.nombre);
      nombreFinal = partes.nombre;
      apellidoFinal = partes.apellido;
    } else {
      if (!nombreFinal || !apellidoFinal) {
        setError("Ingresá tu nombre y apellido.");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/legacy/clientes/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Documento: flow.documento,
          Nombre: nombreFinal,
          Apellido: apellidoFinal,
          Telefono: telefonoLimpio,
          ...(email.trim() ? { Email: email.trim() } : {}),
          convenio,
          canal: "CONVENIO",
          aceptaTerminos: true,
        }),
      });

      const data: StartResponse = await res.json();

      if (!res.ok || !data.pending_id) {
        setError(
          data.error === "params_requeridos"
            ? "Completá todos los campos requeridos."
            : "No pudimos iniciar el registro. Intentá de nuevo.",
        );
        return;
      }

      setFlow({ kind: "otp", pendingId: data.pending_id, telefono: telefonoLimpio });
      setCodigo("");
    } catch {
      setError("No pudimos conectarnos. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmarOtp(e: React.FormEvent) {
    e.preventDefault();
    resetError();

    if (flow.kind !== "otp") return;

    const codigoLimpio = codigo.trim();
    if (codigoLimpio.length < 4) {
      setError("Ingresá el código que recibiste.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/legacy/clientes/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pending_id: flow.pendingId,
          codigo: codigoLimpio,
        }),
      });

      const data: ConfirmResponse = await res.json();

      if (!res.ok) {
        if (data.error === "codigo_incorrecto") {
          setError("El código es incorrecto. Verificá y volvé a intentar.");
        } else if (data.error === "codigo_expirado") {
          setError("El código expiró. Volvé al paso anterior para recibir uno nuevo.");
        } else {
          setError("No pudimos verificar el código. Intentá de nuevo.");
        }
        return;
      }

      setFlow({ kind: "success" });
    } catch {
      setError("No pudimos conectarnos. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={s.page}>
      <div className={s.container}>
        <div className={s.header}>
          <p className={s.eyebrow}>Convenio</p>
          <h1 className={s.title}>{convenio}</h1>
          {flow.kind !== "success" && (
            <p className={s.subtitle}>
              Asociate al convenio y accedé a todos los beneficios.
            </p>
          )}
        </div>

        <div className={s.card}>
          {flow.kind !== "success" && (
            <div className={s.steps}>
              <StepDot active={flow.kind === "dni"} done={flow.kind !== "dni"} label="Documento" />
              <div className={s.stepLine} />
              <StepDot
                active={flow.kind === "form"}
                done={flow.kind === "otp" || flow.kind === "success"}
                label="Datos"
              />
              <div className={s.stepLine} />
              <StepDot
                active={flow.kind === "otp"}
                done={flow.kind === "success"}
                label="Verificación"
              />
            </div>
          )}

          {flow.kind === "dni" && (
            <form onSubmit={handleBuscarDni} className={s.form}>
              <h2 className={s.cardTitle}>Ingresá tu número de documento</h2>
              <p className={s.cardSubtitle}>
                Verificamos si ya tenés cuenta para agilizar el proceso.
              </p>
              <div className={s.field}>
                <label className={s.label} htmlFor="dni">
                  DNI / Documento
                </label>
                <input
                  id="dni"
                  className={s.input}
                  type="text"
                  inputMode="numeric"
                  placeholder="Ej: 30123456"
                  value={dni}
                  onChange={(e) => { setDni(e.target.value); resetError(); }}
                  disabled={loading}
                  autoFocus
                />
              </div>
              {error && <p className={s.errorMsg}>{error}</p>}
              <button className={s.primaryButton} type="submit" disabled={loading || !dni.trim()}>
                {loading ? "Verificando..." : "Continuar"}
              </button>
            </form>
          )}

          {flow.kind === "form" && (
            <form onSubmit={handleSubmitForm} className={s.form}>
              {flow.encontrado && flow.cliente ? (
                <>
                  <h2 className={s.cardTitle}>
                    Hola, {primerNombre(flow.cliente.nombre)}
                  </h2>
                  <p className={s.cardSubtitle}>
                    Verificamos tu teléfono para asociarte al convenio{" "}
                    <strong>{convenio}</strong>.
                  </p>
                </>
              ) : (
                <>
                  <h2 className={s.cardTitle}>Completá tus datos</h2>
                  <p className={s.cardSubtitle}>
                    Te registramos en el convenio <strong>{convenio}</strong>.
                  </p>
                </>
              )}

              {!flow.encontrado && (
                <>
                  <div className={s.fieldRow}>
                    <div className={s.field}>
                      <label className={s.label} htmlFor="nombre">
                        Nombre
                      </label>
                      <input
                        id="nombre"
                        className={s.input}
                        type="text"
                        placeholder="Ej: Juan"
                        value={nombre}
                        onChange={(e) => { setNombre(e.target.value); resetError(); }}
                        disabled={loading}
                      />
                    </div>
                    <div className={s.field}>
                      <label className={s.label} htmlFor="apellido">
                        Apellido
                      </label>
                      <input
                        id="apellido"
                        className={s.input}
                        type="text"
                        placeholder="Ej: Pérez"
                        value={apellido}
                        onChange={(e) => { setApellido(e.target.value); resetError(); }}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className={s.field}>
                    <label className={s.label} htmlFor="email">
                      Email <span className={s.optional}>(opcional)</span>
                    </label>
                    <input
                      id="email"
                      className={s.input}
                      type="email"
                      placeholder="Ej: juan@email.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); resetError(); }}
                      disabled={loading}
                    />
                  </div>
                </>
              )}

              <div className={s.field}>
                <label className={s.label} htmlFor="telefono">
                  Teléfono celular
                </label>
                <input
                  id="telefono"
                  className={s.input}
                  type="tel"
                  inputMode="tel"
                  placeholder="Ej: 3871234567"
                  value={telefono}
                  onChange={(e) => { setTelefono(e.target.value); resetError(); }}
                  disabled={loading}
                  autoFocus
                />
                <span className={s.hint}>
                  Recibirás un código de verificación en este número.
                </span>
              </div>

              <label className={s.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={acepta}
                  onChange={(e) => { setAcepta(e.target.checked); resetError(); }}
                  disabled={loading}
                />
                <span>Acepto los términos y condiciones</span>
              </label>

              {error && <p className={s.errorMsg}>{error}</p>}

              <div className={s.formActions}>
                <button
                  type="button"
                  className={s.ghostButton}
                  onClick={() => { setFlow({ kind: "dni" }); resetError(); }}
                  disabled={loading}
                >
                  Atrás
                </button>
                <button
                  className={s.primaryButton}
                  type="submit"
                  disabled={loading || !acepta || !telefono.trim()}
                >
                  {loading ? "Enviando código..." : "Recibir código"}
                </button>
              </div>
            </form>
          )}

          {flow.kind === "otp" && (
            <form onSubmit={handleConfirmarOtp} className={s.form}>
              <h2 className={s.cardTitle}>Ingresá el código</h2>
              <p className={s.cardSubtitle}>
                Te enviamos un código de verificación al teléfono{" "}
                <strong>{flow.telefono}</strong>.
              </p>
              <div className={s.field}>
                <label className={s.label} htmlFor="codigo">
                  Código de verificación
                </label>
                <input
                  id="codigo"
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
              <div className={s.formActions}>
                <button
                  type="button"
                  className={s.ghostButton}
                  onClick={() => {
                    setFlow({ kind: "form", documento: dni.trim().replace(/\D/g, ""), encontrado: false });
                    resetError();
                    setCodigo("");
                  }}
                  disabled={loading}
                >
                  Atrás
                </button>
                <button
                  className={s.primaryButton}
                  type="submit"
                  disabled={loading || codigo.length < 4}
                >
                  {loading ? "Verificando..." : "Confirmar"}
                </button>
              </div>
            </form>
          )}

          {flow.kind === "success" && (
            <div className={s.success}>
              <div className={s.successIcon}>✓</div>
              <h2 className={s.cardTitle}>¡Listo!</h2>
              <p className={s.cardSubtitle}>
                Ya quedaste asociado al convenio <strong>{convenio}</strong>.
              </p>
              <a href="/socios" className={s.primaryButton} style={{ textDecoration: "none", marginTop: "1.5rem", display: "inline-flex", justifyContent: "center" }}>
                Ir al portal
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepDot({
  active,
  done,
  label,
}: {
  active: boolean;
  done: boolean;
  label: string;
}) {
  return (
    <div className={s.stepDotWrapper}>
      <div className={`${s.stepDot} ${active ? s.stepDotActive : ""} ${done ? s.stepDotDone : ""}`}>
        {done ? "✓" : null}
      </div>
      <span className={`${s.stepLabel} ${active ? s.stepLabelActive : ""}`}>{label}</span>
    </div>
  );
}
