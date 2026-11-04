import { redirect } from "next/navigation";
import { isFiestaActiva } from "@/lib/fiesta";

type FiestaCodigoPageProps = {
  params: Promise<{ codigo: string }>;
};

/**
 * Destino del QR de la entrada de la fiesta: `/fiesta/<codigo>`. Lleva a la
 * vista de la fiesta dentro de /socios (sección Colaboradores) con el código.
 * Sin sesión, el middleware manda antes al login y vuelve acá.
 */
export default async function FiestaCodigoPage({ params }: FiestaCodigoPageProps) {
  if (!isFiestaActiva()) redirect("/socios");
  const { codigo } = await params;
  redirect(`/socios?view=colaboradores-fiesta&ingreso=${encodeURIComponent(codigo)}`);
}
