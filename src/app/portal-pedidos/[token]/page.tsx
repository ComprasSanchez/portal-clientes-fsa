import PortalPedido from "@/components/organisms/portal-pedido/portal-pedido";

type PortalPedidosPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function PortalPedidosPage({ params }: PortalPedidosPageProps) {
  const { token } = await params;

  return <PortalPedido token={token} />;
}