// Tailwind v4 processes the admin stylesheet (src/app/admin/admin.css).
// The empty-file workaround from the pre-Tailwind era is no longer needed —
// v4 is CSS-first configured and cannot pick up a foreign parent config.
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
