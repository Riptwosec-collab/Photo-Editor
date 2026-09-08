import type { NextConfig } from "next";
import publicDeployment from "./src/lib/cloud/public-deployment.json";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Public connection identifiers only. Secret/provider keys must remain server environment variables.
  // Explicit environment values (including an empty value) override this project's Vercel defaults.
  env: process.env.VERCEL === "1" ? {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? publicDeployment.url,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? publicDeployment.publishableKey,
  } : {},
  // Playwright reaches the development server through this loopback host.
  allowedDevOrigins: ["127.0.0.1"],
  experimental: { optimizePackageImports: ["lucide-react"] },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" }
      ]
    }
  ]
};

export default nextConfig;
