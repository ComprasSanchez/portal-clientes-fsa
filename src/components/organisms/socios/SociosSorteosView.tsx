"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  CalendarDays,
  CalendarOff,
  CircleAlert,
  CircleCheckBig,
  LoaderCircle,
  RefreshCw,
  ShoppingCart,
  Ticket,
  X,
} from "lucide-react";
import { usePortalPerfilContext } from "@/lib/portal-perfil-context";
import { getActiveSorteoCampaign } from "@/lib/sorteo-campaign";
import Card from "@/components/atoms/card/card";
import { InstagramIcon } from "@/components/atoms/instagram-icon/instagram-icon";
import Alert from "@/components/atoms/alert/alert";
import EmptyState from "@/components/molecules/empty-state/empty-state";
import styles from "./SociosSorteosView.module.scss";

type PhoneContact = {
  id?: string;
  tipo?: string;
  valor?: string;
  principal?: boolean;
  verificado?: boolean;
};

type SorteoActivo = {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
};

type SorteoActivoResponse = {
  ok: boolean;
  error?: string;
  sorteo?: SorteoActivo;
};

type ParticiparSorteoResponse = {
  ok: boolean;
  alreadyParticipating?: boolean;
  verified?: boolean;
  requiresValidation?: boolean;
  message?: string;
  error?: string;
  estado?: string;
  participacionId?: number;
  sorteo?: {
    id: number;
    codigo: string;
    nombre: string;
  };
};

interface SociosSorteosViewProps {
  documentNumber: string | null;
  userName: string;
  phoneVerified: boolean;
  principalPhone: PhoneContact | null;
  convenio: string | null;
}

