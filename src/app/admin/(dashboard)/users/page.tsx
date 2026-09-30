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

      <table className="cms-table cms-users-table">
        <thead>
          <tr><th>Person</th><th>Access</th><th>Status</th><th>Last signed in</th><th>Account actions</th></tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const isSelf = u.id === me.id;
            const isLastActiveAdmin = u.role === "ADMIN" && u.isActive && activeAdmins <= 1;
            return (
              <tr key={u.id} className={u.isActive ? undefined : "is-inactive"}>
                <td>
                  <strong>{u.name}</strong>{isSelf ? <span className="cms-badge">you</span> : null}
                  <small>{u.email}</small>
                </td>
                <td>
                  <form action={updateUserRole} className="cms-inline-form">
                    <input type="hidden" name="userId" value={u.id} />
                    <select name="role" defaultValue={u.role} aria-label={`Access level for ${u.name}`}>
                      <option value="EDITOR">Editor</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                    <button className="cms-btn cms-btn--ghost cms-btn--small" type="submit">Save</button>
                  </form>
                  {isLastActiveAdmin ? <small className="cms-muted">Only active administrator</small> : null}
                </td>
                <td>
                  <span className={`cms-badge ${u.isActive ? "cms-badge--PUBLISHED" : "cms-badge--REJECTED"}`}>{u.isActive ? "Active" : "Deactivated"}</span>
                  <form action={toggleUserActive} className="cms-inline-form">
                    <input type="hidden" name="userId" value={u.id} />
                    <button className="cms-text-button" type="submit">{u.isActive ? "Deactivate" : "Reactivate"}</button>
                  </form>
                </td>
                <td>{u.lastLoginAt ? u.lastLoginAt.toLocaleString("en-GB") : <span className="cms-muted">never</span>}</td>
                <td>
                  <UserPasswordForm userId={u.id} name={u.name} />
                  {!isSelf && !isLastActiveAdmin ? (
                    <form action={deleteUser} className="cms-inline-form">
                      <input type="hidden" name="userId" value={u.id} />
                      <ConfirmButton className="cms-text-button cms-text-button--danger" message={`Delete ${u.name}'s account permanently? This cannot be undone.`}>Delete account</ConfirmButton>
                    </form>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
