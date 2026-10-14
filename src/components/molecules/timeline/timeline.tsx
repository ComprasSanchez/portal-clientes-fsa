import { CheckCircle2, XCircle } from "lucide-react";
import Badge from "@/components/atoms/badge/badge";
import { toneClass, type UiTone } from "@/types/ui-tone";
import styles from "./timeline.module.scss";

export type TimelineStepState = "done" | "pending" | "error";

export type TimelineStep = {
  key: string | number;
  label: string;
  state: TimelineStepState;
  /** Etiqueta al lado del paso (ej. "Rechazado" en un paso con error). */
  chip?: string;
};

type TimelineProps = {
  steps: TimelineStep[];
  /** `connected`: círculos grandes unidos por una línea. `compact`: lista de círculos chicos. */
  variant?: "connected" | "compact";
  tone?: UiTone;
};

const CIRCLE_CLASS: Record<TimelineStepState, string> = {
  done: styles.circleDone,
  pending: "",
  error: styles.circleError,
};

const LABEL_CLASS: Record<TimelineStepState, string> = {
  done: styles.labelDone,
  pending: "",
  error: styles.labelError,
};

/** Pasos de un proceso (seguimiento de un pedido, etc.) con su estado. */
export default function Timeline({ steps, variant = "connected", tone = "socios" }: TimelineProps) {
  const iconSize = variant === "connected" ? 16 : 14;

  return (
    <ol className={`${styles[variant]} ${toneClass(tone)}`}>
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        const circle = (
          <div className={`${styles.circle} ${CIRCLE_CLASS[step.state]}`}>
            {step.state === "error" ? <XCircle size={iconSize} /> : <CheckCircle2 size={iconSize} />}
          </div>
        );

        return (
          <li key={step.key} className={styles.step}>
            {variant === "connected" ? (
              <div className={styles.iconCol}>
                {circle}
                {!isLast && (
                  <div
                    className={`${styles.connector} ${step.state === "done" ? styles.connectorDone : ""}`}
                  />
                )}
              </div>
            ) : (
              circle
            )}

            <div className={styles.labelRow}>
              <p className={`${styles.label} ${LABEL_CLASS[step.state]}`}>{step.label}</p>
              {step.chip && (
                <Badge color="danger" uppercase>
                  {step.chip}
                </Badge>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
