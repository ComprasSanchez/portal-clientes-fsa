import type { ReactNode } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import farmaciaLogo from "@/assets/logo_azul.svg";
import sociosaLogo from "@/assets/sociosa-color.png";

export const metadata: Metadata = {
  title: "Eliminar tu cuenta — SocioSA",
  description:
    "Cómo eliminar tu cuenta de la app SocioSA de Farmacias Sánchez Antoniolli y qué datos se conservan.",
};

const CONTACT_EMAIL = "sistemas@sanchezantoniolli.com";

const PASOS_APP = [
  "Abrí la app SocioSA e iniciá sesión.",
  "Entrá a la pestaña Perfil (Mi perfil).",
  "Al final de la pantalla, tocá “Borrar mi cuenta”.",
  "Revisá qué se borra y qué se conserva, y tocá “Continuar”.",
  "Te enviamos un código a tu email: ingresalo para confirmar. Tu cuenta se borra en ese momento.",
];

const SE_BORRA = [
  "Tu cuenta para ingresar a la app: email, contraseña y el ingreso con Google o Apple.",
  "Las sesiones abiertas y los celulares en los que iniciaste sesión.",
  "El vínculo entre tu cuenta y tu registro de cliente.",
];

const SE_CONSERVA = [
  "Tus compras y facturas, por obligaciones fiscales y contables.",
  "Tu registro de cliente en las farmacias (nombre, DNI, contactos y domicilio) y tus puntos, que seguís usando en el mostrador.",
];

function Bullet({ children, color = "#007c98" }: { children: ReactNode; color?: string }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span>{children}</span>
    </li>
  );
}

export default function EliminarCuentaPage() {
  return (
    <div className="min-h-screen bg-[#f2f5f6]">
      {/* Header */}
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
            href="/"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-[#007c98] transition-colors hover:bg-[#e0eaed]"
          >
            Volver al inicio
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-[#d3dee2] bg-white px-6 py-10 shadow-sm sm:px-10 sm:py-12">
          <div className="mb-10 border-b border-[#e8f0f3] pb-8">
            <h1 className="text-3xl font-bold text-[#17343d] sm:text-4xl">Eliminar tu cuenta</h1>
            <p className="mt-2 text-[#48636b]">
              App SocioSA — Farmacias Sánchez Antoniolli (Nueva Villa SRL)
            </p>
          </div>

          <div className="space-y-10 text-[15px] leading-relaxed text-[#32505a]">
            <section>
              <h2 className="mb-4 text-lg font-bold text-[#17343d]">Desde la app</h2>
              <ol className="space-y-2 pl-5">
                {PASOS_APP.map((paso, i) => (
                  <li key={paso} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e8f4f7] text-sm font-bold text-[#007c98]">
                      {i + 1}
                    </span>
                    <span>{paso}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section>
              <h2 className="mb-4 text-lg font-bold text-[#17343d]">Si ya no tenés la app</h2>
              <p className="mb-2">
                Escribinos desde el email de tu cuenta a{" "}
                <a href={`mailto:${CONTACT_EMAIL}?subject=Eliminar%20mi%20cuenta%20SocioSA`} className="font-medium text-[#007c98] hover:underline">
                  {CONTACT_EMAIL}
                </a>{" "}
                con el asunto “Eliminar mi cuenta SocioSA” e indicá tu DNI.
              </p>
              <p className="text-sm text-[#48636b]">
                Para proteger tu cuenta, podemos pedirte que confirmes que sos el titular antes de eliminarla.
              </p>
            </section>

            <section className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[#d3dee2] bg-[#f8fbfc] p-4">
                <p className="mb-2 font-semibold text-[#17343d]">Qué se borra</p>
                <ul className="space-y-1 text-sm">
                  {SE_BORRA.map((item) => (
                    <Bullet key={item} color="#dd3f62">
                      {item}
                    </Bullet>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-[#d3dee2] bg-[#f8fbfc] p-4">
                <p className="mb-2 font-semibold text-[#17343d]">Qué se conserva</p>
                <ul className="space-y-1 text-sm">
                  {SE_CONSERVA.map((item) => (
                    <Bullet key={item}>{item}</Bullet>
                  ))}
                </ul>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-lg font-bold text-[#17343d]">Plazos</h2>
              <p className="mb-2">
                Desde la app, la cuenta se elimina en el momento en que ingresás el código. Si lo pedís por email, te
                avisamos por el mismo medio cuando esté eliminada.
              </p>
              <p className="text-sm text-[#48636b]">
                Si más adelante querés volver a usar la app, podés crear una cuenta nueva con tu DNI y recuperás tus
                puntos. Más información en la{" "}
                <Link href="/politica-de-privacidad" className="font-medium text-[#007c98] hover:underline">
                  Política de Privacidad
                </Link>
                .
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#d3dee2] py-6 text-center text-sm text-[#6b8087]">
        <p>© Nueva Villa SRL — CUIT 30-7088226-0 — Congreso 5476, Córdoba, Argentina</p>
      </footer>
    </div>
  );
}
