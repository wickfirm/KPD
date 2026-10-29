"use server";

import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import { revalidatePublicContent } from "@/lib/revalidate";
import { sxsDefaults } from "@/lib/sxs-defaults";
import { applySxsMediaMap, sxsPreviewKey, sxsSettingKey, type SxsContent } from "@/lib/sxs-content";
import { recordVersion, snapshotFormData } from "@/lib/versions";
import { revalidatePath } from "next/cache";

export type SxsFormState = { error?: string };

function text(formData: FormData, name: string, fallback = "") {
  const value = String(formData.get(name) ?? "").trim();
  return value || fallback;
}

function json<T>(formData: FormData, name: string, fallback: T): T {
  try {
    const parsed = JSON.parse(String(formData.get(name) || ""));
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function legendRows(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const record = row as Record<string, unknown>;
    return [[String(record.number ?? ""), String(record.name ?? ""), String(record.size ?? "")]];
  });
}

function planFrom(value: unknown, fallback: Record<string, unknown>) {
  const row = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    ...fallback,
    image: String(row.image || fallback.image || ""),
    alt: String(row.alt || fallback.alt || ""),
    title: String(row.title || fallback.title || ""),
    unit: String(row.unit || fallback.unit || ""),
    totalSqft: String(row.totalSqft || fallback.totalSqft || ""),
    totalSqm: String(row.totalSqm || fallback.totalSqm || ""),
    suiteSqft: String(row.suiteSqft || fallback.suiteSqft || ""),
    suiteSqm: String(row.suiteSqm || fallback.suiteSqm || ""),
    balconySqft: String(row.balconySqft || fallback.balconySqft || ""),
    balconySqm: String(row.balconySqm || fallback.balconySqm || ""),
    legend: legendRows(row.legend).length ? legendRows(row.legend) : fallback.legend,
  };
}

export function sxsContentFromForm(formData: FormData): SxsContent {
  const plans = json<Record<string, unknown>>(formData, "plansJson", sxsDefaults.floorplans.plans as Record<string, unknown>);
  const fallbackPlans = sxsDefaults.floorplans.plans as Record<string, Record<string, unknown>>;
  const content: SxsContent = {
    ...sxsDefaults,
    seo: { title: text(formData, "seoTitle", String(sxsDefaults.seo.title)), description: text(formData, "seoDescription", String(sxsDefaults.seo.description)) },
    navigation: { items: json(formData, "navigationJson", sxsDefaults.navigation.items) },
    hero: {
      eyebrow: text(formData, "heroEyebrow"),
      headline: text(formData, "heroHeadline"),
      body: text(formData, "heroBody"),
      media: text(formData, "heroMedia"),
      gallery: json(formData, "heroGalleryJson", sxsDefaults.hero.gallery),
    },
    about: { headline: text(formData, "aboutHeadline"), body: text(formData, "aboutBody"), media: text(formData, "aboutMedia") },
    manifesto: { body: text(formData, "manifestoBody") },
    apartments: {
      headline: text(formData, "apartmentsHeadline"),
      body: text(formData, "apartmentsBody"),
      imageOne: text(formData, "apartmentOne"),
      imageTwo: text(formData, "apartmentTwo"),
      imageTen: text(formData, "apartmentTen"),
      gallery: json(formData, "apartmentGalleryJson", sxsDefaults.apartments.gallery),
    },
    gallery: {
      headline: text(formData, "galleryHeadline"),
      note: text(formData, "galleryNote"),
      gallery: json(formData, "exteriorGalleryJson", sxsDefaults.gallery.gallery),
    },
    exterior: { headline: text(formData, "exteriorHeadline"), body: text(formData, "exteriorBody"), media: text(formData, "exteriorMedia") },
    amenities: { headline: text(formData, "amenitiesHeadline"), items: json(formData, "amenityJson", sxsDefaults.amenities.items) },
    community: { headline: text(formData, "communityHeadline"), body: text(formData, "communityBody"), slides: json(formData, "communityJson", sxsDefaults.community.slides) },
    location: { headline: text(formData, "locationHeadline"), body: text(formData, "locationBody"), places: json(formData, "placesJson", sxsDefaults.location.places) },
    floorplans: {
      headline: text(formData, "floorHeadline"),
      tabOne: text(formData, "tabOne"),
      tabTwo: text(formData, "tabTwo"),
      tabThree: text(formData, "tabThree"),
      plans: {
        one: planFrom(plans.one, fallbackPlans.one),
        two: planFrom(plans.two, fallbackPlans.two),
        three: planFrom(plans.three, fallbackPlans.three),
      },
    },
    payment: {
      headline: text(formData, "paymentHeadline"),
      body: text(formData, "paymentBody"),
      milestones: json(formData, "milestonesJson", sxsDefaults.payment.milestones),
    },
    register: {
      headline: text(formData, "registerHeadline"),
      body: text(formData, "registerBody"),
      consent: text(formData, "consent"),
      interestOptions: String(formData.get("interestOptions") || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
    },
    footer: { body: text(formData, "footerBody"), copyright: text(formData, "footerCopyright") },
    cta: { primary: text(formData, "ctaPrimary"), secondary: text(formData, "ctaSecondary"), submit: text(formData, "ctaSubmit") },
    brand: {
      logoWhite: text(formData, "logoWhite"),
      logoBlack: text(formData, "logoBlack"),
      markWhite: text(formData, "markWhite"),
      markBlack: text(formData, "markBlack"),
      intro: text(formData, "introImage"),
      map: text(formData, "mapImage"),
    },
    privacy: sxsDefaults.privacy,
  };
  return applySxsMediaMap(content);
}

async function writeSxs(content: SxsContent) {
  await db.siteSetting.upsert({
    where: { key: sxsSettingKey },
    create: { key: sxsSettingKey, value: content as never },
    update: { value: content as never },
  });
  revalidatePath("/seven-x-seven");
  revalidatePath("/admin/seven-x-seven");
  revalidatePublicContent();
}

export async function applySxsSettings(formData: FormData) {
  await writeSxs(sxsContentFromForm(formData));
  return { id: "sxs" };
}

export async function saveSxsPage(_prev: SxsFormState, formData: FormData): Promise<SxsFormState> {
  const { session } = await requirePermission("content.editLive");
  await applySxsSettings(formData);
  await recordVersion({
    entityType: "SXS_PAGE",
    entityId: "sxs",
    path: "/admin/seven-x-seven",
    label: "seven x seven",
    snapshot: snapshotFormData(formData),
    authorEmail: session.email,
  });
  await logActivity({ action: "content.save", session, entityType: "SXS_PAGE", entityId: "sxs", summary: "Saved the seven x seven residence page" });
  redirect("/admin/seven-x-seven?saved=1");
}

export async function previewSxsDraft(formData: FormData) {
  await requirePermission("content.editLive");
  const content = sxsContentFromForm(formData);
  await db.siteSetting.upsert({
    where: { key: sxsPreviewKey },
    create: { key: sxsPreviewKey, value: { content, savedAt: Date.now() } as never },
    update: { value: { content, savedAt: Date.now() } as never },
  });
  return { ok: true as const };
}


