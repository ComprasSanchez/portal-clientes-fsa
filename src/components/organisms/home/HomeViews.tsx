import { useEffect, useRef } from "react";
import { Box, FileText, Package, TrendingUp, User, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { DetailButton } from "@/components/molecules/home/DetailButton";
import { OrderRow } from "@/components/molecules/home/OrderRow";
import {
  QuickAccessCard,
  type QuickAccessItem,
} from "@/components/molecules/home/QuickAccessCard";
import { ProfileView } from "@/components/organisms/profile/ProfileView";
import {
  ExpedienteViewSkeleton,
  TrackingViewSkeleton,
} from "@/components/organisms/loading/ViewSkeletons";
import { useGlobalToast } from "../../ui/global-toast";
import { OrderTrackingPanel } from "@/components/organisms/portal-pedido/order-tracking-panel";
import {
  PARENT_ORDER_STATUS_LABELS,
  TRACKING_LABELS,
} from "@/lib/order-tracking";
import { usePortalExpedientesContext } from "@/lib/portal-expedientes-context";
import { useAuthLogisticaTracking } from "@/lib/use-auth-logistica-tracking";
import { usePortalExpedienteActual } from "@/lib/use-portal-expediente-actual";
import {
  CICLOS_STATE_TYPE_LABELS,
  formatContactLabel,
  formatFriendlyLabel,
  getMappedLabel,
  PAY_TYPE_LABELS,
  SEND_TYPE_LABELS,
  TIME_CONTACT_LABELS,
} from "@/lib/domain-labels";
import type { PortalPerfilResponse } from "@/types/portal-profile";
import { HomeView } from "@/types/home";
import styles from "./HomeViews.module.scss";

const formatOptionalDate = (value: string | null | undefined) => {
  if (!value) {
    return "Sin dato";
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime())
    ? value
    : parsedDate.toLocaleDateString("es-AR");
};


const formatDeliveryLocation = ({
  medioEntrega,
  domicilioEntrega,
  sucursalEntrega,
}: {
  medioEntrega: string | null | undefined;
  domicilioEntrega:
    | {
        calle: string | null;
        numero: string | null;
        piso: string | null;
        departamento: string | null;
        localidad: string | null;
        provincia: string | null;
      }
    | null
    | undefined;
  sucursalEntrega:
    | {
        nombre: string;
        direccion: string;
      }
    | null
    | undefined;
}) => {
  if (
    (medioEntrega === "RETIRA_SUCURSAL" || medioEntrega === "SUCURSAL") &&
    sucursalEntrega
  ) {
    return `${sucursalEntrega.nombre} - ${sucursalEntrega.direccion}`;
  }

  if (domicilioEntrega) {
    const street = [domicilioEntrega.calle, domicilioEntrega.numero]
      .filter(Boolean)
      .join(" ");
    const extra = [domicilioEntrega.piso, domicilioEntrega.departamento]
      .filter(Boolean)
      .join(" ");
    const area = [domicilioEntrega.localidad, domicilioEntrega.provincia]
      .filter(Boolean)
      .join(", ");
    return [street, extra, area].filter(Boolean).join(" - ") || "Sin dato";
  }

  if (sucursalEntrega) {
    return `${sucursalEntrega.nombre} - ${sucursalEntrega.direccion}`;
  }

  return "Sin dato";
};

interface HomeViewsProps {
  currentView: HomeView;
  onNavigate: (view: HomeView) => void;
  userName: string;
  affiliateNumber: string | null;
  documentNumber: string | null;
  email: string | null;
  phone: string | null;
  perfil: PortalPerfilResponse | null;
  isProfileLoading?: boolean;
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
    title: "Tu pedido actual",
    description:
      "Acá podés ver cómo viene tu pedido, cómo te vamos a contactar y qué medicamentos incluye.",
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
  isProfileLoading = false,
}: HomeViewsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pushToast } = useGlobalToast();
  const hasShownValidationToastRef = useRef(false);
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
  } = usePortalExpedientesContext();
  const cicloId = queryCicloId || currentCycleId;
  const requiresAccountValidation =
    expedientesError?.includes("Valida tu cuenta") ?? false;
  const latestOrderSubtitle = requiresAccountValidation
    ? "Valida tu usuario para habilitar el seguimiento"
    : "Estado actual";
  const {
    expedienteData: expedienteActualData,
    expediente: expedienteActual,
    cliente: expedienteActualCliente,
    contacto: expedienteActualContacto,
    domicilioEntrega: expedienteActualDomicilio,
    sucursalEntrega: expedienteActualSucursal,
    medico: expedienteActualMedico,
    cycleEvents: expedienteActualEvents,
    cycleItems: expedienteActualCycleItems,
    expedienteItems: expedienteActualItems,
    currentCycle: expedienteActualCycle,
    pastCycles,
    cicloItemsCount,
    warnings: expedienteActualWarnings,
    isLoading: isExpedienteActualLoading,
    error: expedienteActualError,
    isNotFound: expedienteActualNotFound,
    refresh: refreshExpedienteActual,
  } = usePortalExpedienteActual({
    enabled: currentView === "expediente-actual",
  });
  const expedienteActualRequiresAccountValidation =
    expedienteActualError?.includes("Valida tu cuenta") ?? false;

  useEffect(() => {
    if (!requiresAccountValidation || !expedientesError) {
      hasShownValidationToastRef.current = false;
      return;
    }

    if (hasShownValidationToastRef.current) {
      return;
    }

    pushToast({
      id: "portal-expedientes-account-validation",
      title: "Validá tu usuario",
      description: expedientesError,
      variant: "error",
      duration: 8000,
    });
    hasShownValidationToastRef.current = true;
  }, [expedientesError, pushToast, requiresAccountValidation]);

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
  const shouldShowTrackingLoading =
    isExpedientesLoading || isPedidoTrackingLoading;
  const cicloWarningMessage = expedienteWarnings.includes(
    "expediente_cycles_unavailable",
  )
    ? "El BFF devolvio expedientes, pero no pudo enriquecer los ciclos. Revisa permisos de cliente:read en el bearer final."
    : null;

  if (currentView === "mi-cuenta") {
    return (
      <main className={styles.container}>
        <ProfileView perfil={perfil} variant="cora" isLoading={isProfileLoading} />
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
            <TrackingViewSkeleton variant="cora" />
          ) : null}

          {!shouldShowTrackingLoading && expedientesError ? (
            <div
              className={`${styles.trackingMessageCard} ${styles.trackingMessageError}`}
            >
              <p className={styles.trackingMessageTitle}>
                {requiresAccountValidation
                  ? "Necesitamos validar tu usuario"
                  : "No pudimos cargar los expedientes"}
              </p>
              <p className={styles.trackingMessageText}>{expedientesError}</p>
            </div>
          ) : null}

          {!shouldShowTrackingLoading &&
          !expedientesError &&
          trackingBlockedByExpedientes ? (
            <div className={styles.trackingMessageCard}>
              <p className={styles.trackingMessageTitle}>
                Seguimiento no disponible por ahora
              </p>
              <p className={styles.trackingMessageText}>
                No encontramos un `cicloActual` en `/portal/me/expedientes`, por
                lo que todavia no podemos consultar la logistica autenticada.
              </p>
            </div>
          ) : null}

          {!shouldShowTrackingLoading && expedientesPartial ? (
            <div className={styles.trackingMessageCard}>
              <p className={styles.trackingMessageTitle}>
                Los expedientes llegaron con datos parciales
              </p>
              <p className={styles.trackingMessageText}>
                {cicloWarningMessage ||
                  "La pantalla sigue mostrando la informacion disponible, pero algunos ciclos pueden no estar enriquecidos."}
              </p>
            </div>
          ) : null}

          {!shouldShowTrackingLoading && hasCicloId && pedidoTrackingError ? (
            <div
              className={`${styles.trackingMessageCard} ${styles.trackingMessageError}`}
            >
              <p className={styles.trackingMessageTitle}>
                No pudimos consultar el seguimiento
              </p>
              <p className={styles.trackingMessageText}>
                {pedidoTrackingError}
              </p>
            </div>
          ) : null}

          {!shouldShowTrackingLoading &&
          hasCicloId &&
          !pedidoTrackingError &&
          latestParentOrder ? (
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

  if (currentView === "expediente-actual") {
    return (
      <main className={styles.container}>
        <section className={styles.activeViewCard}>
          <p className={styles.activeViewLabel}>Vista activa</p>
          <h1 className={styles.activeViewTitle}>{active.title}</h1>
          <p className={styles.activeViewDescription}>{active.description}</p>

          {isExpedienteActualLoading ? (
            <ExpedienteViewSkeleton variant="cora" />
          ) : null}

          {!isExpedienteActualLoading && expedienteActualError ? (
            <div
              className={`${styles.trackingMessageCard} ${styles.trackingMessageError}`}
            >
              <p className={styles.trackingMessageTitle}>
                {expedienteActualRequiresAccountValidation
                  ? "Necesitamos validar tu usuario"
                  : "No pudimos cargar el expediente actual"}
              </p>
              <p className={styles.trackingMessageText}>
                {expedienteActualError}
              </p>
            </div>
          ) : null}

          {!isExpedienteActualLoading &&
          !expedienteActualError &&
          expedienteActualNotFound ? (
            <div className={styles.trackingMessageCard}>
              <p className={styles.trackingMessageTitle}>
                Todavía no tenés un pedido activo
              </p>
              <p className={styles.trackingMessageText}>
                Cuando haya un pedido en curso, lo vas a ver acá con su estado,
                la forma de entrega y el detalle de los medicamentos.
              </p>
            </div>
          ) : null}

          {!isExpedienteActualLoading &&
          !expedienteActualError &&
          !expedienteActualNotFound &&
          expedienteActualData ? (
            <div className={styles.detailCardsGrid}>
              <article className={styles.cycleSummaryCard}>
                <p className={styles.cycleSummaryEyebrow}>Tu pedido</p>
                <div className={styles.cycleSummaryGrid}>
                  <div>
                    <p className={styles.cycleSummaryLabel}>Nombre</p>
                    <p className={styles.cycleSummaryValue}>
                      {expedienteActual?.titulo ?? "Sin dato"}
                    </p>
                  </div>
                  <div>
                    <p className={styles.cycleSummaryLabel}>Forma de entrega</p>
                    <p className={styles.cycleSummaryValue}>
                      {getMappedLabel(SEND_TYPE_LABELS, expedienteActual?.medioEntrega)}
                    </p>
                  </div>
                  <div>
                    <p className={styles.cycleSummaryLabel}>Creado el</p>
                    <p className={styles.cycleSummaryValue}>
                      {formatOptionalDate(expedienteActual?.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className={styles.cycleSummaryLabel}>Actualizado</p>
                    <p className={styles.cycleSummaryValue}>
                      {formatOptionalDate(expedienteActual?.updatedAt)}
                    </p>
                  </div>
                  <div>
                    <p className={styles.cycleSummaryLabel}>Paciente</p>
                    <p className={styles.cycleSummaryValue}>
                      {expedienteActualCliente
                        ? `${expedienteActualCliente.nombre} ${expedienteActualCliente.apellido}`
                        : "Sin dato"}
                    </p>
                  </div>
                  <div>
                    <p className={styles.cycleSummaryLabel}>Documento</p>
                    <p className={styles.cycleSummaryValue}>
                      {expedienteActualCliente?.documento.numero ?? "Sin dato"}
                    </p>
                  </div>
                </div>

                {/* {expedienteActualGeneratedAt ? (
                  <p className={styles.trackingMessageText}>
                    Respuesta generada el {formatOptionalDate(expedienteActualGeneratedAt)}.
                  </p>
                ) : null} */}
              </article>

              <article className={styles.cycleSummaryCard}>
                <p className={styles.cycleSummaryEyebrow}>Próxima entrega</p>
                {expedienteActualCycle ? (
                  <div className={styles.cycleSummaryGrid}>
                    <div>
                      <p className={styles.cycleSummaryLabel}>Pedido</p>
                      <p className={styles.cycleSummaryValue}>
                        {expedienteActualCycle.titulo}
                      </p>
                    </div>
                    <div>
                      <p className={styles.cycleSummaryLabel}>Estado</p>
                      <p className={styles.cycleSummaryValue}>
                        {getMappedLabel(CICLOS_STATE_TYPE_LABELS, expedienteActualCycle.estado)}
                      </p>
                    </div>
                    <div>
                      <p className={styles.cycleSummaryLabel}>Fecha estimada</p>
                      <p className={styles.cycleSummaryValue}>
                        {formatOptionalDate(
                          expedienteActualCycle.fechaEntregaObjetivo,
                        )}
                      </p>
                    </div>
                    <div>
                      <p className={styles.cycleSummaryLabel}>Empezamos a prepararlo</p>
                      <p className={styles.cycleSummaryValue}>
                        {formatOptionalDate(
                          expedienteActualCycle.fechaInicioGestion,
                        )}
                      </p>
                    </div>
                    <div>
                      <p className={styles.cycleSummaryLabel}>Movimientos registrados</p>
                      <p className={styles.cycleSummaryValue}>
                        {expedienteActualEvents.length}
                      </p>
                    </div>
                    <div>
                      <p className={styles.cycleSummaryLabel}>Medicamentos en este pedido</p>
                      <p className={styles.cycleSummaryValue}>
                        {expedienteActualCycleItems.length}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className={styles.summaryMuted}>
                    Todavía no tenemos el detalle de la próxima entrega.
                  </p>
                )}
              </article>

              <article className={styles.cycleSummaryCard}>
                <p className={styles.cycleSummaryEyebrow}>Cómo seguimos</p>
                <div className={styles.cycleSummaryGrid}>
                  <div>
                    <p className={styles.cycleSummaryLabel}>Canal de contacto</p>
                    <p className={styles.cycleSummaryValue}>
                      {expedienteActualContacto
                        ? `${formatContactLabel(expedienteActualContacto.tipo)}: ${expedienteActualContacto.valor}`
                        : "Sin dato"}
                    </p>
                  </div>
                  <div>
                    <p className={styles.cycleSummaryLabel}>Horario de contacto</p>
                    <p className={styles.cycleSummaryValue}>
                      {getMappedLabel(
                        TIME_CONTACT_LABELS,
                        expedienteActual?.politicaContacto ?? "",
                      )}
                    </p>
                  </div>
                  <div>
                    <p className={styles.cycleSummaryLabel}>Lo recibís en</p>
                    <p className={styles.cycleSummaryValue}>
                      {formatDeliveryLocation({
                        medioEntrega: expedienteActual?.medioEntrega,
                        domicilioEntrega: expedienteActualDomicilio,
                        sucursalEntrega: expedienteActualSucursal,
                      })}
                    </p>
                  </div>
                  <div>
                    <p className={styles.cycleSummaryLabel}>Médico</p>
                    <p className={styles.cycleSummaryValue}>
                      {expedienteActualMedico?.nombre ??
                        expedienteActual?.medicoNombre ??
                        "Sin dato"}
                    </p>
                  </div>
                  <div>
                    <p className={styles.cycleSummaryLabel}>Forma de pago</p>
                    <p className={styles.cycleSummaryValue}>
                      {getMappedLabel(PAY_TYPE_LABELS, expedienteActual?.medioPago)}
                    </p>
                  </div>
                  <div>
                    <p className={styles.cycleSummaryLabel}>Medicamentos de este pedido</p>
                    <p className={styles.cycleSummaryValue}>
                      {cicloItemsCount}
                    </p>
                  </div>
                  <div>
                    <p className={styles.cycleSummaryLabel}>Medicamentos del tratamiento</p>
                    <p className={styles.cycleSummaryValue}>
                      {expedienteActualItems.length}
                    </p>
                  </div>
                  <div>
                    <p className={styles.cycleSummaryLabel}>Entregas anteriores</p>
                    <p className={styles.cycleSummaryValue}>
                      {pastCycles.length}
                    </p>
                  </div>
                </div>

                <div className={styles.itemsSection}>
                  <p className={styles.itemsSectionTitle}>Medicamentos de este pedido</p>
                {expedienteActualCycleItems.length > 0 ? (
                  <div className={styles.itemsGrid}>
                    {expedienteActualCycleItems.map((item) => (
                      <article key={item.id} className={styles.itemCard}>
                        <p className={styles.itemTitle}>{item.productoNombre}</p>

                      </article>
                    ))}
                  </div>
                ) : (
                  <p className={styles.summaryMuted}>
                    Todavía no tenemos el detalle de los medicamentos de este pedido.
                  </p>
                )}
                </div>

                {expedienteActualWarnings.length > 0 ? (
                  <div className={styles.warningList}>
                    {expedienteActualWarnings.map((warning) => (
                      <span key={warning} className={styles.warningItem}>
                        {warning}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => {
              void refreshExpedienteActual();
            }}
            className={styles.primaryButton}
          >
            Actualizar página
          </button>
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

          <button
            onClick={() => onNavigate("dashboard")}
            className={styles.primaryButton}
          >
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
          <p className={styles.welcomeSubtitle}>
            Bienvenido a tu panel de gestion de pedidos
          </p>
        </div>

        <div className={styles.quickAccessGrid}>
          {quickAccessItems.map((item) => (
            <QuickAccessCard
              key={item.view ?? item.label}
              item={item}
              onNavigate={onNavigate}
            />
          ))}
        </div>

        <div className={styles.detailsGrid}>
          <article className={styles.panelCard}>
            <h2 className={styles.panelTitle}>Mi credencial</h2>
            <p className={styles.panelSubtitle}>
              {hasAffiliateNumber
                ? "Numero de afiliacion"
                : "Todavia no tenes una obra social asociada"}
            </p>
            <div className={styles.credentialGradient}>
              <p className={styles.credentialLabel}>Titular</p>
              <p className={styles.credentialValue}>{userName}</p>
              <div className={styles.separator} />
              <p className={styles.credentialLabel}>
                {hasAffiliateNumber ? "N de afiliacion" : "Estado"}
              </p>
              <p className={styles.credentialNumber}>
                {hasAffiliateNumber
                  ? affiliateNumber
                  : "Sin numero de afiliado"}
              </p>
              {!hasAffiliateNumber ? (
                <p className={styles.credentialHint}>
                  Completa tu obra social desde Mi perfil para ver tu credencial
                  y la cobertura asociada.
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
            <p className={styles.panelSubtitle}>
              Datos personales y de contacto
            </p>
            <dl className={styles.orderList}>
              <OrderRow label="Afiliado" value={userName} />
              <OrderRow
                label="Documento"
                value={documentNumber ?? "Sin dato"}
              />
              <OrderRow label="Mail" value={email ?? "Sin dato"} />
              <OrderRow
                label="Telefono"
                value={
                  <span className={styles.totalAmount}>
                    {phone ?? "Sin dato"}
                  </span>
                }
                hasBorder={false}
              />
            </dl>
            <DetailButton onClick={() => onNavigate("mi-cuenta")} />
          </article>

          <article className={styles.panelCard}>
            <h2 className={styles.panelTitle}>Ultimo pedido</h2>
            <p className={styles.panelSubtitle}>{latestOrderSubtitle}</p>
            <dl className={styles.orderList}>
              <OrderRow
                label="Pedido"
                value={
                  resolvedOrderNumber ? `#${resolvedOrderNumber}` : "Sin dato"
                }
              />
              <OrderRow
                label="Fecha"
                value={
                  hasCicloId
                    ? (activeCycle?.fechaEntregaObjetivo ??
                      new Date().toLocaleDateString("es-AR"))
                    : "Sin ciclo"
                }
              />
              <OrderRow
                label="Estado"
                value={
                  <span className={styles.statusBadge}>
                    {requiresAccountValidation
                      ? "Validar usuario"
                      : !hasCicloId
                        ? "No disponible"
                        : shouldShowTrackingLoading
                          ? "Consultando"
                          : latestParentOrder?.status
                            ? (PARENT_ORDER_STATUS_LABELS[
                                latestParentOrder.status
                              ] ?? latestParentOrder.status)
                            : TRACKING_LABELS[trackingStatus]}
                  </span>
                }
              />
              <OrderRow
                label="Logística"
                value={
                  <span className={styles.totalAmount}>
                    {requiresAccountValidation
                      ? "Validacion requerida"
                      : hasCicloId
                        ? TRACKING_LABELS[trackingStatus]
                        : "Sin seguimiento"}
                  </span>
                }
                hasBorder={false}
              />
            </dl>
            <DetailButton onClick={() => onNavigate("pedidos")} />
          </article>
        </div>

        <section className={styles.promoBanner}>
          <h3 className={styles.promoTitle}>Nuevos productos disponibles</h3>
          <p className={styles.promoDescription}>
            Descubre nuestra nueva seleccion de productos premium
          </p>
          <button
            onClick={() => onNavigate("productos")}
            className={styles.promoButton}
          >
            Ver productos
          </button>
        </section>
      </section>
    </main>
  );
}
