import { AplicacionCard } from "@/components/molecules/socios/AplicacionCard";
import { APLICACIONES_FSA } from "@/lib/aplicaciones-fsa";
import styles from "./SociosColaboradorAplicacionesView.module.scss";

export function SociosColaboradorAplicacionesView() {
  return (
    <div className={styles.view}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Aplicaciones FSA</h1>
        <p className={styles.pageSubtitle}>
          Accedé a las herramientas que usás en tu día a día.
        </p>
      </header>

      <section className={styles.grid} aria-label="Aplicaciones">
        {APLICACIONES_FSA.map((app) => (
          <AplicacionCard
            key={app.id}
            nombre={app.nombre}
            descripcion={app.descripcion}
            icon={app.icon}
            href={app.url}
          />
        ))}
      </section>
    </div>
  );
}
