import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  CreditCard,
  Gift,
  Heart,
  MapPin,
  Ticket,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
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
import { SorteoCard } from "@/components/molecules/socios/SorteoCard";
import { SucursalesPromoCard } from "@/components/molecules/socios/SucursalesPromoCard";
import { BannerCarousel } from "@/components/molecules/socios/BannerCarousel";
import { BeneficiosCarousel } from "@/components/molecules/socios/BeneficiosCarousel";
import cuotasBanner from "@/assets/sociosa-img/cuotas-banner.jpg";
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
  facturas: {
    title: "Facturas",
    description:
      "Consulta comprobantes, fechas de emision y accesos de descarga desde este panel.",
  },
  puntos: {
    title: "Puntos",
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
  const currentFacturasPage = facturasPage + 1;
  const hasPreviousFacturasPage = facturasPage > 0;
  const hasNextFacturasPage =
    facturasStart + FACTURAS_PAGE_SIZE < allComprobantes.length;

  const pointsCard = (
    <article className={`${styles.panelCard} ${styles.pointsPanelCard}`}>
      <div className={styles.pointsHeader}>
        <div>
          <h2 className={styles.panelTitle}>Mis puntos</h2>
          <p className={styles.panelSubtitle}>
            Saldo acumulado y movimientos pendientes
          </p>
        </div>
        {puntosSummary.partial ? (
          <span className={styles.statusBadge}>Parcial</span>
        ) : null}
      </div>

      {pointsError ? (
        <div className={styles.pointsErrorBox}>
          No pudimos cargar tus puntos ahora mismo. Intenta nuevamente en unos
          minutos.
        </div>
      ) : (
        <div className={styles.pointsContentRow}>
          <div className={styles.pointsHighlight}>
            <span className={styles.pointsLabel}>Disponibles</span>
            <strong className={styles.pointsValue}>
              {isPointsLoading
                ? "..."
                : formatPortalPoints(puntosSummary.disponibles)}
            </strong>
            {!isPointsLoading && (
              <span className={styles.pointsARS}>
                ≈ {formatPortalCurrency(puntosToARS(puntosSummary.disponibles))}{" "}
                para gastar
              </span>
            )}
          </div>

          <div className={styles.pointsSideColumn}>
            <div className={styles.pointsGrid}>
              <div className={styles.pointsMetricCard}>
                <span className={styles.pointsMetricLabel}>
                  Por vencer 30 d
                </span>
                <strong className={styles.pointsMetricValue}>
                  {isPointsLoading
                    ? "..."
                    : formatPortalPoints(puntosSummary.porVencer30d)}
                </strong>
              </div>
            </div>

            {puntosSummary.warnings.length > 0 ? (
              <p className={styles.pointsWarning}>
                Algunas fuentes de puntos no estuvieron disponibles, por eso los
                datos pueden ser parciales.
              </p>
            ) : null}
          </div>
        </div>
      )}
    </article>
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
    { label: "Puntos", view: "puntos", icon: Gift, tone: "socios" },
    { label: "Sorteos", view: "sorteos", icon: Ticket, tone: "socios" },
    { label: "Sucursales", view: "sucursales", icon: MapPin, tone: "socios" },
    {
      label: "CORA",
      icon: Heart,
      onClick: () => router.push("/cora"),
      tone: "socios",
    },
  ];

  if (currentView === "mi-cuenta") {
    return (
      <main className={`${styles.container} ${styles.containerWide}`}>
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
      const hasPrevHistorial = historialPage > 1;
      const hasNextHistorial = historialPageInfo?.hasNext ?? false;
      const historialTotal = historialPageInfo?.total ?? 0;

      const tipoLabel: Record<string, string> = {
        compra: "Compra",
        canje: "Canje",
        devolucion: "Devolución",
        anulacion: "Anulación",
        ajuste: "Ajuste",
      };

      const historialCard = (
        <article className={`${styles.panelCard} ${styles.historialCard}`}>
          <div className={styles.historialHeader}>
            <div>
              <h2 className={styles.panelTitle}>Movimientos</h2>
              <p className={styles.panelSubtitle}>
                Historial de operaciones ordenadas por fecha
              </p>
            </div>
            {historialTotal > 0 && (
              <span className={styles.statusBadge}>
                {historialTotal} registros
              </span>
            )}
          </div>

          {historialError ? (
            <div className={styles.historialErrorBox}>
              No pudimos cargar el historial ahora mismo. Intenta nuevamente en
              unos minutos.
            </div>
          ) : isHistorialLoading ? (
            <div className={styles.historialLoading}>Cargando historial…</div>
          ) : historialItems.length === 0 ? (
            <div className={styles.historialEmpty}>
              No hay operaciones registradas aún.
            </div>
          ) : (
            <>
              <div className={styles.historialTableWrap}>
                <table className={styles.historialTable}>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Referencia</th>
                      <th>Monto</th>
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
                      const montoLabel =
                        item.monto != null
                          ? formatPortalCurrency(item.monto)
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
                          <td>{montoLabel}</td>
                          <td className={deltaClass}>{deltaLabel}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {(hasPrevHistorial || hasNextHistorial) && (
                <div className={styles.historialPagination}>
                  <button
                    className={styles.facturasPaginationButton}
                    onClick={() => setHistorialPage(historialPage - 1)}
                    disabled={!hasPrevHistorial}
                  >
                    ← Anterior
                  </button>
                  <span className={styles.historialPaginationText}>
                    Página {historialPage}
                  </span>
                  <button
                    className={styles.facturasPaginationButton}
                    onClick={() => setHistorialPage(historialPage + 1)}
                    disabled={!hasNextHistorial}
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </>
          )}
        </article>
      );

      return (
        <main className={styles.container}>
          <section className={styles.facturasViewSection}>
            <h1 className={styles.activeViewTitle}>{active.title}</h1>
            <p className={styles.activeViewDescription}>{active.description}</p>
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
            <h1 className={styles.activeViewTitle}>{active.title}</h1>
            <p className={styles.activeViewDescription}>{active.description}</p>

            <div className={styles.facturasLayout}>
              <article className={styles.panelCard}>
                <div className={styles.facturasHeaderRow}>
                  <div>
                    <h2 className={styles.panelTitle}>Ultimos comprobantes</h2>
                    <p className={styles.panelSubtitle}>
                      Facturas agrupadas por comprobante con sus lineas de
                      detalle.
                    </p>
                  </div>

                  {!comprasError ? (
                    <div className={styles.facturasHeaderMetric}>
                      <span className={styles.facturasHeaderMetricLabel}>
                        Comprobantes
                      </span>
                      <strong className={styles.facturasHeaderMetricValue}>
                        {isComprasLoading ? "..." : comprasSummary.totalCompras}
                      </strong>
                    </div>
                  ) : null}
                </div>

                {comprasError ? (
                  <div className={styles.pointsErrorBox}>
                    No pudimos cargar el listado de facturas para este cliente.
                  </div>
                ) : isComprasLoading ? (
                  <div className={styles.facturasLoadingState}>
                    Cargando facturacion...
                  </div>
                ) : allComprobantes.length === 0 ? (
                  <div className={styles.facturasEmptyState}>
                    No encontramos comprobantes para este cliente por el
                    momento.
                  </div>
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
                                  <span className={styles.statusBadgeAnulada}>
                                    Anulada
                                  </span>
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
                                  Desplegar productos
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
                  <p className={styles.pointsWarning}>
                    Algunas dependencias no respondieron correctamente, por eso
                    la facturacion puede estar incompleta.
                  </p>
                ) : null}

                {!comprasError &&
                !isComprasLoading &&
                allComprobantes.length > FACTURAS_PAGE_SIZE ? (
                  <div className={styles.facturasPagination}>
                    <button
                      type="button"
                      className={styles.facturasPaginationButton}
                      onClick={() => setFacturasPage((p) => Math.max(0, p - 1))}
                      disabled={!hasPreviousFacturasPage}
                    >
                      Anterior
                    </button>
                    <span className={styles.facturasPaginationText}>
                      Pagina {currentFacturasPage}
                    </span>
                    <button
                      type="button"
                      className={styles.facturasPaginationButton}
                      onClick={() => setFacturasPage((p) => p + 1)}
                      disabled={!hasNextFacturasPage}
                    >
                      Siguiente
                    </button>
                  </div>
                ) : null}
              </article>
            </div>
          </section>
        </main>
      );
    }

    return (
      <main className={styles.container}>
        <section className={styles.activeViewCard}>
          <h1 className={styles.activeViewTitle}>{active.title}</h1>
          <p className={styles.activeViewDescription}>{active.description}</p>

          <button
            onClick={() => onNavigate("dashboard")}
            className={styles.primaryButton}
            type="button"
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
        <SociosDashboardSkeleton />
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <section className={styles.dashboardSection}>
        <div>
          <h1 className={styles.welcomeTitle}>¡Hola, {perfil?.nombre}! 👋</h1>
          <p className={styles.welcomeSubtitle}>
            Bienvenido a tu panel de socios
          </p>
        </div>

        <BannerCarousel />

        <div className={styles.quickAccessGrid}>
          {quickAccessItems.map((item) => (
            <QuickAccessCard
              key={item.view ?? item.label}
              item={item}
              onNavigate={onNavigate}
            />
          ))}
        </div>

        <div className={styles.cuotasBanner}>
          <Image
            src={cuotasBanner}
            alt="NaranjaX y Cordobesa — 4 cuotas sin interés en todas tus compras"
            width={cuotasBanner.width}
            height={cuotasBanner.height}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) calc(100vw - 16rem), 80rem"
            className={styles.cuotasImg}
          />
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
            <DetailButton
              tone="socios"
              onClick={() => onNavigate("mi-cuenta")}
            />
          </article>
          {pointsCard}
        </div>

        <SorteoCard onNavigate={onNavigate} documentNumber={documentNumber} />

        <SucursalesPromoCard onNavigate={onNavigate} />
      </section>
    </main>
  );
}
