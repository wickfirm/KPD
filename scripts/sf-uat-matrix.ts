// UAT test matrix for the Salesforce dual-write — client request, Nov 2026:
// "Please share the UAT results for each approved form, including repeat
// submissions and duplicate handling, so we can review the resulting records
// and ownership."
//
// Creates clearly-marked test Leads in the UAT sandbox (every message starts
// with "[UAT matrix]", every email is @example.com). Never point this at the
// production org. Run:
//
//   npx tsx scripts/sf-uat-matrix.ts
//
// The client-credentials flow is forced (SALESFORCE_USERNAME/_PASSWORD/
// _SECURITY_TOKEN are stripped from the loaded .env.local) because that is the
// flow verified end-to-end and the flow the Vercel deployment will mirror.
// Payloads mirror what /api/contact sends for each form: the route calls
// pushLeadToSalesforce with message = leadDescription(message, details).

import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  buildSalesforceLeadRecord,
  pushLeadToSalesforce,
  websiteLeadOwnerId,
  WEBSITE_LEADS_QUEUE_ID,
  type LeadPayload,
} from "../src/lib/salesforce";
import { leadDescription } from "../src/lib/submissions";

type SubmissionDetail = { label: string; value: string };

type Scenario = {
  form: string;
  note: string;
  payload: Omit<LeadPayload, "message"> & { message: string };
  details: SubmissionDetail[];
  /// null = Property_Interest__c must be left blank; a string = must equal it.
  expectPropertyId: string | null;
  expectPhoneOmitted?: boolean;
  /// Index of an earlier scenario whose Lead this repeat must append to.
  appendTo?: number;
};

const UAT_PROJECT_ID = "a08WF00000oCRm3YAG"; // Kasumigaseki Residences placeholder

