import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ownershipCostPlannerDefaults, plannerValue } from "@/lib/ownership-cost-planner";

/// Public configuration for the legacy Ownership Cost Planner. It deliberately
/// contains no customer data and lets the legacy pages reflect CMS edits.
export async function GET() {
  try {
    const setting = await db.siteSetting.findUnique({ where: { key: "ownership_cost_planner" } });
    return NextResponse.json(plannerValue(setting?.value));
  } catch (error) {
    console.error("[api/calculator/kpd] database error:", error);
    return NextResponse.json(ownershipCostPlannerDefaults);
  }
}
