"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import Alert from "@/components/atoms/alert/alert";
import PortalButton from "@/components/atoms/button/button";
import SearchInput from "@/components/molecules/search-input/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { filtrarSucursalesFavorita } from "@/lib/sucursal-favorita";
import { usePortalSucursales } from "@/lib/use-portal-sucursales";
import styles from "./sucursal-favorita-picker.module.scss";

type SucursalFavoritaPickerProps = {
  /** Número de sucursal elegida hoy (si ya tiene). */
  actual: string | null;
  onGuardar: (codigo: string) => Promise<string | null>;
  bajada?: string;
  textoBoton?: string;
};

/** Elegir la sucursal favorita (se guarda en el perfil; ahí se usan los regalos). */
export default function SucursalFavoritaPicker({
  actual,
  onGuardar,
  bajada = "La guardamos en tu perfil. Es la sucursal donde vas a usar tus regalos y descuentos del calendario.",
  textoBoton = "Guardar y seguir",
}: SucursalFavoritaPickerProps) {
  const { sucursales, isLoading, error } = usePortalSucursales();
  const [busqueda, setBusqueda] = useState("");
  const [elegida, setElegida] = useState<string | null>(actual);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);
  const lista = useMemo(() => filtrarSucursalesFavorita(sucursales, busqueda), [sucursales, busqueda]);

  const guardar = async () => {
    if (!elegida) return;
    setGuardando(true);
    setErrorGuardar(await onGuardar(elegida));
    setGuardando(false);
  };

  return (
    <div className={styles.picker}>
      <p className={styles.bajada}>{bajada}</p>
      <SearchInput
        value={busqueda}
        onChange={setBusqueda}
        onClear={() => setBusqueda("")}
        placeholder="Buscá por nombre, calle o número"
        ariaLabel="Buscar sucursal"
        tone="socios"
      />

      {error && <Alert color="error">{error}</Alert>}
      <ul className={styles.lista}>
        {isLoading
          ? Array.from({ length: 5 }, (_, i) => (
              <li key={i}>
                <Skeleton className={styles.skeleton} />
              </li>
            ))
          : lista.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={`${styles.item} ${elegida === s.codigo ? styles.itemElegido : ""}`}
                  aria-pressed={elegida === s.codigo}
                  onClick={() => setElegida(s.codigo ?? null)}
                >
                  <span className={styles.datos}>
                    <strong>{s.nombre}</strong>
                    <span>{s.direccion}</span>
                  </span>
                  {elegida === s.codigo && <Check size={18} className={styles.check} aria-hidden />}
                </button>
              </li>
            ))}
        {!isLoading && !lista.length && <li className={styles.vacio}>No encontramos sucursales con esa búsqueda.</li>}
      </ul>

      {errorGuardar && <Alert color="error">{errorGuardar}</Alert>}
      <PortalButton tone="socios" onClick={guardar} disabled={!elegida} loading={guardando}>
        {textoBoton}
      </PortalButton>
    </div>
  );
}
