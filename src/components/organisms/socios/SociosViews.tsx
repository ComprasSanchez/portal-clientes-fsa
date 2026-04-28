import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, CreditCard, Gift, Heart, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { DetailButton } from "@/components/molecules/home/DetailButton";
import { OrderRow } from "@/components/molecules/home/OrderRow";
import { QuickAccessCard, type QuickAccessItem } from "@/components/molecules/home/QuickAccessCard";
import { FacturasViewSkeleton } from "@/components/organisms/loading/ViewSkeletons";
import { ProfileView } from "@/components/organisms/profile/ProfileView";
import {
  formatPortalCurrency,
  formatPortalDateTime,
} from "@/lib/portal-compras";
import { usePortalCompras } from "@/lib/use-portal-compras";
import { usePortalExpedientesContext } from "@/lib/portal-expedientes-context";
import { formatPortalPoints } from "@/lib/portal-puntos";
import { usePortalPuntos } from "@/lib/use-portal-puntos";
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
}

const viewContent: Record<Exclude<SociosView, "dashboard">, { title: string; description: string }> = {
  "mi-cuenta": {
    title: "Mi perfil",
    description: "Informacion personal, datos de contacto y referencia de afiliacion en un solo lugar.",
  },
  facturas: {
    title: "Facturas",
    description: "Consulta comprobantes, fechas de emision y accesos de descarga desde este panel.",
  },
  puntos: {
    title: "Puntos",
    description: "Revisa tu saldo actual, beneficios vigentes y proximas recompensas disponibles.",
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
}: SociosViewsProps) {
  const FACTURAS_PAGE_SIZE = 10;
  const router = useRouter();
  const { pushToast } = useGlobalToast();
  const hasShownValidationToastRef = useRef(false);
  const [facturasOffset, setFacturasOffset] = useState(0);
  const hasAffiliateNumber = Boolean(affiliateNumber?.trim());
  const { error: expedientesError } = usePortalExpedientesContext();
  const { summary: puntosSummary, isLoading: isPointsLoading, error: pointsError } =
    usePortalPuntos();
  const {
    compras,
    summary: comprasSummary,
    isLoading: isComprasLoading,
    error: comprasError,
  } = usePortalCompras({
    enabled: currentView === "facturas",
    limit: FACTURAS_PAGE_SIZE,
    offset: facturasOffset,
  });
  const requiresAccountValidation =
    expedientesError?.includes("Valida tu cuenta") ?? false;
  const currentFacturasPage =
    Math.floor(comprasSummary.page.offset / comprasSummary.page.limit) + 1;
  const hasPreviousFacturasPage = comprasSummary.page.offset > 0;

  const pointsCard = (
    <article className={`${styles.panelCard} ${styles.pointsPanelCard}`}>
      <div className={styles.pointsHeader}>
        <div>
          <h2 className={styles.panelTitle}>Mis puntos</h2>
          <p className={styles.panelSubtitle}>Saldo acumulado y movimientos pendientes</p>
        </div>
        {puntosSummary.partial ? (
          <span className={styles.statusBadge}>Parcial</span>
        ) : null}
      </div>

      {pointsError ? (
        <div className={styles.pointsErrorBox}>
          No pudimos cargar tus puntos ahora mismo. Intentá nuevamente en unos minutos.
        </div>
      ) : (
        <div className={styles.pointsContentRow}>
          <div className={styles.pointsHighlight}>
            <span className={styles.pointsLabel}>Disponibles</span>
            <strong className={styles.pointsValue}>
              {isPointsLoading ? "..." : formatPortalPoints(puntosSummary.disponibles)}
            </strong>
          </div>

          <div className={styles.pointsSideColumn}>
            <div className={styles.pointsGrid}>
              <div className={styles.pointsMetricCard}>
                <span className={styles.pointsMetricLabel}>Pendientes</span>
                <strong className={styles.pointsMetricValue}>
                  {isPointsLoading ? "..." : formatPortalPoints(puntosSummary.pendientes)}
                </strong>
              </div>
              <div className={styles.pointsMetricCard}>
                <span className={styles.pointsMetricLabel}>Por vencer 30 d</span>
                <strong className={styles.pointsMetricValue}>
                  {isPointsLoading ? "..." : formatPortalPoints(puntosSummary.porVencer30d)}
                </strong>
              </div>
            </div>

            {puntosSummary.warnings.length > 0 ? (
              <p className={styles.pointsWarning}>
                Algunas fuentes de puntos no estuvieron disponibles, por eso los datos pueden ser parciales.
              </p>
            ) : null}
          </div>
        </div>
      )}

      {/* <DetailButton tone="socios" label="Ver detalle" onClick={() => onNavigate("puntos")} /> */}
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
      title: "Validá tu usuario",
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
    {
      label: "CORA",
      icon: Heart,
      onClick: () => router.push("/home"),
      tone: "socios",
    },
  ];

  if (currentView === "mi-cuenta") {
    return (
      <main className={`${styles.container} ${styles.containerWide}`}>
        <ProfileView perfil={perfil} variant="socios" isLoading={isProfileLoading} />
      </main>
    );
  }

  if (currentView !== "dashboard") {
    const active = viewContent[currentView];

    if (currentView === "puntos") {
      return (
        <main className={styles.container}>
          <section className={styles.facturasViewSection}>
            <p className={styles.activeViewLabel}>Vista activa</p>
            <h1 className={styles.activeViewTitle}>{active.title}</h1>
            <p className={styles.activeViewDescription}>{active.description}</p>
            <div className={styles.activePointsWrapper}>{pointsCard}</div>
            {/* <button onClick={() => onNavigate("dashboard")} className={styles.primaryButton} type="button">
              Volver a Inicio
            </button> */}
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
            <p className={styles.activeViewLabel}>Vista activa</p>
            <h1 className={styles.activeViewTitle}>{active.title}</h1>
            <p className={styles.activeViewDescription}>{active.description}</p>

            <div className={styles.facturasLayout}>
              {/* <article className={styles.panelCard}>
                <div className={styles.pointsHeader}>
                  <div>
                    <h2 className={styles.panelTitle}>Resumen de facturacion</h2>
                    <p className={styles.panelSubtitle}>Total de comprobantes y monto acumulado</p>
                  </div>
                  {comprasSummary.partial ? <span className={styles.statusBadge}>Parcial</span> : null}
                </div>

                {comprasError ? (
                  <div className={styles.pointsErrorBox}>
                    No pudimos cargar la facturacion ahora mismo. Intentá nuevamente en unos minutos.
                  </div>
                ) : (
                  <div className={styles.facturasSummaryGrid}>
                    <div className={styles.facturasSummaryMetric}>
                      <span className={styles.pointsMetricLabel}>Comprobantes</span>
                      <strong className={styles.facturasSummaryValue}>
                        {isComprasLoading ? "..." : comprasSummary.totalCompras}
                      </strong>
                    </div>
                    <div className={styles.facturasSummaryMetric}>
                      <span className={styles.pointsMetricLabel}>Monto acumulado</span>
                      <strong className={styles.facturasSummaryValue}>
                        {isComprasLoading
                          ? "..."
                          : formatPortalCurrency(
                              comprasSummary.montoAcumulado,
                              comprasSummary.moneda,
                            )}
                      </strong>
                    </div>
                  </div>
                )}
              </article> */}

              <article className={styles.panelCard}>
                <div className={styles.facturasHeaderRow}>
                  <div>
                    <h2 className={styles.panelTitle}>Ultimos comprobantes</h2>
                    <p className={styles.panelSubtitle}>
                      Facturas agrupadas por comprobante con sus lineas de detalle.
                    </p>
                  </div>

                  {!comprasError ? (
                    <div className={styles.facturasHeaderMetric}>
                      <span className={styles.facturasHeaderMetricLabel}>Comprobantes</span>
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
                  <div className={styles.facturasLoadingState}>Cargando facturacion...</div>
                ) : comprasSummary.comprobantes.length === 0 ? (
                  <div className={styles.facturasEmptyState}>
                    No encontramos comprobantes para este cliente por el momento.
                  </div>
                ) : (
                  <div className={styles.facturasList}>
                    {comprasSummary.comprobantes.map((comprobante) => (
                      <details key={comprobante.compraId} className={styles.facturaCard}>
                        <summary className={styles.facturaSummary}>
                          <div className={styles.facturaCardHeader}>
                            <div>
                              <h3 className={styles.facturaRef}>{comprobante.comprobanteRef}</h3>
                              <p className={styles.facturaMeta}>
                                {formatPortalDateTime(comprobante.fecha)}
                                {comprobante.hora ? ` · ${comprobante.hora} hs` : ""}
                                {comprobante.nombreFantasia ? ` · ${comprobante.nombreFantasia}` : ""}
                              </p>
                            </div>
                            <div className={styles.facturaAmountBlock}>
                              <span className={styles.facturaAccordionHintWrap}>
                                <span className={styles.facturaAccordionHint}>Desplegar productos</span>
                                <ChevronDown className={styles.facturaAccordionIcon} size={18} />
                              </span>
                              <strong className={styles.facturaAmount}>
                                {formatPortalCurrency(comprobante.total, comprobante.moneda)}
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
                                    {producto.detalle || "Producto sin descripcion"}
                                  </p>
                                  <div className={styles.facturaItemMetaList}>
                                    <p className={styles.facturaItemMeta}>
                                      Cantidad: {producto.cantidad ?? 0}
                                    </p>
                                    {hasProductDiscount(producto) ? (
                                      <p className={styles.facturaItemMeta}>
                                        Descuento: {formatPortalCurrency(producto.descuento ?? 0, comprobante.moneda)}
                                      </p>
                                    ) : null}
                                  </div>
                                </div>
                                <strong className={styles.facturaItemTotal}>
                                  {formatPortalCurrency(producto.total ?? 0, comprobante.moneda)}
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
                    Algunas dependencias no respondieron correctamente, por eso la facturacion puede estar incompleta.
                  </p>
                ) : null}

                {!comprasError && !isComprasLoading ? (
                  <div className={styles.facturasPagination}>
                    <button
                      type="button"
                      className={styles.facturasPaginationButton}
                      onClick={() => {
                        setFacturasOffset((currentOffset) =>
                          Math.max(0, currentOffset - FACTURAS_PAGE_SIZE),
                        );
                      }}
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
                      onClick={() => {
                        setFacturasOffset((currentOffset) =>
                          currentOffset + FACTURAS_PAGE_SIZE,
                        );
                      }}
                      disabled={!comprasSummary.page.hasMore}
                    >
                      Siguiente
                    </button>
                  </div>
                ) : null}
              </article>
            </div>
{/* 
            <button onClick={() => onNavigate("dashboard")} className={styles.primaryButton} type="button">
              Volver a Inicio
            </button> */}
          </section>
        </main>
      );
    }

    return (
      <main className={styles.container}>
        <section className={styles.activeViewCard}>
          <p className={styles.activeViewLabel}>Vista activa</p>
          <h1 className={styles.activeViewTitle}>{active.title}</h1>
          <p className={styles.activeViewDescription}>{active.description}</p>

          <button onClick={() => onNavigate("dashboard")} className={styles.primaryButton} type="button">
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
          <p className={styles.welcomeSubtitle}>Bienvenido a tu panel de socios</p>
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
                  Completa tu obra social desde Mi perfil para mostrar tu numero de afiliacion.
                </p>
              ) : null}
            </div>
            <DetailButton
              tone="socios"
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
            <DetailButton tone="socios" onClick={() => onNavigate("mi-cuenta")} />
          </article>

        </div>

        <div className={styles.fullWidthRow}>{pointsCard}</div>

        <section className={styles.promoBanner}>
          <h3 className={styles.promoTitle}>Entrá a CORA cuando necesites la gestion completa</h3>
          <p className={styles.promoDescription}>
            Desde aqui accedes a una experiencia mas simple. Si necesitas seguir tu pedido o revisar el historial de gestiones, entra a CORA.
          </p>
          <button onClick={() => router.push("/home")} className={styles.promoButton} type="button">
            Ir a CORA
            <ArrowRight size={16} />
          </button>
        </section>
      </section>
    </main>
  );
}