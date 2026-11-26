"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Lock, ShieldCheck, Trash2 } from "lucide-react";
import Alert from "@/components/atoms/alert/alert";
import PortalButton from "@/components/atoms/button/button";
import BottomSheet from "@/components/molecules/bottom-sheet/bottom-sheet";
import EmptyState from "@/components/molecules/empty-state/empty-state";
import CalendarioMesAdmin from "@/components/molecules/fin-de-anio/calendario-mes-admin/calendario-mes-admin";
import DescuentoGeneralForm from "@/components/molecules/fin-de-anio/descuento-general-form/descuento-general-form";
import DescuentoMarcaForm from "@/components/molecules/fin-de-anio/descuento-marca-form/descuento-marca-form";
import PremioForm from "@/components/molecules/fin-de-anio/premio-form/premio-form";
import SorteoForm from "@/components/molecules/fin-de-anio/sorteo-form/sorteo-form";
import TriviaForm from "@/components/molecules/fin-de-anio/trivia-form/trivia-form";
import SegmentedControl from "@/components/molecules/segmented-control/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fechaLarga,
  guardarDiaAdmin,
  listarDiasAdmin,
  resumenContenido,
  TIPO_DIA_NOMBRE,
  TIPOS_DIA,
  vaciarDiaAdmin,
  type ContenidoAdmin,
  type ContenidoDe,
  type DiaAdmin,
} from "@/lib/calendario-admin";
import { mensajeErrorCalendario } from "@/lib/fin-de-anio";
import type { CalendarioTipoDia } from "@/types/portal-calendario";
import styles from "./calendario-contenido-editor.module.scss";

const mensaje = (e: unknown) => (e instanceof Error ? e.message : mensajeErrorCalendario(null));
const OPCIONES_TIPO = TIPOS_DIA.map((t) => ({ value: t, label: TIPO_DIA_NOMBRE[t] }));

const MOTIVO_BLOQUEO = {
  PASADO: "Este día ya pasó y no se puede cambiar.",
  CON_PARTICIPANTES: "Este día ya lo abrieron socios: queda como estaba.",
  SORTEO_HECHO: "El sorteo de este día ya se hizo.",
} as const;

/** Lo cargado del tipo pedido (si el día tenía otro tipo, el formulario arranca vacío). */
const delTipo = <T extends CalendarioTipoDia>(c: ContenidoAdmin | null, tipo: T) =>
  (c?.tipo === tipo ? c : null) as ContenidoDe<T> | null;

