// Salesforce dual-write integration (Contract Clause 2).
// Submissions are always persisted locally first (ContactSubmission), then
// mirrored to Salesforce as a Lead via the REST API (OAuth2 client-credentials
// / username-password flow). Failures are recorded so the sync can be retried.

type LeadPayload = {
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  interest?: string | null;
  sourcePage?: string | null;
};

function isSalesforceConfigured() {
  return Boolean(
    process.env.SALESFORCE_CLIENT_ID &&
      process.env.SALESFORCE_CLIENT_SECRET &&
      process.env.SALESFORCE_USERNAME &&
      process.env.SALESFORCE_PASSWORD
  );
}

async function getAccessToken(): Promise<string> {
  const params = new URLSearchParams({
    grant_type: "password",
    client_id: process.env.SALESFORCE_CLIENT_ID!,
    client_secret: process.env.SALESFORCE_CLIENT_SECRET!,
    username: process.env.SALESFORCE_USERNAME!,
    password:
      process.env.SALESFORCE_PASSWORD! + (process.env.SALESFORCE_SECURITY_TOKEN ?? ""),
  });
  const res = await fetch(`${process.env.SALESFORCE_LOGIN_URL}/services/oauth2/token`, {
    method: "POST",
    body: params,
  });
  if (!res.ok) throw new Error(`Salesforce auth failed (${res.status})`);
  const data = (await res.json()) as { access_token: string; instance_url: string };
  // Stash instance_url for the create call via a module-level cache.
  instanceUrl = data.instance_url;
  return data.access_token;
}

let instanceUrl: string | null = null;

/// Push a lead to Salesforce. Returns the Salesforce record id.
/// Throws when credentials are missing/invalid — callers record the failure.
export async function pushLeadToSalesforce(lead: LeadPayload): Promise<string> {
  if (!isSalesforceConfigured()) {
    throw new Error("Salesforce credentials not configured yet (client to provide).");
  }
  const token = await getAccessToken();
  const [firstName, ...rest] = lead.name.trim().split(/\s+/);
  const res = await fetch(`${instanceUrl}/services/data/v60.0/sobjects/Lead`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      FirstName: firstName || lead.name,
      LastName: rest.join(" ") || lead.name,
      Email: lead.email,
      Phone: lead.phone || undefined,
      Company: "KPD Website Enquiry",
      Description: lead.message,
      LeadSource: "Website",
      ...(lead.interest ? { ProductInterest__c: lead.interest } : {}),
      ...(lead.sourcePage ? { LeadSourceDetail__c: lead.sourcePage } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Salesforce lead create failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as { id: string };
  return data.id;
}
