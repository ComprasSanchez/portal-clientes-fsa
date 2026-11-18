import Image from "next/image";
import Badge from "@/components/atoms/badge/badge";
import PriceTag from "@/components/atoms/price-tag/price-tag";
import { toneClass, type UiTone } from "@/types/ui-tone";
import styles from "./product-card.module.scss";

type ProductCardProps = {
  imagen: string;
  nombre: string;
  presentacion?: string | null;
  precio: number;
  precioAnterior?: number;
  descuentoPct?: number;
  tone?: UiTone;
  /** Carga la imagen de entrada (primeras tarjetas visibles). */
  imagenPrioritaria?: boolean;
};

/** Tarjeta de producto de catálogo: foto, descuento, nombre y precio. */
export default function ProductCard({
  imagen,
  nombre,
  presentacion,
  precio,
  precioAnterior,
  descuentoPct,
  tone = "socios",
  imagenPrioritaria = false,
}: ProductCardProps) {
  return (
    <article className={`${styles.card} ${toneClass(tone)}`}>
      <div className={styles.media}>
        <Image
          src={imagen}
          alt={nombre}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
          className={styles.image}
          loading={imagenPrioritaria ? "eager" : "lazy"}
        />
        {descuentoPct ? (
          <Badge color="sale" tone={tone} className={styles.discount}>
            -{descuentoPct}%
          </Badge>
        ) : null}
      </div>
      <div className={styles.body}>
        <h3 className={styles.name}>{nombre}</h3>
        {presentacion && <p className={styles.presentation}>{presentacion}</p>}
        <div className={styles.price}>
          <PriceTag
            precio={precio}
            precioBase={precioAnterior}
            descuentoPct={descuentoPct}
            basePrefix="Antes"
            size="lg"
            showBadge={false}
            sinDecimales
            tone={tone}
          />
        </div>
      </div>
    </article>
  );
}
