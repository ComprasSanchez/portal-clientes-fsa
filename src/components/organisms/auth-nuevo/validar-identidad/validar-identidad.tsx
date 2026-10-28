"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, MessageCircle, Store } from "lucide-react";
import Alert from "@/components/atoms/alert/alert";
import PortalButton from "@/components/atoms/button/button";
import TextField from "@/components/atoms/text-field/text-field";
import AuthCard from "@/components/molecules/auth/auth-card/auth-card";
import EmptyState from "@/components/molecules/empty-state/empty-state";
import MetodoOption from "@/components/molecules/auth/metodo-option/metodo-option";
import { OtpCodeInput } from "@/components/molecules/input-otp/input-otp";
import { Skeleton } from "@/components/ui/skeleton";
import { getSafeRedirectPath } from "@/lib/auth";
import {
  completarAlta,
  confirmarCodigoDeIdentidad,
  consultarIdentidad,
  consultarValidacion,
  dniValido,
  iniciarValidacion,
  limpiarFlow,
  mensajeDeError,
  type IdentidadCanal,
} from "@/lib/auth-nuevo";
import styles from "./validar-identidad.module.scss";

type Vista =
  | { tipo: "cargando" }
  | { tipo: "elegir"; canales: IdentidadCanal[] }
  | { tipo: "whatsapp"; destino: string }
  | { tipo: "codigo"; destino: string }
  | { tipo: "alta" }
  | { tipo: "sucursal" };

const POLL_MS = 4000;

/**
 * La cuenta inició sesión pero todavía no está vinculada a su DNI. Según el caso:
 * validar con WhatsApp o un código al email que ya tenía el cliente, completar
 * nombre/apellido/DNI, o acercarse a una sucursal.
 */
