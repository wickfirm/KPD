import { db } from "@/lib/db";
import { ownershipCostPlannerDefaults, plannerValue } from "@/lib/ownership-cost-planner";
import CalculatorForm from "./calculator-form";

export const dynamic = "force-dynamic";

export default async function CalculatorPage() {
  const setting = await db.siteSetting.findUnique({ where: { key: "ownership_cost_planner" } });
  return <CalculatorForm settings={setting ? plannerValue(setting.value) : ownershipCostPlannerDefaults} />;
}
