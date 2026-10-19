import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bitácora de viaje",
    short_name: "Bitácora",
    start_url: "/",
    display: "standalone",
    background_color: "#f3eee4",
    theme_color: "#f3eee4",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
