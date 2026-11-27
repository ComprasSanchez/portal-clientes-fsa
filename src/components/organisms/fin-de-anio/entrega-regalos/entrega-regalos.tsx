"use client";

import { useEffect, useState } from "react";
import { Gift, MapPin } from "lucide-react";
import PortalButton from "@/components/atoms/button/button";
import Card from "@/components/atoms/card/card";
import BottomSheet from "@/components/molecules/bottom-sheet/bottom-sheet";
import ListaRegalos from "@/components/molecules/fin-de-anio/lista-regalos/lista-regalos";
import QrEntregaCard from "@/components/molecules/fin-de-anio/qr-entrega-card/qr-entrega-card";
import PasosNumerados from "@/components/molecules/pasos-numerados/pasos-numerados";
import StatTile from "@/components/molecules/stat-tile/stat-tile";
import SucursalFavoritaPicker from "@/components/organisms/sucursal-favorita-picker/sucursal-favorita-picker";
import {
  guardarSucursalEntrega,
  leerSucursalEntrega,
  listarEntregasRecientes,
  pedirQrEntrega,
  type QrEntrega,
} from "@/lib/entrega-regalos";
import { mensajeErrorCalendario } from "@/lib/fin-de-anio";
import { nombreSucursalFavorita } from "@/lib/sucursal-favorita";
import { usePortalSucursales } from "@/lib/use-portal-sucursales";
import type { CalendarioRegalo } from "@/types/portal-calendario";
import styles from "./entrega-regalos.module.scss";

const REFRESCO_ENTREGAS_MS = 5000;
const mensaje = (e: unknown) => (e instanceof Error ? e.message : mensajeErrorCalendario(null));

const PASOS = [
  { titulo: "El socio abre su calendario", texto: "En el portal, en Fin de año → Calendario." },
  { titulo: "Toca “Escanear QR” y apunta a tu pantalla", texto: "El QR se renueva solo: no hace falta tocar nada." },
  { titulo: "Le aparece qué tenés que darle", texto: "Entregale lo que dice su pantalla. Queda registrado a tu nombre." },
];

/** Colaboradores: QR que escanea el socio para retirar sus regalos del calendario. */
export default function EntregaRegalos() {
  const { sucursales } = usePortalSucursales();
  const [sucursal, setSucursal] = useState<string | null>(() => leerSucursalEntrega());
  const [elegir, setElegir] = useState(false);
  const [qr, setQr] = useState<(QrEntrega & { restanteMs: number }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [entregas, setEntregas] = useState<CalendarioRegalo[]>([]);

  // Pide el QR y programa el próximo para cuando cambie.
  useEffect(() => {
    if (!sucursal) return;
    let cancelado = false;
    let timer: ReturnType<typeof setTimeout>;
    const traer = async () => {
      try {
        const nuevo = await pedirQrEntrega(sucursal);
        if (cancelado) return;
        const restanteMs = Math.max(0, new Date(nuevo.cambiaAt).getTime() - Date.now());
        setQr({ ...nuevo, restanteMs });
        setError(null);
        const espera = Math.max(1000, restanteMs + 300);
        timer = setTimeout(() => void traer(), espera);
      } catch (e) {
        if (cancelado) return;
        setError(mensaje(e));
        timer = setTimeout(() => void traer(), 10000);
      }
    };
    void traer();
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [sucursal]);

  // Últimas entregas: se refrescan solas para confirmar cada escaneo.
  useEffect(() => {
    let cancelado = false;
    const traer = async () => {
      try {
        const { entregas: nuevas } = await listarEntregasRecientes();
        if (!cancelado) setEntregas(nuevas);
      } catch {
        // Se reintenta en el próximo ciclo.
      }
    };
    void traer();
    const id = setInterval(() => void traer(), REFRESCO_ENTREGAS_MS);
    return () => {
      cancelado = true;
      clearInterval(id);
    };
  }, []);

  const elegirSucursal = async (codigo: string) => {
    guardarSucursalEntrega(codigo);
    setQr(null);
    setSucursal(codigo);
    setElegir(false);
    return null;
  };

  const nombre = sucursal ? (nombreSucursalFavorita(sucursales, sucursal) ?? `Sucursal ${sucursal}`) : "";

  return (
    <div className={styles.view}>
      <header className={styles.encabezado}>
        <h1 className={styles.titulo}>Entregar regalos</h1>
        <p className={styles.bajada}>Mostrale este QR al socio para entregarle los regalos de su calendario.</p>
      </header>

      <div className={styles.columnas}>
        <div className={styles.principal}>
          {sucursal ? (
            <QrEntregaCard
              sucursal={nombre}
              codigo={qr?.codigo ?? null}
              restanteMs={qr?.restanteMs ?? 0}
              error={error}
              onCambiarSucursal={() => setElegir(true)}
            />
          ) : (
            <Card tone="socios" padding="lg" className={styles.elegir}>
              <span className={styles.elegirIcono} aria-hidden>
                <MapPin size={26} />
              </span>
              <h2 className={styles.elegirTitulo}>¿En qué sucursal estás?</h2>
              <p className={styles.elegirTexto}>Elegila una vez y queda guardada en este dispositivo.</p>
              <div className={styles.elegirBoton}>
                <PortalButton tone="socios" icon={<MapPin size={18} />} onClick={() => setElegir(true)}>
                  Elegir sucursal
                </PortalButton>
              </div>
            </Card>
          )}
        </div>

        <aside className={styles.lateral}>
          <StatTile
            tone="socios"
            variant="highlight"
            icon={<Gift size={18} />}
            label="Entregaste hoy"
            value={entregas.length === 1 ? "1 regalo" : `${entregas.length} regalos`}
          />

          <Card tone="socios" title="Cómo funciona">
            <PasosNumerados pasos={PASOS} />
          </Card>

          <Card tone="socios" title="Tus últimas entregas">
            {entregas.length ? (
              <ListaRegalos regalos={entregas} conHora />
            ) : (
              <p className={styles.vacio}>Cuando un socio escanee tu QR, lo vas a ver acá al instante.</p>
            )}
          </Card>
        </aside>
      </div>

      <BottomSheet open={elegir} onClose={() => setElegir(false)} title="¿En qué sucursal estás?">
        <SucursalFavoritaPicker
          actual={sucursal}
          onGuardar={elegirSucursal}
          bajada="Es la sucursal donde vas a entregar los regalos."
          textoBoton="Listo"
        />
      </BottomSheet>
    </div>
  );
}
