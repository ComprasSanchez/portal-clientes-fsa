import { ArrowRight, CreditCard, Gift, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { DetailButton } from "@/components/molecules/home/DetailButton";
import { OrderRow } from "@/components/molecules/home/OrderRow";
import { QuickAccessCard, type QuickAccessItem } from "@/components/molecules/home/QuickAccessCard";
import { type SociosView } from "@/types/socios";
import styles from "./SociosViews.module.scss";

interface SociosViewsProps {
  currentView: SociosView;
  onNavigate: (view: SociosView) => void;
}

const viewContent: Record<Exclude<SociosView, "dashboard">, { title: string; description: string }> = {
  facturas: {
    title: "Facturas",
    description: "Consulta comprobantes, fechas de emision y accesos de descarga desde este panel.",
  },
  puntos: {
    title: "Puntos",
    description: "Revisa tu saldo actual, beneficios vigentes y proximas recompensas disponibles.",
  },
};

export function SociosViews({ currentView, onNavigate }: SociosViewsProps) {
  const router = useRouter();
  const quickAccessItems: QuickAccessItem<SociosView>[] = [
    { label: "Facturas", view: "facturas", icon: CreditCard, tone: "socios" },
    { label: "Puntos", view: "puntos", icon: Gift, tone: "socios" },
    {
      label: "CORA",
      icon: Heart,
      onClick: () => router.push("/home"),
      tone: "socios",
    },
  ];

  if (currentView !== "dashboard") {
    const active = viewContent[currentView];

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
          <h1 className={styles.welcomeTitle}>Hola, Luciana</h1>
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
            <p className={styles.panelSubtitle}>Numero de afiliacion</p>
            <div className={styles.credentialGradient}>
              <p className={styles.credentialLabel}>Titular</p>
              <p className={styles.credentialValue}>Luciana Ferreyra</p>
              <div className={styles.separator} />
              <p className={styles.credentialLabel}>N de afiliacion</p>
              <p className={styles.credentialNumber}>AF-548213-09</p>
            </div>
            <DetailButton tone="socios" />
          </article>

          <article className={styles.panelCard}>
            <h2 className={styles.panelTitle}>Ultima actividad</h2>
            <p className={styles.panelSubtitle}>Resumen general</p>
            <dl className={styles.orderList}>
              <OrderRow label="Factura" value="FAC-2026-084" />
              <OrderRow label="Fecha" value="13/04/2026" />
              <OrderRow label="Estado" value={<span className={styles.statusBadge}>Disponible</span>} />
              <OrderRow label="Puntos" value={<span className={styles.totalAmount}>1.250</span>} hasBorder={false} />
            </dl>
            <DetailButton tone="socios" onClick={() => onNavigate("facturas")} />
          </article>
        </div>

        <section className={styles.promoBanner}>
          <h3 className={styles.promoTitle}>Entrá a CORA cuando necesites la gestion completa</h3>
          <p className={styles.promoDescription}>
            Desde aqui accedes a una experiencia mas simple. Si necesitas pedidos, perfil completo o historial, entra a CORA.
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