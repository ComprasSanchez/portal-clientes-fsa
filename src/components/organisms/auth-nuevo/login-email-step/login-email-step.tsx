"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Alert from "@/components/atoms/alert/alert";
import PortalButton from "@/components/atoms/button/button";
import TextField from "@/components/atoms/text-field/text-field";
import AuthCard from "@/components/molecules/auth/auth-card/auth-card";
import {
  buscarEmail,
  capturarParametrosDeEntrada,
  destinoDespuesDelIngreso,
  emailValido,
  guardarFlow,
  mensajeDeError,
} from "@/lib/auth-nuevo";
import { useAuthFlow } from "@/lib/use-auth-flow";
import styles from "./login-email-step.module.scss";

type Aviso = {
  color: "info" | "warning";
  texto: string;
  accion?: { label: string; href: string };
};

const registroHref = (email: string) => `/registro?email=${encodeURIComponent(email.trim())}`;

/** Paso 1 del ingreso: el email. Según si tiene cuenta, sigue al método o invita a registrarse. */
export default function LoginEmailStep() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flow = useAuthFlow();
  // Arranca con el email de la URL o del paso anterior, hasta que se edite.
  const [emailEditado, setEmail] = useState<string | null>(null);
  const email = emailEditado ?? searchParams.get("email") ?? flow?.email ?? "";
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    capturarParametrosDeEntrada(searchParams);
  }, [searchParams]);

  const continuar = async (e: FormEvent) => {
    e.preventDefault();
    setAviso(null);
    if (!emailValido(email)) {
      setError("Ingresá un email válido.");
      return;
    }
    setError(null);
    setBuscando(true);
    try {
      const { status } = await buscarEmail(email);
      guardarFlow({ email: email.trim().toLowerCase(), challenge: undefined });
      if (status === "ACCOUNT") {
        router.push("/ingresar/metodo");
        return;
      }
      setAviso(
        status === "ACCOUNT_UNVERIFIED"
          ? {
              color: "warning",
              texto:
                "Todavía no confirmaste tu email. Completá de nuevo el registro con este email y te enviamos un código para confirmarlo.",
              accion: { label: "Confirmar mi email", href: registroHref(email) },
            }
          : status === "CLIENTE_WITHOUT_ACCOUNT"
            ? {
                color: "info",
                texto: "¡Ya sos cliente! Creá tu cuenta para ver tus puntos, compras y pedidos.",
                accion: { label: "Crear mi cuenta", href: registroHref(email) },
              }
            : {
                color: "info",
                texto: "No encontramos una cuenta con ese email.",
                accion: { label: "Crear cuenta", href: registroHref(email) },
              },
      );
    } catch (err) {
      setAviso({ color: "warning", texto: mensajeDeError(err) });
    } finally {
      setBuscando(false);
    }
  };

  const ingresarConGoogle = () => {
    const destino = destinoDespuesDelIngreso();
    window.location.assign(
      `/api/v2/auth/providers/google/start?redirectTo=${encodeURIComponent(destino)}`,
    );
  };

  return (
    <AuthCard
      title="Iniciar sesión"
      subtitle="Ingresá a tu cuenta de Farmacias Sanchez Antoniolli"
    >
      <form className={styles.form} onSubmit={continuar} noValidate>
        <TextField
          id="ingresar-email"
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Ingresá tu email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setAviso(null);
          }}
          error={error}
          autoFocus
        />
        {aviso && <Alert color={aviso.color}>{aviso.texto}</Alert>}
        {aviso?.accion && (
          <PortalButton
            variant="secondary"
            tone="socios"
            onClick={() => router.push(aviso.accion!.href)}
          >
            {aviso.accion.label}
          </PortalButton>
        )}
        <PortalButton type="submit" tone="socios" loading={buscando}>
          {buscando ? "Continuando…" : "Continuar"}
        </PortalButton>
      </form>

      <Link href="/registro" className={styles.textLink}>
        Hacete socio
      </Link>

      <div className={styles.separator}>
        <span>o</span>
      </div>

      <PortalButton variant="google" onClick={ingresarConGoogle} disabled={buscando}>
        Continuar con Google
      </PortalButton>
    </AuthCard>
  );
}
