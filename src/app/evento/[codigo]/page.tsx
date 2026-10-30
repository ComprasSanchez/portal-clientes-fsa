import { redirect } from "next/navigation";

type EventoCodigoPageProps = {
  params: Promise<{ codigo: string }>;
};

/**
 * Destino de los QR impresos en cada stand: `/evento/<codigo>`. Lleva a la vista
 * del juego dentro de /socios, que registra el stand y limpia el código de la URL.
 * Sin sesión, el middleware manda antes al login y vuelve acá.
 */
export default async function EventoCodigoPage({ params }: EventoCodigoPageProps) {
  const { codigo } = await params;
  redirect(`/socios?view=evento&stand=${encodeURIComponent(codigo)}`);
}
