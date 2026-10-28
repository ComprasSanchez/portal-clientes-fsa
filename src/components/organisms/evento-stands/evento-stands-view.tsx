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
import {
  debeMostrarAyudaInicial,
  extraerCodigoDeQr,
  isEventoStandsActivo,
  marcarAyudaVista,
  nombresEscaneados,
  pasosComoFunciona,
  premioCopy,
  textoProgresoPremio,
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

const TONE = "socios" as const;
const PAGE_CLASS = `${styles.page} ${toneClass(TONE)}`;

export default function EventoStandsView({ urlVista, onBack }: EventoStandsViewProps) {
  const router = useRouter();
  // Los QR abren /evento/<codigo>, que redirige acá con ?stand=<codigo>.
  const codigo = useSearchParams().get("stand") ?? undefined;
  const { avance, loading, error, escanear, entregar } = usePortalEventoStands();
  const [aviso, setAviso] = useState<Aviso>(null);
  const [destacado, setDestacado] = useState<number | null>(null);
  const [scannerAbierto, setScannerAbierto] = useState(false);
  const [procesando, setProcesando] = useState(false);
  // En celular "Cómo funciona" va en un modal que se abre solo la primera vez.
  const [ayudaAbierta, setAyudaAbierta] = useState(debeMostrarAyudaInicial);
  const codigoInicialProcesado = useRef(false);
  const activo = isEventoStandsActivo();

  const cerrarAyuda = () => {
    setAyudaAbierta(false);
    marcarAyudaVista();
  };

  const registrar = async (cod: string) => {
    setProcesando(true);
    const r = await escanear(cod);
    setProcesando(false);
    if (r.ok) {
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
  useEffect(() => {
    if (!activo || !codigo || codigoInicialProcesado.current) return;
    codigoInicialProcesado.current = true;
    void registrar(codigo).finally(() => router.replace(urlVista, { scroll: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo, codigo]);

  const abrirScanner = () => {
    setAviso(null);
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

  const handleEntregar = async (pin: string) => {
    const r = await entregar(pin);
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
  const puedeEscanear = !!avance && !avance.completo && !avance.premio_entregado;

  return (
    <div className={PAGE_CLASS}>
      <header className={styles.header}>
        <div className={styles.topBar}>
          <BackButton ariaLabel="Volver al inicio" onClick={onBack} tone={TONE} />
          <Badge tone={TONE} color="primary" size="sm" uppercase icon={<Sparkles size={14} />}>
            Evento Breve
          </Badge>
        </div>
        <h1 className={styles.title}>Juego de stands</h1>
        <p className={styles.subtitle}>
          Visitá los stands, escaneá el QR de cada uno desde tu celular y retirá tu premio en el
          stand de premios.
        </p>
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
          <Skeleton className="h-56 w-full rounded-2xl bg-[#e6f7fb]" />
          <Skeleton className="h-96 w-full rounded-2xl bg-[#e6f7fb]" />
        </div>
      )}

      {error && !avance && <Alert color="warning">{error}</Alert>}

      {avance && premio && (
        <div className={styles.layout}>
          <div className={styles.progreso}>
            <ProgresoCard
              escaneados={avance.escaneados}
              total={avance.total}
              minimo={avance.minimo_premio}
              texto={textoProgresoPremio(avance)}
              tone={TONE}
            />
          </div>

          {puedeEscanear && (
            <div className={styles.escanear}>
              <EscanearCta onClick={abrirScanner} disabled={procesando} tone={TONE} />
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
                    <PremioPinForm onSubmit={handleEntregar} tone={TONE} />
                  )}
                </div>
              )}
            </Card>
          </div>

          <div className={styles.stands}>
            <Card tone={TONE}>
              <div className={styles.standsHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Los {avance.total} stands</h2>
                  {puedeEscanear && (
                    <p className={styles.sectionText}>Tocá un stand para escanear su código.</p>
                  )}
                </div>
                <p className={styles.standsCount}>
                  <strong>{avance.escaneados}</strong> escaneados
                </p>
              </div>
              <StandGrid
                stands={avance.stands}
                destacado={destacado}
                onSelectPendiente={puedeEscanear ? abrirScanner : undefined}
                tone={TONE}
              />
            </Card>
          </div>

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
        open={ayudaAbierta}
        onClose={cerrarAyuda}
        title="Cómo funciona"
        tone={TONE}
        footer={
          <PortalButton tone={TONE} onClick={cerrarAyuda}>
            ¡Entendido!
          </PortalButton>
        }
      >
        <ComoFunciona
          pasos={pasosComoFunciona(avance?.minimo_premio ?? 5)}
          layout="stack"
          tone={TONE}
        />
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
