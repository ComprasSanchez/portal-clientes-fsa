import { Check, House, ShoppingBag } from "lucide-react";
import styles from "./stepper.module.scss";

type PortalStepperProps = {
  currentStep?: 1 | 2 | 3;
};

export default function PortalStepper({ currentStep = 1 }: PortalStepperProps) {
  const steps = [
    { id: 1, label: "Productos", icon: ShoppingBag },
    { id: 2, label: "Entrega", icon: House },
    { id: 3, label: "Confirmación", icon: Check },
  ] as const;

  return (
    <div className={styles.stepper}>
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = step.id === currentStep;
        const isCompleted = step.id < currentStep;
        const isUpcoming = step.id > currentStep;

        return (
          <div key={step.id} className={styles.stepItem}>
            <div
              className={[
                styles.stepCircle,
                isActive ? styles.active : "",
                isCompleted ? styles.completed : "",
                isUpcoming ? styles.upcoming : "",
              ].join(" ")}
            >
              <Icon size={20} strokeWidth={2.2} />
            </div>

            {index < steps.length - 1 && (
              <div className={styles.connector}>
                <div
                  className={[
                    styles.connectorFill,
                    currentStep > step.id ? styles.filled : "",
                  ].join(" ")}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
