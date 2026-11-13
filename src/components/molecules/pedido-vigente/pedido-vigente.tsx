"use client";

import { ClipboardList, MessageCircle, Package } from "lucide-react";
import { TEXTOS_SIN_PEDIDO, textosPedidoVigente } from "@/lib/pedido-vigente";
import type { PedidoVigente as PedidoVigenteModel } from "@/types/pedido-vigente";
import styles from "./pedido-vigente.module.scss";

interface PedidoVigenteProps {
  pedido: PedidoVigenteModel | null;
  onHablarConAsesor: () => void;
}

export default function PedidoVigente({ pedido, onHablarConAsesor }: PedidoVigenteProps) {
  const textos = pedido ? textosPedidoVigente(pedido) : TEXTOS_SIN_PEDIDO;
  const Icono = pedido ? Package : ClipboardList;

  return (
    <section className={styles.card}>
      <div className={styles.iconWrap}>
        <Icono size={40} strokeWidth={2} className={styles.icon} />
      </div>

      <h1 className={styles.title}>{textos.titulo}</h1>
      <p className={styles.text}>{textos.detalle}</p>

      {pedido && (
        <div className={styles.code}>
          <span className={styles.codeLabel}>Número de pedido</span>
          <span className={styles.codeValue}>#{pedido.codigo}</span>
        </div>
      )}

      <button type="button" className={styles.action} onClick={onHablarConAsesor}>
        <MessageCircle size={20} />
        Hablar con un asesor
      </button>
    </section>
  );
}
