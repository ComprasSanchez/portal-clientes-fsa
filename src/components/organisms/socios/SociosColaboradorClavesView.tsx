"use client";

import { useState, type FormEvent } from "react";
import { Check, Copy, KeyRound, Search, ShieldCheck } from "lucide-react";
import Alert from "@/components/atoms/alert/alert";
import PortalButton from "@/components/atoms/button/button";
import Card from "@/components/atoms/card/card";
import TextField from "@/components/atoms/text-field/text-field";
import DataList from "@/components/molecules/data-list/data-list";
import {
  buscarCuentaSocio,
  dniValido,
  generarClaveSocio,
  mensajeDeError,
  type CuentaSocio,
} from "@/lib/auth-nuevo";
import styles from "./SociosColaboradorClavesView.module.scss";

type Paso =
  | { tipo: "buscar" }
  | { tipo: "confirmar"; dni: string; cuenta: CuentaSocio }
  | { tipo: "lista"; cuenta: CuentaSocio; password: string };

export function SociosColaboradorClavesView() {
  const [dni, setDni] = useState("");
  const [paso, setPaso] = useState<Paso>({ tipo: "buscar" });
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [copiada, setCopiada] = useState(false);

  const empezarDeNuevo = () => {
    setPaso({ tipo: "buscar" });
    setDni("");
    setError(null);
    setCopiada(false);
  };

  const buscar = async (e: FormEvent) => {
    e.preventDefault();
    const limpio = dni.replace(/\D/g, "");
    if (!dniValido(limpio)) {
      setError("Ingresá el DNI de la persona, sin puntos.");
      return;
    }
    setError(null);
    setCargando(true);
    try {
      const { cuenta } = await buscarCuentaSocio(limpio);
      setPaso({ tipo: "confirmar", dni: limpio, cuenta });
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setCargando(false);
    }
  };

  const generar = async (dniSocio: string) => {
    setError(null);
    setCargando(true);
    try {
      const { cuenta, password } = await generarClaveSocio(dniSocio);
      setPaso({ tipo: "lista", cuenta, password });
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setCargando(false);
    }
  };

  const copiar = async (password: string) => {
    try {
      await navigator.clipboard.writeText(password);
      setCopiada(true);
    } catch {
      setCopiada(false);
    }
  };

  return (
    <div className={styles.view}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Cambiar contraseñas</h1>
        <p className={styles.pageSubtitle}>
          Generá una contraseña nueva para un cliente o un colaborador que no puede entrar a su cuenta. A la persona no le llega
          ningún mensaje: pasale la contraseña vos.
        </p>
      </header>

      <Alert color="info" icon={<ShieldCheck size={18} />} className={styles.panel}>
        Cada cambio queda registrado: quién lo hizo, a qué cuenta y cuándo. Usalo solo cuando la persona te lo
        pida.
      </Alert>

      <Card tone="socios" className={styles.panel}>
        {paso.tipo === "buscar" && (
          <form className={styles.form} onSubmit={buscar} noValidate>
            <TextField
              id="claves-dni"
              label="DNI"
              inputMode="numeric"
              autoComplete="off"
              maxLength={10}
              value={dni}
              onChange={(e) => {
                setDni(e.target.value);
                setError(null);
              }}
              error={error}
            />
            <PortalButton type="submit" tone="socios" loading={cargando} icon={<Search size={18} />}>
              Buscar cuenta
            </PortalButton>
          </form>
        )}

        {paso.tipo === "confirmar" && (
          <div className={styles.form}>
            <DataList
              items={[
                { label: "Nombre", value: paso.cuenta.nombre ?? "Sin nombre cargado" },
                { label: "DNI", value: paso.dni },
                { label: "Email de la cuenta", value: paso.cuenta.email_masked ?? "Sin email" },
              ]}
            />
            <p className={styles.texto}>
              Confirmá con la persona que estos datos son suyos antes de generar la contraseña. La que tenía deja
              de funcionar y el cambio queda registrado a tu nombre.
            </p>
            {error && <Alert color="error">{error}</Alert>}
            <div className={styles.acciones}>
              <PortalButton
                tone="socios"
                loading={cargando}
                icon={<KeyRound size={18} />}
                onClick={() => generar(paso.dni)}
              >
                Generar contraseña nueva
              </PortalButton>
              <PortalButton tone="socios" variant="secondary" disabled={cargando} onClick={empezarDeNuevo}>
                Buscar otro DNI
              </PortalButton>
            </div>
          </div>
        )}

        {paso.tipo === "lista" && (
          <div className={styles.form}>
            <Alert color="success">
              Listo. {paso.cuenta.nombre ?? "La persona"} ya puede entrar con su email
              {paso.cuenta.email_masked ? ` (${paso.cuenta.email_masked})` : ""} y esta contraseña.
            </Alert>
            <div className={styles.clave}>
              <span className={styles.claveValor}>{paso.password}</span>
              <button
                type="button"
                className={styles.copiar}
                onClick={() => copiar(paso.password)}
                aria-label="Copiar contraseña"
              >
                {copiada ? <Check size={18} /> : <Copy size={18} />}
                {copiada ? "Copiada" : "Copiar"}
              </button>
            </div>
            <p className={styles.texto}>
              Anotala o pasásela ahora: cuando salgas de esta pantalla no se vuelve a mostrar. Recomendale
              cambiarla por una propia.
            </p>
            <PortalButton tone="socios" variant="secondary" onClick={empezarDeNuevo}>
              Cambiar la de otra persona
            </PortalButton>
          </div>
        )}
      </Card>
    </div>
  );
}
