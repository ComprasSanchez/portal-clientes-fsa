"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import sucursalesPin from "@/assets/sucursales-pin.svg";
import { usePortalSucursales } from "@/lib/use-portal-sucursales";
import { type SociosView } from "@/types/socios";
import styles from "./SucursalesPromoCard.module.scss";

const LeafletMiniMap = dynamic(
  () =>
    import("@/components/molecules/sucursales/LeafletMiniMap").then(
      (m) => m.LeafletMiniMap,
    ),
  { ssr: false, loading: () => <div className={styles.mapLoading} /> },
);

interface SucursalesPromoCardProps {
  onNavigate: (view: SociosView) => void;
}

export function SucursalesPromoCard({ onNavigate }: SucursalesPromoCardProps) {
  const { sucursales } = usePortalSucursales();

  return (
    <div className={styles.wrapper}>
      <article className={styles.card}>
        <div className={styles.content}>
          <h3 className={styles.title}>Nuestras sucursales</h3>
          <p className={styles.description}>
            Encontrá horarios, teléfonos y cómo llegar a cada sucursal
          </p>
          <button
            type="button"
            className={styles.button}
            onClick={() => onNavigate("sucursales")}
          >
            Ver sucursales
          </button>
        </div>

        <div className={styles.mapContainer}>
          <LeafletMiniMap branches={sucursales} />
        </div>
      </article>

      <div className={styles.pinWrap} aria-hidden="true">
        <Image
          src={sucursalesPin as string}
          alt=""
          width={102}
          height={115}
        />
      </div>
    </div>
  );
}
