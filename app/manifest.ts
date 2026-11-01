import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} — Portfolio`,
    short_name: "Ehsan",
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0B0B0A",
    theme_color: "#0B0B0A",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon", type: "image/png", sizes: "180x180" },
    ],
  };
}
