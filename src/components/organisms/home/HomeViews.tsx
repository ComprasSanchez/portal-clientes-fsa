import {
  Box,
  FileText,
  Package,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { DetailButton } from "@/components/molecules/home/DetailButton";
import { OrderRow } from "@/components/molecules/home/OrderRow";
import { QuickAccessCard, type QuickAccessItem } from "@/components/molecules/home/QuickAccessCard";
import { ProfileView } from "@/components/organisms/profile/ProfileView";
import { OrderTrackingPanel } from "@/components/organisms/portal-pedido/order-tracking-panel";
import {
  PARENT_ORDER_STATUS_LABELS,
  TRACKING_LABELS,
} from "@/lib/order-tracking";
import { useAuthLogisticaTracking } from "@/lib/use-auth-logistica-tracking";
import { usePortalExpedientes } from "@/lib/use-portal-expedientes";
import type { PortalPerfilResponse } from "@/types/portal-profile";
import { HomeView } from "@/types/home";
import styles from "./HomeViews.module.scss";

interface HomeViewsProps {
  currentView: HomeView;
  onNavigate: (view: HomeView) => void;
  userName: string;
  affiliateNumber: string | null;
  documentNumber: string | null;
  email: string | null;
  phone: string | null;
  perfil: PortalPerfilResponse | null;
}

const viewContent: Record<
  HomeView,
  {
    title: string;
    description: string;
  }
> = {
  dashboard: {
    title: "Inicio",
    description: "Resumen general del portal con accesos rapidos.",
  },
  "mi-cuenta": {
    title: "Mi perfil",
    description: "Informacion personal y datos de tu cuenta.",
  },
  productos: {
    title: "Productos",
    description: "Catalogo y detalle de productos disponibles.",
  },
  pedidos: {
    title: "Segui tu pedido",
    description: "Seguimiento del estado, preparacion y entrega de tu pedido.",
  },
  facturas: {
    title: "Facturas",
    description: "Consulta y descarga de comprobantes.",
  },
  "expediente-actual": {
    title: "Expediente actual",
    description: "Vista del expediente activo con su estado actual.",
  },
  "expediente-completo": {
    title: "Historial completo",
    description: "Registro historico de toda la documentacion.",
  },
};

export function HomeViews({
  currentView,
  onNavigate,
  userName,
  affiliateNumber,
  documentNumber,
  email,
  phone,
  perfil,
}: HomeViewsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = viewContent[currentView];
  const hasAffiliateNumber = Boolean(affiliateNumber?.trim());
  const quickAccessItems: QuickAccessItem[] = [
    {
      label: "SocioSA",
      icon: Users,
      onClick: () => router.push("/socios"),
    },
    { label: "Mi perfil", view: "mi-cuenta", icon: User },
    { label: "Productos", view: "productos", icon: Box },
    { label: "Segui tu pedido", view: "pedidos", icon: Package },
    { label: "Expediente", view: "expediente-actual", icon: FileText },
    { label: "Historial", view: "expediente-completo", icon: TrendingUp },
  ];

  const queryCicloId = searchParams.get("cicloId");
  const {
    activeCycle,
    currentCycleId,
    partial: expedientesPartial,
    warnings: expedienteWarnings,
    isLoading: isExpedientesLoading,
    error: expedientesError,
  } = usePortalExpedientes();
  const cicloId = queryCicloId || currentCycleId;

  const {
    isLoading: isPedidoTrackingLoading,
    error: pedidoTrackingError,
    latestParentOrder,
    trackingStatus,
    resolvedOrderNumber,
    hasCicloId,
    refresh,
  } = useAuthLogisticaTracking({ cicloId });
  const trackingBlockedByExpedientes = !queryCicloId && !currentCycleId;
  const shouldShowTrackingLoading = isExpedientesLoading || isPedidoTrackingLoading;
  const cicloWarningMessage = expedienteWarnings.includes("expediente_cycles_unavailable")
    ? "El BFF devolvio expedientes, pero no pudo enriquecer los ciclos. Revisa permisos de cliente:read en el bearer final."
    : null;

  if (currentView === "mi-cuenta") {
    return (
      <main className={styles.container}>
        <ProfileView perfil={perfil} variant="cora" />
      </main>
    );
  }

  if (currentView === "pedidos") {
    return (
      <main className={styles.container}>
        <section className={styles.activeViewCard}>
          <p className={styles.activeViewLabel}>Vista activa</p>
          <h1 className={styles.activeViewTitle}>{active.title}</h1>
          <p className={styles.activeViewDescription}>{active.description}</p>

          {shouldShowTrackingLoading ? (
            <div className={styles.trackingMessageCard}>
              <p className={styles.trackingMessageTitle}>Consultando estado actual</p>
              <p className={styles.trackingMessageText}>
                Estamos recuperando el expediente activo y la informacion de logistica del pedido.
              </p>
            </div>
          ) : null}

          {!shouldShowTrackingLoading && expedientesError ? (
            <div className={`${styles.trackingMessageCard} ${styles.trackingMessageError}`}>
              <p className={styles.trackingMessageTitle}>No pudimos cargar los expedientes</p>
              <p className={styles.trackingMessageText}>{expedientesError}</p>
            </div>
          ) : null}

          {!shouldShowTrackingLoading && !expedientesError && trackingBlockedByExpedientes ? (
            <div className={styles.trackingMessageCard}>
              <p className={styles.trackingMessageTitle}>Seguimiento no disponible por ahora</p>
              <p className={styles.trackingMessageText}>
                No encontramos un `cicloActual` en `/portal/me/expedientes`, por lo que todavia no podemos consultar la logistica autenticada.
              </p>
            </div>
          ) : null}

          {!shouldShowTrackingLoading && expedientesPartial ? (
            <div className={styles.trackingMessageCard}>
              <p className={styles.trackingMessageTitle}>Los expedientes llegaron con datos parciales</p>
              <p className={styles.trackingMessageText}>
                {cicloWarningMessage || "La pantalla sigue mostrando la informacion disponible, pero algunos ciclos pueden no estar enriquecidos."}
              </p>
            </div>
          ) : null}

          {!shouldShowTrackingLoading && hasCicloId && pedidoTrackingError ? (
            <div className={`${styles.trackingMessageCard} ${styles.trackingMessageError}`}>
              <p className={styles.trackingMessageTitle}>No pudimos consultar el seguimiento</p>
              <p className={styles.trackingMessageText}>{pedidoTrackingError}</p>
            </div>
          ) : null}

          {!shouldShowTrackingLoading && hasCicloId && !pedidoTrackingError && latestParentOrder ? (
            <div className={styles.trackingPanelWrap}>
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
        </section>
      </main>
    );
  }

  if (currentView !== "dashboard") {
    return (
      <main className={styles.container}>
        <section className={styles.activeViewCard}>
          <p className={styles.activeViewLabel}>Vista activa</p>
          <h1 className={styles.activeViewTitle}>{active.title}</h1>
          <p className={styles.activeViewDescription}>{active.description}</p>

          <button onClick={() => onNavigate("dashboard")} className={styles.primaryButton}>
            Volver a Inicio
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <section className={styles.dashboardSection}>
        <div>
          <h1 className={styles.welcomeTitle}>Hola, {userName}</h1>
          <p className={styles.welcomeSubtitle}>Bienvenido a tu panel de gestion de pedidos</p>
        </div>

        <div className={styles.quickAccessGrid}>
          {quickAccessItems.map((item) => (
            <QuickAccessCard key={item.view ?? item.label} item={item} onNavigate={onNavigate} />
          ))}
        </div>

        <div className={styles.detailsGrid}>
          <article className={styles.panelCard}>
            <h2 className={styles.panelTitle}>Mi credencial</h2>
            <p className={styles.panelSubtitle}>
              {hasAffiliateNumber ? "Numero de afiliacion" : "Todavia no tenes una obra social asociada"}
            </p>
            <div className={styles.credentialGradient}>
              <p className={styles.credentialLabel}>Titular</p>
              <p className={styles.credentialValue}>{userName}</p>
              <div className={styles.separator} />
              <p className={styles.credentialLabel}>
                {hasAffiliateNumber ? "N de afiliacion" : "Estado"}
              </p>
              <p className={styles.credentialNumber}>
                {hasAffiliateNumber ? affiliateNumber : "Sin numero de afiliado"}
              </p>
              {!hasAffiliateNumber ? (
                <p className={styles.credentialHint}>
                  Completa tu obra social desde Mi perfil para ver tu credencial y la cobertura asociada.
                </p>
              ) : null}
            </div>
            <DetailButton
              label={hasAffiliateNumber ? "Ver detalle" : "Ir a Mi perfil"}
              onClick={() => onNavigate("mi-cuenta")}
            />
          </article>

          <article className={styles.panelCard}>
            <h2 className={styles.panelTitle}>Mi perfil</h2>
            <p className={styles.panelSubtitle}>Datos personales y de contacto</p>
            <dl className={styles.orderList}>
              <OrderRow label="Afiliado" value={userName} />
              <OrderRow label="Documento" value={documentNumber ?? "Sin dato"} />
              <OrderRow label="Mail" value={email ?? "Sin dato"} />
              <OrderRow
                label="Telefono"
                value={<span className={styles.totalAmount}>{phone ?? "Sin dato"}</span>}
                hasBorder={false}
              />
            </dl>
            <DetailButton onClick={() => onNavigate("mi-cuenta")} />
          </article>

          <article className={styles.panelCard}>
            <h2 className={styles.panelTitle}>Ultimo pedido</h2>
            <p className={styles.panelSubtitle}>Estado actual</p>
            <dl className={styles.orderList}>
              <OrderRow label="Pedido" value={resolvedOrderNumber ? `#${resolvedOrderNumber}` : "Sin dato"} />
              <OrderRow
                label="Fecha"
                value={hasCicloId ? (activeCycle?.fechaEntregaObjetivo ?? new Date().toLocaleDateString("es-AR")) : "Sin ciclo"}
              />
              <OrderRow
                label="Estado"
                value={
                  <span className={styles.statusBadge}>
                    {!hasCicloId
                      ? "No disponible"
                      : shouldShowTrackingLoading
                        ? "Consultando"
                        : latestParentOrder?.status
                          ? (PARENT_ORDER_STATUS_LABELS[latestParentOrder.status] ?? latestParentOrder.status)
                          : TRACKING_LABELS[trackingStatus]}
                  </span>
                }
              />
              <OrderRow
                label="Logística"
                value={<span className={styles.totalAmount}>{hasCicloId ? TRACKING_LABELS[trackingStatus] : "Sin seguimiento"}</span>}
                hasBorder={false}
              />
            </dl>
            <DetailButton onClick={() => onNavigate("pedidos")} />
          </article>
        </div>

        <section className={styles.promoBanner}>
          <h3 className={styles.promoTitle}>Nuevos productos disponibles</h3>
          <p className={styles.promoDescription}>Descubre nuestra nueva seleccion de productos premium</p>
          <button onClick={() => onNavigate("productos")} className={styles.promoButton}>
            Ver productos
          </button>
        </section>
      </section>
    </main>
  );
}
