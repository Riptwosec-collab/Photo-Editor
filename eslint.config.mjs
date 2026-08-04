import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/components/editor/filmstrip.tsx"],
    rules: {
      // Filmstrip metadata hydrates from browser-local storage after mount.
      "react-hooks/set-state-in-effect": "off",
      // Object URLs created from IndexedDB Blobs cannot use Next Image optimization.
      "@next/next/no-img-element": "off",
    },
  },
  {
    files: ["src/components/editor/reference-workflows.tsx"],
    rules: {
      // User-selected local object URLs must remain local and are not Next Image resources.
      "@next/next/no-img-element": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "coverage/**"]),
]);