const formatDate = (value?: string | null) => {
  if (!value) return "Sin fecha definida";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

export function SociosSorteosView({
  documentNumber,
  userName,
  phoneVerified,
  principalPhone,
  convenio,
}: SociosSorteosViewProps) {
  const { refresh } = usePortalPerfilContext();
  const [activeDraw, setActiveDraw] = useState<SorteoActivo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [noSorteo, setNoSorteo] = useState(false);
  const [isParticipating, setIsParticipating] = useState(false);
  const [participation, setParticipation] =
    useState<ParticiparSorteoResponse | null>(null);

  const [isVerificacionModalOpen, setIsVerificacionModalOpen] = useState(false);
  const [otpStep, setOtpStep] = useState<
    "idle" | "sending" | "waiting_whatsapp"
  >("idle");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadActiveDraw = async () => {
    setIsLoading(true);
    setLoadError(null);
    setNoSorteo(false);

    try {
      const response = await fetch("/api/legacy/sorteos/activo", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response
        .json()
        .catch(() => null)) as SorteoActivoResponse | null;

      const errorCode = data?.error ?? null;
      const isSinSorteo =
        !data?.sorteo || errorCode === "sorteo_activo_no_configurado";

      if (!response.ok) {
        if (isSinSorteo) {
          setActiveDraw(null);
          setNoSorteo(true);
        } else {
          setActiveDraw(null);
          setLoadError(errorCode ?? "No pudimos consultar el sorteo activo.");
        }
        return;
      }

      if (!data?.ok || !data.sorteo) {
        setActiveDraw(null);
        setNoSorteo(true);
        return;
      }

      setActiveDraw(data.sorteo);
    } catch {
      setActiveDraw(null);
      setLoadError("No pudimos consultar el sorteo activo.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadActiveDraw();
  }, []);

  useEffect(() => {
    if (otpStep !== "waiting_whatsapp" || !principalPhone?.id) return;

    const contactoId = principalPhone.id;

    pollingRef.current = setInterval(() => {
      void fetch("/api/portal/me/perfil", {
        headers: { Accept: "application/json" },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then(
          (
            data: {
              contactos?: { id?: string; verificado?: boolean }[];
            } | null,
          ) => {
            if (!data) return;
            const contacto = (data.contactos ?? []).find(
              (c) => c.id === contactoId,
            );
            if (contacto?.verificado) {
              if (pollingRef.current) clearInterval(pollingRef.current);
              setIsVerificacionModalOpen(false);
              setOtpStep("idle");
              void refresh();
            }
          },
        )
        .catch(() => undefined);
    }, 4000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [otpStep, principalPhone?.id, refresh]);

  useEffect(() => {
    if (otpStep !== "waiting_whatsapp") {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
      setResendCooldown(0);
      return;
    }

    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [otpStep]);

  const handleParticipate = async () => {
    if (!documentNumber || !activeDraw) {
      return;
    }

    setIsParticipating(true);
    setParticipation(null);

    try {
      const response = await fetch("/api/legacy/sorteos/participar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documento: documentNumber,
          canal: convenio ? "CONVENIO" : "SOCIOSA_PORTAL",
          ...(convenio ? { convenio } : {}),
        }),
      });

      const data = (await response
        .json()
        .catch(() => null)) as ParticiparSorteoResponse | null;

      if (!response.ok || !data) {
        setParticipation({
          ok: false,
          error: data?.error ?? "No pudimos registrar tu participacion.",
        });
        return;
      }

      setParticipation(data);
    } catch {
      setParticipation({
        ok: false,
        error: "No pudimos registrar tu participacion.",
      });
    } finally {
      setIsParticipating(false);
    }
  };

  const handleOpenVerificacionModal = () => {
    setOtpStep("idle");
    setOtpError(null);
    setIsVerificacionModalOpen(true);
  };

  const handleCloseVerificacionModal = () => {
    if (otpStep === "sending") return;
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    setIsVerificacionModalOpen(false);
    setOtpStep("idle");
    setOtpError(null);
    setResendCooldown(0);
  };

  const handleSolicitarOtp = async () => {
    if (!principalPhone?.id) return;
    setOtpStep("sending");
    setOtpError(null);
    try {
      if (
        principalPhone.valor?.startsWith("+54") &&
        !principalPhone.valor?.startsWith("+549")
      ) {
        const normalizedValor = "+549" + principalPhone.valor.slice(3);
        const patchRes = await fetch(
          `/api/portal/me/contactos/${principalPhone.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tipo: "TELEFONO",
              valor: normalizedValor,
              regionIso2: "AR",
              principal: principalPhone.principal ?? false,
              verificado: principalPhone.verificado ?? false,
            }),
          },
        );
        if (!patchRes.ok) {
          setOtpError(
            "No se pudo normalizar el numero antes de verificar. Edita y guarda el telefono primero.",
          );
          setOtpStep("idle");
          return;
        }
      }

      const res = await fetch(
        `/api/portal/me/contactos/${principalPhone.id}/verificar`,
        { method: "POST", headers: { Accept: "application/json" } },
      );
      const data = (await res.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!res.ok) {
        setOtpError(
          data?.message ?? "No se pudo enviar el mensaje. Intenta de nuevo.",
        );
        setOtpStep("idle");
        return;
      }
      setOtpStep("waiting_whatsapp");
    } catch {
      setOtpError("Error de red. Intenta de nuevo.");
      setOtpStep("idle");
    }
  };

  const participationMessage =
    participation?.message ?? participation?.error ?? null;
  const campaign = getActiveSorteoCampaign();
  const purchaseCampaign = campaign?.purchaseParticipation ?? null;
  const canParticipate = Boolean(
    documentNumber && activeDraw && !isParticipating && phoneVerified,
  );

  return (
    <main className={styles.container}>
      <section className={styles.heroCard}>
        <div>
          <h1 className={styles.title}>Sorteos</h1>
          <p className={styles.description}>
            Consulta el sorteo vigente y participa con el documento asociado a
            tu cuenta de socio.
          </p>
        </div>
      </section>

      {convenio ? (
        <section className={styles.convenioBanner}>
          <span className={styles.convenioBannerLabel}>Sorteo de convenio</span>
          <strong className={styles.convenioBannerName}>{convenio}</strong>
        </section>
      ) : null}

      <section className={styles.grid}>
        <Card>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Sorteo actual</h2>
            </div>
            <span className={styles.iconBadge}>
              <Ticket size={18} />
            </span>
          </div>

          {campaign ? (
            <Image
              src={campaign.section.image}
              alt={campaign.section.imageAlt}
              className={styles.campaignImage}
              sizes="(max-width: 767px) 100vw, 50vw"
              priority
            />
          ) : isLoading ? (
            <Alert
              color="neutral"
              className="mt-4"
              icon={<LoaderCircle className="animate-spin" size={18} />}
            >
              Cargando información del sorteo...
            </Alert>
          ) : loadError ? (
            <Alert className="mt-4" icon={<CircleAlert size={18} />}>
              {loadError}
            </Alert>
          ) : noSorteo ? (
            <EmptyState
              variant="dashed"
              className="mt-5"
              icon={CalendarOff}
              title="Sin sorteo activo por el momento"
              text="Cuando haya un sorteo en curso, vas a poder verlo y participar desde acá. Volvé pronto."
            />
          ) : activeDraw ? (
            <div className={styles.drawContent}>
              <div className={styles.drawHero}>
                <p className={styles.drawCode}>{activeDraw.codigo}</p>
                <h3 className={styles.drawName}>{activeDraw.nombre}</h3>
                <p className={styles.drawDescription}>
                  {activeDraw.descripcion?.trim()}
                </p>
              </div>

              <div className={styles.metaGrid}>
                <div className={styles.metaCard}>
                  <span className={styles.metaLabel}>Inicio</span>
                  <strong className={styles.metaValue}>
                    {formatDate(activeDraw.fechaInicio)}
                  </strong>
                </div>
                <div className={styles.metaCard}>
                  <span className={styles.metaLabel}>Cierre</span>
                  <strong className={styles.metaValue}>
                    {formatDate(activeDraw.fechaFin)}
                  </strong>
                </div>
              </div>
            </div>
          ) : null}
        </Card>

        <Card>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Participar</h2>
            </div>
            <span className={styles.iconBadgeAlt}>
              <CalendarDays size={18} />
            </span>
          </div>

          <div className={styles.identityCard}>
            <strong className={styles.identityValue}>{userName}</strong>
            <span className={styles.identityHint}>
              Documento usado para participar:{" "}
              {documentNumber?.trim() || "No disponible en tu perfil"}
            </span>
          </div>

          {purchaseCampaign ? (
            <div className={styles.purchaseInfo}>
              <div className={styles.purchaseHighlight}>
                <ShoppingCart size={20} className={styles.purchaseHighlightIcon} />
                <div>
                  <p className={styles.purchaseHighlightTitle}>
                    Participás automáticamente por ser socioSA
                  </p>
                  <p className={styles.purchaseHighlightBody}>
                    Todas tus compras en {purchaseCampaign.storeName}{" "}
                    {purchaseCampaign.periodLabel} suman chances.
                  </p>
                </div>
              </div>

              <div className={styles.purchaseFooter}>
                <p>{purchaseCampaign.frequencyLabel}</p>
                {campaign?.instagram ? (
                  <>
                    <p>Los ganadores se comunican en nuestro Instagram:</p>
                    <a
                      href={campaign.instagram.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.instagramButton}
                    >
                      <InstagramIcon />
                      {campaign.instagram.handle}
                    </a>
                  </>
                ) : null}
              </div>
            </div>
          ) : (
          <>
          {!phoneVerified ? (
            <Alert color="warning" className="mt-4" icon={<CircleAlert size={18} />}>
              <div className={styles.warningContent}>
                <span>
                  Necesitas verificar tu celular para poder participar del
                  sorteo.
                </span>
                {principalPhone?.id ? (
                  <button
                    type="button"
                    className={styles.verifyLink}
                    onClick={handleOpenVerificacionModal}
                  >
                    Verificar celular
                  </button>
                ) : (
                  <span className={styles.warningHint}>
                    Anda a tu perfil y carga un numero para verificarlo.
                  </span>
                )}
              </div>
            </Alert>
          ) : null}

          {participationMessage ? (
            <Alert
              color={participation?.ok ? "success" : "error"}
              className="mt-4"
              icon={
                participation?.ok ? (
                  <CircleCheckBig size={18} />
                ) : (
                  <CircleAlert size={18} />
                )
              }
            >
              <div>
                <p>{participationMessage}</p>
                {participation?.requiresValidation ? (
                  <small className={styles.inlineHint}>
                    La participacion quedo registrada pero requiere validacion
                    adicional.
                  </small>
                ) : null}
                {participation?.alreadyParticipating ? (
                  <small className={styles.inlineHint}>
                    Ya figurabas como participante en este sorteo.
                  </small>
                ) : null}
              </div>
            </Alert>
          ) : null}

          <button
            className={styles.primaryButton}
            disabled={!canParticipate}
            onClick={() => void handleParticipate()}
            type="button"
          >
            {isParticipating ? (
              <>
                <LoaderCircle className={styles.spinningIcon} size={16} />
                Registrando participacion...
              </>
            ) : (
              <>
                <Ticket size={16} />
                Participar del sorteo
              </>
            )}
          </button>
          </>
          )}
        </Card>
      </section>

      {isVerificacionModalOpen && principalPhone ? (
        <div
          className={styles.modalOverlay}
          onClick={handleCloseVerificacionModal}
        >
          <div
            className={styles.modalDialog}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="verificacion-sorteo-title"
          >
            <header className={styles.modalHeader}>
              <div>
                <h2
                  id="verificacion-sorteo-title"
                  className={styles.modalTitle}
                >
                  Verificar celular
                </h2>
                <p className={styles.modalSubtitle}>
                  {principalPhone.valor ?? "Tu celular"}
                </p>
              </div>
              <button
                type="button"
                className={styles.modalCloseButton}
                onClick={handleCloseVerificacionModal}
                aria-label="Cerrar"
                disabled={otpStep === "sending"}
              >
                <X size={22} />
              </button>
            </header>

            <div className={styles.modalBody}>
              {otpStep === "waiting_whatsapp" ? (
                <p className={styles.modalText}>
                  Te enviamos un mensaje de WhatsApp a{" "}
                  <strong>{principalPhone.valor ?? "tu celular"}</strong>. Toca
                  el boton <strong>Validar</strong> en ese mensaje para
                  confirmar tu numero.
                  <span className={styles.modalHint}>
                    Esperando confirmacion...
                  </span>
                </p>
              ) : (
                <p className={styles.modalText}>
                  Te enviaremos un mensaje de WhatsApp a tu celular para
                  confirmar que es tuyo.
                </p>
              )}
              {otpError ? (
                <p className={styles.modalError}>{otpError}</p>
              ) : null}
            </div>

            <footer className={styles.modalFooter}>
              <button
                type="button"
                className={styles.modalSecondaryAction}
                onClick={handleCloseVerificacionModal}
                disabled={otpStep === "sending"}
              >
                Cancelar
              </button>
              {otpStep === "waiting_whatsapp" ? (
                <button
                  type="button"
                  className={styles.modalSecondaryAction}
                  onClick={() => void handleSolicitarOtp()}
                  disabled={resendCooldown > 0}
                >
                  {resendCooldown > 0
                    ? `Reenviar en ${resendCooldown}s`
                    : "Reenviar mensaje"}
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.modalPrimaryAction}
                  onClick={() => void handleSolicitarOtp()}
                  disabled={otpStep === "sending"}
                >
                  {otpStep === "sending" ? "Enviando..." : "Enviar mensaje"}
                </button>
              )}
            </footer>
          </div>
        </div>
      ) : null}
    </main>
  );
}
