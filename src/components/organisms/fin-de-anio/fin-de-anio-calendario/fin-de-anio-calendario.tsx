"use client";

import { useCallback, useState } from "react";
import Alert from "@/components/atoms/alert/alert";
import PortalButton from "@/components/atoms/button/button";
import BottomSheet from "@/components/molecules/bottom-sheet/bottom-sheet";
import QrScanner from "@/components/molecules/evento-stands/qr-scanner/qr-scanner";
import ListaRegalos from "@/components/molecules/fin-de-anio/lista-regalos/lista-regalos";
import CalendarioCartel from "@/components/molecules/fin-de-anio/calendario-cartel/calendario-cartel";
import CalendarioDia from "@/components/molecules/fin-de-anio/calendario-dia/calendario-dia";
import CalendarioRegalo from "@/components/molecules/fin-de-anio/calendario-regalo/calendario-regalo";
import CalendarioSkeleton from "@/components/molecules/fin-de-anio/calendario-skeleton/calendario-skeleton";
import RegalosPendientes from "@/components/molecules/fin-de-anio/regalos-pendientes/regalos-pendientes";
import TriviaPreguntas from "@/components/molecules/fin-de-anio/trivia-preguntas/trivia-preguntas";
import IdentityGate from "@/components/molecules/identity-gate/identity-gate";
import CalendarioRevelado from "@/components/organisms/fin-de-anio/calendario-revelado/calendario-revelado";
import { useGlobalToast } from "@/components/ui/global-toast";
import {
  BASES_CALENDARIO,
  CALENDARIO_DIAS,
  CALENDARIO_IMAGENES,
  casillaSinDatos,
  estadoCerrado,
  extraerCodigoRetiro,
  fechaDelDia,
  fechaLegible,
  hoyArgentina,
  isModoPruebaCalendario,
  textosDeCasilla,
  type CalendarioDia as Dia,
} from "@/lib/fin-de-anio";
import { useIdentidad } from "@/lib/portal-identidad-context";
import { usePortalCalendario } from "@/lib/use-portal-calendario";
import { usePrecargaImagenes } from "@/lib/use-precarga-imagenes";
import type { CalendarioCasilla, CalendarioRegalo as RegaloDelSocio } from "@/types/portal-calendario";
import styles from "./fin-de-anio-calendario.module.scss";

type Revelado = { dia: Dia; casilla: CalendarioCasilla; animado: boolean };

