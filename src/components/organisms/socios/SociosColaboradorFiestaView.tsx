"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleAlert, Gift, PartyPopper, Printer, QrCode, Trophy } from "lucide-react";
import Alert from "@/components/atoms/alert/alert";
import Badge from "@/components/atoms/badge/badge";
import PortalButton from "@/components/atoms/button/button";
import Card from "@/components/atoms/card/card";
import EmptyState from "@/components/molecules/empty-state/empty-state";
import QrScanner from "@/components/molecules/evento-stands/qr-scanner/qr-scanner";
import FiestaCredencialQr from "./FiestaCredencialQr";
import StatTile from "@/components/molecules/stat-tile/stat-tile";
import { Skeleton } from "@/components/ui/skeleton";
import {
  extraerCodigoIngreso,
  formatPuntosFiesta,
  NIVEL_UNO_POR_PERSONA,
  NIVELES_PREMIO,
  textoCredencial,
  textoMovimiento,
} from "@/lib/fiesta";
import { usePortalFiesta } from "@/lib/use-portal-fiesta";
import type { PortalFiestaPremio } from "@/types/portal-fiesta";
import styles from "./SociosColaboradorFiestaView.module.scss";

/** URL de la vista sin el código de la entrada (se limpia después de usarlo). */
const URL_VISTA = "/socios?view=colaboradores-fiesta";

const hora = (iso: string) =>
  new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Cordoba",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

/** Una tarjeta por categoría (cada premio es una bolsa sorpresa de esa categoría). */
const porCategoria = (premios: PortalFiestaPremio[]) =>
  ["A", "B", "C", "D"]
    .map((nivel) => {
      const items = premios.filter((p) => p.nivel === nivel);
      return {
        nivel,
        hay: items.length > 0,
        puntos: items.length ? Math.min(...items.map((p) => p.puntos)) : 0,
        disponibles: items.reduce((s, p) => s + Math.max(0, p.disponibles), 0),
      };
    })
    .filter((c) => c.hay);

