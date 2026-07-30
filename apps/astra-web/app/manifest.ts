import type { MetadataRoute } from "next";
import { ui } from "../lib/i18n";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: ui.metadata.title,
    short_name: ui.shell.brand,
    description: ui.metadata.description,
    start_url: "/journey",
    scope: "/",
    display: "standalone",
    background_color: "#fbfaf7",
    theme_color: "#fbfaf7",
    icons: [
      {
        src: "/icons/astra-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/astra-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/astra-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}
