import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import farmaciaLogo from "@/assets/logo_azul.svg";
import sociosaLogo from "@/assets/sociosa-color.png";

export const metadata: Metadata = {
  title: "Bases y condiciones — Juego de stands Breve",
  description: "Bases y condiciones del juego de stands del evento Breve.",
};

// Página provisoria: reemplazar por las bases definitivas cuando estén.
export default function BasesEventoPage() {
  return (
    <div className="min-h-screen bg-[#f2f5f6]">
      <header className="sticky top-0 z-10 border-b border-[#d3dee2] bg-[#f2f5f6]">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-6 px-6 py-4">
          <div className="flex items-center gap-5">
            <Image
              src={farmaciaLogo}
              alt="Farmacias Sánchez Antoniolli"
              height={360}
              width={360}
              className="h-10 w-auto sm:h-10"
              priority
            />
            <div className="h-8 w-px bg-[#c4d2d7]" />
            <Image src={sociosaLogo} alt="SocioSA" height={36} className="h-8 w-auto sm:h-9" priority />
          </div>
          <Link
            href="/socios?view=evento"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-[#007c98] transition-colors hover:bg-[#e0eaed]"
          >
            Volver al juego
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-[#d3dee2] bg-white px-6 py-10 shadow-sm sm:px-10 sm:py-12">
          <h1 className="text-3xl font-bold text-[#17343d] sm:text-4xl">Bases y condiciones</h1>
          <p className="mt-2 text-[#48636b]">Juego de stands — Evento Breve</p>
          <p className="mt-8 text-[15px] leading-relaxed text-[#32505a]">
            Estamos terminando de preparar las bases y condiciones de este juego. Muy pronto vas a
            poder leerlas completas en esta página.
          </p>
        </div>
      </main>

      <footer className="border-t border-[#d3dee2] py-6 text-center text-sm text-[#6b8087]">
        <p>© Nueva Villa SRL — CUIT 30-7088226-0 — Congreso 5476, Córdoba, Argentina</p>
      </footer>
    </div>
  );
}
