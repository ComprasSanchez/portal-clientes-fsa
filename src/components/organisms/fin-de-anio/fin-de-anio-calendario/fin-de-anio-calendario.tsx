"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import CalendarioCartel from "@/components/molecules/fin-de-anio/calendario-cartel/calendario-cartel";
import CalendarioDia from "@/components/molecules/fin-de-anio/calendario-dia/calendario-dia";
import CalendarioRegalo from "@/components/molecules/fin-de-anio/calendario-regalo/calendario-regalo";
import CalendarioSkeleton from "@/components/molecules/fin-de-anio/calendario-skeleton/calendario-skeleton";
import BottomSheet from "@/components/molecules/bottom-sheet/bottom-sheet";
import PortalButton from "@/components/atoms/button/button";
import CalendarioRevelado from "@/components/organisms/fin-de-anio/calendario-revelado/calendario-revelado";
import Alert from "@/components/atoms/alert/alert";
import { useGlobalToast } from "@/components/ui/global-toast";
import { usePrecargaImagenes } from "@/lib/use-precarga-imagenes";
import { useCalendarioAperturas } from "@/lib/use-calendario-aperturas";
import {
  BASES_CALENDARIO,
  CALENDARIO_DIAS,
  CALENDARIO_IMAGENES,
  estadoDelDia,
  fechaLegible,
  fechaSimulada,
  hoyArgentina,
  isModoPruebaCalendario,
  type CalendarioDia as Dia,
} from "@/lib/fin-de-anio";
import styles from "./fin-de-anio-calendario.module.scss";

type FinDeAnioCalendarioProps = {
  /** Separa lo abierto de cada cuenta en el mismo navegador. */
  cuenta: string;
};

/** Calendario de regalos de diciembre: cada casilla se abre solo en su día. */
export default function FinDeAnioCalendario({ cuenta }: FinDeAnioCalendarioProps) {
  const searchParams = useSearchParams();
  const [hoyReal] = useState(() => hoyArgentina());
  const hoy = fechaSimulada(searchParams.get("fecha")) ?? hoyReal;
  const [revelado, setRevelado] = useState<{ dia: Dia; animado: boolean } | null>(null);
  const [verBases, setVerBases] = useState(false);
  const { pushToast } = useGlobalToast();
  const imagenesListas = usePrecargaImagenes(CALENDARIO_IMAGENES);
  const { abiertos, cargado, marcarAbierto, reiniciar } = useCalendarioAperturas(cuenta);
  const cerrarRevelado = useCallback(() => setRevelado(null), []);

  const estado = (dia: Dia) => estadoDelDia(dia.dia, hoy, abiertos.includes(dia.dia));

  const handleDia = (dia: Dia) => {
    switch (estado(dia)) {
      case "hoy":
        marcarAbierto(dia.dia);
        setRevelado({ dia, animado: true });
        return;
      case "abierto":
        setRevelado({ dia, animado: false });
        return;
      case "vencido":
        pushToast({ variant: "info", title: "Este día ya pasó", description: "¡Volvé mañana por la próxima casilla!" });
        return;
      default:
        pushToast({ variant: "info", title: "Todavía no", description: `Esta casilla se abre el ${fechaLegible(dia.dia)}.` });
    }
  };

  if (!imagenesListas || !cargado) return <CalendarioSkeleton />;

  return (
    <section className={styles.page}>
      <p className={styles.bajada}>
        Abrí una casilla por día: cada una tiene una sorpresa y solo se puede abrir en su fecha. ¡No te la pierdas!
      </p>

      {isModoPruebaCalendario() && (
        <Alert color="warning">
          Modo prueba: todas las casillas se pueden abrir ahora.{" "}
          <button type="button" className={styles.basesLink} onClick={reiniciar}>
            Cerrar todas otra vez
          </button>
        </Alert>
      )}

      <div className={styles.grilla}>
        <CalendarioCartel variante="titulo" className={styles.titulo} />
        {CALENDARIO_DIAS.map((dia) => {
          const e = estado(dia);
          return e === "abierto" ? (
            <CalendarioRegalo
              key={dia.dia}
              dia={dia}
              enGrilla
              esHoy={estadoDelDia(dia.dia, hoy, false) === "hoy"}
              onClick={() => handleDia(dia)}
            />
          ) : (
            <CalendarioDia key={dia.dia} dia={dia} estado={e} onClick={() => handleDia(dia)} />
          );
        })}
        <CalendarioCartel variante="anio-nuevo" className={styles.anioNuevo} />
      </div>

      <button type="button" className={styles.basesLink} onClick={() => setVerBases(true)}>
        Bases y condiciones
      </button>

      {revelado && (
        <CalendarioRevelado
          dia={revelado.dia}
          animado={revelado.animado}
          esHoy={estadoDelDia(revelado.dia.dia, hoy, false) === "hoy"}
          onCerrar={cerrarRevelado}
          onVerBases={() => setVerBases(true)}
        />
      )}

      <BottomSheet
        open={verBases}
        onClose={() => setVerBases(false)}
        title="Bases y condiciones"
        footer={<PortalButton tone="socios" onClick={() => setVerBases(false)}>Cerrar</PortalButton>}
      >
        <ul className={styles.basesLista}>
          {BASES_CALENDARIO.map((punto) => (
            <li key={punto}>{punto}</li>
          ))}
        </ul>
      </BottomSheet>
    </section>
  );
}
