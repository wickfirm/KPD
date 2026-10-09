import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ownershipCostPlannerDefaults, plannerValue } from "@/lib/ownership-cost-planner";
import CalculatorForm from "./calculator-form";
import VersionHistory from "@/components/admin/version-history";
import { SavedBanner } from "@/components/admin/flash";
import { EditorShell } from "@/components/admin/editor-shell";

export const dynamic = "force-dynamic";

export default async function CalculatorPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser();
  const [setting, flash] = await Promise.all([
    db.siteSetting.findUnique({ where: { key: "ownership_cost_planner" } }),
    searchParams,
  ]);
  return <>
    <SavedBanner params={flash} />
    <EditorShell>
      <CalculatorForm settings={setting ? plannerValue(setting.value) : ownershipCostPlannerDefaults} />
      <VersionHistory entityType="CALCULATOR" entityId="ownership_cost_planner" entityLabel="calculator settings" />
    </EditorShell>
  </>;
}
