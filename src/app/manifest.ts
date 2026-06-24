import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SocioSA - Portal de Clientes",
    short_name: "SocioSA",
    description: "Portal de clientes de Farmacias Sánchez Antoniolli",
    start_url: "/socios",
    display: "standalone",
    background_color: "#f2f5f6",
    theme_color: "#007c98",
    icons: [
      {
        src: "/icono-estrella.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
