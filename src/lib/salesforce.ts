// Salesforce dual-write (Contract Clause 2).
//
// Submissions are always stored locally first. A Lead is created only for the
// enquiry types confirmed in the org review. Newsletter, job, and
// customer-service forms stay in Messages until that list is confirmed.
//
// Lead mapping from the org review:
//   FirstName, LastName, Email, Phone
//   Company "KPD Website Enquiry"
//   Status "New"
//   LeadSource "Website" (the value already exists; do not send LeadSourceDetail__c)
//   Description — message plus the extra form detail
//   Property_Interest__c — Salesforce Project record id only (lookup). Never ProductInterest__c.
//   OwnerId — the website_leads queue, until each enquiry type has its own owner.
//
// The org blocks a second Lead when Email or Phone exactly matches an existing
// Lead (DUPLICATES_DETECTED, allowSave false). That response cannot be overridden.
// The new detail is appended to the existing Lead instead.
//
// Point SALESFORCE_LOGIN_URL at the UAT sandbox. Do not use the production org
// for the first test of this mapping, and do not deploy it to production first.

const API_VERSION = "v60.0";
const DESCRIPTION_LIMIT = 32_000;

/// Queue "website_leads". 00G is the Group/Queue prefix; the id is the full value.
export const WEBSITE_LEADS_QUEUE_ID = "00GWF00000Ailv7";

export const SALESFORCE_LEAD_HOLD_NOTE =
  "Stored in Messages. Newsletter, job, and customer-service forms are not sent to Salesforce yet.";

/// Recipient keys and inquiry labels that stay local until the lead list is confirmed.
const HELD_RECIPIENT_KEYS = new Set(["newsletter", "contactCareers", "contactCustomer"]);
const HELD_INQUIRY_TYPES = new Set([
  "newsletter",
  "newsletter signup",
  "job",
  "job inquiry",
  "careers",
  "customer inquiry",
  "customer service",
]);

export type LeadPayload = {
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  interest?: string | null;
  /// Salesforce Project record id for Property_Interest__c. A project name is not an id.
  propertyInterestId?: string | null;
  sourcePage?: string | null;
  inquiryType?: string | null;
};

export type SalesforceLeadRecord = {
  FirstName: string;
  LastName: string;
  Email: string;
  Phone?: string;
  Company: "KPD Website Enquiry";
  Status: "New";
  LeadSource: "Website";
  Description: string;
  OwnerId: string;
  Property_Interest__c?: string;
};

type DuplicateMatch = {
  entityType?: string;
  matchRecords?: Array<{ record?: { Id?: string; id?: string; attributes?: { url?: string } } }>;
};

function isSalesforceConfigured() {
  return Boolean(process.env.SALESFORCE_CLIENT_ID && process.env.SALESFORCE_CLIENT_SECRET && process.env.SALESFORCE_LOGIN_URL);
}

/// UAT uses the client-credentials flow. The password flow remains only when both are set.
function usesPasswordGrant() {
  return Boolean(process.env.SALESFORCE_USERNAME && process.env.SALESFORCE_PASSWORD);
}

export function normalizeInquiryLabel(value: string): string {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

/// 15- or 18-character Salesforce record id. Project names fail this check.
export function salesforceRecordId(value: unknown): string | null {
  const id = String(value ?? "").trim();
  return /^[a-zA-Z0-9]{15}(?:[a-zA-Z0-9]{3})?$/.test(id) ? id : null;
}

/// Queue ids use the 00G prefix. A queue name such as website_leads is not an id.
export function queueObjectId(value: unknown): string | null {
  const id = salesforceRecordId(value);
  return id?.startsWith("00G") ? id : null;
}

/// Lead ids use the 00Q prefix.
export function leadObjectId(value: unknown): string | null {
  const id = salesforceRecordId(value);
  return id?.startsWith("00Q") ? id : null;
}

/// Project lookup ids. Reject ids that belong to a queue, a lead, or a user.
export function projectObjectId(value: unknown): string | null {
  const id = salesforceRecordId(value);
  if (!id || id.startsWith("00G") || id.startsWith("00Q") || id.startsWith("005")) return null;
  return id;
}

/// The website_leads queue, unless SALESFORCE_LEAD_OWNER_ID names another queue.
export function websiteLeadOwnerId(raw = process.env.SALESFORCE_LEAD_OWNER_ID): string {
  const configured = raw?.trim() || WEBSITE_LEADS_QUEUE_ID;
  const id = queueObjectId(configured);
  if (!id) throw new Error(`Salesforce owner must be a queue id. website_leads is ${WEBSITE_LEADS_QUEUE_ID}.`);
  return id;
}

/// Website project label -> Project record id. Empty until UAT supplies the ids.
export function projectRecordIds(raw = process.env.SALESFORCE_PROJECT_RECORD_IDS): Record<string, string> {
  if (!raw?.trim()) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const ids: Record<string, string> = {};
    for (const [label, id] of Object.entries(parsed)) {
      const recordId = projectObjectId(id);
      const key = normalizeInquiryLabel(label);
      if (key && recordId) ids[key] = recordId;
    }
    return ids;
  } catch {
    return {};
  }
}

