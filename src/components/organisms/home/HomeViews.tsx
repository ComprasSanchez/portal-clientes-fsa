import {
  Box,
  CreditCard,
  FileText,
  Package,
  TrendingUp,
  User,
} from "lucide-react";
import { DetailButton } from "@/components/molecules/home/DetailButton";
import { OrderRow } from "@/components/molecules/home/OrderRow";
import { QuickAccessCard, type QuickAccessItem } from "@/components/molecules/home/QuickAccessCard";
import { ProfileView } from "@/components/organisms/home/ProfileView";
import { HomeView } from "@/types/home";
import styles from "./HomeViews.module.scss";

interface HomeViewsProps {
  currentView: HomeView;
  onNavigate: (view: HomeView) => void;
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
    title: "Mis pedidos",
    description: "Seguimiento de pedidos y estados de entrega.",
  },
  facturas: {
    title: "Facturas",
    description: "Consulta y descarga de comprobantes.",
  },
  "expediente-actual": {
    title: "Expediente actual",
    description: "Vista del expediente activo con su estado actual.",
  },
  "expediente-completo": {
    title: "Historial completo",
    description: "Registro historico de toda la documentacion.",
  },
};

const quickAccessItems: QuickAccessItem[] = [
  { label: "Mi perfil", view: "mi-cuenta", icon: User },
  { label: "Productos", view: "productos", icon: Box },
  { label: "Mis Pedidos", view: "pedidos", icon: Package },
  { label: "Facturas", view: "facturas", icon: CreditCard },
  { label: "Expediente", view: "expediente-actual", icon: FileText },
  { label: "Historial", view: "expediente-completo", icon: TrendingUp },
];

export function HomeViews({ currentView, onNavigate }: HomeViewsProps) {
  const active = viewContent[currentView];

  if (currentView === "mi-cuenta") {
    return (
      <main className={styles.container}>
        <ProfileView />
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

          <button onClick={() => onNavigate("dashboard")} className={styles.primaryButton}>
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
          <h1 className={styles.welcomeTitle}>Hola, Solh</h1>
          <p className={styles.welcomeSubtitle}>Bienvenido a tu panel de gestion de pedidos</p>
        </div>

        <div className={styles.quickAccessGrid}>
          {quickAccessItems.map((item) => (
            <QuickAccessCard key={item.view} item={item} onNavigate={onNavigate} />
          ))}
        </div>

        <div className={styles.detailsGrid}>
          <article className={styles.panelCard}>
            <h2 className={styles.panelTitle}>Mi credencial</h2>
            <p className={styles.panelSubtitle}>Numero de afiliacion</p>
            <div className={styles.credentialGradient}>
              <p className={styles.credentialLabel}>Titular</p>
              <p className={styles.credentialValue}>Solh Marlyn</p>
              <div className={styles.separator} />
              <p className={styles.credentialLabel}>N de afiliacion</p>
              <p className={styles.credentialNumber}>27-13892565-3</p>
            </div>
            <DetailButton />
          </article>

          <article className={styles.panelCard}>
            <h2 className={styles.panelTitle}>Ultimo pedido</h2>
            <p className={styles.panelSubtitle}>Estado actual</p>
            <dl className={styles.orderList}>
              <OrderRow label="Pedido" value="PED-2024-001" />
              <OrderRow label="Fecha" value="19/03/2024" />
              <OrderRow label="Estado" value={<span className={styles.statusBadge}>En curso</span>} />
              <OrderRow
                label="Total"
                value={<span className={styles.totalAmount}>$1250.00</span>}
                hasBorder={false}
              />
            </dl>
            <DetailButton onClick={() => onNavigate("pedidos")} />
          </article>
        </div>

        <section className={styles.promoBanner}>
          <h3 className={styles.promoTitle}>Nuevos productos disponibles</h3>
          <p className={styles.promoDescription}>Descubre nuestra nueva seleccion de productos premium</p>
          <button onClick={() => onNavigate("productos")} className={styles.promoButton}>
            Ver productos
          </button>
        </section>
      </section>
    </main>
  );
}