export default function ValidarIdentidad() {
  const searchParams = useSearchParams();
  const destinoFinal = getSafeRedirectPath(searchParams.get("redirectTo"));
  const [vista, setVista] = useState<Vista>({ tipo: "cargando" });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [code, setCode] = useState("");
  const [alta, setAlta] = useState({ nombre: "", apellido: "", nro_documento: "" });
  const pollRef = useRef<number | null>(null);

  const terminar = useCallback(() => {
    limpiarFlow({ alSalir: true });
    window.location.assign(destinoFinal);
  }, [destinoFinal]);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      const r = await consultarIdentidad();
      if (r.status === "LINKED") return terminar();
      if (r.status === "PENDING") return setVista({ tipo: "elegir", canales: r.channels ?? [] });
      if (r.status === "ONBOARDING_REQUIRED") return setVista({ tipo: "alta" });
      setVista({ tipo: "sucursal" });
    } catch (err) {
      setError(mensajeDeError(err));
      setVista({ tipo: "sucursal" });
    }
  }, [terminar]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Mientras espera el botón "Validar" del WhatsApp, consulta cada 4 segundos.
  useEffect(() => {
    if (vista.tipo !== "whatsapp") return;
    pollRef.current = window.setInterval(() => {
      void consultarValidacion()
        .then((r) => {
          if (r.status === "LINKED") terminar();
          if (r.status === "EXPIRED") {
            setError("El mensaje venció. Pedí uno nuevo.");
            void cargar();
          }
        })
        .catch(() => undefined);
    }, POLL_MS);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [vista.tipo, terminar, cargar]);

  const elegir = async (canal: IdentidadCanal) => {
    setEnviando(true);
    setError(null);
    try {
      const r = await iniciarValidacion(canal.channel);
      setVista(
        canal.channel === "whatsapp"
          ? { tipo: "whatsapp", destino: r.validation.destination_masked }
          : { tipo: "codigo", destino: r.validation.destination_masked },
      );
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  };

  const confirmarCodigo = async (e: FormEvent) => {
    e.preventDefault();
    if (code.length !== 6 || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      await confirmarCodigoDeIdentidad(code);
      terminar();
    } catch (err) {
      setError(mensajeDeError(err));
      setCode("");
      setEnviando(false);
    }
  };

  const enviarAlta = async (e: FormEvent) => {
    e.preventDefault();
    if (enviando) return;
    if (!alta.nombre.trim() || !alta.apellido.trim() || !dniValido(alta.nro_documento)) {
      setError("Completá tu nombre, apellido y DNI (sin puntos).");
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const r = await completarAlta(alta);
      if (r.identity_linked) return terminar();
      // El DNI ya era de un cliente con otro email: falta validar que es la persona.
      await cargar();
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  };

  const cerrarSesion = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    limpiarFlow({ alSalir: true });
    window.location.assign("/");
  };

  const pie = (
    <button type="button" className={styles.link} onClick={() => void cerrarSesion()}>
      Cerrar sesión
    </button>
  );

  if (vista.tipo === "cargando") {
    return (
      <AuthCard title="Validá tu identidad" footer={pie}>
        <Skeleton className="h-16 w-full rounded-2xl bg-[#e6f7fb]" />
        <Skeleton className="h-16 w-full rounded-2xl bg-[#e6f7fb]" />
      </AuthCard>
    );
  }

  if (vista.tipo === "alta") {
    return (
      <AuthCard
        title="Completá tu alta"
        subtitle="Necesitamos tus datos para mostrarte tus puntos, compras y pedidos."
        footer={pie}
      >
        <form className={styles.form} onSubmit={enviarAlta} noValidate>
          <TextField
            id="alta-nombre"
            label="Nombre"
            autoComplete="given-name"
            value={alta.nombre}
            onChange={(e) => setAlta((a) => ({ ...a, nombre: e.target.value }))}
          />
          <TextField
            id="alta-apellido"
            label="Apellido"
            autoComplete="family-name"
            value={alta.apellido}
            onChange={(e) => setAlta((a) => ({ ...a, apellido: e.target.value }))}
          />
          <TextField
            id="alta-dni"
            label="DNI"
            inputMode="numeric"
            maxLength={8}
            placeholder="Sin puntos"
            value={alta.nro_documento}
            onChange={(e) =>
              setAlta((a) => ({ ...a, nro_documento: e.target.value.replace(/\D/g, "") }))
            }
          />
          {error && <Alert color="warning">{error}</Alert>}
          <PortalButton type="submit" tone="socios" disabled={enviando}>
            {enviando ? "Guardando…" : "Continuar"}
          </PortalButton>
        </form>
      </AuthCard>
    );
  }

  if (vista.tipo === "sucursal") {
    return (
      <AuthCard title="Validá tu identidad" footer={pie}>
        {error && <Alert color="warning">{error}</Alert>}
        <EmptyState
          icon={Store}
          tone="socios"
          variant="plain"
          title="Acercate a una sucursal"
          text="No pudimos validar tu identidad desde acá. Acercate a cualquier sucursal con tu DNI y te ayudamos."
        />
      </AuthCard>
    );
  }

  if (vista.tipo === "whatsapp") {
    return (
      <AuthCard
        title="Revisá tu WhatsApp"
        subtitle={
          <>
            Te mandamos un mensaje a <strong>{vista.destino}</strong>. Tocá <strong>Validar</strong>{" "}
            en el mensaje y volvé a esta pantalla.
          </>
        }
        onBack={() => void cargar()}
        footer={pie}
      >
        <Alert color="info">Esperando la validación… Se actualiza sola.</Alert>
        {error && <Alert color="warning">{error}</Alert>}
      </AuthCard>
    );
  }

  if (vista.tipo === "codigo") {
    return (
      <AuthCard
        title="Ingresá el código"
        subtitle={
          <>
            Te mandamos un código de 6 dígitos a <strong>{vista.destino}</strong>.
          </>
        }
        onBack={() => void cargar()}
        footer={pie}
      >
        <form className={styles.form} onSubmit={confirmarCodigo} noValidate>
          <OtpCodeInput value={code} onChange={setCode} isInvalid={!!error} autoFocus />
          {error && <Alert color="warning">{error}</Alert>}
          <PortalButton type="submit" tone="socios" disabled={enviando || code.length !== 6}>
            {enviando ? "Validando…" : "Validar"}
          </PortalButton>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Validá tu identidad"
      subtitle="Ya tenemos tus datos como cliente. Para mostrarte tus puntos, compras y pedidos, confirmá que sos vos."
      footer={pie}
    >
      {vista.canales.map((canal) => (
        <MetodoOption
          key={canal.channel}
          icon={canal.channel === "whatsapp" ? <MessageCircle size={22} /> : <Mail size={22} />}
          title={canal.channel === "whatsapp" ? "Por WhatsApp" : "Con un código por email"}
          text={`A ${canal.destination_masked}`}
          onClick={() => void elegir(canal)}
          disabled={enviando}
          tone="socios"
        />
      ))}
      {error && <Alert color="warning">{error}</Alert>}
      <p className={styles.tip}>¿Ese teléfono o email ya no es tuyo? Acercate a una sucursal con tu DNI.</p>
    </AuthCard>
  );
}
