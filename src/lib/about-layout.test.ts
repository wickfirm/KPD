import { describe, expect, it } from "vitest";
import { splitLead, valueCard } from "./about-layout";

describe("splitLead", () => {
  it("uses the first sentence as the lead", () => {
    expect(splitLead("Turning challenge into value. Adopted from our parent brand.")).toEqual({ lead: "Turning challenge into value.", rest: "Adopted from our parent brand." });
  });
  it("prefers a blank line chosen by the editor", () => {
    expect(splitLead("The art of knowing.\n\nKnowing is our discipline. Every decision is evidenced.")).toEqual({ lead: "The art of knowing.", rest: "Knowing is our discipline. Every decision is evidenced." });
  });
  it("keeps single-sentence and empty text whole", () => {
    expect(splitLead("One line only")).toEqual({ lead: "One line only", rest: "" });
    expect(splitLead("  ")).toEqual({ lead: "", rest: "" });
  });
});

describe("valueCard", () => {
  it("turns the delivered value sentence into a card", () => {
    expect(valueCard("Hinshitsu, quality, is an uncompromising commitment to every material.", 0)).toEqual({ cap: "01 · Quality", title: "Hinshitsu", text: "An uncompromising commitment to every material." });
    expect(valueCard("Anshin, peace of mind, is the confidence of being in safe hands.", 1).cap).toBe("02 · Peace of mind");
  });
  it("shows any other paragraph whole", () => {
    expect(valueCard("We build for the long term.", 2)).toEqual({ cap: "03", title: "", text: "We build for the long term." });
  });
});
