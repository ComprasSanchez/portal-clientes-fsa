"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { SociosSidebar } from "@/components/molecules/side-bar/SociosSidebar";
import { SociosViews } from "@/components/organisms/socios/SociosViews";
import { ConvenioVerificacionModal } from "@/components/organisms/convenio/ConvenioVerificacionModal";
import { usePortalPerfilContext } from "@/lib/portal-perfil-context";
import { useGlobalToast } from "@/components/ui/global-toast";
import { type SociosView } from "@/types/socios";

const FUTURA = '"Futura", "BD Supper", Arial, Helvetica, sans-serif';

const DEFAULT_VIEW: SociosView = "dashboard";
const VALID_VIEWS: SociosView[] = ["dashboard", "mi-cuenta", "facturas", "puntos", "sorteos", "sucursales"];


export function SociosPageClient() {
  const [currentView, setCurrentView] = useState<SociosView>(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view");
    if (view && VALID_VIEWS.includes(view as SociosView)) {
      return view as SociosView;
    }
    return DEFAULT_VIEW;
  });
  const [convenio] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("convenio")?.trim().toUpperCase() || null;
  });
  const [convenioUnlocked, setConvenioUnlocked] = useState<boolean>(!convenio);
  const [convenioChecking, setConvenioChecking] = useState<boolean>(Boolean(convenio));
  const convenioLocked = Boolean(convenio && !convenioUnlocked);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const view = searchParams.get("view");
    if (view && VALID_VIEWS.includes(view as SociosView)) {
      setCurrentView(view as SociosView);
    } else if (!view) {
      setCurrentView(DEFAULT_VIEW);
    }
  }, [searchParams]);

  const { perfil, summary, isLoading } = usePortalPerfilContext();
  const { pushToast } = useGlobalToast();

  // Fuente de verdad: verificar contra el CRM en cualquier dispositivo
  useEffect(() => {
    if (!convenio || convenioUnlocked) {
      setConvenioChecking(false);
      return;
    }
    const dni = summary.documentNumber;
    if (!dni) return;

    void axios
      .get<{ found?: boolean; convenio?: string | null }>(
        `/api/legacy/cliente/${encodeURIComponent(dni)}`
      )
      .then(({ data }) => {
        if (data.found && data.convenio?.toUpperCase() === convenio) {
          setConvenioUnlocked(true);
        }
      })
      .catch(() => undefined)
      .finally(() => setConvenioChecking(false));
  }, [convenio, convenioUnlocked, summary.documentNumber]);

  const handleNavigate = (view: SociosView) => {
    if (convenioLocked) return;
    setCurrentView(view);
    const url = view === DEFAULT_VIEW ? "/socios" : `/socios?view=${view}`;
    router.push(url, { scroll: false });
    window.scrollTo(0, 0);
  };

  const handleLogout = () => {
    void (async () => {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } finally {
        setCurrentView(DEFAULT_VIEW);
        router.replace("/");
      }
    })();
  };

  const principalPhone =
    perfil?.contactos?.find((c) => c.tipo === "TELEFONO" && c.principal) ??
    perfil?.contactos?.find((c) => c.tipo === "TELEFONO") ??
    null;
  const phoneVerified = principalPhone?.verificado === true;

  const handleConvenioVerified = () => {
    setConvenioUnlocked(true);
    router.replace("/socios", { scroll: false });
    pushToast({
      variant: "success",
      title: "¡Verificación completada!",
      description: `Tu número fue verificado y quedaste asociado al convenio ${convenio ?? ""}.`,
    });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#edf1f2] via-[#f7f9fa] to-white" style={{ fontFamily: FUTURA }}>
      {convenioLocked && convenio && !convenioChecking && (
        <ConvenioVerificacionModal
          convenio={convenio}
          documentNumber={summary.documentNumber}
          userName={summary.displayName}
          principalPhone={principalPhone}
          phoneVerified={phoneVerified}
          onVerified={handleConvenioVerified}
          onLogout={handleLogout}
        />
      )}

      <SociosSidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        userName={summary.displayName}
      />

      <div className="flex min-h-[calc(100vh-4rem)] flex-col pt-16 transition-all duration-300 lg:ml-64 lg:min-h-screen lg:pt-0">
        <SociosViews
          currentView={currentView}
          onNavigate={handleNavigate}
          userName={summary.displayName}
          affiliateNumber={summary.affiliateNumber}
          documentNumber={summary.documentNumber}
          email={summary.email}
          phone={summary.phone}
          perfil={perfil}
          isProfileLoading={isLoading || convenioChecking}
          convenio={convenio}
          convenioLocked={convenioLocked}
        />

        <footer className="relative left-1/2 mt-auto -translate-x-1/2 border-t border-[#d3dee2] bg-white py-6">
          <div className="mx-auto max-w-7xl px-4 text-center text-sm text-[#627880] sm:px-6 lg:px-8">
            <p className="mb-2">© 2026 Farmacias Sanchez Antoniolli - Todos los derechos reservados</p>
            {/* <p className="text-xs text-[#8a9aa0]">Atencion clara · Gestion simple · Acceso rapido</p> */}
          </div>
        </footer>
      </div>
    </div>
  );
}