export function shouldMirrorSubmissionToSalesforce(input: {
  recipientKey?: string | null;
  inquiryType?: string | null;
}): boolean {
  if (HELD_RECIPIENT_KEYS.has((input.recipientKey || "").trim())) return false;
  const inquiryType = normalizeInquiryLabel(input.inquiryType || "");
  if (!inquiryType) return true;
  if (inquiryType.includes("newsletter")) return false;
  return !HELD_INQUIRY_TYPES.has(inquiryType);
}

function propertyInterestId(lead: LeadPayload): string | null {
  return (
    projectObjectId(lead.propertyInterestId) ||
    projectObjectId(lead.interest) ||
    projectRecordIds()[normalizeInquiryLabel(lead.interest || "")] ||
    null
  );
}

/// Phone, email, and last name are required before Salesforce will accept the Lead.
export function missingSalesforceLeadFields(lead: LeadPayload): string | null {
  const parts = lead.name.trim().split(/\s+/).filter(Boolean);
  const lastName = parts.slice(1).join(" ") || parts[0] || "";
  if (!lastName) return "A Salesforce Lead needs a last name.";
  if (!lead.email.trim()) return "A Salesforce Lead needs an email address.";
  if (!lead.phone?.trim()) return "A Salesforce Lead needs a phone number.";
  return null;
}

/// Description carries every extra detail that no longer has its own field.
export function buildSalesforceLeadRecord(lead: LeadPayload): SalesforceLeadRecord {
  const name = lead.name.trim();
  const parts = name.split(/\s+/).filter(Boolean);
  const first = parts[0] || name;
  const propertyId = propertyInterestId(lead);
  const blocks = [lead.message.trim()];
  const inquiryType = lead.inquiryType?.trim();
  if (inquiryType) blocks.push(`Inquiry type: ${inquiryType}`);
  const interest = lead.interest?.trim();
  if (interest && interest !== propertyId) blocks.push(`Property interest: ${interest}`);
  const sourcePage = lead.sourcePage?.trim();
  if (sourcePage) blocks.push(`Source page: ${sourcePage}`);
  const phone = (lead.phone || "").trim().slice(0, 40);
  const record: SalesforceLeadRecord = {
    FirstName: first.slice(0, 40),
    LastName: (parts.slice(1).join(" ") || first).slice(0, 80),
    Email: lead.email.trim().slice(0, 80),
    Company: "KPD Website Enquiry",
    Status: "New",
    LeadSource: "Website",
    OwnerId: websiteLeadOwnerId(),
    Description: blocks.filter(Boolean).join("\n\n").slice(0, DESCRIPTION_LIMIT),
  };
  if (phone) record.Phone = phone;
  if (propertyId) record.Property_Interest__c = propertyId;
  return record;
}

/// Keep the newest enquiry when the existing description is already long.
export function mergeLeadDescription(existing: string | null | undefined, incoming: string): string {
  const previous = (existing || "").trim();
  const next = incoming.trim();
  if (!next) return previous.slice(0, DESCRIPTION_LIMIT);
  if (!previous || previous.includes(next)) return (previous || next).slice(0, DESCRIPTION_LIMIT);
  const separator = "\n\n---\n\n";
  const room = DESCRIPTION_LIMIT - next.length - separator.length;
  if (room <= 0) return next.slice(0, DESCRIPTION_LIMIT);
  return `${previous.slice(0, room)}${separator}${next}`;
}

export function soqlLiteral(value: string): string {
  return value.replace(/[\0\r\n]/g, "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function leadIdFromRecord(record: { Id?: string; id?: string; attributes?: { url?: string } } | undefined): string | null {
  const direct = leadObjectId(record?.Id) || leadObjectId(record?.id);
  if (direct) return direct;
  const url = record?.attributes?.url || "";
  const match = url.match(/\/Lead\/([a-zA-Z0-9]{15}(?:[a-zA-Z0-9]{3})?)(?:$|\?)/);
  return match ? leadObjectId(match[1]) : null;
}

/// Id of the Lead named by a blocking duplicate-rule response. Other objects are ignored.
export function leadIdFromDuplicateResponse(body: string): string | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return null;
  }
  const errors = Array.isArray(parsed) ? parsed : [parsed];
  for (const error of errors) {
    if (!error || typeof error !== "object") continue;
    const duplicate = error as { errorCode?: string; duplicateResult?: { matchResults?: DuplicateMatch[] } };
    if (duplicate.errorCode !== "DUPLICATES_DETECTED") continue;
    for (const result of duplicate.duplicateResult?.matchResults || []) {
      if (result.entityType && result.entityType !== "Lead") continue;
      for (const match of result.matchRecords || []) {
        const id = leadIdFromRecord(match.record);
        if (id) return id;
      }
    }
  }
  return null;
}

export function isDuplicateLeadBlock(body: string): boolean {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return false;
  }
  const errors = Array.isArray(parsed) ? parsed : [parsed];
  return errors.some((error) => Boolean(error && typeof error === "object" && (error as { errorCode?: string }).errorCode === "DUPLICATES_DETECTED"));
}