/** Colaboradores habilitados: cargan qué trae cada día del calendario de regalos. */
export default function CalendarioContenidoEditor() {
  const [dias, setDias] = useState<DiaAdmin[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState<DiaAdmin | null>(null);
  const [tipo, setTipo] = useState<CalendarioTipoDia | null>(null);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);
  const [vaciando, setVaciando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      setError(null);
      setDias((await listarDiasAdmin()).dias);
    } catch (e) {
      setError(mensaje(e));
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const abrir = (dia: DiaAdmin) => {
    setErrorGuardar(null);
    setAviso(null);
    setTipo(dia.contenido?.tipo ?? null);
    setEditando(dia);
  };

  const reemplazar = (dia: DiaAdmin) => setDias((prev) => prev?.map((d) => (d.fecha === dia.fecha ? dia : d)) ?? prev);

  const guardar = async (contenido: ContenidoAdmin) => {
    if (!editando) return;
    try {
      setErrorGuardar(null);
      reemplazar(await guardarDiaAdmin(editando.fecha, contenido));
      setAviso(`Listo, quedó cargado el ${fechaLarga(editando.fecha).toLowerCase()}.`);
      setEditando(null);
    } catch (e) {
      setErrorGuardar(mensaje(e));
      // Puede que alguien lo haya abierto mientras tanto: se refresca la lista.
      void cargar();
    }
  };

  const vaciar = async () => {
    if (!editando) return;
    setVaciando(true);
    try {
      await vaciarDiaAdmin(editando.fecha);
      reemplazar({ ...editando, contenido: null });
      setAviso(`Listo, el ${fechaLarga(editando.fecha).toLowerCase()} quedó sin cargar.`);
      setEditando(null);
    } catch (e) {
      setErrorGuardar(mensaje(e));
    } finally {
      setVaciando(false);
    }
  };

  const faltan = dias?.filter((d) => !d.bloqueo && !d.contenido).length ?? 0;
  const formulario = editando && tipo && (
    <>
      {tipo === "DESCUENTO_MARCA" && (
        <DescuentoMarcaForm inicial={delTipo(editando.contenido, tipo)} onGuardar={guardar} error={errorGuardar} />
      )}
      {tipo === "DESCUENTO_GENERAL" && (
        <DescuentoGeneralForm inicial={delTipo(editando.contenido, tipo)} onGuardar={guardar} error={errorGuardar} />
      )}
      {tipo === "TRIVIA" && (
        <TriviaForm inicial={delTipo(editando.contenido, tipo)} onGuardar={guardar} error={errorGuardar} />
      )}
      {tipo === "SORTEO" && (
        <SorteoForm inicial={delTipo(editando.contenido, tipo)} onGuardar={guardar} error={errorGuardar} />
      )}
      {tipo === "PREMIO" && (
        <PremioForm inicial={delTipo(editando.contenido, tipo)} onGuardar={guardar} error={errorGuardar} />
      )}
    </>
  );

  return (
    <div className={styles.view}>
      <header className={styles.encabezado}>
        <h1 className={styles.titulo}>Calendario de regalos</h1>
        <p className={styles.bajada}>
          Tocá un día para elegir qué trae: un descuento, una trivia, un sorteo o un regalo hasta agotar.
        </p>
      </header>

      <Alert color="info" icon={<ShieldCheck size={18} />}>
        Lo que guardes lo ven los socios al abrir ese día. Cuando algún socio ya abrió un día, ese día queda como estaba
        y no se puede cambiar. Los días que ya pasaron tampoco.
      </Alert>

      {aviso && <Alert color="success">{aviso}</Alert>}
      {dias && faltan > 0 && (
        <Alert color="warning">
          {faltan === 1 ? "Falta cargar 1 día." : `Faltan cargar ${faltan} días.`} Sin contenido, ese día el socio no
          puede abrir su casilla.
        </Alert>
      )}

      {error ? (
        <EmptyState
          icon={CalendarDays}
          title="No pudimos traer los días"
          text={error}
          action={
            <PortalButton tone="socios" variant="secondary" onClick={() => void cargar()}>
              Probar de nuevo
            </PortalButton>
          }
        />
      ) : !dias ? (
        <Skeleton className={styles.skeleton} />
      ) : (
        <CalendarioMesAdmin dias={dias} onAbrir={abrir} />
      )}

      <BottomSheet
        open={editando !== null}
        onClose={() => setEditando(null)}
        title={editando ? fechaLarga(editando.fecha) : ""}
      >
        {editando?.bloqueo ? (
          <div className={styles.hoja}>
            <Alert color="neutral" icon={<Lock size={18} />}>
              {MOTIVO_BLOQUEO[editando.bloqueo]}
            </Alert>
            <p className={styles.soloVer}>
              {editando.contenido
                ? `${TIPO_DIA_NOMBRE[editando.contenido.tipo]}: ${resumenContenido(editando.contenido)}`
                : "Este día no tuvo contenido."}
            </p>
          </div>
        ) : (
          editando && (
            <div className={styles.hoja}>
              <div className={styles.tipos}>
                <span className={styles.tiposEtiqueta}>¿Qué trae este día?</span>
                <SegmentedControl
                  variant="pills"
                  className={styles.tiposOpciones}
                  ariaLabel="Tipo de día"
                  options={OPCIONES_TIPO}
                  value={(tipo ?? "") as CalendarioTipoDia}
                  onChange={(t) => {
                    setErrorGuardar(null);
                    setTipo(t);
                  }}
                />
              </div>
              {tipo ? (
                <div key={`${editando.fecha}-${tipo}`}>{formulario}</div>
              ) : (
                <p className={styles.elegi}>Elegí una opción para cargar el día.</p>
              )}
              {editando.contenido && (
                <button type="button" className={styles.vaciar} onClick={() => void vaciar()} disabled={vaciando}>
                  <Trash2 size={16} /> {vaciando ? "Vaciando…" : "Dejar el día sin cargar"}
                </button>
              )}
            </div>
          )
        )}
      </BottomSheet>
    </div>
  );
}