function loadDotEnvLocal() {
  // Run from the repo root, like `npm run db:seed` does for prisma/seed.ts.
  // Unescaping mirrors dotenv: \" \' and \n inside quoted values.
  const text = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    value = value.replace(/\\(["'n])/g, (found, char) => (char === "n" ? "\n" : char));
    if (process.env[match[1]] === undefined) process.env[match[1]] = value;
  }
}

loadDotEnvLocal();
// Force the verified client-credentials flow.
delete process.env.SALESFORCE_USERNAME;
delete process.env.SALESFORCE_PASSWORD;
delete process.env.SALESFORCE_SECURITY_TOKEN;

const scenarios: Scenario[] = [
  {
    form: "Contact — Sales Inquiry (seven x seven)",
    note: "Project lookup: Property_Interest__c = Kasumigaseki Residences placeholder",
    payload: {
      name: "Samir Haddad", email: "uat.matrix.sales.sxs@example.com", phone: "+971 50 111 0001",
      interest: "seven x seven", inquiryType: "Sales Inquiry", sourcePage: "/contact",
      message: "[UAT matrix] Sales enquiry about seven x seven.",
    },
    details: [
      { label: "Title", value: "Mr." }, { label: "Enquirer type", value: "Client" },
      { label: "Project of interest", value: "seven x seven" },
      { label: "Marketing consent", value: "Yes" }, { label: "Terms accepted", value: "Yes" },
    ],
    expectPropertyId: UAT_PROJECT_ID,
  },
  {
    form: "Contact — Sales Inquiry (Villa 174)",
    note: "Villa stays Description-only, Property_Interest__c blank (client decision)",
    payload: {
      name: "Yara Aslan", email: "uat.matrix.sales.villa174@example.com", phone: "+971 50 111 0002",
      interest: "Villa 174", inquiryType: "Sales Inquiry", sourcePage: "/contact",
      message: "[UAT matrix] Sales enquiry about Villa 174 / Emerald Villa.",
    },
    details: [
      { label: "Title", value: "Ms." }, { label: "Enquirer type", value: "Client" },
      { label: "Project of interest", value: "Villa 174" },
      { label: "Marketing consent", value: "No" }, { label: "Terms accepted", value: "Yes" },
    ],
    expectPropertyId: null,
  },
  {
    form: "Contact — Sales Inquiry (Dubai Hills Mansion)",
    note: "Villa 24 / Dubai Hills Mansion — same Description-only rule",
    payload: {
      name: "Karim Nassar", email: "uat.matrix.sales.dhm@example.com", phone: "+971 50 111 0003",
      interest: "Dubai Hills Mansion", inquiryType: "Sales Inquiry", sourcePage: "/contact",
      message: "[UAT matrix] Sales enquiry about Villa 24 / Dubai Hills Mansion.",
    },
    details: [
      { label: "Title", value: "Mr." }, { label: "Enquirer type", value: "Client" },
      { label: "Project of interest", value: "Dubai Hills Mansion" },
      { label: "Marketing consent", value: "Yes" }, { label: "Terms accepted", value: "Yes" },
    ],
    expectPropertyId: null,
  },
  {
    form: "Contact — Channel Partner",
    note: "Agency details carried as labelled Description details",
    payload: {
      name: "Dana Khoury", email: "uat.matrix.channel@example.com", phone: "+971 50 111 0004",
      interest: "Meraki Real Estate", inquiryType: "Channel Partner", sourcePage: "/contact",
      message: "[UAT matrix] Broker partnership enquiry.",
    },
    details: [
      { label: "Company / agency", value: "Meraki Real Estate" }, { label: "RERA / ORN", value: "ORB-12345" },
      { label: "Market / country", value: "United Arab Emirates" }, { label: "Website", value: "https://meraki.example.com" },
    ],
    expectPropertyId: null,
  },
  {
    form: "Contact — Press Inquiry",
    note: "Publication details carried as labelled Description details",
    payload: {
      name: "Rami Ayoub", email: "uat.matrix.press@example.com", phone: "+971 50 111 0005",
      interest: "Gulf News", inquiryType: "Press Inquiry", sourcePage: "/contact",
      message: "[UAT matrix] Press feature request.",
    },
    details: [
      { label: "Publication / outlet", value: "Gulf News" }, { label: "Deadline", value: "2026-11-20" },
    ],
    expectPropertyId: null,
  },
  {
    form: "Booking request (no phone given)",
    note: "Booking modal leaves phone optional — Lead must be created without Phone",
    payload: {
      name: "Lina Mansour", email: "uat.matrix.booking@example.com",
      interest: "Online call", inquiryType: "Booking request", sourcePage: "/",
      message: "[UAT matrix] Meeting request via the inquiry widget.",
    },
    details: [{ label: "Interest", value: "Online call" }],
    expectPropertyId: null,
    expectPhoneOmitted: true,
  },
  {
    form: "Mortgage Eligibility Review (calculator form)",
    note: "Calculator numbers arrive as labelled details; phone optional on this form",
    payload: {
      name: "Layal Salloum", email: "uat.matrix.mortgage@example.com",
      interest: "", inquiryType: "Mortgage Eligibility Review", sourcePage: "/invest-in-dubai",
      message: "[UAT matrix] Mortgage eligibility review from the investor-guide calculator.",
    },
    details: [
      { label: "Purchase Price", value: "AED 2,400,000" }, { label: "Residency Status", value: "UAE Resident" },
      { label: "Down Payment", value: "AED 480,000" }, { label: "Loan Amount", value: "AED 1,920,000" },
      { label: "Loan Period", value: "20 years" }, { label: "Interest Rate", value: "4.25%" },
      { label: "Estimated Monthly Payment", value: "AED 11,905" },
      { label: "Estimated Purchase Costs", value: "AED 88,000" },
      { label: "Estimated Total Upfront", value: "AED 568,000" },
    ],
    expectPropertyId: null,
    expectPhoneOmitted: true,
  },
  {
    form: "Brochure request",
    note: "Development brochure gate; project-name interest resolves via the map",
    payload: {
      name: "Rania Fahmy", email: "uat.matrix.brochure@example.com", phone: "+971 50 111 0008",
      interest: "seven x seven", inquiryType: "Brochure request", sourcePage: "/developments/seven-x-seven-residences",
      message: "[UAT matrix] Brochure download request.",
    },
    details: [{ label: "Country", value: "United Arab Emirates" }],
    expectPropertyId: UAT_PROJECT_ID,
  },
  {
    form: "Floor plan request (name + email now required)",
    note: "Development-page modal; visitor skipped the optional phone",
    payload: {
      name: "Omar Rahme", email: "uat.matrix.floorplan@example.com",
      interest: "Investment Interest", inquiryType: "Floor plan request", sourcePage: "/developments/seven-x-seven-residences",
      message: "[UAT matrix] Floor plan request.",
    },
    details: [{ label: "Interest", value: "Investment Interest" }],
    expectPropertyId: null,
    expectPhoneOmitted: true,
  },
  {
    form: "seven x seven residence (register form)",
    note: "Fixed interest label — Property_Interest__c must resolve to the placeholder",
    payload: {
      name: "Nadia Karam", email: "uat.matrix.sxs@example.com", phone: "+971 50 111 0010",
      interest: "seven x seven", inquiryType: "seven x seven residence", sourcePage: "/seven-x-seven",
      message: "[UAT matrix] seven x seven residence enquiry from the Footer form. Interest: A property consultant to contact me.",
    },
    details: [
      { label: "Name", value: "Nadia Karam" }, { label: "Email", value: "uat.matrix.sxs@example.com" },
      { label: "Phone", value: "+971 50 111 0010" },
      { label: "Interest", value: "A property consultant to contact me" }, { label: "Source", value: "Footer form" },
      { label: "Landing page", value: "https://kpd.ae/seven-x-seven" },
    ],
    expectPropertyId: UAT_PROJECT_ID,
  },
  {
    form: "Repeat submission — same contact sales enquiry",
    note: "Exact-email duplicate: enquiry must append to the existing Lead, not create one",
    payload: {
      name: "Samir Haddad", email: "uat.matrix.sales.sxs@example.com", phone: "+971 50 111 0001",
      interest: "seven x seven", inquiryType: "Sales Inquiry", sourcePage: "/contact",
      message: "[UAT matrix] Follow-up sales enquiry about payment plans.",
    },
    details: [
      { label: "Title", value: "Mr." }, { label: "Enquirer type", value: "Client" },
      { label: "Project of interest", value: "seven x seven" },
      { label: "Marketing consent", value: "Yes" }, { label: "Terms accepted", value: "Yes" },
    ],
    expectPropertyId: UAT_PROJECT_ID,
    appendTo: 0,
  },
  {
    form: "Repeat visitor — booking email via floor-plan form",
    note: "Same person, different form: exact-email duplicate appends again",
    payload: {
      name: "Lina Mansour", email: "uat.matrix.booking@example.com",
      interest: "Investment Interest", inquiryType: "Floor plan request", sourcePage: "/developments/seven-x-seven-residences",
      message: "[UAT matrix] Floor plan request from the same visitor.",
    },
    details: [{ label: "Interest", value: "Investment Interest" }],
    expectPropertyId: null,
    appendTo: 5,
  },
];

type Row = {
  form: string;
  note: string;
  status: "PASS" | "FAIL";
  leadId?: string;
  name?: string;
  phone?: string;
  propertyInterest?: string;
  checks: string[];
};

async function main() {
  const loginUrl = process.env.SALESFORCE_LOGIN_URL || "(unset)";
  const clientId = (process.env.SALESFORCE_CLIENT_ID || "").slice(0, 8);
  const owner = websiteLeadOwnerId();
  console.log(`Salesforce UAT matrix — ${new Date().toISOString()}`);
  console.log(`  login: ${loginUrl}`);
  console.log(`  auth:  client credentials (${clientId}…, username/password stripped)`);
  console.log(`  owner: ${owner}${owner === WEBSITE_LEADS_QUEUE_ID ? " (website_leads queue)" : ""}`);
  console.log(`  scenarios: ${scenarios.length}\n`);

  const rows: Row[] = [];
  const leadIds: string[] = [];

  for (const [index, scenario] of scenarios.entries()) {
    const payload: LeadPayload = {
      ...scenario.payload,
      message: leadDescription(scenario.payload.message, scenario.details),
    };
    const record = buildSalesforceLeadRecord(payload);
    const row: Row = {
      form: scenario.form, note: scenario.note, status: "PASS",
      name: `${record.FirstName} ${record.LastName}`,
      phone: record.Phone || "(none)",
      propertyInterest: record.Property_Interest__c || "(blank)",
      checks: [],
    };
    try {
      const leadId = await pushLeadToSalesforce(payload);
      row.leadId = leadId;
      if (scenario.appendTo !== undefined) {
        const expected = leadIds[scenario.appendTo];
        row.checks.push(leadId === expected
          ? `appended to existing Lead ${expected} (no duplicate created)`
          : `FAIL: expected append to ${expected}, got ${leadId}`);
        if (leadId !== expected) row.status = "FAIL";
      }
      if (scenario.expectPropertyId === null && record.Property_Interest__c) {
        row.checks.push(`FAIL: Property_Interest__c should be blank, got ${record.Property_Interest__c}`);
        row.status = "FAIL";
      }
      if (typeof scenario.expectPropertyId === "string") {
        row.checks.push(record.Property_Interest__c === scenario.expectPropertyId
          ? `Property_Interest__c = ${scenario.expectPropertyId}`
          : `FAIL: Property_Interest__c ${record.Property_Interest__c || "(blank)"} != ${scenario.expectPropertyId}`);
        if (record.Property_Interest__c !== scenario.expectPropertyId) row.status = "FAIL";
      }
      if (scenario.expectPhoneOmitted) {
        row.checks.push(record.Phone ? `FAIL: Phone should be omitted, got ${record.Phone}` : "created without Phone (optional per client, Nov 2026)");
        if (record.Phone) row.status = "FAIL";
      }
      leadIds[index] = leadId;
      console.log(`  ${index + 1}. ${row.status === "PASS" ? "PASS" : "FAIL"}  ${scenario.form} -> ${leadId}`);
    } catch (error) {
      row.status = "FAIL";
      row.checks.push(`Salesforce error: ${error instanceof Error ? error.message : String(error)}`);
      console.log(`  ${index + 1}. FAIL  ${scenario.form} -> ${error instanceof Error ? error.message : error}`);
    }
    rows.push(row);
  }

  const lines = [
    "# Salesforce UAT matrix — results",
    "",
    `- Run: ${new Date().toISOString()}`,
    `- Sandbox: ${loginUrl} (client-credentials flow, verified UAT path)`,
    `- Owner: every Lead owned by ${owner} (website_leads queue) — per-type ownership is still to be confirmed by Dalia/Rayan`,
    `- Mapping basis: Property_Interest__c = Project record ids only; Villa 174 and Dubai Hills Mansion stay in the Description with the lookup blank; seven x seven uses the Kasumigaseki Residences placeholder (${UAT_PROJECT_ID}); required Lead fields = first/last name + email, Company "KPD Website Enquiry"`,
    `- All records below were created by scripts/sf-uat-matrix.ts (every Description starts with "[UAT matrix]", emails @example.com) and are safe to delete after review.`,
    "",
    "| # | Form | Lead Id | Name | Phone | Property_Interest__c | Checks |",
    "|---|------|---------|------|-------|----------------------|--------|",
    ...rows.map((row, index) => `| ${index + 1} | ${row.form} | ${row.leadId || "(failed)"} | ${row.name} | ${row.phone} | ${row.propertyInterest} | ${row.status === "PASS" ? "PASS" : "**FAIL**"}: ${row.checks.join("; ")} |`),
    "",
    "## Notes",
    "",
    ...rows.map((row, index) => `- ${index + 1}. ${row.form} — ${row.note}`),
    "",
  ];
  const outPath = join(tmpdir(), "kpd-sf-uat-results-2026-11-06.md");
  writeFileSync(outPath, lines.join("\n"), "utf8");
  const failed = rows.filter((row) => row.status === "FAIL").length;
  console.log(`\n${rows.length - failed}/${rows.length} scenarios passed. Results file: ${outPath}`);
  if (failed > 0) process.exitCode = 1;
}

main();
