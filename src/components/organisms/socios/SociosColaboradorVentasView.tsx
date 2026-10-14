"use client";

import { useMemo, useState } from "react";
import { BarChart3, CircleAlert } from "lucide-react";
import Card from "@/components/atoms/card/card";
import Alert from "@/components/atoms/alert/alert";
import EmptyState from "@/components/molecules/empty-state/empty-state";
import { DateRangeFilter } from "@/components/molecules/socios/DateRangeFilter";
import StatTile from "@/components/molecules/stat-tile/stat-tile";
import { VentasDiariasChart } from "@/components/molecules/socios/VentasDiariasChart";
import { ColaboradorVentasSkeleton } from "@/components/organisms/loading/ViewSkeletons";
import { formatPortalCurrency } from "@/lib/portal-compras";
import { formatPortalPoints } from "@/lib/portal-puntos";
import { usePortalVentasColaborador } from "@/lib/use-portal-ventas-colaborador";
import styles from "./SociosColaboradorVentasView.module.scss";

type Rango = { desde: string; hasta: string };

const hoyLocal = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Cordoba",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const formatFecha = (fecha: string) => {
  const [year, month, day] = fecha.split("-");
  return `${day}/${month}/${year}`;
};

const porcentaje = (parte: number, total: number) =>
  total > 0 ? `${Math.round((parte / total) * 100)}% del total` : undefined;

export function SociosColaboradorVentasView() {
  // `null` = mes en curso (el rango lo define el servidor).
  const [rango, setRango] = useState<Rango | null>(null);
  const hoy = useMemo(() => hoyLocal(), []);
  const { ventas, isLoading, error } = usePortalVentasColaborador({
    desde: rango?.desde,
    hasta: rango?.hasta,
  });

  const filtroDesde = ventas?.desde ?? rango?.desde ?? "";
  const filtroHasta = ventas?.hasta ?? rango?.hasta ?? "";
  const resumen = ventas?.resumen;
  const promedioTicketsDia =
    resumen && resumen.dias_con_ventas > 0
      ? Math.round(resumen.tickets / resumen.dias_con_ventas)
      : null;

  return (
    <div className={styles.view}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Mis ventas</h1>
        <p className={styles.pageSubtitle}>
          Tu desempeño en el mostrador, día a día
        </p>
      </header>

      <DateRangeFilter
        key={`${filtroDesde}|${filtroHasta}`}
        desde={filtroDesde}
        hasta={filtroHasta}
        maxValue={hoy}
        disabled={isLoading}
        onApply={setRango}
        onReset={rango ? () => setRango(null) : undefined}
      />

      {isLoading && !ventas ? (
        <ColaboradorVentasSkeleton />
      ) : error ? (
        <Alert icon={<CircleAlert size={18} />}>{error}</Alert>
      ) : resumen && ventas ? (
        <div
          className={`${styles.content} ${isLoading ? styles.refreshing : ""}`}
        >
          <section
            className={styles.statsGrid}
            aria-label="Resumen del período"
          >
            <StatTile
              variant="highlight"
              label="Total del período"
              value={formatPortalCurrency(resumen.total)}
              hint={`${formatPortalPoints(resumen.dias_con_ventas)} días con ventas`}
            />
            <StatTile
              label="Ticket promedio"
              value={
                resumen.ticket_promedio !== null
                  ? formatPortalCurrency(resumen.ticket_promedio)
                  : "—"
              }
            />
            <StatTile
              label="Tickets"
              value={formatPortalPoints(resumen.tickets)}
              hint={
                promedioTicketsDia !== null
                  ? `${formatPortalPoints(promedioTicketsDia)} por día en promedio`
                  : undefined
              }
            />
          </section>

          <section
            className={styles.statsGrid}
            aria-label="Ventas por tipo de atención"
          >
            <StatTile
              label="Particular"
              value={formatPortalCurrency(resumen.particular)}
              hint={porcentaje(resumen.particular, resumen.total)}
            />
            <StatTile
              label="Obra social"
              value={formatPortalCurrency(resumen.obra_social)}
              hint={porcentaje(resumen.obra_social, resumen.total)}
            />
            <StatTile
              label="PAMI"
              value={formatPortalCurrency(resumen.pami)}
              hint={porcentaje(resumen.pami, resumen.total)}
            />
          </section>

          <Card className="flex flex-col gap-4">
            <h2 className={styles.panelTitle}>Ventas por día</h2>
            {ventas.dias.length > 0 ? (
              <VentasDiariasChart dias={ventas.dias} />
            ) : (
              <EmptyState
                variant="plain"
                icon={BarChart3}
                text="Todavía no hay ventas registradas para estas fechas."
              />
            )}
          </Card>
        </div>
      ) : null}
    </div>
  );
}
