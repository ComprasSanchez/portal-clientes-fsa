"use client";

import { useEffect, useState } from "react";

/** true cuando las imágenes ya están descargadas (o pasó `esperaMaxMs`, para no trabar la pantalla). */
export function usePrecargaImagenes(urls: readonly string[], esperaMaxMs = 4000): boolean {
  const [listo, setListo] = useState(false);

  useEffect(() => {
    let activo = true;
    const terminar = () => {
      if (activo) setListo(true);
    };
    const espera = window.setTimeout(terminar, esperaMaxMs);
    const cargas = urls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = img.onerror = () => resolve();
          img.src = url;
        }),
    );
    void Promise.all(cargas).then(terminar);
    return () => {
      activo = false;
      window.clearTimeout(espera);
    };
  }, [urls, esperaMaxMs]);

  return listo;
}
