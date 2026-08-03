import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LumaForge AI Studio",
    short_name: "LumaForge",
    description: "Professional browser photo editor",
    start_url: "/",
    display: "standalone",
    background_color: "#08090B",
    theme_color: "#08090B",
    icons: []
  };
}
