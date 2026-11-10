import { describe, expect, it } from "vitest";
import { demoExportIssues, mockExportJson, mockReaderHtml, newMockDraft, normalizeMockDraft, regenerateMockImage, setMockMetadata, updateMockPage, updateMockTranslation } from "@/domain/mock-journey";
import { finalApprovalIssues } from "@/domain/story";
import { placeholderImage, placeholderTone } from "@/components/mock-media";

function acknowledgedDraft() {
  const draft = newMockDraft();
  Object.values(draft.acknowledgements).forEach(flags => flags.fill(true));
  draft.culturalAcknowledgement = true;
  return draft;
}

describe("mock journey, separate from real content approval", () => {
  it("has six editable pages and no fabricated Sesotho or media approval", () => {
    const draft = newMockDraft();
    expect(draft.story.pages).toHaveLength(6);
    expect(draft.story.pages.every(page => page.translation?.text.includes("placeholder") && page.translation.status !== "approved")).toBe(true);
    expect(finalApprovalIssues(acknowledgedDraft().story).length).toBeGreaterThan(0);
    expect(() => mockExportJson(draft)).toThrow();
  });
  it("invalidates acknowledgements on source edits and allows temporarily empty fields", () => {
    const draft = acknowledgedDraft();
    const edited = updateMockPage(draft, 2, "narrative", "");
    expect(edited.story.pages[2].narrative).toBe("");
    expect(edited.acknowledgements.text[2]).toBe(false);
    expect(edited.acknowledgements.images[2]).toBe(false);
    expect(edited.acknowledgements.translations[2]).toBe(false);
    expect(demoExportIssues(edited).length).toBeGreaterThan(0);
    expect(draft.story.pages[2].narrative).not.toBe("");
  });
  it("keeps translation and regeneration scoped to the selected page", () => {
    const draft = acknowledgedDraft();
    const edited = updateMockTranslation(draft, 1, "Reviewer test text");
    expect(edited.story.pages[1].translation?.status).toBe("edited");
    expect(edited.acknowledgements.translations).toEqual([true, false, true, true, true, true]);
    const regenerated = regenerateMockImage(draft, 4);
    expect(regenerated.imageRevisions).toEqual([0, 0, 0, 0, 1, 0]);
    expect(regenerated.acknowledgements.images).toEqual([true, true, true, true, false, true]);
  });
  it("restores only validated drafts and cannot import approved fixture claims", () => {
    const draft = acknowledgedDraft();
    draft.story.pages[0].approvals = { text: true, illustration: true, audio: true };
    draft.story.pages[0].provenance = "creator";
    draft.story.pages[0].translation = { text: "Test text", status: "approved" };
    const restored = normalizeMockDraft(JSON.parse(JSON.stringify(draft)));
    expect(restored.story.pages[0].approvals.text).toBe(false);
    expect(restored.story.pages[0].provenance).toBe("provisional-fixture");
    expect(restored.story.pages[0].translation?.status).toBe("edited");
    const { culturalAcknowledgement: _oldAcknowledgement, ...earlyDraft } = draft;
    expect(_oldAcknowledgement).toBe(true);
    expect(normalizeMockDraft(earlyDraft).culturalAcknowledgement).toBe(false);
    expect(() => normalizeMockDraft({ format: "wrong" })).toThrow();
  });
  it("requires shared export consent and excludes the recording copy", () => {
    const draft = acknowledgedDraft();
    draft.story.visibility = "shared";
    draft.recordingCopy = true;
    expect(() => mockExportJson(draft)).toThrow();
    draft.story.sharingConsent = true;
    const output = JSON.parse(mockExportJson(draft));
    expect(output.reviewStatus).toBe("provisional-unreviewed");
    expect(output.recordingCopy).toBe(false);
    expect(output.story.assumptionsConfirmed).toBe(false);
    expect(output.story.pages.every((page: { approvals: { text: boolean } }) => !page.approvals.text)).toBe(true);
  });
  it("escapes story text in the standalone reader and forbids external connections", () => {
    const draft = acknowledgedDraft();
    draft.story.title = '</title><script>alert("xss")</script>';
    draft.story.pages[0].narrative = '<img src="https://example.com" onerror="alert(1)">';
    const html = mockReaderHtml(draft);
    expect(html).not.toContain("<script>");
    expect(html).not.toContain('<img src="https://');
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("default-src 'none'");
    expect(html).toContain("PROVISIONAL / UNREVIEWED");
  });
  it("invalidates all dependent acknowledgements after context changes", () => {
    const edited = setMockMetadata(acknowledgedDraft(), "culturalContext", "Creator correction");
    expect(edited.story.assumptionsConfirmed).toBe(false);
    expect(Object.values(edited.acknowledgements).flat().every(value => !value)).toBe(true);
  });
  it("embeds deterministic symbols and a WAV tone without a remote asset", () => {
    expect(placeholderImage(1)).toMatch(/^data:image\/svg\+xml/);
    const bytes = Buffer.from(placeholderTone().split(",")[1], "base64");
    expect(bytes.subarray(0, 4).toString()).toBe("RIFF");
    expect(bytes.readUInt32LE(40)).toBe(8000 * 6 * 2);
  });
});
