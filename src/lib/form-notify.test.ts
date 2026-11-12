import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));
const { buildNotificationEmail, notificationRecipients, notifyKeyFor, resendConfigured, sendWithResend } = await import("./form-notify");

describe("form notification routing", () => {
  it("uses the form's own key, else matches the enquiry type", () => {
    expect(notifyKeyFor({ recipientKey: "contactSales", inquiryType: "Sales Inquiry" })).toBe("contactSales");
    expect(notifyKeyFor({ inquiryType: "Brochure request" })).toBe("brochure");
    expect(notifyKeyFor({ inquiryType: "seven x seven residence" })).toBe("sevenXSeven");
    expect(notifyKeyFor({ recipientKey: "bogus", inquiryType: "Something else" })).toBe("enquiry");
  });
  it("reads recipients from settings only, falling back to the default address", () => {
    expect(notificationRecipients({ email: "info@kpd.ae", recipients: { brochure: "" } }, "brochure")).toEqual(["info@kpd.ae"]);
    expect(notificationRecipients({ email: "info@kpd.ae", recipients: { brochure: "a@kpd.ae, b@kpd.ae;a@kpd.ae" } }, "brochure")).toEqual(["a@kpd.ae", "b@kpd.ae"]);
    expect(notificationRecipients({}, "enquiry")).toEqual([]);
    expect(notificationRecipients({ email: "not an email" }, "enquiry")).toEqual([]);
  });
});

describe("notification email", () => {
  it("lists every field once and escapes visitor input", () => {
    const mail = buildNotificationEmail({ inquiryType: "Brochure request", name: "Sam <b>", email: "sam@example.com", phone: "+971 50", message: "Hi", interest: "seven x seven", sourcePage: "/developments/seven-x-seven", submissionId: "abc", details: [{ label: "Name", value: "Sam <b>" }, { label: "Country", value: "UAE" }, { label: "Delivery recipient", value: "info@kpd.ae" }] });
    expect(mail.subject).toBe("New Brochure request from Sam b");
    expect(mail.text.match(/^Name:/gm)).toHaveLength(1);
    expect(mail.text).toContain("Country: UAE");
    expect(mail.text).not.toContain("Delivery recipient");
    expect(mail.html).toContain("Sam &lt;b&gt;");
    expect(mail.html).not.toContain("<b>");
  });
});

describe("Resend", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
  it("is off without an API key", () => {
    vi.stubEnv("RESEND_API_KEY", "");
    expect(resendConfigured()).toBe(false);
  });
  it("posts to the Resend API", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("RESEND_FROM", "KPD <noreply@kpd.ae>");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "m1" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(sendWithResend({ to: ["info@kpd.ae"], subject: "s", html: "h", text: "t", replyTo: "v@example.com" })).resolves.toEqual({ id: "m1" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(JSON.parse(init.body)).toMatchObject({ from: "KPD <noreply@kpd.ae>", to: ["info@kpd.ae"], reply_to: "v@example.com" });
  });
  it("throws on an API error", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("RESEND_FROM", "KPD <noreply@kpd.ae>");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("domain not verified", { status: 403 })));
    await expect(sendWithResend({ to: ["info@kpd.ae"], subject: "s", html: "h", text: "t" })).rejects.toThrow("Resend 403");
  });
});
