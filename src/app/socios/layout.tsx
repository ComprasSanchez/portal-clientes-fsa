import { Suspense } from "react";
import type { Metadata } from "next";
import { IdentityLinkGuard } from "@/components/auth/IdentityLinkGuard";
import { SessionExpiryGuard } from "@/components/auth/SessionExpiryGuard";
import { PortalExpedientesProvider } from "@/lib/portal-expedientes-context";
import { PortalPerfilProvider } from "@/lib/portal-perfil-context";
import { PortalIdentidadProvider } from "@/lib/portal-identidad-context";
import { PortalNotificacionesProvider } from "@/lib/portal-notificaciones-context";

export const metadata: Metadata = {
  title: "SocioSA",
  description: "Portal de socios",
  icons: {
    icon: "/socio.ico",
    shortcut: "/socio.ico",
    apple: "/icons/apple-touch-icon.png",
  },
};

export default function SociosLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PortalIdentidadProvider>
      <PortalPerfilProvider>
        <PortalExpedientesProvider>
          <PortalNotificacionesProvider>
            <Suspense fallback={null}>
              <SessionExpiryGuard />
              <IdentityLinkGuard />
            </Suspense>
            {children}
          </PortalNotificacionesProvider>
        </PortalExpedientesProvider>
      </PortalPerfilProvider>
    </PortalIdentidadProvider>
  );
}
