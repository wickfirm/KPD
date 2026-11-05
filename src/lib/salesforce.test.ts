import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildSalesforceLeadRecord,
  isDuplicateLeadBlock,
  leadIdFromDuplicateResponse,
  mergeLeadDescription,
  projectRecordIds,
  missingSalesforceLeadFields,
  projectObjectId,
  pushLeadToSalesforce,
  queueObjectId,
  salesforceRecordId,
  shouldMirrorSubmissionToSalesforce,
  soqlLiteral,
  WEBSITE_LEADS_QUEUE_ID,
} from "./salesforce";

const ENV_KEYS = [
  "SALESFORCE_CLIENT_ID",
  "SALESFORCE_CLIENT_SECRET",
  "SALESFORCE_USERNAME",
  "SALESFORCE_PASSWORD",
  "SALESFORCE_SECURITY_TOKEN",
  "SALESFORCE_LOGIN_URL",
  "SALESFORCE_PROJECT_RECORD_IDS",
  "SALESFORCE_LEAD_OWNER_ID",
] as const;

const previousEnv = new Map(ENV_KEYS.map((key) => [key, process.env[key]]));

afterEach(() => {
  vi.unstubAllGlobals();
  for (const [key, value] of previousEnv) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

const lead = {
  name: "Jane Doe",
  email: "jane@example.com",
  phone: "+971500000000",
  message: "Hello\n\nBudget: AED 5M",
  interest: "seven x seven",
  sourcePage: "/contact",
  inquiryType: "Sales Inquiry",
};

describe("Salesforce lead mapping", () => {
  it("sends the reviewed fields and assigns the website_leads queue", () => {
    delete process.env.SALESFORCE_PROJECT_RECORD_IDS;
    delete process.env.SALESFORCE_LEAD_OWNER_ID;
    const record = buildSalesforceLeadRecord(lead);
    expect(record).toEqual({
      FirstName: "Jane",
      LastName: "Doe",
      Email: "jane@example.com",
      Phone: "+971500000000",
      Company: "KPD Website Enquiry",
      Status: "New",
      LeadSource: "Website",
      OwnerId: WEBSITE_LEADS_QUEUE_ID,
      Description: "Hello\n\nBudget: AED 5M\n\nInquiry type: Sales Inquiry\n\nProperty interest: seven x seven\n\nSource page: /contact",
    });
    expect(record).not.toHaveProperty("ProductInterest__c");
    expect(record).not.toHaveProperty("LeadSourceDetail__c");
    expect(queueObjectId("website_leads")).toBeNull();
    expect(queueObjectId(WEBSITE_LEADS_QUEUE_ID)).toBe(WEBSITE_LEADS_QUEUE_ID);
  });

  it("sets Property_Interest__c only for a Project record id", () => {
    delete process.env.SALESFORCE_PROJECT_RECORD_IDS;
    const projectId = "a01xx0000000001AAA";
    expect(salesforceRecordId(projectId)).toBe(projectId);
    expect(salesforceRecordId("seven x seven")).toBeNull();
    expect(projectObjectId(WEBSITE_LEADS_QUEUE_ID)).toBeNull();
    expect(buildSalesforceLeadRecord({ ...lead, interest: WEBSITE_LEADS_QUEUE_ID }).Property_Interest__c).toBeUndefined();
    const byId = buildSalesforceLeadRecord({ ...lead, interest: projectId, propertyInterestId: projectId });
    expect(byId.Property_Interest__c).toBe(projectId);
    expect(byId.Description).not.toContain("Property interest:");

    process.env.SALESFORCE_PROJECT_RECORD_IDS = JSON.stringify({ "Seven x Seven": projectId, "Villa 174": "not-an-id" });
    expect(projectRecordIds()).toEqual({ "seven x seven": projectId });
    const mapped = buildSalesforceLeadRecord(lead);
    expect(mapped.Property_Interest__c).toBe(projectId);
    expect(mapped.Description).toContain("Property interest: seven x seven");
    expect(projectRecordIds("nope")).toEqual({});
    expect(projectRecordIds("[]")).toEqual({});
  });

  it("keeps a single name in LastName and omits an empty phone", () => {
    delete process.env.SALESFORCE_PROJECT_RECORD_IDS;
    delete process.env.SALESFORCE_LEAD_OWNER_ID;
    const record = buildSalesforceLeadRecord({ ...lead, name: "Prince", phone: "  " });
    expect(record.FirstName).toBe("Prince");
    expect(record.LastName).toBe("Prince");
    expect(record.Status).toBe("New");
    expect(record).not.toHaveProperty("Phone");
    expect(missingSalesforceLeadFields({ ...lead, phone: " " })).toMatch(/phone/i);
    expect(missingSalesforceLeadFields({ ...lead, email: " " })).toMatch(/email/i);
    expect(missingSalesforceLeadFields({ ...lead, name: " " })).toMatch(/last name/i);
  });
});

describe("which forms become Leads", () => {
  it("holds newsletter, job, and customer-service forms", () => {
    expect(shouldMirrorSubmissionToSalesforce({ recipientKey: "newsletter", inquiryType: "Newsletter signup" })).toBe(false);
    expect(shouldMirrorSubmissionToSalesforce({ recipientKey: "contactCareers", inquiryType: "Job Inquiry" })).toBe(false);
    expect(shouldMirrorSubmissionToSalesforce({ recipientKey: "contactCustomer", inquiryType: "Customer Inquiry" })).toBe(false);
    expect(shouldMirrorSubmissionToSalesforce({ inquiryType: "Customer service" })).toBe(false);
    expect(shouldMirrorSubmissionToSalesforce({ inquiryType: "customer-service" })).toBe(false);
    expect(shouldMirrorSubmissionToSalesforce({ recipientKey: "enquiry", inquiryType: "Newsletter signup" })).toBe(false);
  });

  it("still mirrors the confirmed enquiry forms", () => {
    for (const inquiryType of ["Sales Inquiry", "Booking request", "Floor plan request", "Press Inquiry", "Channel Partner", "Brochure request", "seven x seven residence"]) {
      expect(shouldMirrorSubmissionToSalesforce({ inquiryType })).toBe(true);
    }
    expect(shouldMirrorSubmissionToSalesforce({ recipientKey: "calculator" })).toBe(true);
    expect(shouldMirrorSubmissionToSalesforce({})).toBe(true);
  });
});

describe("duplicate lead rule", () => {
  const existingId = "00Qxx0000000001EAA";
  const duplicateBody = JSON.stringify([
    {
      message: "Use one of these records?",
      errorCode: "DUPLICATES_DETECTED",
      fields: [],
      duplicateResult: {
        allowSave: false,
        duplicateRule: "Lead_Email_or_Phone_Exact",
        matchResults: [
          { entityType: "Contact", matchRecords: [{ record: { Id: "003xx0000000001AAA" } }] },
          {
            entityType: "Lead",
            matchRecords: [{ record: { attributes: { url: `/services/data/v60.0/sobjects/Lead/${existingId}` }, Id: existingId } }],
          },
        ],
      },
    },
  ]);

  it("reads the matching Lead id and ignores a contact match", () => {
    expect(isDuplicateLeadBlock(duplicateBody)).toBe(true);
    expect(leadIdFromDuplicateResponse(duplicateBody)).toBe(existingId);
    expect(leadIdFromDuplicateResponse(duplicateBody.replace(`"Id": "${existingId}"`, `"Id": ""`))).toBe(existingId);
    expect(isDuplicateLeadBlock(JSON.stringify([{ errorCode: "REQUIRED_FIELD_MISSING", message: existingId }]))).toBe(false);
    expect(leadIdFromDuplicateResponse("not json")).toBeNull();
  });

  it("appends the new enquiry without dropping the existing description", () => {
    expect(mergeLeadDescription("First visit", "Second visit")).toBe("First visit\n\n---\n\nSecond visit");
    expect(mergeLeadDescription("First visit\n\n---\n\nSecond visit", "Second visit")).toBe("First visit\n\n---\n\nSecond visit");
    expect(mergeLeadDescription("", "Only this")).toBe("Only this");
    expect(soqlLiteral("o'reilly@example.com")).toBe("o\\'reilly@example.com");
  });

  it("adds the enquiry to the existing lead when the rule blocks create", async () => {
    process.env.SALESFORCE_CLIENT_ID = "client";
    process.env.SALESFORCE_CLIENT_SECRET = "secret";
    process.env.SALESFORCE_USERNAME = "user";
    process.env.SALESFORCE_PASSWORD = "password";
    process.env.SALESFORCE_LOGIN_URL = "https://login.example.test";
    delete process.env.SALESFORCE_LEAD_OWNER_ID;
    delete process.env.SALESFORCE_PROJECT_RECORD_IDS;
    const calls: Array<{ url: string; body?: unknown }> = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      const raw = init?.body == null ? "" : String(init.body);
      const body = raw.startsWith("{") ? JSON.parse(raw) : undefined;
      calls.push({ url, body });
      if (String(url).endsWith("/services/oauth2/token")) {
        return new Response(JSON.stringify({ access_token: "token", instance_url: "https://uat.example.test" }), { status: 200 });
      }
      if (init?.method === "POST") {
        return new Response(duplicateBody, { status: 400 });
      }
      if (init?.method === "PATCH") return new Response(null, { status: 204 });
      return new Response(JSON.stringify({ Description: "Earlier enquiry" }), { status: 200 });
    }));

    await expect(pushLeadToSalesforce(lead)).resolves.toBe(existingId);
    const create = calls.find((call) => call.url.endsWith("/sobjects/Lead"));
    expect(create?.body).toMatchObject({
      Company: "KPD Website Enquiry",
      Status: "New",
      LeadSource: "Website",
      Email: "jane@example.com",
    });
    expect(create?.body).not.toHaveProperty("ProductInterest__c");
    expect(create?.body).not.toHaveProperty("LeadSourceDetail__c");
    expect(create?.body).toMatchObject({ OwnerId: WEBSITE_LEADS_QUEUE_ID, Status: "New" });
    const patch = calls.find((call) => call.url.includes(`/Lead/${existingId}`) && call.body);
    expect(patch?.body).toEqual({ Description: "Earlier enquiry\n\n---\n\n" + (create?.body as { Description: string }).Description });
    expect(calls.some((call) => call.url.includes("/query?"))).toBe(false);
  });

  it("looks up an exact email or phone when the block response hides the lead", async () => {
    process.env.SALESFORCE_CLIENT_ID = "client";
    process.env.SALESFORCE_CLIENT_SECRET = "secret";
    process.env.SALESFORCE_USERNAME = "user";
    process.env.SALESFORCE_PASSWORD = "password";
    process.env.SALESFORCE_LOGIN_URL = "https://login.example.test";
    delete process.env.SALESFORCE_LEAD_OWNER_ID;
    const hidden = JSON.stringify([{ errorCode: "DUPLICATES_DETECTED", duplicateResult: { allowSave: false, matchResults: [{ entityType: "Lead", matchRecords: [{}] }] } }]);
    const queries: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).endsWith("/services/oauth2/token")) {
        return new Response(JSON.stringify({ access_token: "token", instance_url: "https://uat.example.test" }), { status: 200 });
      }
      if (init?.method === "POST") return new Response(hidden, { status: 400 });
      if (String(url).includes("/query?")) {
        const soql = decodeURIComponent(String(url));
        queries.push(soql);
        if (soql.includes("Email =")) return new Response(JSON.stringify({ records: [] }), { status: 200 });
        return new Response(JSON.stringify({ records: [{ Id: existingId }] }), { status: 200 });
      }
      if (init?.method === "PATCH") return new Response(null, { status: 204 });
      return new Response(JSON.stringify({ Description: null }), { status: 200 });
    }));

    await expect(pushLeadToSalesforce({ ...lead, email: "o'reilly@example.com", phone: "+971500000000" })).resolves.toBe(existingId);
    expect(queries[0]).toContain("Email = 'o\\'reilly@example.com'");
    expect(queries[1]).toContain("Phone = '+971500000000'");
  });

  it("leaves a field error as a failure", async () => {
    process.env.SALESFORCE_CLIENT_ID = "client";
    process.env.SALESFORCE_CLIENT_SECRET = "secret";
    process.env.SALESFORCE_USERNAME = "user";
    process.env.SALESFORCE_PASSWORD = "password";
    process.env.SALESFORCE_LOGIN_URL = "https://login.example.test";
    delete process.env.SALESFORCE_LEAD_OWNER_ID;
    const urls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      urls.push(String(url));
      if (String(url).endsWith("/services/oauth2/token")) {
        return new Response(JSON.stringify({ access_token: "token", instance_url: "https://uat.example.test" }), { status: 200 });
      }
      if (init?.method === "POST") {
        return new Response(JSON.stringify([{ errorCode: "INVALID_FIELD", message: "No such column" }]), { status: 400 });
      }
      return new Response("unexpected", { status: 500 });
    }));

    await expect(pushLeadToSalesforce(lead)).rejects.toThrow(/INVALID_FIELD/);
    expect(urls.some((url) => url.includes("/query?"))).toBe(false);
  });

  it("refuses a lead with no phone before calling Salesforce", async () => {
    process.env.SALESFORCE_CLIENT_ID = "client";
    process.env.SALESFORCE_CLIENT_SECRET = "secret";
    process.env.SALESFORCE_LOGIN_URL = "https://login.example.test";
    delete process.env.SALESFORCE_USERNAME;
    delete process.env.SALESFORCE_PASSWORD;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(pushLeadToSalesforce({ ...lead, phone: " " })).rejects.toThrow(/phone/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses client credentials when no username or password is set", async () => {
    process.env.SALESFORCE_CLIENT_ID = "client";
    process.env.SALESFORCE_CLIENT_SECRET = "secret";
    process.env.SALESFORCE_LOGIN_URL = "https://inspiration-force-4305--uat.sandbox.my.salesforce.com";
    delete process.env.SALESFORCE_USERNAME;
    delete process.env.SALESFORCE_PASSWORD;
    delete process.env.SALESFORCE_LEAD_OWNER_ID;
    let tokenBody = "";
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).endsWith("/services/oauth2/token")) {
        tokenBody = String(init?.body);
        return new Response(JSON.stringify({ access_token: "token", instance_url: "https://uat.example.test" }), { status: 200 });
      }
      if (init?.method === "POST") return new Response(JSON.stringify({ id: "00Qxx0000000001EAA" }), { status: 201 });
      return new Response("unexpected", { status: 500 });
    }));

    await expect(pushLeadToSalesforce(lead)).resolves.toBe("00Qxx0000000001EAA");
    expect(tokenBody).toContain("grant_type=client_credentials");
    expect(tokenBody).not.toContain("password");
  });
});
