import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  CreditCard,
  Star,
  Heart,
  History,
  MapPin,
  Receipt,
  Ticket,
  ShoppingBag,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Alert from "@/components/atoms/alert/alert";
import Badge from "@/components/atoms/badge/badge";
import Card from "@/components/atoms/card/card";
import EmptyState from "@/components/molecules/empty-state/empty-state";
import InstallAppCard from "@/components/molecules/install-app-card/install-app-card";
import Pagination from "@/components/molecules/pagination/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailButton } from "@/components/molecules/home/DetailButton";
import { OrderRow } from "@/components/molecules/home/OrderRow";
import {
  QuickAccessCard,
  type QuickAccessItem,
} from "@/components/molecules/home/QuickAccessCard";
import {
  FacturasViewSkeleton,
  SociosDashboardSkeleton,
} from "@/components/organisms/loading/ViewSkeletons";
import { ProfileView } from "@/components/organisms/profile/ProfileView";
import { SociosSorteosView } from "./SociosSorteosView";
import { SociosSucursalesView } from "./SociosSucursalesView";
import { SociosPedidosView } from "./SociosPedidosView";
import { NotificacionesView } from "@/components/organisms/notificaciones/NotificacionesView";
import { SociosColaboradorVentasView } from "./SociosColaboradorVentasView";
import { SociosColaboradorAplicacionesView } from "./SociosColaboradorAplicacionesView";
import { SorteoCard } from "@/components/molecules/socios/SorteoCard";
import { SucursalesPromoCard } from "@/components/molecules/socios/SucursalesPromoCard";
import { BannerCarousel } from "@/components/molecules/socios/BannerCarousel";
import { BannerSocioMobileCarousel } from "@/components/molecules/socios/BannerSocioMobileCarousel";
import { BeneficiosCarousel } from "@/components/molecules/socios/BeneficiosCarousel";
import cuotasBanner from "@/assets/sociosa-img/cuotas-banner.jpg";
import { CuotasMobileCarousel } from "@/components/molecules/socios/CuotasMobileCarousel";
import {
  formatPortalCurrency,
  formatPortalDateTime,
} from "@/lib/portal-compras";
import { usePortalCompras } from "@/lib/use-portal-compras";
import { usePortalExpedientesContext } from "@/lib/portal-expedientes-context";
import { formatPortalPoints, puntosToARS } from "@/lib/portal-puntos";
import { usePortalPuntos } from "@/lib/use-portal-puntos";
import { usePortalPuntosHistorial } from "@/lib/use-portal-puntos-historial";
import { useGlobalToast } from "../../ui/global-toast";
import type { PortalPerfilResponse } from "@/types/portal-profile";
import type { PortalComprasProducto } from "@/types/portal-compras";
import { type SociosView } from "@/types/socios";
import styles from "./SociosViews.module.scss";

interface SociosViewsProps {
  currentView: SociosView;
  onNavigate: (view: SociosView) => void;
  userName: string;
  affiliateNumber: string | null;
  documentNumber: string | null;
  email: string | null;
  phone: string | null;
  perfil: PortalPerfilResponse | null;
  isProfileLoading?: boolean;
  convenio?: string | null;
  convenioLocked?: boolean;
}

const viewContent: Record<
  Exclude<SociosView, "dashboard">,
  { title: string; description: string }
> = {
  "mi-cuenta": {
    title: "Mi perfil",
    description:
      "Informacion personal, datos de contacto y referencia de afiliacion en un solo lugar.",
  },
  pedidos: {
    title: "Mis pedidos",
    description: "Seguimiento del estado, preparacion y entrega de tu pedido.",
  },
  notificaciones: {
    title: "Notificaciones",
    description: "Todas tus novedades, organizadas por categoría.",
  },
  facturas: {
    title: "Historial de compra",
    description: "Tus compras en Farmacias Sánchez Antoniolli.",
  },
  puntos: {
    title: "Mis puntos",
    description:
      "Revisa tu saldo actual, beneficios vigentes y proximas recompensas disponibles.",
  },
  sorteos: {
    title: "Sorteos",
    description:
      "Consulta el sorteo activo y participa con tu cuenta de socio en pocos pasos.",
  },
  sucursales: {
    title: "Sucursales",
    description:
      "Encontrá la sucursal más cercana, consultá horarios y accedé a indicaciones.",
  },
  "colaboradores-ventas": {
    title: "Mis ventas",
    description: "Tu desempeño en el mostrador, día a día.",
  },
  "colaboradores-aplicaciones": {
    title: "Aplicaciones FSA",
    description: "Accedé a las herramientas que usás en tu día a día.",
  },
};