/** Calendario de regalos de diciembre: cada casilla se abre solo en su día y una vez. */
export default function FinDeAnioCalendario() {
  const identidad = useIdentidad();
  const cal = usePortalCalendario({ enabled: identidad.vinculada });
  const imagenesListas = usePrecargaImagenes(CALENDARIO_IMAGENES);
  const { pushToast } = useGlobalToast();

  const [revelado, setRevelado] = useState<Revelado | null>(null);
  const [verBases, setVerBases] = useState(false);
  const [verValidar, setVerValidar] = useState(false);
  const [escaneando, setEscaneando] = useState(false);
  const [retirando, setRetirando] = useState(false);
  // Lo que retiró recién: se muestra para que el personal sepa qué entregar.
  const [retirados, setRetirados] = useState<RegaloDelSocio[] | null>(null);
  const [abriendo, setAbriendo] = useState(false);
  const [reiniciando, setReiniciando] = useState(false);
  const modoPrueba = isModoPruebaCalendario();
  const cerrarRevelado = useCallback(() => setRevelado(null), []);

  const hoy = cal.calendario?.hoy ?? hoyArgentina();
  const casillaDe = (dia: Dia): CalendarioCasilla =>
    cal.calendario?.casillas.find((c) => c.fecha === fechaDelDia(dia.dia)) ?? casillaSinDatos(dia.dia, hoy);
  const avisar = (title: string, description: string) => pushToast({ variant: "info", title, description });

  const abrirDia = async (dia: Dia) => {
    if (abriendo) return;
    setAbriendo(true);
    try {
      const casilla = await cal.abrir(fechaDelDia(dia.dia));
      setRevelado({ dia, casilla, animado: true });
    } catch (e) {
      const code = (e as { code?: string | null }).code ?? null;
      if (code === "CALENDARIO_DIA_YA_ABIERTO") {
        // Ya estaba abierta (otro celular o doble toque): se muestra directo.
        await cal.refresh();
      }
      avisar("No pudimos abrir el día", e instanceof Error ? e.message : "Probá de nuevo en un rato.");
    } finally {
      setAbriendo(false);
    }
  };

  const handleDia = (dia: Dia) => {
    const casilla = casillaDe(dia);
    switch (casilla.estado) {
      case "ABIERTA":
        setRevelado({ dia, casilla, animado: false });
        return;
      case "VENCIDA":
        avisar("Este día ya pasó", "¡Volvé mañana por la próxima casilla!");
        return;
      case "FUTURA":
        avisar("Todavía no", `Esta casilla se abre el ${fechaLegible(dia.dia)}.`);
        return;
      default:
        if (!identidad.vinculada) setVerValidar(true);
        else void abrirDia(dia);
    }
  };

  const responderTrivia = async (fecha: string, respuestas: Record<string, string>): Promise<string | null> => {
    try {
      const casilla = await cal.responderTrivia(fecha, respuestas);
      setRevelado((prev) => (prev ? { ...prev, casilla, animado: false } : prev));
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "No pudimos enviar tu respuesta.";
    }
  };

  const leerQr = async (texto: string) => {
    if (retirando) return;
    const codigo = extraerCodigoRetiro(texto);
    if (!codigo) {
      avisar("Ese QR no es para retirar regalos", "Pedile al personal de la sucursal que te muestre su QR.");
      return;
    }
    setRetirando(true);
    try {
      const { retirados } = await cal.retirar(codigo);
      setEscaneando(false);
      setRetirados(retirados);
    } catch (e) {
      avisar("No pudimos registrar el retiro", e instanceof Error ? e.message : "Probá de nuevo.");
    } finally {
      setRetirando(false);
    }
  };

  const reiniciar = async () => {
    setReiniciando(true);
    try {
      await cal.reiniciar();
      pushToast({ variant: "success", title: "Listo", description: "Todas las casillas quedaron cerradas otra vez." });
    } catch (e) {
      avisar("No se pudo reiniciar", e instanceof Error ? e.message : "Probá de nuevo.");
    } finally {
      setReiniciando(false);
    }
  };

  if (!imagenesListas || (identidad.vinculada && cal.isLoading)) return <CalendarioSkeleton />;

  const regalosPendientes = cal.calendario?.regalosPendientes.length ?? 0;

  return (
    <section className={styles.page}>
      <p className={styles.bajada}>
        Abrí una casilla por día: cada una tiene una sorpresa y solo se puede abrir en su fecha. ¡No te la pierdas!
      </p>

      {modoPrueba && identidad.vinculada && (
        <Alert color="warning">
          Modo prueba: podés abrir cualquier día.{" "}
          <button type="button" className={styles.link} onClick={() => void reiniciar()} disabled={reiniciando}>
            {reiniciando ? "Cerrando…" : "Cerrar todas otra vez"}
          </button>
        </Alert>
      )}
      {cal.error && (
        <Alert color="warning">
          {cal.error}{" "}
          <button type="button" className={styles.link} onClick={() => void cal.refresh()}>
            Reintentar
          </button>
        </Alert>
      )}
      {regalosPendientes > 0 && (
        <RegalosPendientes cantidad={regalosPendientes} onRetirar={() => setEscaneando(true)} />
      )}

      <div className={styles.grilla}>
        <CalendarioCartel variante="titulo" className={styles.titulo} />
        {CALENDARIO_DIAS.map((dia) => {
          const casilla = casillaDe(dia);
          return casilla.estado === "ABIERTA" ? (
            <CalendarioRegalo
              key={dia.dia}
              dia={dia}
              lineas={textosDeCasilla(casilla, dia.dia).lineas}
              enGrilla
              esHoy={casilla.fecha === hoy}
              onClick={() => handleDia(dia)}
            />
          ) : (
            <CalendarioDia key={dia.dia} dia={dia} estado={estadoCerrado(casilla.estado)} onClick={() => handleDia(dia)} />
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
          textos={textosDeCasilla(revelado.casilla, revelado.dia.dia)}
          animado={revelado.animado}
          esHoy={revelado.casilla.fecha === hoy}
          extra={
            revelado.casilla.contenido?.tipo === "TRIVIA" &&
            !revelado.casilla.trivia?.respondida &&
            (revelado.casilla.fecha === hoy || modoPrueba) ? (
              <TriviaPreguntas
                preguntas={revelado.casilla.contenido.preguntas}
                onResponder={(respuestas) => responderTrivia(revelado.casilla.fecha, respuestas)}
              />
            ) : null
          }
          onCerrar={cerrarRevelado}
          onVerBases={() => setVerBases(true)}
        />
      )}


      <BottomSheet open={escaneando} onClose={() => setEscaneando(false)} title="Retirar mis regalos">
        <QrScanner
          onDetect={(texto) => void leerQr(texto)}
          onClose={() => setEscaneando(false)}
          paused={retirando}
          hint="Apuntá al QR que te muestra el personal"
        />
      </BottomSheet>

      <BottomSheet
        open={retirados !== null}
        onClose={() => setRetirados(null)}
        title="¡Listo! Mostrale esto al personal"
        footer={
          <PortalButton tone="socios" onClick={() => setRetirados(null)}>
            Entendido
          </PortalButton>
        }
      >
        {retirados && (
          <div className={styles.retiro}>
            <p className={styles.retiroTexto}>
              {retirados.length === 1 ? "Te tienen que entregar:" : `Te tienen que entregar ${retirados.length} regalos:`}
            </p>
            <ListaRegalos regalos={retirados} />
          </div>
        )}
      </BottomSheet>

      <BottomSheet open={verValidar} onClose={() => setVerValidar(false)} title="Validá tu identidad">
        <IdentityGate
          tone="socios"
          status={identidad.status}
          motivo="Para abrir las casillas del calendario necesitamos confirmar que esta cuenta es tuya."
        />
      </BottomSheet>

      <BottomSheet
        open={verBases}
        onClose={() => setVerBases(false)}
        title="Bases y condiciones"
        footer={
          <PortalButton tone="socios" onClick={() => setVerBases(false)}>
            Cerrar
          </PortalButton>
        }
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
