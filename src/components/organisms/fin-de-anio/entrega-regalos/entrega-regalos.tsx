"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Gift, MapPin } from "lucide-react";
import PortalButton from "@/components/atoms/button/button";
import Card from "@/components/atoms/card/card";
import BottomSheet from "@/components/molecules/bottom-sheet/bottom-sheet";
import EntregaSocioCard from "@/components/molecules/fin-de-anio/entrega-socio-card/entrega-socio-card";
import QrEntregaCard from "@/components/molecules/fin-de-anio/qr-entrega-card/qr-entrega-card";
import PasosNumerados from "@/components/molecules/pasos-numerados/pasos-numerados";
import SearchInput from "@/components/molecules/search-input/search-input";
import StatTile from "@/components/molecules/stat-tile/stat-tile";
import SucursalFavoritaPicker from "@/components/organisms/sucursal-favorita-picker/sucursal-favorita-picker";
import {
  agruparEntregas,
  buscarEntregas,
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
const POR_PAGINA = 5;
const mensaje = (e: unknown) => (e instanceof Error ? e.message : mensajeErrorCalendario(null));

const PASOS = [
  { titulo: "El socio abre su calendario", texto: "En el portal, en Fin de año → Calendario." },
  { titulo: "Toca “Escanear QR” y apunta a tu pantalla", texto: "El QR se renueva solo: no hace falta tocar nada." },
  {
    titulo: "Le aparece qué tenés que darle",
    texto: "Entregale lo que dice su pantalla. Queda registrado a tu nombre.",
  },
];

/** Colaboradores: QR que escanea el socio para retirar sus regalos del calendario. */
export default function EntregaRegalos() {
  const { sucursales } = usePortalSucursales();
  const [sucursal, setSucursal] = useState<string | null>(() => leerSucursalEntrega());
  const [elegir, setElegir] = useState(false);
  const [qr, setQr] = useState<(QrEntrega & { restanteMs: number }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [entregas, setEntregas] = useState<CalendarioRegalo[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrar, setMostrar] = useState(POR_PAGINA);
  // undefined = la más reciente abierta (la que se acaba de escanear); null = todas cerradas.
  const [abierta, setAbierta] = useState<string | null | undefined>(undefined);

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
        if (cancelado) return;
        setEntregas((prev) => {
          if (nuevas[0]?.retiradoAt !== prev[0]?.retiradoAt) setAbierta(undefined);
          return nuevas;
        });
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

  const grupos = agruparEntregas(entregas);
  const filtradas = buscarEntregas(grupos, busqueda);
  const visibles = filtradas.slice(0, mostrar);

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
            hint={grupos.length ? `a ${grupos.length} ${grupos.length === 1 ? "socio" : "socios"}` : undefined}
          />

          <Card tone="socios" title="Cómo funciona">
            <PasosNumerados pasos={PASOS} />
          </Card>

          <Card tone="socios" title="Tus entregas de hoy">
            {grupos.length ? (
              <div className={styles.entregas}>
                {grupos.length > POR_PAGINA && (
                  <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar por nombre o DNI" />
                )}
                {visibles.map((e, i) => (
                  <EntregaSocioCard
                    key={e.clave}
                    entrega={e}
                    abierta={abierta === undefined ? i === 0 && !busqueda : abierta === e.clave}
                    onToggle={() => setAbierta((prev) => (prev === e.clave ? null : e.clave))}
                  />
                ))}
                {!filtradas.length && <p className={styles.vacio}>No hay entregas con ese nombre o DNI.</p>}
                {filtradas.length > POR_PAGINA && (
                  <div className={styles.paginado}>
                    {filtradas.length > visibles.length && (
                      <button type="button" className={styles.verMas} onClick={() => setMostrar((m) => m + POR_PAGINA)}>
                        Ver más ({filtradas.length - visibles.length}) <ChevronDown size={15} aria-hidden />
                      </button>
                    )}
                    {visibles.length > POR_PAGINA && (
                      <button type="button" className={styles.verMas} onClick={() => setMostrar(POR_PAGINA)}>
                        Ver menos <ChevronUp size={15} aria-hidden />
                      </button>
                    )}
                  </div>
                )}
              </div>
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
