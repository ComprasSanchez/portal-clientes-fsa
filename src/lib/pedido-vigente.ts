import type {
  PedidoVigente,
  PedidoVigenteApi,
  PedidoVigenteRespuesta,
} from "@/types/pedido-vigente";

export function mapPedidoVigente(api: PedidoVigenteApi): PedidoVigenteRespuesta {
  const p = api.pedido;
  return {
    cicloAbierto: api.ciclo_abierto,
    pedido: p
      ? {
          codigo: p.codigo,
          estado: p.estado,
          retiraEnSucursal: p.retira_en_sucursal,
          sucursalNombre: p.sucursal_nombre,
          fechaEntrega: p.fecha_entrega,
        }
      : null,
  };
}

/** El back responde 410 con este código cuando el ciclo del link ya se cerró. */
export function esCicloCerrado(error: unknown): boolean {
  return error instanceof Error && error.message.includes("PORTAL_CICLO_CERRADO");
}

function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

export const TEXTOS_SIN_PEDIDO = {
  titulo: "Por ahora no tenés un pedido en curso",
  detalle:
    "Cuando llegue el momento de tu próximo pedido, te vamos a avisar. Si necesitás tu medicación antes, escribinos y te ayudamos.",
};

/** Textos para el cliente según el estado de su pedido. */
export function textosPedidoVigente(pedido: PedidoVigente): {
  titulo: string;
  detalle: string;
} {
  const sucursal = pedido.sucursalNombre
    ? `por ${pedido.sucursalNombre}`
    : "por tu sucursal";

  switch (pedido.estado) {
    case "PENDING_PAYMENT":
      return {
        titulo: "Estamos esperando la confirmación de tu pago",
        detalle: "En cuanto se acredite, empezamos a preparar tu pedido.",
      };
    case "ACCEPTED":
    case "CONFIRMED":
      return {
        titulo: "¡Recibimos tu pedido!",
        detalle: "Ya lo tenemos registrado y pronto empezamos a prepararlo.",
      };
    case "IN_PREPARATION":
      return {
        titulo: "Tu pedido está siendo preparado",
        detalle: "Te avisamos cuando esté listo.",
      };
    case "PREPARED":
      return pedido.retiraEnSucursal === false
        ? { titulo: "¡Tu pedido está listo!", detalle: "Pronto sale hacia tu domicilio." }
        : {
            titulo: "¡Tu pedido está listo para retirar!",
            detalle: `Podés pasar a buscarlo ${sucursal}.`,
          };
    case "IN_TRANSIT":
      return {
        titulo: "Tu pedido está en camino",
        detalle: "Lo estamos llevando a tu domicilio.",
      };
    case "DELIVERED": {
      const fecha = pedido.fechaEntrega ? ` el ${fechaCorta(pedido.fechaEntrega)}` : "";
      return pedido.retiraEnSucursal
        ? { titulo: "Tu pedido ya fue retirado", detalle: `Lo retiraste${fecha}.` }
        : { titulo: "Tu pedido ya fue entregado", detalle: `Lo recibiste${fecha}.` };
    }
  }
}
