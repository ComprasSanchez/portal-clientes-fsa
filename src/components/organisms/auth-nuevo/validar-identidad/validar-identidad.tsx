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
import { trackEvent } from "@/lib/analytics";
import { getSafeRedirectPath } from "@/lib/auth";
import {
  completarAlta,
  confirmarCodigoDeIdentidad,
  consultarIdentidad,
  consultarValidacion,
  dniValido,
  iniciarValidacion,
  iniciarValidacionConContactoPropio,
  limpiarFlow,
  mensajeDeError,
  type IdentidadCanal,
} from "@/lib/auth-nuevo";
import styles from "./validar-identidad.module.scss";

type Vista =
  | { tipo: "cargando" }
  | { tipo: "elegir"; canales: IdentidadCanal[] }
  /** Ficha sin contactos: valida con el email de la cuenta o un celular propio. */
  | { tipo: "propio"; email: string | null }
  | { tipo: "celular"; email: string | null }
  | { tipo: "whatsapp"; destino: string }
  | { tipo: "codigo"; destino: string }
  | { tipo: "alta" }
  | { tipo: "sucursal" }
  /** No se pudo consultar el estado (corte, demora): se reintenta, no es para la sucursal. */
  | { tipo: "error" };

const POLL_MS = 4000;

/**
 * La cuenta inició sesión pero todavía no está vinculada a su DNI. Según el caso:
 * validar con WhatsApp o un código al email que ya tenía el cliente, completar
 * nombre/apellido/DNI, validar con un contacto propio si la ficha no tiene, o
 * acercarse a una sucursal.
 */
export default function ValidarIdentidad() {
  const searchParams = useSearchParams();
  const destinoFinal = getSafeRedirectPath(searchParams.get("redirectTo"));
  const [vista, setVista] = useState<Vista>({ tipo: "cargando" });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [code, setCode] = useState("");
  const [celular, setCelular] = useState("");
  const [alta, setAlta] = useState({ nombre: "", apellido: "", nro_documento: "" });
  const pollRef = useRef<number | null>(null);

  const terminar = useCallback(() => {
    trackEvent("identidad_validada");
    limpiarFlow({ alSalir: true });
    window.location.assign(destinoFinal);
  }, [destinoFinal]);

  /** `retomar`: si hay un envío vigente, vuelve a esa pantalla (false al tocar "volver"). */
  const cargar = useCallback(async (retomar = true) => {
    setError(null);
    try {
      const r = await consultarIdentidad();
      if (r.status === "LINKED") return terminar();
      if (r.status === "PENDING") return setVista({ tipo: "elegir", canales: r.channels ?? [] });
      if (r.status === "ONBOARDING_REQUIRED") return setVista({ tipo: "alta" });
      if (r.self_contact) {
        // Si ya había pedido el mensaje o el código, sigue donde quedó.
        if (retomar && r.validation?.channel === "whatsapp")
          return setVista({ tipo: "whatsapp", destino: r.validation.destination_masked });
        if (retomar && r.validation?.channel === "email")
          return setVista({ tipo: "codigo", destino: r.validation.destination_masked });
        return setVista({ tipo: "propio", email: r.self_contact.email_masked });
      }
      setVista({ tipo: "sucursal" });
    } catch (err) {
      setError(mensajeDeError(err));
      setVista({ tipo: "error" });
    }
  }, [terminar]);

  const reintentar = () => {
    setVista({ tipo: "cargando" });
    void cargar();
  };

  // Sin validar igual puede usar el portal (modo limitado).
  const irAlPortal = () => window.location.assign(destinoFinal);

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

  const validarConEmailPropio = async () => {
    setEnviando(true);
    setError(null);
    try {
      const r = await iniciarValidacionConContactoPropio({ channel: "email" });
      setVista({ tipo: "codigo", destino: r.validation.destination_masked });
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  };

  const validarConCelular = async (e: FormEvent) => {
    e.preventDefault();
    if (enviando) return;
    if (celular.replace(/\D/g, "").length < 10) {
      setError("Ingresá la característica y el número, sin el 0 ni el 15.");
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const r = await iniciarValidacionConContactoPropio({ channel: "whatsapp", telefono: celular });
      setVista({ tipo: "whatsapp", destino: r.validation.destination_masked });
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

  if (vista.tipo === "error") {
    return (
      <AuthCard title="Validá tu identidad" footer={pie}>
        <Alert color="warning">{error ?? "No pudimos cargar tus datos."}</Alert>
        <PortalButton tone="socios" onClick={reintentar}>
          Probar de nuevo
        </PortalButton>
        <PortalButton tone="socios" variant="secondary" onClick={irAlPortal}>
          Ir al portal
        </PortalButton>
      </AuthCard>
    );
  }

  if (vista.tipo === "sucursal") {
    return (
      <AuthCard title="Validá tu identidad" footer={pie}>
        <EmptyState
          icon={Store}
          tone="socios"
          variant="plain"
          title="Terminá la validación en una sucursal"
          text="No pudimos confirmar desde acá que sos vos. Mientras tanto podés seguir usando el portal, y cuando pases por cualquier sucursal con tu DNI terminamos de validar tu identidad."
        />
        <PortalButton tone="socios" onClick={irAlPortal}>
          Ir al portal
        </PortalButton>
      </AuthCard>
    );
  }

  if (vista.tipo === "propio") {
    const { email } = vista;
    return (
      <AuthCard
        title="Validá tu identidad"
        subtitle="Ya tenemos tus datos como cliente. Para mostrarte tus puntos, compras y pedidos, confirmá que sos vos."
        footer={pie}
      >
        {email && (
          <MetodoOption
            icon={<Mail size={22} />}
            title="Con un código por email"
            text={`A ${email}`}
            onClick={() => void validarConEmailPropio()}
            disabled={enviando}
            tone="socios"
          />
        )}
        <MetodoOption
          icon={<MessageCircle size={22} />}
          title="Por WhatsApp"
          text="Te pedimos tu celular"
          onClick={() => {
            setError(null);
            setVista({ tipo: "celular", email });
          }}
          disabled={enviando}
          tone="socios"
        />
        {error && <Alert color="warning">{error}</Alert>}
        <PortalButton tone="socios" variant="secondary" onClick={irAlPortal}>
          Ahora no, ir al portal
        </PortalButton>
      </AuthCard>
    );
  }

  if (vista.tipo === "celular") {
    return (
      <AuthCard
        title="Tu celular"
        subtitle="Te mandamos un WhatsApp para confirmar que sos vos."
        onBack={() => {
          setError(null);
          setVista({ tipo: "propio", email: vista.email });
        }}
        footer={pie}
      >
        <form className={styles.form} onSubmit={validarConCelular} noValidate>
          <TextField
            id="validar-celular"
            label="Celular"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="Ej: 351 6620601"
            hint="Característica y número, sin el 0 ni el 15."
            value={celular}
            onChange={(e) => setCelular(e.target.value)}
            autoFocus
          />
          {error && <Alert color="warning">{error}</Alert>}
          <PortalButton type="submit" tone="socios" disabled={enviando}>
            {enviando ? "Enviando…" : "Enviarme el WhatsApp"}
          </PortalButton>
        </form>
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
        onBack={() => void cargar(false)}
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
        onBack={() => void cargar(false)}
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
