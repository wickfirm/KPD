import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { SavedBanner } from "@/components/admin/flash";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { updateUserRole, toggleUserActive, deleteUser } from "./user-actions";
import { UserCreateForm, UserPasswordForm } from "./users-client";

export const dynamic = "force-dynamic";

function first(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

/// Team management — ADMIN only. Shows every account with its access level,
/// and the safe actions around it (role, active, password, delete).
export default async function UsersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ user: me }, params] = await Promise.all([requireRole(["ADMIN"]), searchParams]);
  const users = await db.user.findMany({ orderBy: [{ isActive: "desc" }, { createdAt: "asc" }] });
  const activeAdmins = users.filter((u) => u.role === "ADMIN" && u.isActive).length;

  const flash: string[] = [];
  const created = first(params, "created");
  const pw = first(params, "pw");
  const deleted = first(params, "deleted");
  const msg = first(params, "msg");
  if (created) flash.push(`Account created for ${created}. Share the temporary password in person — they can change it under My profile.`);
  if (pw) flash.push(`New password saved for ${pw}. Send it to them securely.`);
  if (deleted) flash.push(`${deleted}'s account was removed.`);
  if (msg) flash.push(msg);

  return (
    <>
      <div className="cms-page-heading">
        <div>
          <span className="cms-eyebrow">Administration</span>
          <h1>Team</h1>
          <p>Who can sign in to the CMS, and what they can do there. Editors write and publish content; administrators also manage settings, the team, and the activity log.</p>
        </div>
      </div>
      <SavedBanner params={params} />
      {flash.map((text) => <p className="cms-ok" role="status" key={text}>{text}</p>)}

      <div className="cms-card">
        <span className="cms-eyebrow">New account</span>
        <h2>Add a team member</h2>
        <p className="cms-muted">Create the account, then hand over the temporary password personally. They pick a new one after signing in.</p>
        <UserCreateForm />
      </div>

      <div className="cms-section-heading">
        <div><span className="cms-eyebrow">{users.length} account{users.length === 1 ? "" : "s"}</span><h2>Current team</h2></div>
      </div>

      <div className="cms-user-list">
        {users.map((u) => {
          const isSelf = u.id === me.id;
          const isLastActiveAdmin = u.role === "ADMIN" && u.isActive && activeAdmins <= 1;
          const initials = u.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";
          return (
            <article key={u.id} className={`cms-user-card${u.isActive ? "" : " is-inactive"}`}>
              <header className="cms-user-card__head">
                <span className="cms-avatar" aria-hidden="true">{initials}</span>
                <div className="cms-user-card__who">
                  <strong>{u.name}{isSelf ? <span className="cms-badge">you</span> : null}</strong>
                  <small>{u.email}</small>
                </div>
                <span className={`cms-badge ${u.isActive ? "cms-badge--PUBLISHED" : "cms-badge--REJECTED"}`}>{u.isActive ? "Active" : "Deactivated"}</span>
              </header>
              <div className="cms-user-card__grid">
                <div>
                  <span className="cms-user-card__label">Access level</span>
                  <form action={updateUserRole} className="cms-inline-form">
                    <input type="hidden" name="userId" value={u.id} />
                    <select name="role" defaultValue={u.role} aria-label={`Access level for ${u.name}`}>
                      <option value="EDITOR">Editor</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                    <button className="cms-btn cms-btn--ghost cms-btn--small" type="submit">Save</button>
                  </form>
                  {isLastActiveAdmin ? <small className="cms-muted">Only active administrator</small> : null}
                </div>
                <div>
                  <span className="cms-user-card__label">Last signed in</span>
                  <span>{u.lastLoginAt ? u.lastLoginAt.toLocaleString("en-GB") : <span className="cms-muted">never</span>}</span>
                </div>
                <div>
                  <span className="cms-user-card__label">Password</span>
                  <UserPasswordForm userId={u.id} name={u.name} />
                </div>
              </div>
              <footer className="cms-user-card__foot">
                <form action={toggleUserActive} className="cms-inline-form">
                  <input type="hidden" name="userId" value={u.id} />
                  <button className="cms-btn cms-btn--ghost cms-btn--small" type="submit">{u.isActive ? "Deactivate" : "Reactivate"}</button>
                </form>
                {!isSelf && !isLastActiveAdmin ? (
                  <form action={deleteUser} className="cms-inline-form">
                    <input type="hidden" name="userId" value={u.id} />
                    <ConfirmButton className="cms-text-button cms-text-button--danger" message={`Delete ${u.name}'s account permanently? This cannot be undone.`}>Delete account</ConfirmButton>
                  </form>
                ) : null}
              </footer>
            </article>
          );
        })}
      </div>
    </>
  );
}
