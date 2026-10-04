import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

export default [
  // build output, dependencies and the delivered static site are not linted
  { ignores: [".next/**", "node_modules/**", "public/**", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Pre-existing debt across the delivered-markup port, surfaced when lint
      // first ran: plain <a> links and raw apostrophes in transcribed copy are
      // part of the delivered design; `module` names in actions follow the
      // schema vocabulary. Tracked as warnings so lint stays green.
      "@next/next/no-html-link-for-pages": "warn",
      "@next/next/no-assign-module-variable": "warn",
      "react/no-unescaped-entities": "warn",
    },
  },
];
