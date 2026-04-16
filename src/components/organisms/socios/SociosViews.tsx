import { useEffect, useRef } from "react";
import { ArrowRight, CreditCard, Gift, Heart, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { DetailButton } from "@/components/molecules/home/DetailButton";
import { OrderRow } from "@/components/molecules/home/OrderRow";
import { QuickAccessCard, type QuickAccessItem } from "@/components/molecules/home/QuickAccessCard";
import { ProfileView } from "@/components/organisms/profile/ProfileView";
import { useGlobalToast } from "../../ui/global-toast";
import { usePortalExpedientes } from "@/lib/use-portal-expedientes";
import type { PortalPerfilResponse } from "@/types/portal-profile";
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

export function SociosViews({
  currentView,
  onNavigate,
  userName,
  affiliateNumber,
  documentNumber,
  email,
  phone,
  perfil,
}: SociosViewsProps) {
  const router = useRouter();
  const { pushToast } = useGlobalToast();
  const hasShownValidationToastRef = useRef(false);
  const hasAffiliateNumber = Boolean(affiliateNumber?.trim());
  const { error: expedientesError } = usePortalExpedientes();
  const requiresAccountValidation =
    expedientesError?.includes("Valida tu cuenta") ?? false;

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
      <main className={styles.container}>
        <ProfileView perfil={perfil} variant="socios" />
      </main>
    );
  }

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