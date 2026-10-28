import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ownershipCostPlannerDefaults, plannerValue } from "@/lib/ownership-cost-planner";

/// Public configuration for the legacy Ownership Cost Planner. It deliberately
/// contains no customer data and lets the legacy pages reflect CMS edits.
export async function GET() {
  try {
    const [setting, published] = await Promise.all([
      db.siteSetting.findUnique({ where: { key: "ownership_cost_planner" } }),
      db.project.findMany({ where: { status: "PUBLISHED", profile: "FULL" }, select: { slug: true, name: true } }),
    ]);
    const planner = plannerValue(setting?.value);
    const names = new Map(published.map((project) => [project.slug, project.name]));
    return NextResponse.json({ ...planner, projects: planner.projects.filter((project) => names.has(project.slug)).map((project) => ({ ...project, name: names.get(project.slug) ?? project.name })) });
  } catch (error) {
    console.error("[api/calculator/kpd] database error:", error);
    return NextResponse.json(ownershipCostPlannerDefaults);
  }
}
