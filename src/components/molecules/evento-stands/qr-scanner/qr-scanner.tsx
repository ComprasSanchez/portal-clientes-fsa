"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { X } from "lucide-react";
import { toneClass, type UiTone } from "@/types/ui-tone";
import styles from "./qr-scanner.module.scss";

type QrScannerProps = {
  /** Texto leído del QR. Mientras `paused` sea true no se vuelve a llamar. */
  onDetect: (texto: string) => void;
  onClose: () => void;
  paused?: boolean;
  tone?: UiTone;
};

type Estado = "iniciando" | "escaneando" | "sin-permiso" | "sin-camara";

const MS_ENTRE_LECTURAS = 200;

/** Cámara trasera a pantalla completa que lee QR (funciona también en iPhone). */
export default function QrScanner({ onDetect, onClose, paused = false, tone = "socios" }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const onDetectRef = useRef(onDetect);
  const [estado, setEstado] = useState<Estado>("iniciando");

  useEffect(() => {
    pausedRef.current = paused;
    onDetectRef.current = onDetect;
  }, [paused, onDetect]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let frame = 0;
    let ultimaLectura = 0;
    let activo = true;

    const leer = (ahora: number) => {
      if (!activo) return;
      frame = requestAnimationFrame(leer);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (
        pausedRef.current ||
        !video ||
        !canvas ||
        video.readyState < video.HAVE_ENOUGH_DATA ||
        ahora - ultimaLectura < MS_ENTRE_LECTURAS
      ) {
        return;
      }
      ultimaLectura = ahora;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imagen = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const qr = jsQR(imagen.data, imagen.width, imagen.height, {
        inversionAttempts: "dontInvert",
      });
      if (qr?.data) onDetectRef.current(qr.data);
    };

    const iniciar = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setEstado("sin-camara");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (!activo || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setEstado("escaneando");
        frame = requestAnimationFrame(leer);
      } catch (error) {
        const nombre = error instanceof DOMException ? error.name : "";
        setEstado(nombre === "NotAllowedError" ? "sin-permiso" : "sin-camara");
      }
    };

    void iniciar();

    return () => {
      activo = false;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className={`${styles.overlay} ${toneClass(tone)}`} role="dialog" aria-modal aria-label="Escanear QR">
      <video ref={videoRef} className={styles.video} playsInline muted />
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden />

      <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar">
        <X size={26} />
      </button>

      {estado === "escaneando" && (
        <>
          <div className={styles.frame} aria-hidden />
          <p className={styles.hint}>Apuntá al QR del stand</p>
        </>
      )}
      {estado === "iniciando" && <p className={styles.hint}>Abriendo la cámara…</p>}
      {(estado === "sin-permiso" || estado === "sin-camara") && (
        <div className={styles.message}>
          <p>
            {estado === "sin-permiso"
              ? "Necesitamos permiso para usar la cámara. Habilitalo en la configuración del navegador y volvé a intentar."
              : "No pudimos abrir la cámara."}
          </p>
          <p>También podés escanear el QR con la cámara de tu celular.</p>
        </div>
      )}
    </div>
  );
}
