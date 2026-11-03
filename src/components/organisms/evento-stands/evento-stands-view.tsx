"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleHelp, QrCode, Sparkles } from "lucide-react";
import Alert from "@/components/atoms/alert/alert";
import BackButton from "@/components/atoms/back-button/back-button";
import Badge from "@/components/atoms/badge/badge";
import PortalButton from "@/components/atoms/button/button";
import Card from "@/components/atoms/card/card";
import BottomSheet from "@/components/molecules/bottom-sheet/bottom-sheet";
import EmptyState from "@/components/molecules/empty-state/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import ComoFunciona from "@/components/molecules/evento-stands/como-funciona/como-funciona";
import EscanearCta from "@/components/molecules/evento-stands/escanear-cta/escanear-cta";
import PremioEstado from "@/components/molecules/evento-stands/premio-estado/premio-estado";
import PremioPinForm from "@/components/molecules/evento-stands/premio-pin-form/premio-pin-form";
import ProgresoCard from "@/components/molecules/evento-stands/progreso-card/progreso-card";
import QrScanner from "@/components/molecules/evento-stands/qr-scanner/qr-scanner";
import StandGrid from "@/components/molecules/evento-stands/stand-grid/stand-grid";
import StandsEscaneados from "@/components/molecules/evento-stands/stands-escaneados/stands-escaneados";
import Checkbox from "@/components/atoms/checkbox/checkbox";
import {
  BASES_EVENTO_URL,
  extraerCodigoDeQr,
  isEventoStandsActivo,
  nombresEscaneados,
  PEDIR_DNI_EN_ENTREGA,
  pasosComoFunciona,
  premioCopy,
  subtituloEvento,
  textoProgresoPremio,
  textoStandsParaDescubrir,
} from "@/lib/evento-stands";
import { usePortalEventoStands } from "@/lib/use-portal-evento-stands";
import { toneClass } from "@/types/ui-tone";
import styles from "./evento-stands-view.module.scss";

type EventoStandsViewProps = {
  /** URL de la vista sin el código del stand; se usa para limpiar `?stand=` después de registrarlo. */
  urlVista: string;
  onBack: () => void;
};

type Aviso = { color: "success" | "warning"; texto: string } | null;

const TONE = "breve" as const;
/** Mientras carga, se muestra la regla por defecto del evento. */
const MINIMO_POR_DEFECTO = 5;
const PAGE_CLASS = `${styles.page} ${toneClass(TONE)}`;

