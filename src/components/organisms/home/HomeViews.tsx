import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  MapPin,
  Phone,
  Pill,
  Stethoscope,
  TrendingUp,
  Truck,
  User,
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { DetailButton } from "@/components/molecules/home/DetailButton";
import { OrderRow } from "@/components/molecules/home/OrderRow";
import {
  QuickAccessCard,
  type QuickAccessItem,
} from "@/components/molecules/home/QuickAccessCard";
import { ProfileView } from "@/components/organisms/profile/ProfileView";
import {
  CoraDashboardSkeleton,
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
import { ExpedientesManagementView } from "@/components/organisms/expedientes-management/ExpedientesManagementView";
import { CrearPedidoView } from "@/components/organisms/expedientes-management/crear-pedido/CrearPedidoView";
import { FaqView } from "../faq-view/FaqView";
import { BannerCoraCarousel } from "@/components/molecules/home/BannerCoraCarousel";
import { BannerCoraMobileCarousel } from "@/components/molecules/home/BannerCoraMobileCarousel";
import boxCoraIcon from "@/assets/cora/card/box-cora.svg";
import fileCoraIcon from "@/assets/cora/card/file-cora.svg";
import bellCoraIcon from "@/assets/cora/card/bell-cora.svg";
import userCoraIcon from "@/assets/cora/card/user-cora.svg";
import interrogationCoraIcon from "@/assets/cora/card/interrogation-cora.svg";

const MEDICAMENTOS_COLLAPSED_LIMIT = 3;

// Las fechas "YYYY-MM-DD" que manda el backend son solo-fecha, sin hora.
// `new Date("YYYY-MM-DD")` las interpreta como medianoche UTC, lo que las
// corre un día hacia atrás al formatearlas en horarios detrás de UTC
// (ej. Argentina, UTC-3). Acá las parseamos como fecha local en cambio.
const parseDateOnly = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match) {
    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  return new Date(value);
};

const formatOptionalDate = (value: string | null | undefined) => {
  if (!value) {
    return "No informado";
  }

  const parsedDate = parseDateOnly(value);
  return Number.isNaN(parsedDate.getTime())
    ? value
    : parsedDate.toLocaleDateString("es-AR");
};

const formatDaysUntilContact = (value: string | null | undefined) => {
  const parsedDate = value ? parseDateOnly(value) : null;
  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  // Comparamos por día calendario (no por horas/milisegundos) para no perder
  // un día por diferencia de horario dentro de la misma fecha.
  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const startOfTarget = new Date(
    parsedDate.getFullYear(),
    parsedDate.getMonth(),
    parsedDate.getDate(),
  );
  const diffDays = Math.round(
    (startOfTarget.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays <= 0) return "Te contactaremos hoy";
  if (diffDays === 1) return "Te contactaremos mañana";
  return `Te contactaremos en ${diffDays} días`;
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
    return [street, extra, area].filter(Boolean).join(" - ") || "No informado";
  }

  if (sucursalEntrega) {
    return `${sucursalEntrega.nombre} - ${sucursalEntrega.direccion}`;
  }

  return "No informado";
};

