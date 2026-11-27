"use client";

import { useState, type FormEvent } from "react";
import { CircleCheck, Pencil, Stethoscope } from "lucide-react";
import { usePortalDrCall } from "@/lib/use-portal-drcall";
import type { ActivarCuentaDrCallBody, SexoDrCall } from "@/types/portal-invitacion";
import styles from "./SociosDosisConexionView.module.scss";

const SEXOS: Array<{ id: SexoDrCall; nombre: string }> = [
  { id: "FEMENINO", nombre: "Femenino" },
  { id: "MASCULINO", nombre: "Masculino" },
  { id: "OTRO", nombre: "Otro" },
];

const sexoLegible = (s: SexoDrCall | null) => SEXOS.find((x) => x.id === s)?.nombre ?? null;

/** "1985-03-20" → "20/03/1985" */
const fechaLegible = (f: string | null) => (f ? f.split("-").reverse().join("/") : null);

/**
 * "Dosis de Conexión": activar la cuenta de Dr. Call con un toque.
 * Médicos → alta como médico (matrícula y especialidad); farmacéuticos y
 * visitadores → alta como paciente. Los datos salen de la ficha del portal;
 * lo que falte se completa acá. Nada se manda a Dr. Call sin tocar "Activar".
 */
export function DosisDrCallCard() {
  const { cuenta, isLoading, activando, error, activar } = usePortalDrCall();
  const [editar, setEditar] = useState(false);
  const [form, setForm] = useState({ email: "", telefono: "", sexo: "", fechaNacimiento: "", matricula: "", especialidadId: "" });

  if (isLoading || !cuenta) return null;

  const esMedico = cuenta.tipo === "medico";
  const d = cuenta.datos;
  const falta = (campo: string) => cuenta.faltan.includes(campo);
  const set = (campo: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [campo]: e.target.value }));

  if (cuenta.activa) {
    return (
      <article className={`${styles.card} ${styles.drcallActiva}`}>
        <h2 className={styles.cardTitulo}>
          <Stethoscope aria-hidden /> Tu cuenta de Dr. Call
        </h2>
        <p className={styles.drcallOk}>
          <CircleCheck aria-hidden /> ¡Tu cuenta está activa!
        </p>
        <p className={styles.texto}>
          {esMedico
            ? "Ya estás en Dr. Call como médico."
            : "Ya podés hacer consultas médicas online con Dr. Call."}
          {d.email && <> Ingresá con tu email <strong>{d.email}</strong>.</>}
        </p>
      </article>
    );
  }

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    const body: ActivarCuentaDrCallBody = {};
    if (form.email.trim()) body.email = form.email.trim();
    if (form.telefono.trim()) body.telefono = form.telefono.trim();
    if (form.sexo) body.sexo = form.sexo as SexoDrCall;
    if (form.fechaNacimiento) body.fechaNacimiento = form.fechaNacimiento;
    if (esMedico) {
      if (form.matricula.trim()) body.matricula = Number(form.matricula.replace(/\D/g, ""));
      if (form.especialidadId) body.especialidadId = form.especialidadId;
    }
    await activar(body);
  };

  const mostrar = (campo: string) => editar || falta(campo);
  const nombreCompleto = [d.nombre, d.apellido].filter(Boolean).join(" ");

  return (
    <article className={`${styles.card} ${styles.drcall}`}>
      <h2 className={styles.cardTitulo}>
        <Stethoscope aria-hidden /> Tu cuenta de Dr. Call
      </h2>
      <p className={styles.texto}>
        {esMedico
          ? "Sumate a Dr. Call, la plataforma de consultas médicas online. Cargá tu matrícula y especialidad y activá tu cuenta."
          : "Consultas médicas online, cuando las necesites. Activá tu cuenta con un toque."}
      </p>

      <form className={styles.drcallForm} onSubmit={enviar} noValidate>
        <dl className={styles.drcallDatos}>
          {nombreCompleto && (
            <div>
              <dt>Nombre</dt>
              <dd>{nombreCompleto}</dd>
            </div>
          )}
          {!mostrar("email") && (
            <div>
              <dt>Email</dt>
              <dd>{d.email}</dd>
            </div>
          )}
          {!mostrar("telefono") && (
            <div>
              <dt>Celular</dt>
              <dd>{d.telefono}</dd>
            </div>
          )}
          {!mostrar("sexo") && (
            <div>
              <dt>Sexo</dt>
              <dd>{sexoLegible(d.sexo)}</dd>
            </div>
          )}
          {!mostrar("fecha_nacimiento") && (
            <div>
              <dt>Nacimiento</dt>
              <dd>{fechaLegible(d.fecha_nacimiento)}</dd>
            </div>
          )}
        </dl>

        {mostrar("email") && (
          <label className={styles.campo}>
            <span>Email</span>
            <input type="email" inputMode="email" autoComplete="email" placeholder={d.email ?? "tu@email.com"} value={form.email} onChange={set("email")} />
          </label>
        )}
        {mostrar("telefono") && (
          <label className={styles.campo}>
            <span>Celular</span>
            <input type="tel" inputMode="tel" autoComplete="tel" placeholder={d.telefono ?? "351 1234567"} value={form.telefono} onChange={set("telefono")} />
          </label>
        )}
        {mostrar("sexo") && (
          <label className={styles.campo}>
            <span>Sexo</span>
            <select value={form.sexo} onChange={set("sexo")}>
              <option value="">{sexoLegible(d.sexo) ?? "Elegí una opción"}</option>
              {SEXOS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </label>
        )}
        {mostrar("fecha_nacimiento") && (
          <label className={styles.campo}>
            <span>Fecha de nacimiento</span>
            <input type="date" value={form.fechaNacimiento || d.fecha_nacimiento || ""} onChange={set("fechaNacimiento")} />
          </label>
        )}

        {esMedico && (
          <div className={styles.drcallMedico}>
            <label className={styles.campo}>
              <span>Matrícula</span>
              <input inputMode="numeric" placeholder="Ej. 21251" value={form.matricula} onChange={set("matricula")} />
            </label>
            <label className={styles.campo}>
              <span>Especialidad</span>
              <select value={form.especialidadId} onChange={set("especialidadId")}>
                <option value="">Elegí tu especialidad</option>
                {(cuenta.especialidades ?? []).map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {!editar && (
          <button type="button" className={styles.linkEditar} onClick={() => setEditar(true)}>
            <Pencil aria-hidden /> Corregir mis datos
          </button>
        )}

        {error && (
          <p className={styles.drcallError} role="alert">
            {error}
          </p>
        )}

        <button type="submit" className={styles.boton} disabled={activando}>
          {activando ? "Activando…" : "Activar mi cuenta"}
        </button>
        <p className={styles.letraChica}>Al activar, compartimos estos datos con Dr. Call para crear tu cuenta.</p>
      </form>
    </article>
  );
}