const hasProductDiscount = (producto: PortalComprasProducto) => {
  return typeof producto.descuento === "number" && producto.descuento !== 0;
};

export function SociosViews({
  currentView,
  onNavigate,
  userName,
  affiliateNumber,
  documentNumber,
  email,
  phone,
  perfil,
  isProfileLoading = false,
  convenio,
  convenioLocked,
}: SociosViewsProps) {
  const FACTURAS_PAGE_SIZE = 5;
  const router = useRouter();
  const { pushToast } = useGlobalToast();
  const hasShownValidationToastRef = useRef(false);
  const [facturasPage, setFacturasPage] = useState(0);
  const hasAffiliateNumber = Boolean(affiliateNumber?.trim());
  const { error: expedientesError } = usePortalExpedientesContext();
  const {
    summary: puntosSummary,
    isLoading: isPointsLoading,
    error: pointsError,
  } = usePortalPuntos();
  const {
    historial: puntosHistorial,
    isLoading: isHistorialLoading,
    error: historialError,
    page: historialPage,
    setPage: setHistorialPage,
  } = usePortalPuntosHistorial({ enabled: currentView === "puntos" });
  const {
    compras,
    summary: comprasSummary,
    isLoading: isComprasLoading,
    error: comprasError,
  } = usePortalCompras({
    enabled: currentView === "facturas",
    limit: 100,
    offset: 0,
  });
  const requiresAccountValidation =
    expedientesError?.includes("Valida tu cuenta") ?? false;
  const allComprobantes = comprasSummary.comprobantes;
  const facturasStart = facturasPage * FACTURAS_PAGE_SIZE;
  const comprobantesPage = allComprobantes.slice(
    facturasStart,
    facturasStart + FACTURAS_PAGE_SIZE,
  );
  const facturasTotalPages = Math.ceil(allComprobantes.length / FACTURAS_PAGE_SIZE);

  const pointsCard = (
    <Card className={styles.pointsPanelCard}>
      <div className={styles.pointsHeader}>
        <div>
          <h2 className={styles.panelTitle}>Tu saldo y actividad reciente</h2>
          <p className={styles.panelSubtitle}>
            Saldo acumulado y movimientos pendientes
          </p>
        </div>
        {puntosSummary.partial ? <Badge color="warning">Parcial</Badge> : null}
      </div>

      {pointsError ? (
        <Alert className="mt-4">
          No pudimos cargar tus puntos ahora mismo. Intenta nuevamente en unos
          minutos.
        </Alert>
      ) : (
        <div className={styles.pointsContentRow}>
          <div className={styles.pointsHighlight}>
            <span className={styles.pointsLabel}>Disponibles</span>
            <strong className={styles.pointsValue}>
              {isPointsLoading
                ? "..."
                : formatPortalPoints(puntosSummary.disponibles)}
            </strong>
              {/* {!isPointsLoading && (
                <span className={styles.pointsARS}>
                  ≈ {formatPortalCurrency(puntosToARS(puntosSummary.disponibles))}{" "}
                  para gastar
                </span>
              )} */}
          </div>

          <div className={styles.pointsSideColumn}>
            <div className={styles.pointsGrid}>
              <div className={styles.pointsMetricCard}>
                <span className={styles.pointsMetricLabel}>
                  Vencen en 30 días
                </span>
                <strong className={styles.pointsMetricValue}>
                  {isPointsLoading
                    ? "..."
                    : formatPortalPoints(puntosSummary.porVencer30d)}
                </strong>
              </div>
            </div>

            {puntosSummary.warnings.length > 0 ? (
              <Alert color="warning" className="mt-4">
                Algunas fuentes de puntos no estuvieron disponibles, por eso los
                datos pueden ser parciales.
              </Alert>
            ) : null}
          </div>
        </div>
      )}
    </Card>
  );

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
      title: "Valida tu usuario",
      description: expedientesError,
      variant: "error",
      duration: 8000,
    });
    hasShownValidationToastRef.current = true;
  }, [expedientesError, pushToast, requiresAccountValidation]);

  const quickAccessItems: QuickAccessItem<SociosView>[] = [
    { label: "Mi perfil", view: "mi-cuenta", icon: User, tone: "socios" },
    { label: "Facturas", view: "facturas", icon: CreditCard, tone: "socios" },
    { label: "Puntos", view: "puntos", icon: Star, tone: "socios" },
    { label: "Sorteos", view: "sorteos", icon: Ticket, tone: "socios" },
    { label: "Sucursales", view: "sucursales", icon: MapPin, tone: "socios" },
    {
      label: "Mis pedidos",
      view: "pedidos",
      icon: ShoppingBag,
      tone: "socios",
    },
    // {
    //   label: "CORA",
    //   icon: Heart,
    //   onClick: () => router.push("/cora"),
    //   tone: "socios",
    // },
  ];

  if (currentView === "mi-cuenta") {
    return (
      <main className={styles.container}>
        <ProfileView
          perfil={perfil}
          variant="socios"
          isLoading={isProfileLoading}
        />
      </main>
    );
  }

  if (currentView === "sucursales") {
    return <SociosSucursalesView />;
  }

  if (currentView === "pedidos") {
    return (
      <main className={styles.container}>
        <SociosPedidosView />
      </main>
    );
  }

  if (currentView === "notificaciones") {
    return (
      <main className={styles.container}>
        <NotificacionesView tone="socios" onBack={() => onNavigate("dashboard")} />
      </main>
    );
  }

  if (currentView === "colaboradores-ventas") {
    return (
      <main className={styles.container}>
        <SociosColaboradorVentasView />
      </main>
    );
  }

  if (currentView === "colaboradores-aplicaciones") {
    return (
      <main className={styles.container}>
        <SociosColaboradorAplicacionesView />
      </main>
    );
  }

  if (currentView === "sorteos") {
    const principalPhone =
      perfil?.contactos?.find((c) => c.tipo === "TELEFONO" && c.principal) ??
      perfil?.contactos?.find((c) => c.tipo === "TELEFONO") ??
      null;
    const phoneVerified = principalPhone?.verificado === true;
    return (
      <SociosSorteosView
        documentNumber={documentNumber}
        userName={userName}
        phoneVerified={phoneVerified}
        principalPhone={principalPhone}
        convenio={convenio ?? null}
      />
    );
  }

  if (currentView !== "dashboard") {
    const active = viewContent[currentView];

    if (currentView === "puntos") {
      const historialItems = puntosHistorial?.data?.items ?? [];
      const historialPageInfo = puntosHistorial?.data?.page;
      // Si el total no viene confiable, al menos permitir avanzar mientras haya `hasNext`.
      const historialTotalPages = historialPageInfo
        ? Math.max(
            Math.ceil(historialPageInfo.total / Math.max(1, historialPageInfo.limit)),
            historialPage + (historialPageInfo.hasNext ? 1 : 0),
          )
        : 0;

      const tipoLabel: Record<string, string> = {
        compra: "Compra",
        canje: "Canje",
        devolucion: "Devolución",
        anulacion: "Anulación",
        ajuste: "Ajuste",
      };

      const historialCard = (
        <Card className={styles.historialCard}>
          <div className={styles.historialHeader}>
            <div>
              <h2 className={styles.panelTitle}>ACTIVIDAD</h2>
              <p className={styles.panelSubtitle}>
                Tus canjes y acumulaciones recientes
              </p>
            </div>
          </div>

          {historialError ? (
            <Alert className="mt-4">
              No pudimos cargar el historial ahora mismo. Intenta nuevamente en
              unos minutos.
            </Alert>
          ) : isHistorialLoading ? (
            <div className="mt-4 flex flex-col gap-2" aria-label="Cargando historial">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 rounded-lg bg-[#e6f7fb]/70" />
              ))}
            </div>
          ) : historialItems.length === 0 ? (
            <EmptyState
              variant="plain"
              icon={History}
              text="Todavía no tenés movimientos. Sumá puntos con tu próxima compra en cualquier sucursal o en nuestro ecommerce."
            />
          ) : (
            <>
              <div className={styles.historialTableWrap}>
                <table className={styles.historialTable}>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Referencia</th>
                      {/* <th>Monto</th> */}
                      <th>Puntos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialItems.map((item, idx) => {
                      const delta = item.puntosDelta ?? item.puntos ?? 0;
                      const deltaClass =
                        delta > 0
                          ? styles.historialDeltaPositive
                          : delta < 0
                            ? styles.historialDeltaNegative
                            : styles.historialDeltaNeutral;
                      const deltaLabel =
                        delta > 0
                          ? `+${formatPortalPoints(delta)}`
                          : delta < 0
                            ? formatPortalPoints(delta)
                            : "—";
                      const tipoNorm = item.tipo.toLowerCase();
                      const montoLabel =
                        (tipoNorm === "compra" ||
                          tipoNorm === "devolucion" ||
                          tipoNorm === "canje") &&
                        delta !== 0
                          ? formatPortalCurrency(Math.abs(delta) / 10)
                          : "—";

                      return (
                        <tr key={item.id ?? idx}>
                          <td>{formatPortalDateTime(item.fecha)}</td>
                          <td>
                            {tipoLabel[item.tipo.toLowerCase()] ?? item.tipo}
                          </td>
                          <td className={styles.historialRef}>
                            {item.refOperacion ?? "—"}
                          </td>
                          {/* <td>{montoLabel}</td> */}
                          <td className={deltaClass}>{deltaLabel}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* El hook pagina desde 1; Pagination desde 0. */}
              <Pagination
                className="mt-4"
                page={historialPage - 1}
                totalPages={historialTotalPages}
                onChange={(next) => setHistorialPage(next + 1)}
              />
            </>
          )}
        </Card>
      );

      return (
        <main className={styles.container}>
          <section className={styles.facturasViewSection}>
            <div>
              <h1 className={styles.activeViewTitle}>{active.title}</h1>
              <p className={styles.activeViewDescription}>
                {active.description}
              </p>
            </div>
            <div className={styles.activePointsWrapper}>{pointsCard}</div>
            {historialCard}
          </section>
        </main>
      );
    }

    if (currentView === "facturas") {
      if (isComprasLoading && !compras) {
        return (
          <main className={styles.container}>
            <FacturasViewSkeleton variant="socios" />
          </main>
        );
      }

      return (
        <main className={styles.container}>
          <section className={styles.facturasViewSection}>
            <div>
              <h1 className={styles.activeViewTitle}>{active.title}</h1>
              <p className={styles.activeViewDescription}>
                {active.description}
              </p>
            </div>

            <div className={styles.facturasLayout}>
              <div>
                {comprasError ? (
                  <Alert className="mt-4">
                    No pudimos cargar el listado de facturas para este cliente.
                  </Alert>
                ) : isComprasLoading ? (
                  <div className="mt-4 flex flex-col gap-2" aria-label="Cargando facturas">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 rounded-xl bg-[#e6f7fb]/70" />
                    ))}
                  </div>
                ) : allComprobantes.length === 0 ? (
                  <EmptyState
                    icon={Receipt}
                    text="No encontramos comprobantes para este cliente por el momento."
                  />
                ) : (
                  <div className={styles.facturasList}>
                    {comprobantesPage.map((comprobante) => (
                      <details
                        key={comprobante.compraId}
                        className={styles.facturaCard}
                      >
                        <summary className={styles.facturaSummary}>
                          <div className={styles.facturaCardHeader}>
                            <div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem",
                                }}
                              >
                                <h3 className={styles.facturaRef}>
                                  {comprobante.nombreFantasia ?? ""}
                                </h3>
                                {comprobante.anulado && (
                                  <Badge color="danger">Anulada</Badge>
                                )}
                              </div>
                              <p className={styles.facturaMeta}>
                                {formatPortalDateTime(comprobante.fecha)}
                                {comprobante.hora
                                  ? ` - ${comprobante.hora} hs`
                                  : ""}{" "}
                                - {comprobante.comprobanteRef}
                              </p>
                            </div>
                            <div className={styles.facturaAmountBlock}>
                              <span className={styles.facturaAccordionHintWrap}>
                                <span className={styles.facturaAccordionHint}>
                                  Ver detalles
                                </span>
                                <ChevronDown
                                  className={styles.facturaAccordionIcon}
                                  size={18}
                                />
                              </span>
                              {/* {comprobante.puntosGanados != null &&
                                comprobante.puntosGanados > 0 && (
                                  <span className={styles.facturaPuntosGanados}>
                                    +{formatPortalPoints(comprobante.puntosGanados)} pts
                                  </span>
                                )} */}
                              <strong className={styles.facturaAmount}>
                                {formatPortalCurrency(
                                  comprobante.total,
                                  comprobante.moneda,
                                )}
                              </strong>
                            </div>
                          </div>
                        </summary>

                        <div className={styles.facturaAccordionContent}>
                          <div className={styles.facturaItemsList}>
                            {comprobante.productos.map((producto, index) => (
                              <div
                                key={`${comprobante.compraId}-producto-${index}`}
                                className={styles.facturaItemRow}
                              >
                                <div>
                                  <p className={styles.facturaItemName}>
                                    {producto.detalle ||
                                      "Producto sin descripcion"}
                                  </p>
                                  <div className={styles.facturaItemMetaList}>
                                    <p className={styles.facturaItemMeta}>
                                      Cantidad: {producto.cantidad ?? 0}
                                    </p>
                                    {hasProductDiscount(producto) ? (
                                      <p className={styles.facturaItemMeta}>
                                        Descuento:{" "}
                                        {formatPortalCurrency(
                                          producto.descuento ?? 0,
                                          comprobante.moneda,
                                        )}
                                      </p>
                                    ) : null}
                                  </div>
                                </div>
                                <strong className={styles.facturaItemTotal}>
                                  {formatPortalCurrency(
                                    producto.total ?? 0,
                                    comprobante.moneda,
                                  )}
                                </strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      </details>
                    ))}
                  </div>
                )}

                {comprasSummary.warnings.length > 0 ? (
                  <Alert color="warning" className="mt-4">
                    Algunas dependencias no respondieron correctamente, por eso
                    la facturación puede estar incompleta.
                  </Alert>
                ) : null}

                {!comprasError && !isComprasLoading ? (
                  <Pagination
                    className="mt-4"
                    page={facturasPage}
                    totalPages={facturasTotalPages}
                    onChange={setFacturasPage}
                  />
                ) : null}
              </div>
            </div>
          </section>
        </main>
      );
    }

    return (
      <main className={styles.container}>
        <Card padding="lg">
          <h1 className={styles.activeViewTitle}>{active.title}</h1>
          <p className={styles.activeViewDescription}>{active.description}</p>

          <button
            onClick={() => onNavigate("dashboard")}
            className={styles.primaryButton}
            type="button"
          >
            Volver a Inicio
          </button>
        </Card>
      </main>
    );
  }

  if (isProfileLoading) {
    return (
      <main className={styles.container}>
        <SociosDashboardSkeleton />
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <section className={styles.dashboardSection}>
        <InstallAppCard tone="socios" />

        <div>
          <h1 className={styles.welcomeTitle}>¡Hola, {perfil?.nombre}! 👋</h1>
          <p className={styles.welcomeSubtitle}>
            Tus beneficios, puntos y sorteos en un solo lugar
          </p>
        </div>

        {/* Desktop */}
        <div className="hidden sm:block">
          <BannerCarousel />
        </div>

        {/* Mobile: banner-socio1 y banner-socio2 */}
        <div className="sm:hidden">
          <BannerSocioMobileCarousel />
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

        {/* Desktop */}
        <div className={`${styles.cuotasBanner} hidden sm:block`}>
          <Image
            src={cuotasBanner}
            alt="NaranjaX y Cordobesa — 4 cuotas sin interés en todas tus compras"
            width={cuotasBanner.width}
            height={cuotasBanner.height}
            sizes="(max-width: 1280px) calc(100vw - 16rem), 80rem"
            className={styles.cuotasImg}
          />
        </div>

        {/* Mobile: carrusel de cards */}
        <div className="sm:hidden">
          <CuotasMobileCarousel />
        </div>

        <BeneficiosCarousel />

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
                  Completa tu obra social desde Mi perfil para mostrar tu numero
                  de afiliacion.
                </p>
              ) : null}
            </div>
            <DetailButton
              tone="socios"
              label={hasAffiliateNumber ? "Ver detalle" : "Ir a Mi perfil"}
              onClick={() => onNavigate("mi-cuenta")}
            />
          </article> */}

          {pointsCard}

          <Card>
            <h2 className={styles.panelTitle}>Mi perfil</h2>
            <p className={styles.panelSubtitle}>
              Datos personales y de contacto
            </p>
            <dl className={styles.orderList}>
              <OrderRow label="Nombre completo" value={userName} />
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
            <DetailButton
              tone="socios"
              onClick={() => onNavigate("mi-cuenta")}
            />
          </Card>
        </div>

        <SorteoCard onNavigate={onNavigate} />

        <SucursalesPromoCard onNavigate={onNavigate} />
      </section>
    </main>
  );
}
