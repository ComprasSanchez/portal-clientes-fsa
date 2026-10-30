"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Alert from "@/components/atoms/alert/alert";
import PortalButton from "@/components/atoms/button/button";
import Checkbox from "@/components/atoms/checkbox/checkbox";
import TextField from "@/components/atoms/text-field/text-field";
import AuthCard from "@/components/molecules/auth/auth-card/auth-card";
import {
  AuthNuevoError,
  capturarParametrosDeEntrada,
  guardarFlow,
  leerFlow,
  mensajeDeError,
  registrarse,
  validarRegistro,
  type ErroresRegistro,
  type RegistroDatos,
} from "@/lib/auth-nuevo";
import { useAuthFlow } from "@/lib/use-auth-flow";
import styles from "./registro-form.module.scss";

const VACIO: RegistroDatos = { nombre: "", apellido: "", nro_documento: "", email: "", password: "" };

/** Registro corto: nombre, apellido, DNI, email y contraseña. El resto se completa adentro. */
export default function RegistroForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flow = useAuthFlow();
  const [campos, setCampos] = useState<RegistroDatos>(VACIO);
  // Email y "recordar" arrancan con lo que trae la URL o el paso anterior,
  // hasta que la persona los cambie.
  const [emailEditado, setEmailEditado] = useState<string | null>(null);
  const [recordarEditado, setRecordarEditado] = useState<boolean | null>(null);
  const [politica, setPolitica] = useState(false);
  const [errores, setErrores] = useState<ErroresRegistro>({});
  const [error, setError] = useState<{ texto: string; irAlIngreso?: boolean } | null>(null);
  const [enviando, setEnviando] = useState(false);

  const datos: RegistroDatos = {
    ...campos,
    email: emailEditado ?? searchParams.get("email") ?? flow?.email ?? "",
  };
  const recordar = recordarEditado ?? flow?.recordar === true;

  useEffect(() => {
    capturarParametrosDeEntrada(searchParams);
  }, [searchParams]);

  const set = (campo: keyof RegistroDatos) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = campo === "nro_documento" ? e.target.value.replace(/\D/g, "") : e.target.value;
    if (campo === "email") setEmailEditado(value);
    else setCampos((d) => ({ ...d, [campo]: value }));
    setErrores((prev) => ({ ...prev, [campo]: undefined }));
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (enviando) return;
    const encontrados = validarRegistro(datos, politica);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;

    setEnviando(true);
    setError(null);
    try {
      const result = await registrarse(datos, leerFlow().origen);
      guardarFlow({
        email: datos.email.trim().toLowerCase(),
        recordar,
        registro: { flowId: result.flow_id, destination: result.challenge.destination_masked },
      });
      router.push("/registro/verificar");
    } catch (err) {
      const code = err instanceof AuthNuevoError ? err.code : undefined;
      setError({
        texto: mensajeDeError(err),
        irAlIngreso:
          code === "AUTH_REGISTER_EMAIL_IN_USE" || code === "AUTH_REGISTER_DOCUMENTO_ALREADY_LINKED",
      });
      setEnviando(false);
    }
  };

  return (
    <AuthCard
      title="Creá tu cuenta"
      subtitle="Solo te pedimos lo necesario. El resto lo completás después."
      onBack={() => router.push("/ingresar")}
      footer={
        <>
          ¿Ya tenés cuenta?{" "}
          <Link href="/ingresar" className={styles.link}>
            Ingresá
          </Link>
        </>
      }
    >
      <form className={styles.form} onSubmit={enviar} noValidate>
        <div className={styles.row}>
          <TextField
            id="registro-nombre"
            label="Nombre"
            autoComplete="given-name"
            value={datos.nombre}
            onChange={set("nombre")}
            error={errores.nombre}
          />
          <TextField
            id="registro-apellido"
            label="Apellido"
            autoComplete="family-name"
            value={datos.apellido}
            onChange={set("apellido")}
            error={errores.apellido}
          />
        </div>
        <TextField
          id="registro-dni"
          label="DNI"
          inputMode="numeric"
          maxLength={8}
          placeholder="Sin puntos"
          value={datos.nro_documento}
          onChange={set("nro_documento")}
          error={errores.nro_documento}
        />
        <TextField
          id="registro-email"
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={datos.email}
          onChange={set("email")}
          error={errores.email}
        />
        <TextField
          id="registro-password"
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          value={datos.password}
          onChange={set("password")}
          error={errores.password}
          hint="Al menos 8 caracteres."
        />
        <Checkbox
          id="registro-politica"
          checked={politica}
          onChange={(v) => {
            setPolitica(v);
            setErrores((prev) => ({ ...prev, politica: undefined }));
          }}
          label={
            <>
              Acepto la{" "}
              <Link href="/politica-de-privacidad" target="_blank" className={styles.link}>
                política de privacidad
              </Link>
            </>
          }
          tone="socios"
        />
        {errores.politica && <p className={styles.fieldError}>{errores.politica}</p>}
        <Checkbox
          id="registro-recordar"
          checked={recordar}
          onChange={setRecordarEditado}
          label="Mantener la sesión iniciada por 30 días"
          tone="socios"
        />
        {error && (
          <Alert color="warning">
            <span>{error.texto}</span>
            {error.irAlIngreso && (
              <Link href="/ingresar" className={styles.alertAction}>
                Ir a ingresar
              </Link>
            )}
          </Alert>
        )}
        <PortalButton type="submit" tone="socios" disabled={enviando}>
          {enviando ? "Creando tu cuenta…" : "Crear cuenta"}
        </PortalButton>
      </form>
    </AuthCard>
  );
}
