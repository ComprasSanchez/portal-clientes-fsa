import type { Metadata } from "next";
import { PortalExpedientesProvider } from "@/lib/portal-expedientes-context";
import { PortalPerfilProvider } from "@/lib/portal-perfil-context";

export const metadata: Metadata = {
  title: "Socios A",
  description: "Portal de socios",
  icons: {
    icon: "/socio.ico",
    shortcut: "/socio.ico",
  },
};

export default function SociosLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PortalPerfilProvider>
      <PortalExpedientesProvider>{children}</PortalExpedientesProvider>
    </PortalPerfilProvider>
  );
}