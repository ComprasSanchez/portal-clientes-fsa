import Badge from "@/components/atoms/badge/badge";
import type { UiTone } from "@/types/ui-tone";
import styles from "./stands-escaneados.module.scss";

type StandsEscaneadosProps = {
  nombres: string[];
  tone?: UiTone;
};

/** Lista de los stands que marcó el cliente; la mira el personal al entregar el premio. */
export default function StandsEscaneados({ nombres, tone = "socios" }: StandsEscaneadosProps) {
  return (
    <div className={styles.wrap}>
      <p className={styles.title}>Stands escaneados ({nombres.length})</p>
      <div className={styles.list}>
        {nombres.map((nombre) => (
          <Badge key={nombre} tone={tone} color="primary" wrap>
            {nombre}
          </Badge>
        ))}
      </div>
    </div>
  );
}
