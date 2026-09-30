import type { Prisma } from "@prisma/client";
import type { SessionPayload } from "./session";
import { db } from "./db";

// ─────────────────────────────────────────────────────────────────────────────
// Activity log (audit trail). Every admin mutation writes one row, best-effort:
// logActivity never throws — a logging failure must never block a content save
// or sign-in. Rendered read-only at /admin/activity (admins only).
// ─────────────────────────────────────────────────────────────────────────────

export const activityActions = [
  "auth.login",
  "auth.login_failed",
  "auth.logout",
  "content.save",
  "content.delete",
  "content.restore",
  "content.import",
  "settings.save",
  "user.create",
  "user.update",
  "user.delete",
  "user.password",
  "media.upload",
  "media.delete",
  "media.import",
  "rss.approve",
  "rss.reject",
] as const;

export type ActivityAction = (typeof activityActions)[number];

/// Friendly labels for the action filter chips in /admin/activity.
export const activityActionLabels: Record<ActivityAction, string> = {
  "auth.login": "Sign-ins",
  "auth.login_failed": "Failed sign-ins",
  "auth.logout": "Sign-outs",
  "content.save": "Content saves",
  "content.delete": "Content deletions",
  "content.restore": "Version restores",
  "content.import": "Content imports",
  "settings.save": "Settings saves",
  "user.create": "Users created",
  "user.update": "User changes",
  "user.delete": "User deletions",
  "user.password": "Password changes",
  "media.upload": "Media uploads",
  "media.delete": "Media deletions",
  "media.import": "Media imports",
  "rss.approve": "RSS approvals",
  "rss.reject": "RSS rejections",
};

export type ActivityInput = {
  action: ActivityAction;
  summary: string;
  session?: SessionPayload | null;
  entityType?: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
};

export async function logActivity(input: ActivityInput): Promise<void> {
  try {
    await db.activityLog.create({
      data: {
        action: input.action,
        summary: input.summary.slice(0, 500),
        actorEmail: input.session?.email ?? null,
        actorName: input.session?.name ?? null,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        metadata: input.metadata ?? undefined,
      },
    });
  } catch (error) {
    console.error("[activity] failed to write log entry:", error);
  }
}
