import { Check } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import styles from "./FaqView.module.scss";
import { FAQ_SECTIONS } from "./FaqView.data";

export function FaqView() {
  return (
    <section className={styles.container}>
      <div>
        <h1 className={styles.title}>¿En qué puedo ayudarte?</h1>
        <p className={styles.subtitle}>
          Encontrá respuestas rápidas sobre CORA y cómo funciona
        </p>
      </div>

      {FAQ_SECTIONS.map((section) => (
        <div key={section.id} className={styles.faqCard}>
          <h2 className={styles.faqHeading}>{section.title}</h2>

          <Accordion type="single" collapsible className={styles.accordion}>
            {section.items.map((item) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className={styles.item}
              >
                <AccordionTrigger className={styles.trigger}>
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className={styles.content}>
                  {Array.isArray(item.answer) ? (
                    <ul className={styles.bulletList}>
                      {item.answer.map((line) => (
                        <li key={line} className={styles.bulletItem}>
                          <Check size={16} className={styles.bulletIcon} />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    item.answer
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ))}
    </section>
  );
}
