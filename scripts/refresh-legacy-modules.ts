// One-shot content refresh: reconciles each delivered development's CMS
// modules against the full-fidelity blueprints in
// src/lib/legacy-project-templates.ts (which now mirror the delivered HTML
// 1:1). Updates existing modules, creates missing ones, and removes anything
// not in the blueprint (e.g. the stray abbreviated "Arrival & Interiors"
// gallery). Run against the DIRECT connection:
//
//   DATABASE_URL="<direct url>" npx tsx scripts/refresh-legacy-modules.ts
//
import { PrismaClient } from "@prisma/client";
import { legacyProjectTemplates } from "../src/lib/legacy-project-templates";

const db = new PrismaClient();

async function main() {
  for (const [slug, template] of Object.entries(legacyProjectTemplates)) {
    const project = await db.project.findUnique({ where: { slug }, include: { modules: true } });
    if (!project) {
      console.error(`✖ ${slug}: project not found — run db:seed first.`);
      continue;
    }

    // The project row carries the line-broken overview heading and copy.
    await db.project.update({ where: { id: project.id }, data: { tagline: template.tagline, description: template.description } });

    const blueprintSlugs = new Set(template.modules.map((module) => module.slug));
    let updated = 0;
    let created = 0;
    let removed = 0;

    for (const module of template.modules) {
      const existing = project.modules.find((row) => row.slug === module.slug);
      const data = { title: module.title, kind: module.kind, content: module.content as never, sortOrder: module.sortOrder };
      if (existing) {
        await db.projectModule.update({ where: { id: existing.id }, data });
        updated += 1;
      } else {
        await db.projectModule.create({ data: { ...data, slug: module.slug, projectId: project.id } });
        created += 1;
      }
    }

    for (const module of project.modules) {
      if (!blueprintSlugs.has(module.slug)) {
        await db.contentVersion.deleteMany({ where: { entityType: "PROJECT_MODULE", entityId: module.id } });
        await db.projectModule.delete({ where: { id: module.id } });
        removed += 1;
        console.log(`  − removed "${module.title}" (${module.slug}) — not part of the delivered page`);
      }
    }

    console.log(`✔ ${slug}: ${updated} updated, ${created} created, ${removed} removed`);
  }

  console.log("Refresh complete. Public pages re-render within 5 minutes (ISR), or immediately after any admin save.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
