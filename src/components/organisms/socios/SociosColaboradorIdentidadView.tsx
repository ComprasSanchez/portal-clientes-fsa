"use client";

import { useState, type FormEvent } from "react";
import { IdCard, Search, ShieldCheck, UserRound } from "lucide-react";
import Alert from "@/components/atoms/alert/alert";
import PortalButton from "@/components/atoms/button/button";
import Card from "@/components/atoms/card/card";
import TextField from "@/components/atoms/text-field/text-field";
import MetodoOption from "@/components/molecules/auth/metodo-option/metodo-option";
import DataList from "@/components/molecules/data-list/data-list";
import {
  buscarIdentidadSocio,
  dniValido,
  mensajeDeError,
  validarIdentidadSocio,
  type BusquedaIdentidad,
  type CuentaIdentidad,
} from "@/lib/auth-nuevo";
import styles from "./SociosColaboradorIdentidadView.module.scss";

type Paso =
  | { tipo: "buscar" }
  | { tipo: "resultado"; dni: string; busqueda: BusquedaIdentidad }
  | { tipo: "confirmar"; dni: string; cuenta: CuentaIdentidad }
  | { tipo: "lista"; cuenta: CuentaIdentidad };

export function SociosColaboradorIdentidadView() {
  const [dni, setDni] = useState("");
  const [paso, setPaso] = useState<Paso>({ tipo: "buscar" });
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const empezarDeNuevo = () => {
    setPaso({ tipo: "buscar" });
    setDni("");
    setError(null);
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
      const busqueda = await buscarIdentidadSocio(limpio);
      setPaso({ tipo: "resultado", dni: limpio, busqueda });
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setCargando(false);
    }
  };

  const validar = async (dniSocio: string, cuenta: CuentaIdentidad) => {
    setError(null);
    setCargando(true);
    try {
      await validarIdentidadSocio(dniSocio, cuenta.cuentaId);
      setPaso({ tipo: "lista", cuenta });
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className={styles.view}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Validar identidades</h1>
        <p className={styles.pageSubtitle}>
          Para clientes que se registraron pero no pueden confirmar que son ellos porque ya no tienen el celular o el
          email que teníamos cargado. Pedile el DNI y validalo acá.
        </p>
      </header>

      <Alert color="info" icon={<ShieldCheck size={18} />} className={styles.panel}>
        Validá solo con el DNI en la mano y si la foto coincide con la persona. Cada validación queda registrada a tu
        nombre.
      </Alert>

      <Card tone="socios" className={styles.panel}>
        {paso.tipo === "buscar" && (
          <form className={styles.form} onSubmit={buscar} noValidate>
            <TextField
              id="identidad-dni"
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
              Buscar
            </PortalButton>
          </form>
        )}

        {paso.tipo === "resultado" && paso.busqueda.estado === "PENDIENTE" && (
          <div className={styles.form}>
            <p className={styles.texto}>
              Preguntale con qué email se registró y elegí su cuenta.
            </p>
            {paso.busqueda.cuentas.map((cuenta) => (
              <MetodoOption
                key={cuenta.cuentaId}
                icon={<UserRound size={22} />}
                title={cuenta.nombre ?? "Sin nombre cargado"}
                text={cuenta.emailMasked ?? "Sin email"}
                onClick={() => setPaso({ tipo: "confirmar", dni: paso.dni, cuenta })}
                tone="socios"
              />
            ))}
            <PortalButton tone="socios" variant="secondary" onClick={empezarDeNuevo}>
              Buscar otro DNI
            </PortalButton>
          </div>
        )}

        {paso.tipo === "resultado" && paso.busqueda.estado === "VINCULADA" && (
          <div className={styles.form}>
            <Alert color="success">
              Este DNI ya tiene la identidad validada
              {paso.busqueda.cuenta.emailMasked ? ` con la cuenta ${paso.busqueda.cuenta.emailMasked}` : ""}. No hace
              falta hacer nada.
            </Alert>
            <p className={styles.texto}>
              Si la persona no reconoce ese email, avisale al equipo de sistemas.
            </p>
            <PortalButton tone="socios" variant="secondary" onClick={empezarDeNuevo}>
              Buscar otro DNI
            </PortalButton>
          </div>
        )}

        {paso.tipo === "resultado" && paso.busqueda.estado === "SIN_CUENTA" && (
          <div className={styles.form}>
            <Alert color="warning">
              Esta persona todavía no se registró en el portal ni en la app. Que se registre con su DNI y después la
              validás acá.
            </Alert>
            <PortalButton tone="socios" variant="secondary" onClick={empezarDeNuevo}>
              Buscar otro DNI
            </PortalButton>
          </div>
        )}

        {paso.tipo === "confirmar" && (
          <div className={styles.form}>
            <DataList
              items={[
                { label: "Nombre", value: paso.cuenta.nombre ?? "Sin nombre cargado" },
                { label: "DNI", value: paso.dni },
                { label: "Email de la cuenta", value: paso.cuenta.emailMasked ?? "Sin email" },
              ]}
            />
            <p className={styles.texto}>
              Confirmá que el DNI es de la persona que tenés enfrente. Al validar, va a ver sus puntos, compras y
              pedidos.
            </p>
            {error && <Alert color="error">{error}</Alert>}
            <div className={styles.acciones}>
              <PortalButton
                tone="socios"
                loading={cargando}
                icon={<IdCard size={18} />}
                onClick={() => validar(paso.dni, paso.cuenta)}
              >
                Validar identidad
              </PortalButton>
              <PortalButton tone="socios" variant="secondary" disabled={cargando} onClick={empezarDeNuevo}>
                Cancelar
              </PortalButton>
            </div>
          </div>
        )}

        {paso.tipo === "lista" && (
          <div className={styles.form}>
            <Alert color="success">
              Listo. {paso.cuenta.nombre ?? "La persona"} ya puede ver sus puntos, compras y pedidos.
            </Alert>
            <p className={styles.texto}>
              Si cambió de celular o de email, que lo actualice desde Mi perfil.
            </p>
            <PortalButton tone="socios" variant="secondary" onClick={empezarDeNuevo}>
              Validar a otra persona
            </PortalButton>
          </div>
        )}
      </Card>
    </div>
  );
}
