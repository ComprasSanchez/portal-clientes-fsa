"use client";

import { Loader } from "@/components/atoms/loader/loader";
import Header from "@/components/molecules/header/header";
import { OrderTrackingPanel } from "@/components/organisms/portal-pedido/order-tracking-panel";
import { usePortalPedidoTracking } from "@/lib/use-portal-pedido-tracking";
import styles from "./portal-pedido.module.scss";

type PortalPedidoProps = {
  token: string;
};

export default function PortalPedido({ token }: PortalPedidoProps) {
  const {
    isLoading,
    error,
    latestParentOrder,
    trackingStatus,
    resolvedOrderNumber,
    refresh,
  } = usePortalPedidoTracking({ token });

  return (
    <div className={styles.root}>
      <Header cartCount={0} showBackButton />

      <main className={styles.content}>
        <section className={styles.intro}>
          <p className={styles.eyebrow}>Seguimiento</p>
          <h1 className={styles.title}>Estado de tu pedido</h1>
          <p className={styles.subtitle}>
            Consulta la etapa actual de preparación y entrega usando tu enlace seguro.
          </p>
        </section>

        {isLoading ? <Loader /> : null}

        {!isLoading && error ? (
          <div className={`${styles.statusCard} ${styles.error}`}>
            <p className={styles.statusTitle}>No pudimos abrir el seguimiento</p>
            <p className={styles.statusText}>{error}</p>
          </div>
        ) : null}

        {!isLoading && !error && !latestParentOrder ? (
          <div className={styles.statusCard}>
            <p className={styles.statusTitle}>Todavía no encontramos un pedido asociado</p>
            <p className={styles.statusText}>
              Cuando el pedido quede registrado, vas a poder seguir su estado desde este portal.
            </p>
          </div>
        ) : null}

        {!isLoading && !error && latestParentOrder ? (
          <div className="w-full p-5">
            <OrderTrackingPanel
              latestParentOrder={latestParentOrder}
              trackingStatus={trackingStatus}
              resolvedOrderNumber={resolvedOrderNumber}
              onRefresh={() => {
                void refresh();
              }}
            />
          </div>
        ) : null}
      </main>
    </div>
  );
}