export function SociosColaboradorFiestaView() {
  const router = useRouter();
  // El QR de la entrada abre /fiesta/<codigo>, que redirige acá con ?ingreso=<codigo>.
  const codigoUrl = useSearchParams().get("ingreso");
  const { fiesta, loading, error, marcarAsistencia } = usePortalFiesta();
  const [codigo, setCodigo] = useState<string | null>(codigoUrl);
  const [marcando, setMarcando] = useState(false);
  const [aviso, setAviso] = useState<{ color: "success" | "warning"; texto: string } | null>(null);
  const [scannerAbierto, setScannerAbierto] = useState(false);
  const urlLimpia = useRef(false);

  // El código ya quedó en el estado: limpia la URL (recargar o compartir no lo reenvía).
  useEffect(() => {
    if (!codigoUrl || urlLimpia.current) return;
    urlLimpia.current = true;
    router.replace(URL_VISTA, { scroll: false });
  }, [codigoUrl, router]);

  const marcar = async (cod: string) => {
    setMarcando(true);
    setAviso(null);
    const r = await marcarAsistencia(cod);
    setMarcando(false);
    if (r.ok) {
      setCodigo(null);
      setAviso({ color: "success", texto: "¡Listo! Ya estás en el evento." });
    } else {
      setCodigo(null);
      setAviso({ color: "warning", texto: r.message });
    }
  };

  const handleDetect = async (texto: string) => {
    if (marcando) return;
    setScannerAbierto(false);
    const cod = extraerCodigoIngreso(texto);
    if (!cod) {
      setAviso({ color: "warning", texto: "Ese QR no es el de la entrada del evento." });
      return;
    }
    await marcar(cod);
  };

  const header = (
    <header className={styles.pageHeader}>
      <h1 className={styles.pageTitle}>Evento de Fin de Año</h1>
      <p className={styles.pageSubtitle}>
        Jugá, sumá puntos y canjealos por premios
      </p>
    </header>
  );

  if (loading && !fiesta) {
    return (
      <div className={styles.view}>
        {header}
        <Skeleton className={styles.skeletonHero} />
        <Skeleton className={styles.skeletonBlock} />
      </div>
    );
  }

  if (error && !fiesta) {
    return (
      <div className={styles.view}>
        {header}
        <Alert icon={<CircleAlert size={18} />}>{error}</Alert>
      </div>
    );
  }

  if (!fiesta) return null;

  const asistencia = fiesta.asistencia;
  const credencial = textoCredencial(asistencia?.impresion ?? null);

  return (
    <div className={styles.view}>
      {header}

      {aviso && <Alert color={aviso.color}>{aviso.texto}</Alert>}

      {!asistencia ? (
        <Card padding="lg">
          <div className={styles.bienvenida}>
            <PartyPopper size={40} className={styles.iconoHero} aria-hidden />
            <h2 className={styles.heroTitle}>¡Bienvenido al evento!</h2>
            {codigo ? (
              <>
                <p className={styles.heroText}>
                  Marcá tu asistencia y te imprimimos la credencial con tu nombre.
                </p>
                <PortalButton
                  tone="socios"
                  icon={<PartyPopper size={18} />}
                  loading={marcando}
                  onClick={() => void marcar(codigo)}
                >
                  Marcar asistencia
                </PortalButton>
              </>
            ) : (
              <>
                <p className={styles.heroText}>
                  Para marcar tu asistencia escaneá el QR que está en la entrada.
                </p>
                <PortalButton
                  tone="socios"
                  icon={<QrCode size={18} />}
                  loading={marcando}
                  onClick={() => {
                    setAviso(null);
                    setScannerAbierto(true);
                  }}
                >
                  Escanear QR de la entrada
                </PortalButton>
              </>
            )}
          </div>
        </Card>
      ) : (
        <>
          <section className={styles.statsGrid} aria-label="Tus puntos">
            <StatTile
              variant="highlight"
              label="Tus puntos"
              value={formatPuntosFiesta(fiesta.saldo)}
              hint="Canjealos por premios en el puesto de canje"
            />
            <StatTile
              label="Llegaste"
              value={hora(asistencia.ingreso_at)}
              size="sm"
              hint={`Turno ${asistencia.turno}`}
            />
          </section>

          <Card title="Tu credencial">
            <div className={styles.credencial}>
              <Printer size={22} aria-hidden />
              <div>
                <p className={styles.credencialTitulo}>{credencial.titulo}</p>
                <p className={styles.credencialTexto}>{credencial.texto}</p>
              </div>
              {credencial.lista && (
                <Badge color="success" size="sm">
                  Lista
                </Badge>
              )}
            </div>
            <FiestaCredencialQr token={asistencia.credencial_token} />
          </Card>
        </>
      )}

      {fiesta.actividades.length > 0 && (
        <Card title="Qué vale cada actividad">
          <ul className={styles.lista}>
            {fiesta.actividades.map((a) => (
              <li key={a.id} className={styles.fila}>
                <span>{a.nombre}</span>
                <span className={styles.puntos}>
                  {formatPuntosFiesta(a.puntos)} pts
                  {a.bonus_ganador > 0 && (
                    <span className={styles.bonus}>
                      <Trophy size={14} aria-hidden /> +{formatPuntosFiesta(a.bonus_ganador)} si ganás
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <p className={styles.nota}>
            Podés jugar todas las veces que quieras: el referente te escanea la credencial en cada partida.
          </p>
        </Card>
      )}

      <Card title="Premios">
        {fiesta.premios.length === 0 ? (
          <EmptyState
            icon={Gift}
            variant="plain"
            title="Muy pronto"
            text="Estamos cargando los premios."
          />
        ) : (
          <>
            <p className={styles.nota}>
              Cada premio es una bolsa sorpresa. Elegís la categoría y en el puesto de canje te dan una bolsa de esa categoría.
            </p>
            <ul className={styles.bolsas}>
              {porCategoria(fiesta.premios).map((cat) => {
                const alcanza = !!asistencia && fiesta.saldo >= cat.puntos && cat.disponibles > 0;
                return (
                  <li
                    key={cat.nivel}
                    className={`${styles.bolsa} ${styles[`bolsa${cat.nivel}`] ?? ""} ${cat.disponibles <= 0 ? styles.agotado : ""}`}
                  >
                    <span className={styles.bolsaNombre}>{NIVELES_PREMIO[cat.nivel] ?? cat.nivel}</span>
                    <span className={styles.bolsaPuntos}>{formatPuntosFiesta(cat.puntos)} pts</span>
                    <span className={styles.bolsaInfo}>
                      {cat.disponibles > 0
                        ? `Quedan ${formatPuntosFiesta(cat.disponibles)} ${cat.disponibles === 1 ? "bolsa" : "bolsas"}`
                        : "Agotadas"}
                    </span>
                    {cat.nivel === NIVEL_UNO_POR_PERSONA && (
                      <span className={styles.bolsaNota}>Máximo una por persona</span>
                    )}
                    {alcanza && (
                      <Badge color="success" size="sm">Te alcanza</Badge>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Card>

      {asistencia && fiesta.movimientos.length > 0 && (
        <Card title="Tus puntos, uno por uno">
          <ul className={styles.lista}>
            {fiesta.movimientos.map((m, i) => (
              <li key={`${m.created_at}-${i}`} className={styles.fila}>
                <span>
                  {textoMovimiento(m, fiesta.actividades)}
                  <span className={styles.horaMov}>{hora(m.created_at)}</span>
                </span>
                <span className={m.puntos < 0 ? styles.negativo : styles.positivo}>
                  {m.puntos > 0 ? "+" : ""}
                  {formatPuntosFiesta(m.puntos)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {scannerAbierto && (
        <QrScanner
          paused={marcando}
          hint="Apuntá al QR de la entrada"
          onDetect={(t) => void handleDetect(t)}
          onClose={() => setScannerAbierto(false)}
        />
      )}
    </div>
  );
}
