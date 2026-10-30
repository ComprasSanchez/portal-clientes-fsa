import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import farmaciaLogo from "@/assets/logo_azul.svg";
import sociosaLogo from "@/assets/sociosa-color.png";

export const metadata: Metadata = {
  title: "Bases y condiciones — Juego de stands Breve",
  description: "Bases y condiciones del juego de stands del evento Breve.",
};

const BASES = [
  "Actividad organizada por Nueva Villa S.R.L. el día 30/10/2026 en el evento aniversario de BREVE. La participación es gratuita y sin obligación de compra.",
  "Para participar, aceptá las bases y condiciones, buscá los códigos QR de los stands y escanealos desde la plataforma. Al completar 5 stands diferentes con escaneo confirmado, acercate al stand de premios para canjear tu regalo. Se habilitará un único regalo por socio, que podrá canjearse una sola vez por el desafío completado. Los regalos están sujetos a stock disponible.",
  "Según el regalo obtenido, se entregará durante el evento.",
  "Los regalos podrán incluir productos, alimentos o vouchers. Los vouchers serán válidos únicamente para BREVE Market (Av. Rio de Janeiro 1621. Villa Allende) y no podrán utilizarse para medicamentos ni productos medicinales. Su canje estará sujeto a las condiciones y fecha de vencimiento indicadas en cada voucher.",
  "Los regalos no son canjeables por dinero ni intercambiables por otros productos o beneficios por elección del participante, sin perjuicio de los derechos que correspondan ante defectos o incumplimientos.",
  "Para los productos comestibles, deberán respetarse las indicaciones de conservación y las fechas de vencimiento. En caso de alergias o restricciones alimentarias, consultá los ingredientes antes de consumirlos.",
];

export default function BasesEventoPage() {
  return (
    <div className="min-h-screen bg-[#f2f5f6]">
      <header className="sticky top-0 z-10 border-b border-[#d3dee2] bg-[#f2f5f6]">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4 sm:gap-6 sm:px-6">
          {/* En celular solo entra un logo al lado del link. */}
          <div className="flex min-w-0 items-center gap-5">
            <Image
              src={farmaciaLogo}
              alt="Farmacias Sánchez Antoniolli"
              height={360}
              width={360}
              className="h-9 w-auto sm:h-10"
              priority
            />
            <div className="hidden h-8 w-px bg-[#c4d2d7] sm:block" />
            <Image
              src={sociosaLogo}
              alt="SocioSA"
              height={36}
              className="hidden h-8 w-auto sm:block sm:h-9"
              priority
            />
          </div>
          <Link
            href="/socios?view=evento"
            className="shrink-0 whitespace-nowrap rounded-lg border border-[#c4d2d7] bg-white px-4 py-2 text-sm font-semibold text-[#007c98] transition-colors hover:bg-[#e0eaed]"
          >
            Volver al juego
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-[#d3dee2] bg-white px-6 py-10 shadow-sm sm:px-10 sm:py-12">
          <h1 className="text-3xl font-bold text-[#17343d] sm:text-4xl">Bases y condiciones</h1>
          <p className="mt-2 text-[#48636b]">Juego de stands — Evento Breve</p>
          <div className="mt-8 space-y-4 text-[15px] leading-relaxed text-[#32505a]">
            {BASES.map((parrafo) => (
              <p key={parrafo}>{parrafo}</p>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-[#d3dee2] py-6 text-center text-sm text-[#6b8087]">
        <p>© Nueva Villa SRL — CUIT 30-7088226-0 — Congreso 5476, Córdoba, Argentina</p>
      </footer>
    </div>
  );
}