export default function EventoStandsView({ urlVista, onBack }: EventoStandsViewProps) {
  const router = useRouter();
  // Los QR abren /evento/<codigo>, que redirige acá con ?stand=<codigo>.
  const codigo = useSearchParams().get("stand") ?? undefined;
  const { avance, loading, error, escanear, entregar, aceptarTerminos } =
    usePortalEventoStands();
  const [aviso, setAviso] = useState<Aviso>(null);
  const [destacado, setDestacado] = useState<number | null>(null);
  const [scannerAbierto, setScannerAbierto] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [ayudaAbierta, setAyudaAbierta] = useState(false);
  /** Nombre del stand cuando escanea un QR que ya tenía (abre el aviso). */
  const [repetido, setRepetido] = useState<string | null>(null);
  // Hasta aceptar las bases, "Cómo funciona" se abre solo (celular y escritorio).
  const [terminosCerrado, setTerminosCerrado] = useState(false);
  const [aceptaBases, setAceptaBases] = useState(false);
  const [aceptando, setAceptando] = useState(false);
  const [errorTerminos, setErrorTerminos] = useState<string | null>(null);
  const codigoInicialProcesado = useRef(false);
  const activo = isEventoStandsActivo();
  const terminosAceptados = !!avance?.terminos_aceptados;
  const pideTerminos = !!avance && !terminosAceptados;
  const sheetAbierto = ayudaAbierta || (pideTerminos && !terminosCerrado);

  const cerrarAyuda = () => {
    setAyudaAbierta(false);
    setTerminosCerrado(true);
  };

  const handleAceptarTerminos = async () => {
    setAceptando(true);
    setErrorTerminos(null);
    const r = await aceptarTerminos();
    setAceptando(false);
    if (r.ok) setAyudaAbierta(false);
    else setErrorTerminos(r.message);
  };

  const registrar = async (cod: string) => {
    setProcesando(true);
    const r = await escanear(cod);
    setProcesando(false);
    if (r.ok && r.yaEscaneado) {
      setDestacado(r.standNumero ?? null);
      setAviso(null);
      setRepetido(r.standNombre ?? `Stand ${r.standNumero}`);
    } else if (r.ok) {
      setDestacado(r.standNumero ?? null);
      setAviso({
        color: "success",
        texto: `¡${r.standNombre ?? `Stand ${r.standNumero}`} escaneado!`,
      });
    } else {
      setAviso({ color: "warning", texto: r.message });
    }
    return r.ok;
  };

  // El código del QR se registra una sola vez y se limpia la URL
  // (así recargar o compartir la página no vuelve a mandar el código).
  // Si todavía no aceptó las bases, queda pendiente y se registra al aceptar.
  useEffect(() => {
    if (!activo || !codigo || !terminosAceptados || codigoInicialProcesado.current) return;
    codigoInicialProcesado.current = true;
    void registrar(codigo).finally(() => router.replace(urlVista, { scroll: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo, codigo, terminosAceptados]);

  const abrirScanner = () => {
    setAviso(null);
    if (!terminosAceptados) {
      setAyudaAbierta(true);
      return;
    }
    setScannerAbierto(true);
  };

  const handleDetect = async (texto: string) => {
    if (procesando) return;
    const cod = extraerCodigoDeQr(texto);
    if (!cod) {
      setAviso({ color: "warning", texto: "Ese QR no es de un stand del evento." });
      setScannerAbierto(false);
      return;
    }
    await registrar(cod);
    setScannerAbierto(false);
  };

  const handleEntregar = async (pin: string, dni?: string) => {
    const r = await entregar(pin, dni);
    return r.ok ? null : r.message;
  };

  if (!activo) {
    return (
      <div className={PAGE_CLASS}>
        <EmptyState
          icon={QrCode}
          tone={TONE}
          title="El juego de stands terminó"
          text="¡Gracias por participar!"
        />
      </div>
    );
  }

  const premio = avance ? premioCopy(avance) : null;
  const minimo = avance?.minimo_premio ?? MINIMO_POR_DEFECTO;
  // Al llegar a la meta ya no se ofrece escanear: el foco pasa a retirar el regalo.
  const puedeEscanear =
    !!avance &&
    avance.escaneados < avance.minimo_premio &&
    !avance.premio_entregado &&
    !avance.premios_agotados;

  return (
    <div className={PAGE_CLASS}>
      <header className={styles.header}>
        <div className={styles.topBar}>
          <BackButton ariaLabel="Volver al inicio" onClick={onBack} tone={TONE} />
          <Badge
            tone={TONE}
            color="primary"
            uppercase
            icon={<Sparkles size={16} className={styles.badgeIcon} />}
          >
            Aniversario Breve
          </Badge>
        </div>
        <h1 className={styles.title}>Recorré, probá y ganá</h1>
        <p className={styles.subtitle}>{subtituloEvento(minimo)}</p>
        <button type="button" className={styles.ayudaButton} onClick={() => setAyudaAbierta(true)}>
          <CircleHelp size={18} aria-hidden />
          ¿Cómo funciona?
        </button>
      </header>

      {aviso && (
        <Alert color={aviso.color} className={styles.aviso}>
          {aviso.texto}
        </Alert>
      )}

      {loading && !avance && (
        <div className={styles.layout}>
          <Skeleton className="h-56 w-full rounded-2xl bg-[#f4f4f2]" />
          <Skeleton className="h-96 w-full rounded-2xl bg-[#f4f4f2]" />
        </div>
      )}

      {error && !avance && <Alert color="warning">{error}</Alert>}

      {avance && premio && (
        <div className={`${styles.layout} ${puedeEscanear ? styles.conBotonFlotante : ""}`}>
          <div className={styles.progreso}>
            <ProgresoCard
              escaneados={avance.escaneados}
              meta={avance.minimo_premio}
              texto={textoProgresoPremio(avance)}
              tone={TONE}
            />
          </div>

          {puedeEscanear && (
            <div className={styles.escanear}>
              <EscanearCta
                onClick={abrirScanner}
                disabled={procesando}
                flotanteEnCelular
                tone={TONE}
              />
            </div>
          )}

          <div className={styles.premio}>
            <Card tone={TONE}>
              <PremioEstado
                estado={premio.estado}
                title={premio.title}
                text={premio.text}
                tone={TONE}
              />
              {premio.estado !== "bloqueado" && (
                <div className={styles.premioDetalle}>
                  <StandsEscaneados nombres={nombresEscaneados(avance)} tone={TONE} />
                  {premio.estado === "habilitado" && (
                    <PremioPinForm
                      onSubmit={handleEntregar}
                      pedirDni={PEDIR_DNI_EN_ENTREGA}
                      tone={TONE}
                    />
                  )}
                </div>
              )}
            </Card>
          </div>

          <section className={styles.stands}>
            <div className={styles.standsHeader}>
              <h2 className={styles.standsTitle}>Stands para descubrir</h2>
              <p className={styles.standsCount}>{avance.total} en total</p>
            </div>
            <p className={styles.standsText}>
              {textoStandsParaDescubrir(avance.minimo_premio, avance.total)}
            </p>
            <StandGrid
              stands={avance.stands}
              destacado={destacado}
              onSelectPendiente={puedeEscanear ? abrirScanner : undefined}
              tone={TONE}
            />
          </section>

          <div className={styles.comoFunciona}>
            <Card tone={TONE}>
              <h2 className={styles.sectionTitle}>Cómo funciona</h2>
              <div className={styles.comoFuncionaBody}>
                <ComoFunciona pasos={pasosComoFunciona(avance.minimo_premio)} tone={TONE} />
              </div>
            </Card>
          </div>
        </div>
      )}

      <BottomSheet
        open={sheetAbierto}
        onClose={cerrarAyuda}
        title="Cómo funciona"
        tone={TONE}
        footer={
          pideTerminos ? (
            <div className={styles.terminos}>
              <Checkbox
                id="evento-acepta-bases"
                checked={aceptaBases}
                onChange={setAceptaBases}
                tone={TONE}
                label={
                  <>
                    Acepto las{" "}
                    <a
                      href={BASES_EVENTO_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.terminosLink}
                      onClick={(e) => e.stopPropagation()}
                    >
                      bases y condiciones
                    </a>
                  </>
                }
              />
              {errorTerminos && <Alert color="warning">{errorTerminos}</Alert>}
              <PortalButton
                tone={TONE}
                disabled={!aceptaBases}
                loading={aceptando}
                onClick={() => void handleAceptarTerminos()}
              >
                Empezar a jugar
              </PortalButton>
            </div>
          ) : (
            <PortalButton tone={TONE} onClick={cerrarAyuda}>
              ¡Entendido!
            </PortalButton>
          )
        }
      >
        <ComoFunciona
          pasos={pasosComoFunciona(minimo)}
          layout="stack"
          tone={TONE}
        />
      </BottomSheet>

      <BottomSheet
        open={!!repetido}
        onClose={() => setRepetido(null)}
        title="Ya escaneaste este stand"
        tone={TONE}
        footer={
          puedeEscanear ? (
            <div className={styles.terminos}>
              <PortalButton
                tone={TONE}
                onClick={() => {
                  setRepetido(null);
                  abrirScanner();
                }}
              >
                Escanear otro stand
              </PortalButton>
              <PortalButton tone={TONE} variant="secondary" onClick={() => setRepetido(null)}>
                Cerrar
              </PortalButton>
            </div>
          ) : (
            <PortalButton tone={TONE} onClick={() => setRepetido(null)}>
              ¡Entendido!
            </PortalButton>
          )
        }
      >
        <p className={styles.sheetText}>
          <strong>{repetido}</strong> ya está en tu recorrido, no suma de nuevo. Buscá un
          stand que todavía no hayas visitado.
        </p>
      </BottomSheet>
      {scannerAbierto && (
        <QrScanner
          tone={TONE}
          paused={procesando}
          onDetect={(texto) => void handleDetect(texto)}
          onClose={() => setScannerAbierto(false)}
        />
      )}
    </div>
  );
}
