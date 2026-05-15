import PortalCliente from "@/components/organisms/portal-cliente/portal-cliente";

type PortalClientePageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function PortalClientePage({
  params,
}: PortalClientePageProps) {
  const { token } = await params;

  return <PortalCliente token={token} />;
}
