import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import farmaciaLogo from "@/assets/logo_azul.svg";
import sociosaLogo from "@/assets/sociosa-color.png";

export const metadata: Metadata = {
  title: "Política de Privacidad — Farmacias Sánchez Antoniolli",
  description:
    "Política de Privacidad de Farmacias Sánchez Antoniolli y Breve Market (Nueva Villa SRL)",
};

export default function PoliticaDePrivacidadPage() {
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
            <Image
              src={sociosaLogo}
              alt="SocioSA"
              height={36}
              className="h-8 w-auto sm:h-9"
              priority
            />
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

          {/* Title */}
          <div className="mb-10 border-b border-[#e8f0f3] pb-8">
            {/* <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-[#007c98]">
              Documento legal
            </p> */}
            <h1 className="text-3xl font-bold text-[#17343d] sm:text-4xl">
              Política de Privacidad
            </h1>
            <p className="mt-2 text-[#48636b]">
              Farmacias Sánchez Antoniolli y Breve Market (Nueva Villa SRL)
            </p>
          </div>

          <div className="space-y-10 text-[15px] leading-relaxed text-[#32505a]">

            {/* 1 */}
            <section>
              <h2 className="mb-4 text-lg font-bold text-[#17343d]">
                1. Responsable del tratamiento
              </h2>
              <p className="mb-4">
                <strong>NUEVA VILLA SRL</strong> (CUIT 30-7088226-0), con domicilio en Congreso 5476, Córdoba, República Argentina (en adelante, la &ldquo;Empresa&rdquo;), es responsable del tratamiento de los datos personales recolectados a través de:
              </p>
              <ul className="mb-4 space-y-1 pl-5">
                {[
                  "Sitio web: www.farmaciassanchezantoniolli.com.ar",
                  "Sitio web: www.sociosa.sanchezantoniolli.com.ar",
                  "Sitio web: www.brevemarket.com.ar",
                  "Aplicaciones móviles actuales o futuras",
                  "Canales digitales y físicos asociados",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#007c98]" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mb-2">
                La Empresa opera bajo las marcas <strong>Farmacias Sánchez Antoniolli</strong> y <strong>Breve Market</strong>.
              </p>
              <p>
                El tratamiento de datos se realiza conforme a la <strong>Ley N° 25.326</strong> de Protección de Datos Personales y normativa complementaria.
              </p>
            </section>

            {/* 2 */}
            <section>
              <h2 className="mb-4 text-lg font-bold text-[#17343d]">
                2. Aceptación
              </h2>
              <p className="mb-2">
                El uso de los sitios, aplicaciones o servicios implica la <strong>aceptación expresa</strong> de esta Política de Privacidad.
              </p>
              <p>
                Si el usuario no está de acuerdo, deberá abstenerse de utilizar los servicios.
              </p>
            </section>

            {/* 3 */}
            <section>
              <h2 className="mb-4 text-lg font-bold text-[#17343d]">
                3. Datos que recopilamos
              </h2>
              <p className="mb-4">Podemos recopilar los siguientes datos personales:</p>
              <div className="space-y-4">
                {[
                  {
                    label: "a) Datos identificatorios",
                    items: ["Nombre y apellido", "DNI", "Fecha de nacimiento"],
                  },
                  {
                    label: "b) Datos de contacto",
                    items: ["Email", "Teléfono", "Dirección"],
                  },
                  {
                    label: "c) Datos transaccionales",
                    items: ["Historial de compras", "Productos adquiridos", "Interacciones con promociones"],
                  },
                  {
                    label: "d) Datos de navegación",
                    items: ["IP", "Cookies", "Comportamiento en sitio/app"],
                  },
                ].map(({ label, items }) => (
                  <div key={label}>
                    <p className="mb-2 font-semibold text-[#17343d]">{label}</p>
                    <ul className="space-y-1 pl-5">
                      {items.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#007c98]" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <div className="rounded-xl border border-[#f0e8fb] bg-[#faf7fe] p-4">
                  <p className="mb-2 font-semibold text-[#6d42b8]">
                    e) Datos sensibles (solo en casos específicos)
                  </p>
                  <ul className="mb-3 space-y-1 pl-5">
                    {["Información de salud o vinculada a tratamientos", "Recetas médicas o consultas"].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#6d42b8]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-[#48636b]">
                    Los datos sensibles serán tratados únicamente cuando el usuario los proporcione voluntariamente, con fines estrictamente necesarios y bajo confidencialidad reforzada.
                  </p>
                </div>
              </div>
            </section>

            {/* 4 */}
            <section>
              <h2 className="mb-4 text-lg font-bold text-[#17343d]">
                4. Finalidad del tratamiento
              </h2>
              <p className="mb-4">Los datos serán utilizados para:</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    title: "Operación del servicio",
                    items: ["Procesar compras y entregas", "Validar identidad", "Gestionar pedidos"],
                  },
                  {
                    title: "Programas y beneficios",
                    items: ["Administrar programas de fidelización (ej: SOCIOSA)", "Otorgar beneficios, descuentos y promociones"],
                  },
                  {
                    title: "Atención al cliente",
                    items: ["Gestionar consultas, reclamos y soporte"],
                  },
                  {
                    title: "Mejora del servicio",
                    items: ["Analizar comportamiento y preferencias", "Optimizar experiencia de usuario"],
                  },
                  {
                    title: "Marketing (con consentimiento)",
                    items: ["Enviar promociones y comunicaciones", "Personalizar ofertas"],
                  },
                  {
                    title: "Cumplimiento legal",
                    items: ["Normativa fiscal", "Normativa sanitaria", "Prevención de fraude"],
                  },
                ].map(({ title, items }) => (
                  <div
                    key={title}
                    className="rounded-xl border border-[#d3dee2] bg-[#f8fbfc] p-4"
                  >
                    <p className="mb-2 font-semibold text-[#17343d]">{title}</p>
                    <ul className="space-y-1 text-sm">
                      {items.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#007c98]" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* 5 */}
            <section>
              <h2 className="mb-4 text-lg font-bold text-[#17343d]">
                5. Tratamiento de datos sensibles (salud)
              </h2>
              <div className="rounded-xl border border-[#f0e8fb] bg-[#faf7fe] p-5">
                <p className="mb-3 font-semibold text-[#6d42b8]">La Empresa:</p>
                <ul className="space-y-1.5 pl-5">
                  {[
                    "NO utilizará datos de salud con fines publicitarios sin consentimiento expreso",
                    "Garantiza confidencialidad reforzada",
                    "Limita el acceso a personal autorizado",
                    "Cumple normativa sanitaria vigente",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#6d42b8]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* 6 */}
            <section>
              <h2 className="mb-4 text-lg font-bold text-[#17343d]">
                6. Consentimiento y comunicaciones
              </h2>
              <p className="mb-3">El usuario podrá:</p>
              <ul className="mb-4 space-y-1 pl-5">
                {[
                  "Aceptar o rechazar comunicaciones comerciales",
                  "Darse de baja en cualquier momento",
                  "Configurar notificaciones en la app",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#007c98]" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mb-2">
                Para solicitar exclusión:{" "}
                <a
                  href="mailto:sistemas@sanchezantoniolli.com.ar"
                  className="font-medium text-[#007c98] hover:underline"
                >
                  sistemas@sanchezantoniolli.com.ar
                </a>
              </p>
              <p className="text-sm text-[#48636b]">
                La negativa al uso de datos para marketing no afecta el uso del servicio.
              </p>
            </section>

            {/* 7 */}
            <section>
              <h2 className="mb-4 text-lg font-bold text-[#17343d]">
                7. Almacenamiento y seguridad
              </h2>
              <p className="mb-3">Los datos podrán almacenarse en:</p>
              <ul className="mb-4 space-y-1 pl-5">
                {["AWS (Amazon Web Services)", "Railway", "Otros proveedores cloud"].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#007c98]" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mb-3 text-sm text-[#48636b]">
                Dado que son servicios internacionales, los datos pueden alojarse fuera de Argentina.
              </p>
              <p>La Empresa aplica estándares de seguridad, controles de acceso y medidas técnicas y organizativas para proteger la información.</p>
            </section>

            {/* 8 */}
            <section>
              <h2 className="mb-4 text-lg font-bold text-[#17343d]">
                8. Transferencia de datos
              </h2>
              <p className="mb-4">Los datos podrán compartirse con:</p>
              <div className="space-y-3">
                {[
                  {
                    title: "Proveedores operativos",
                    items: ["Logística y envíos", "Pasarelas de pago", "Sistemas tecnológicos"],
                  },
                  {
                    title: "Marketing y publicidad",
                    items: ["Plataformas como Google y Meta"],
                  },
                  {
                    title: "Empresas vinculadas",
                    items: ["Sociedades del grupo", "Socios comerciales"],
                  },
                ].map(({ title, items }) => (
                  <div key={title} className="rounded-xl border border-[#d3dee2] bg-[#f8fbfc] p-4">
                    <p className="mb-2 font-semibold text-[#17343d]">{title}</p>
                    <ul className="space-y-1 text-sm">
                      {items.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#007c98]" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-sm text-[#48636b]">
                Siempre bajo acuerdos de confidencialidad y limitación de uso.
              </p>
            </section>

            {/* 9 */}
            <section>
              <h2 className="mb-4 text-lg font-bold text-[#17343d]">9. Cookies</h2>
              <p className="mb-3">Se utilizan cookies para:</p>
              <ul className="mb-4 space-y-1 pl-5">
                {["Personalizar la experiencia", "Analizar comportamiento", "Mostrar publicidad"].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#007c98]" />
                    {item}
                  </li>
                ))}
              </ul>
              <p>
                El usuario puede aceptar o rechazar cookies, y eliminarlas desde su navegador.
              </p>
            </section>

            {/* 10 */}
            <section>
              <h2 className="mb-4 text-lg font-bold text-[#17343d]">
                10. Derechos del usuario (ARCO)
              </h2>
              <p className="mb-4">El usuario puede ejercer sus derechos de:</p>
              <div className="mb-4 flex flex-wrap gap-2">
                {["Acceso", "Rectificación", "Cancelación", "Oposición"].map((right) => (
                  <span
                    key={right}
                    className="rounded-full border border-[#b8d6de] bg-[#e8f4f7] px-4 py-1.5 text-sm font-semibold text-[#007c98]"
                  >
                    {right}
                  </span>
                ))}
              </div>
              <p className="mb-2">
                Vía email:{" "}
                <a
                  href="mailto:sistemas@sanchezantoniolli.com.ar"
                  className="font-medium text-[#007c98] hover:underline"
                >
                  sistemas@sanchezantoniolli.com.ar
                </a>
              </p>
              <p className="text-sm text-[#48636b]">
                También puede acudir a la Agencia de Acceso a la Información Pública.
              </p>
            </section>

            {/* 11 */}
            <section>
              <h2 className="mb-4 text-lg font-bold text-[#17343d]">
                11. Eliminación de datos
              </h2>
              <p className="mb-3">El usuario puede solicitar la eliminación de su cuenta y la supresión de sus datos.</p>
              <div className="rounded-xl border border-[#fde8cc] bg-[#fffaf5] p-4 text-sm text-[#7a4e1a]">
                <strong>Excepción:</strong> La Empresa podrá conservar datos cuando sea necesario para obligaciones legales, facturación, o cumplimiento fiscal o sanitario.
              </div>
            </section>

            {/* 12 */}
            <section>
              <h2 className="mb-4 text-lg font-bold text-[#17343d]">
                12. Plazo de conservación
              </h2>
              <p>
                Los datos se conservarán mientras sean necesarios para la finalidad que justificó su recolección, o según lo exijan las normativas legales aplicables.
              </p>
            </section>

            {/* 13 */}
            <section>
              <h2 className="mb-4 text-lg font-bold text-[#17343d]">
                13. Seguridad y vulnerabilidades
              </h2>
              <p className="mb-3">
                La Empresa promueve la notificación responsable de fallas de seguridad.
              </p>
              <p className="mb-1">
                Contacto:{" "}
                <a
                  href="mailto:sistemas@sanchezantoniolli.com.ar"
                  className="font-medium text-[#007c98] hover:underline"
                >
                  sistemas@sanchezantoniolli.com.ar
                </a>
              </p>
              <p className="text-sm text-[#48636b]">No se otorgan recompensas económicas.</p>
            </section>

            {/* 14 */}
            <section>
              <h2 className="mb-4 text-lg font-bold text-[#17343d]">
                14. Requerimientos legales
              </h2>
              <p className="mb-3">La Empresa podrá revelar datos:</p>
              <ul className="space-y-1 pl-5">
                {[
                  "Por requerimiento judicial",
                  "Por obligación legal",
                  "Ante sospechas de fraude o delito",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#007c98]" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* 15 */}
            <section>
              <h2 className="mb-4 text-lg font-bold text-[#17343d]">
                15. Modificaciones
              </h2>
              <p className="mb-3">
                La presente política podrá actualizarse. Se notificará mediante:
              </p>
              <ul className="space-y-1 pl-5">
                {["Email", "Publicación en los sitios"].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#007c98]" />
                    {item}
                  </li>
                ))}
              </ul>
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
