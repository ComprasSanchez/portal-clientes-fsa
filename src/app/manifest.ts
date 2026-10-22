import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/socios",
    name: "SocioSA - Portal de Clientes",
    short_name: "SocioSA",
    description: "Portal de clientes de Farmacias Sánchez Antoniolli",
    lang: "es-AR",
    start_url: "/socios",
    scope: "/",
    display: "standalone",
    background_color: "#f2f5f6",
    theme_color: "#007c98",
    // Generados desde public/icono-estrella.png. Chrome (Android) necesita 192 y 512
    // con tamaño declarado para ofrecer la instalación.
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
