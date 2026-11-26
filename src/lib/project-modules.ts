import { Prisma } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// The columns of a development section that every language shares.
//
// Queries name these on purpose instead of taking every column of the row:
// the column `translations` exists only once the database has had
// prisma/add-translations.sql, and an English page must render exactly as
// before whether or not it has. A translation reads that column separately,
// and only on an Arabic or Japanese page (src/lib/translations/store.ts).
// ─────────────────────────────────────────────────────────────────────────────

export const sharedModuleFields = {
  id: true,
  projectId: true,
  slug: true,
  title: true,
  kind: true,
  profile: true,
  content: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProjectModuleSelect;
