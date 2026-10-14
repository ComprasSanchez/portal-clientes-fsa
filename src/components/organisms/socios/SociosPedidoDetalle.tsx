"use client";

import Card from "@/components/atoms/card/card";
import { PedidoDetalleHeader } from "@/components/molecules/socios/pedidos/detalle/pedido-detalle-header/pedido-detalle-header";
import { PedidoEntrega } from "@/components/molecules/socios/pedidos/detalle/pedido-entrega/pedido-entrega";
import {
  PedidoInfoAdicional,
  type PedidoInfoItem,
} from "@/components/molecules/socios/pedidos/detalle/pedido-info-adicional/pedido-info-adicional";
import { PedidoProductosList } from "@/components/molecules/socios/pedidos/detalle/pedido-productos-list/pedido-productos-list";
import { PedidoResumen } from "@/components/molecules/socios/pedidos/detalle/pedido-resumen/pedido-resumen";
import Timeline from "@/components/molecules/timeline/timeline";
import { getPedidoTimelineSteps } from "@/lib/portal-pedidos";
import type { PedidoNormalizado } from "@/types/portal-pedidos";

export function SociosPedidoDetalle({ pedido }: { pedido: PedidoNormalizado }) {
  const infoAdicional: PedidoInfoItem[] = [
    pedido.referencia_pago && { label: "Referencia de pago", value: pedido.referencia_pago },
    pedido.observacion && { label: "Observación", value: pedido.observacion },
  ].filter((item): item is PedidoInfoItem => Boolean(item));

  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      <Card>
        <PedidoDetalleHeader pedido={pedido} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-5">
        <div className="flex flex-col gap-4 lg:gap-5">
          <Card title="Seguimiento">
            <Timeline steps={getPedidoTimelineSteps(pedido)} />
          </Card>

          {pedido.productos.length > 0 && (
            <Card title={`Productos (${pedido.productos.length})`}>
              <PedidoProductosList productos={pedido.productos} />
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-4 lg:sticky lg:top-6 lg:gap-5">
          <Card title="Resumen">
            <PedidoResumen pedido={pedido} />
          </Card>

          <Card title="Entrega">
            <PedidoEntrega pedido={pedido} />
          </Card>

          {infoAdicional.length > 0 && (
            <Card title="Más información">
              <PedidoInfoAdicional items={infoAdicional} />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
