import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./phase-two.css";
import "./tone-curve.css";
import "./versions.css";
import "./color-mixer.css";
import "./presets.css";
import "./export-center.css";
import "./import-tools.css";
import "./interaction-fixes.css";
import "./pro-studio.css";
import "./studio-upgrade.css";
import { Providers } from "@/components/providers";


export const metadata: Metadata = {
  title: "LumaForge AI Studio",
  description: "Professional browser photo editing with transparent AI-assisted workflows.",
  applicationName: "LumaForge AI Studio",
  generator: "LumaForge AI Studio",
};

export const viewport: Viewport = {
  themeColor: "#08090B",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