let instanceUrl: string | null = null;

async function getAccessToken(): Promise<string> {
  const params = usesPasswordGrant()
    ? new URLSearchParams({
        grant_type: "password",
        client_id: process.env.SALESFORCE_CLIENT_ID!,
        client_secret: process.env.SALESFORCE_CLIENT_SECRET!,
        username: process.env.SALESFORCE_USERNAME!,
        password: process.env.SALESFORCE_PASSWORD! + (process.env.SALESFORCE_SECURITY_TOKEN ?? ""),
      })
    : new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.SALESFORCE_CLIENT_ID!,
        client_secret: process.env.SALESFORCE_CLIENT_SECRET!,
      });
  const res = await fetch(`${process.env.SALESFORCE_LOGIN_URL}/services/oauth2/token`, {
    method: "POST",
    body: params,
    // Bound the handshake so a slow Salesforce cannot pin the enquiry buttons.
    signal: AbortSignal.timeout(5_000),
  });
  if (!res.ok) throw new Error(`Salesforce auth failed (${res.status})`);
  const data = (await res.json()) as { access_token: string; instance_url: string };
  if (!data.instance_url) throw new Error("Salesforce auth did not return an instance URL.");
  instanceUrl = data.instance_url.replace(/\/$/, "");
  return data.access_token;
}

async function salesforceFetch(path: string, token: string, init?: { method?: string; body?: unknown }) {
  if (!instanceUrl) throw new Error("Salesforce auth did not return an instance URL.");
  return fetch(`${instanceUrl}${path}`, {
    method: init?.method || "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(6_000),
  });
}

async function queryExactLeadId(token: string, where: string): Promise<string | null> {
  const soql = `SELECT Id FROM Lead WHERE ${where} ORDER BY CreatedDate ASC LIMIT 1`;
  const res = await salesforceFetch(`/services/data/${API_VERSION}/query?q=${encodeURIComponent(soql)}`, token);
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Salesforce lead lookup failed (${res.status}): ${detail.slice(0, 300)}`);
  }
  const data = (await res.json()) as { records?: Array<{ Id?: string }> };
  return leadObjectId(data.records?.[0]?.Id);
}

/// Exact Email match, then exact Phone match. The duplicate rule uses the same comparison.
async function findExactLeadId(token: string, email: string, phone?: string | null): Promise<string | null> {
  const byEmail = email.trim() ? await queryExactLeadId(token, `Email = '${soqlLiteral(email.trim())}'`) : null;
  if (byEmail) return byEmail;
  const trimmedPhone = phone?.trim();
  if (!trimmedPhone) return null;
  return queryExactLeadId(token, `Phone = '${soqlLiteral(trimmedPhone)}'`);
}

async function addEnquiryToExistingLead(token: string, id: string, description: string) {
  const current = await salesforceFetch(`/services/data/${API_VERSION}/sobjects/Lead/${id}?fields=Description`, token);
  if (!current.ok) {
    const detail = await current.text();
    throw new Error(`Salesforce blocked a second lead (${id}), but the existing lead could not be read (${current.status}): ${detail.slice(0, 200)}`);
  }
  const data = (await current.json()) as { Description?: string | null };
  const merged = mergeLeadDescription(data.Description, description);
  if (merged === (data.Description || "").trim()) return;
  const patched = await salesforceFetch(`/services/data/${API_VERSION}/sobjects/Lead/${id}`, token, {
    method: "PATCH",
    body: { Description: merged },
  });
  if (!patched.ok) {
    const detail = await patched.text();
    throw new Error(`Salesforce blocked a second lead (${id}), but the new enquiry could not be added (${patched.status}): ${detail.slice(0, 200)}`);
  }
}

/// Push a lead to Salesforce. Returns the Salesforce Lead id (new, or the existing exact match).
/// Throws when credentials are missing or the call fails — callers record the failure.
export async function pushLeadToSalesforce(lead: LeadPayload): Promise<string> {
  const missing = missingSalesforceLeadFields(lead);
  if (missing) throw new Error(missing);
  if (!isSalesforceConfigured()) {
    throw new Error("Salesforce credentials not configured yet (client to provide).");
  }
  const token = await getAccessToken();
  const record = buildSalesforceLeadRecord(lead);
  const created = await salesforceFetch(`/services/data/${API_VERSION}/sobjects/Lead`, token, {
    method: "POST",
    body: record,
  });
  if (created.ok) {
    const data = (await created.json()) as { id?: string };
    if (!data.id) throw new Error("Salesforce lead create did not return an id.");
    return data.id;
  }
  const body = await created.text();
  if (!isDuplicateLeadBlock(body)) {
    throw new Error(`Salesforce lead create failed (${created.status}): ${body.slice(0, 300)}`);
  }
  const matchedId = leadIdFromDuplicateResponse(body) || (await findExactLeadId(token, lead.email, lead.phone));
  if (!matchedId) {
    throw new Error(`Salesforce blocked this lead because the email or phone matches an existing lead, and that lead could not be opened. ${body.slice(0, 300)}`);
  }
  await addEnquiryToExistingLead(token, matchedId, record.Description);
  return matchedId;
}