interface HomeViewsProps {
  currentView: HomeView;
  previousView?: HomeView;
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
  "mi-historial": {
    title: "Mi historial",
    description: "Creá pedidos nuevos y actualizá el pedido activo.",
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
  "pedido-actual": {
    title: "Tu último pedido",
    description:
      "Te contamos todo sobre tu pedido: estado, medicamentos y entrega.",
  },
  "pedido-completo": {
    title: "Historial completo",
    description: "Registro historico de toda la documentacion.",
  },
  "preguntas-frecuentes": {
    title: "Preguntas frecuentes",
    description: "Respuestas rápidas sobre CORA y cómo funciona.",
  },
  "crear-pedido": {
    title: "Nuevo pedido",
    description: "Elegí los productos, la fecha y cómo querés recibirlo.",
  },
};

export function HomeViews({
  currentView,
  previousView,
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
  const [isMedicamentosExpanded, setIsMedicamentosExpanded] = useState(false);
  const active = viewContent[currentView];
  const hasAffiliateNumber = Boolean(affiliateNumber?.trim());
  const quickAccessItems: QuickAccessItem[] = [
    {
      label: "Mi pedido",
      view: "pedido-actual",
      icon: boxCoraIcon,
      tone: "plain",
    },
    {
      label: "Mi historial",
      view: "mi-historial",
      icon: fileCoraIcon,
      tone: "plain",
    },
    // {
    //   label: "Mis recordatorios",
    //   view: "pedidos",
    //   icon: bellCoraIcon,
    //   tone: "plain",
    // },
    {
      label: "Mi perfil",
      view: "mi-cuenta",
      icon: userCoraIcon,
      tone: "plain",
    },
    {
      label: "Preguntas frecuentes",
      view: "pedidos",
      icon: interrogationCoraIcon,
      tone: "plain",
    },
  ];

  const queryCicloId = searchParams.get("cicloId");
  const {
    items: expedienteItems,
    activeExpediente,
    activeCycle,
    currentCycleId,
    partial: expedientesPartial,
    warnings: expedienteWarnings,
    isLoading: isExpedientesLoading,
    error: expedientesError,
    refresh: refreshExpedientes,
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
    expedienteItems: expedienteActualItems,
    currentCycle: expedienteActualCycle,
    pastCycles,
    warnings: expedienteActualWarnings,
    isLoading: isExpedienteActualLoading,
    error: expedienteActualError,
    isNotFound: expedienteActualNotFound,
    refresh: refreshExpedienteActual,
  } = usePortalExpedienteActual({
    enabled: currentView === "pedido-actual",
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
    ? "Todavía estamos completando la información de tus pedidos, pero podés seguir viendo los datos disponibles."
    : null;

  if (currentView === "mi-cuenta") {
    return (
      <main className={styles.container}>
        <ProfileView
          perfil={perfil}
          variant="cora"
          isLoading={isProfileLoading}
        />
      </main>
    );
  }

  if (currentView === "mi-historial") {
    return (
      <main className={styles.container}>
        <ExpedientesManagementView
          perfil={perfil}
          expedientes={expedienteItems}
          activeExpedienteId={activeExpediente?.expedienteId ?? null}
          refreshExpedientes={refreshExpedientes}
          isExpedientesLoading={isExpedientesLoading}
          expedientesError={expedientesError}
          onNavigate={onNavigate}
        />
      </main>
    );
  }

  if (currentView === "crear-pedido") {
    return (
      <main className={styles.container}>
        <CrearPedidoView
          perfil={perfil}
          refreshExpedientes={refreshExpedientes}
          onNavigate={onNavigate}
          previousView={previousView ?? "mi-historial"}
        />
      </main>
    );
  }

  if (currentView === "preguntas-frecuentes") {
    return (
      <main className={styles.container}>
        <FaqView />
      </main>
    );
  }

  if (currentView === "pedidos") {
    return (
      <main className={styles.container}>
        <section className={styles.activeViewCard}>
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
                  : "No pudimos cargar tus pedidos"}
              </p>
              <p className={styles.trackingMessageText}>{expedientesError}</p>
            </div>
          ) : null}

          {!shouldShowTrackingLoading &&
          !expedientesError &&
          trackingBlockedByExpedientes ? (
            <div className={styles.trackingMessageCard}>
              <p className={styles.trackingMessageTitle}>
                No se encontraron pedidos recientes para mostrarte su
                seguimiento
              </p>
              <p className={styles.trackingMessageText}>
                No pudimos encontrar un pedido reciente para mostrarte su
                seguimiento. Cuando hagas un nuevo pedido, vas a poder seguir su
                estado y preparación desde esta pantalla.
              </p>
            </div>
          ) : null}

          {!shouldShowTrackingLoading && expedientesPartial ? (
            <div className={styles.trackingMessageCard}>
              <p className={styles.trackingMessageTitle}>
                Tus pedidos llegaron con datos parciales
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

  if (currentView === "pedido-actual") {
    return (
      <main className={styles.container}>
        <section
          className={`${styles.activeViewCard} ${styles.expedienteActualViewCard}`}
        >
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
                  : "No pudimos cargar tu pedido actual"}
              </p>
              <p className={styles.trackingMessageText}>
                Contactate con nuestro equipo de soporte para resolver este
                inconveniente y poder mostrarte el estado de tu pedido actual.
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
            <div className={styles.expedienteLayout}>
              <div className={styles.expedienteTwoCol}>
                <div>
                  <section className={styles.expedienteSection}>
                    <p className={styles.sectionEyebrow}>
                      Medicamentos solicitados
                    </p>
                    {expedienteActualItems.length > 0 ? (
                      <>
                        {(isMedicamentosExpanded
                          ? expedienteActualItems
                          : expedienteActualItems.slice(
                              0,
                              MEDICAMENTOS_COLLAPSED_LIMIT,
                            )
                        ).map((item) => (
                          <div key={item.id} className={styles.medicamentCard}>
                            <div className={styles.medicamentIcon}>
                              <Pill size={16} />
                            </div>
                            <div className={styles.medicamentInfo}>
                              <p className={styles.medicamentName}>
                                {item.productoNombre}
                              </p>
                              {item.marcaNombre && (
                                <p className={styles.medicamentMarca}>
                                  {item.marcaNombre}
                                </p>
                              )}
                            </div>
                            {item.cantidadEnvasesPorCiclo != null && (
                              <div className={styles.medicamentQty}>
                                <span className={styles.medicamentQtyLabel}>
                                  Cantidad
                                </span>
                                <span className={styles.medicamentQtyValue}>
                                  {item.cantidadEnvasesPorCiclo}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}

                        {expedienteActualItems.length >
                        MEDICAMENTOS_COLLAPSED_LIMIT ? (
                          <button
                            type="button"
                            onClick={() =>
                              setIsMedicamentosExpanded((prev) => !prev)
                            }
                            className={styles.verTodosButton}
                          >
                            {isMedicamentosExpanded
                              ? "Ver menos"
                              : `Ver todos (${expedienteActualItems.length})`}
                            {isMedicamentosExpanded ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </button>
                        ) : null}
                      </>
                    ) : (
                      <p className={styles.summaryMuted}>
                        Sin medicamentos registrados.
                      </p>
                    )}
                  </section>

                  {expedienteActualCycle && (
                    <section className={styles.expedienteSection}>
                      <p className={styles.sectionEyebrow}>FECHA ESTIMADA DE CONTACTO</p>
                      <div className={styles.cicloCard}>
                        <div className={styles.cicloCardLeft}>
                          <p className={styles.cicloDate}>
                            {formatOptionalDate(
                              expedienteActualCycle.fechaInicioGestion,
                            )}
                          </p>
                        </div>
                      </div>
                    </section>
                  )}
                </div>

                <div>
                  <section className={styles.expedienteSection}>
                    <p className={styles.sectionEyebrow}>Método de entrega y pago</p>
                    <div className={styles.entregaCard}>
                      <div className={styles.entregaRow}>
                        <Truck size={20} className={styles.entregaIcon} />
                        <div className={styles.entregaBody}>
                          <p className={styles.entregaType}>
                            {getMappedLabel(
                              SEND_TYPE_LABELS,
                              expedienteActual?.medioEntrega,
                            )}
                          </p>
                          <p className={styles.entregaAddress}>
                            {formatDeliveryLocation({
                              medioEntrega: expedienteActual?.medioEntrega,
                              domicilioEntrega: expedienteActualDomicilio,
                              sucursalEntrega: expedienteActualSucursal,
                            })}
                          </p>
                        </div>
                      </div>
                      <div className={styles.entregaPago}>
                        <CreditCard
                          size={20}
                          className={styles.entregaPagoIcon}
                        />
                        <div>
                          <p className={styles.entregaPagoLabel}>Cobertura</p>
                          <p className={styles.entregaPagoValue}>
                            {getMappedLabel(
                              PAY_TYPE_LABELS,
                              expedienteActual?.medioPago,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className={styles.expedienteSection}>
                    <p className={styles.sectionEyebrow}>Datos de contacto</p>
                    <div className={styles.infoCard}>
                      <div className={styles.infoRow}>
                        <Phone size={16} className={styles.infoIcon} />
                        <div>
                          <p className={styles.infoLabel}>
                            {expedienteActualContacto
                              ? formatContactLabel(
                                  expedienteActualContacto.tipo,
                                )
                              : "Teléfono"}
                          </p>
                          <p className={styles.infoValue}>
                            {expedienteActualContacto?.valor ?? "No informado"}
                          </p>
                        </div>
                      </div>
                      <div className={styles.infoRow}>
                        <Clock size={16} className={styles.infoIcon} />
                        <div>
                          <p className={styles.infoLabel}>
                            Horario de contacto
                          </p>
                          <p className={styles.infoValue}>
                            {getMappedLabel(
                              TIME_CONTACT_LABELS,
                              expedienteActual?.politicaContacto ?? "",
                            )}
                          </p>
                        </div>
                      </div>
                      <div className={styles.infoRow}>
                        <MapPin size={16} className={styles.infoIcon} />
                        <div>
                          <p className={styles.infoLabel}>Dirección de entrega</p>
                          <p className={styles.infoValue}>
                            {formatDeliveryLocation({
                              medioEntrega: expedienteActual?.medioEntrega,
                              domicilioEntrega: expedienteActualDomicilio,
                              sucursalEntrega: expedienteActualSucursal,
                            })}
                          </p>
                        </div>
                      </div>
                      <div className={styles.infoRow}>
                        <Stethoscope size={16} className={styles.infoIcon} />
                        <div>
                          <p className={styles.infoLabel}>Médico</p>
                          <p className={styles.infoValue}>
                            {expedienteActualMedico?.nombre ??
                              expedienteActual?.medicoNombre ??
                              "No informado"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {expedienteActualWarnings.length > 0 && (
                    <div className={styles.warningList}>
                      {expedienteActualWarnings.map((warning) => (
                        <span key={warning} className={styles.warningItem}>
                          {warning}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
          {/* <button
            type="button"
            onClick={() => {
              void refreshExpedienteActual();
            }}
            className={styles.primaryButton}
          >
            Actualizar página
          </button> */}
        </section>
      </main>
    );
  }

  if (currentView !== "dashboard") {
    return (
      <main className={styles.container}>
        <section className={styles.activeViewCard}>
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

  if (isProfileLoading) {
    return (
      <main className={styles.container}>
        <CoraDashboardSkeleton />
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <section className={styles.dashboardSection}>
        <div>
          <h1 className={styles.welcomeTitle}>¡Hola, {perfil?.nombre}! 👋</h1>
        </div>

        {/* Desktop */}
        <div className="hidden sm:block">
          <BannerCoraCarousel />
        </div>

        {/* Mobile: banner-socio1 y banner-socio2 */}
        <div className="sm:hidden">
          <BannerCoraMobileCarousel />
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
          {/* <article className={styles.panelCard}>
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
          </article> */}

          <article className={styles.panelCard}>
            <h2 className={styles.panelTitle}>Ultimo pedido</h2>
            <p className={styles.panelSubtitle}>{latestOrderSubtitle}</p>
            <dl className={styles.orderList}>
              <OrderRow
                label="Pedido"
                value={
                  resolvedOrderNumber ? `#${resolvedOrderNumber}` : "No informado"
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

          <article className={styles.panelCard}>
            <h2 className={styles.panelTitle}>Mi perfil</h2>
            <p className={styles.panelSubtitle}>
              Datos personales y de contacto
            </p>
            <dl className={styles.orderList}>
              <OrderRow label="Nombre completo" value={userName} />
              <OrderRow
                label="Documento"
                value={documentNumber ?? "No informado"}
              />
              <OrderRow label="Mail" value={email ?? "No informado"} />
              <OrderRow
                label="Telefono"
                value={
                  <span className={styles.totalAmount}>
                    {phone ?? "No informado"}
                  </span>
                }
                hasBorder={false}
              />
            </dl>
            <DetailButton onClick={() => onNavigate("mi-cuenta")} />
          </article>

          {activeExpediente?.nextActionAt ? (
            <article className={`${styles.panelCard} ${styles.panelCardBell}`}>
              <div className={styles.panelBellLayout}>
                <Image
                  src={bellCoraIcon}
                  alt=""
                  width={80}
                  height={80}
                  className={styles.panelBellIcon}
                />
                <div className={styles.panelBellContent}>
                  <h2 className={`${styles.panelTitle} ${styles.panelTitleAccent}`}>
                    Voy a acompañarte
                  </h2>
                  <p className={styles.panelSubtitle}>
                    Así seguimos tu tratamiento
                  </p>
                  <p className={styles.panelContactSentence}>
                    {formatDaysUntilContact(activeExpediente.nextActionAt)}
                  </p>
                  {process.env.NEXT_PUBLIC_FSA_PHONE_PORTAL ? (
                    <a
                      href={`https://wa.me/${process.env.NEXT_PUBLIC_FSA_PHONE_PORTAL}?text=${encodeURIComponent(
                        "Hola, quiero avisarles que cambió mi tratamiento.",
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.panelWhatsappLink}
                    >
                      💜 Contame si cambió tu tratamiento
                    </a>
                  ) : null}
                </div>
              </div>
            </article>
          ) : null}
        </div>
      </section>
    </main>
  );
}
