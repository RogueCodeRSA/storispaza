import { describe, expect, it } from "vitest";
import { demoStory } from "../fixtures/demo-story";
import { editNarrative, finalApprovalIssues, replaceIllustration, storySchema } from "@/domain/story";
import { recordingConsentSchema } from "@/domain/consent";
import { languagePacks } from "@/domain/languages";

describe("story and creator control", () => {
  it("rejects wrong page count, ordering and unknown characters", () => {
    expect(storySchema.safeParse({ ...demoStory, pages: demoStory.pages.slice(0, 5) }).success).toBe(false);
    const wrongOrder = structuredClone(demoStory);
    wrongOrder.pages[1].number = 1;
    expect(storySchema.safeParse(wrongOrder).success).toBe(false);
    wrongOrder.pages[1].number = 2;
    wrongOrder.pages[0].characterRefs = ["unknown"];
    expect(storySchema.safeParse(wrongOrder).success).toBe(false);
  });
  it("invalidates affected approvals after editing and regeneration", () => {
    const page = { ...demoStory.pages[0], translation: { text: "Reviewer-supplied test content", status: "approved" as const }, approvals: { text: true, illustration: true, audio: true } };
    const edited = editNarrative(page, "The creator corrected this page.");
    expect(edited.translation?.status).toBe("machine-translated");
    expect(edited.approvals.text).toBe(false);
    expect(edited.approvals.audio).toBe(false);
    expect(edited.approvals.illustration).toBe(false);
    expect(replaceIllustration(page, "replacement").approvals.illustration).toBe(false);
  });
  it("blocks unreviewed fixtures and empty approved translations", () => {
    expect(finalApprovalIssues(demoStory).length).toBeGreaterThan(0);
    const empty = structuredClone(demoStory);
    empty.pages[0].translation = { text: " ", status: "approved" };
    expect(storySchema.safeParse(empty).success).toBe(false);
  });
  it("requires storage consent and never implies transmission or redistribution", () => {
    expect(recordingConsentSchema.safeParse({ storage: false, apiTransmission: false }).success).toBe(false);
    expect(recordingConsentSchema.parse({ storage: true, apiTransmission: false })).toMatchObject({ redistribution: false, retainedByCreator: false });
  });
  it("requires current content and sharing consent even after toggling approval flags", () => {
    const reviewed = structuredClone(demoStory);
    reviewed.assumptionsConfirmed = true;
    reviewed.pages.forEach(page => {
      page.approvals = { text: true, illustration: true, audio: true };
      page.translation = { text: "Reviewer-supplied test text", status: "approved" };
      page.narrationAssetIds = { en: "en-audio", st: "st-audio" };
    });
    expect(finalApprovalIssues(reviewed)).toHaveLength(6); // Provisional provenance cannot be approved away.
    reviewed.pages.forEach(page => { page.provenance = "creator"; });
    expect(finalApprovalIssues(reviewed)).toEqual([]);
    reviewed.visibility = "shared";
    expect(finalApprovalIssues(reviewed)).toContain("Consent is required for shared export.");
  });
  it("keeps Sesotho speech claims disabled", () => {
    expect(languagePacks.st.transcription).toBe("manual-only");
    expect(languagePacks.st.narration).toBe("creator-recorded");
    expect(languagePacks.st.callAndResponse).toBeNull();
  });
});
