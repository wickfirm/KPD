import { requireUser } from "@/lib/auth";
import { ProfileNameForm, PasswordForm } from "./profile-client";

export const dynamic = "force-dynamic";

/// Every signed-in user manages their own name and password here.
export default async function ProfilePage() {
  const { user } = await requireUser();
  return (
    <>
      <div className="cms-page-heading">
        <div>
          <span className="cms-eyebrow">Your account</span>
          <h1>My profile</h1>
          <p>Your name, password and sign-in details. Nothing here affects the public website.</p>
        </div>
      </div>

      <div className="cms-card">
        <span className="cms-eyebrow">Account details</span>
        <h2>Signed in as</h2>
        <dl className="cms-detail-list">
          <div><dt>Email (sign-in name)</dt><dd>{user.email}</dd></div>
          <div><dt>Access level</dt><dd>{user.role === "ADMIN" ? "Administrator — full control of the CMS" : "Editor — content, media and messages"}</dd></div>
          <div><dt>Last signed in</dt><dd>{user.lastLoginAt ? user.lastLoginAt.toLocaleString("en-GB") : "This is your first sign-in"}</dd></div>
          <div><dt>Password last changed</dt><dd>{user.passwordChangedAt ? user.passwordChangedAt.toLocaleDateString("en-GB") : "Never (still the original password)"}</dd></div>
        </dl>
      </div>

      <div className="cms-card">
        <span className="cms-eyebrow">Profile</span>
        <h2>Your name</h2>
        <ProfileNameForm name={user.name} />
      </div>

      <div className="cms-card">
        <span className="cms-eyebrow">Security</span>
        <h2>Change password</h2>
        <p className="cms-muted">Choose something long and memorable. You will stay signed in on this device.</p>
        <PasswordForm />
      </div>
    </>
  );
}
