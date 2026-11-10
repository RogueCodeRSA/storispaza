import { describe, expect, it, vi } from "vitest";
import { encodeCaptureWav, validateCaptureWav, MAX_AUDIO_BYTES } from "@/domain/capture";
import { createOpenAIAdapter } from "@/server/providers/adapters/openai.adapter";
import { protectProvider } from "@/server/providers/boundary";
import { fakeTransport, contractGuard, wireStory } from "./helpers/live-provider";

const input = { idea: "A fictional community story", culturalContext: "Creator-provided context", educationalObjective: "Cooperation", sourceLanguage: "en" as const };
describe("normalized audio bounds", () => {
  it("encodes/resamples mono PCM and verifies actual frame duration", () => {
    const bytes = encodeCaptureWav(new Float32Array(48000), 48000);
    expect(bytes.length).toBe(32044);
    expect(validateCaptureWav(bytes)).toBe(1);
    expect(() => validateCaptureWav(new Uint8Array([1, 2]))).toThrow();
    bytes[24] = 1;
    expect(() => validateCaptureWav(bytes)).toThrow();
  });
  it("rejects excessive duration, false lengths and disguised non-WAV data", () => {
    expect(() => encodeCaptureWav(new Float32Array(16000 * 121), 16000)).toThrow();
    expect(() => validateCaptureWav(new Uint8Array(MAX_AUDIO_BYTES + 1))).toThrow();
    const bytes = encodeCaptureWav(new Float32Array(16), 16000); bytes[40] = 255;
    expect(() => validateCaptureWav(bytes)).toThrow();
  });
});
describe("live adapter with injected transport (no credentials/network)", () => {
  it("uses strict output, no response storage/retries and private unapproved results", async () => {
    const transport = fakeTransport(); const respond = vi.spyOn(transport, "respond");
    const result = await protectProvider(createOpenAIAdapter({ transport }), contractGuard()).structureStory(input);
    expect(respond).toHaveBeenCalledTimes(1);
    expect(respond.mock.calls[0][0]).toMatchObject({ store: false, max_output_tokens: 4096, text: { format: { strict: true } } });
    expect(result.data.pages).toHaveLength(6);
    expect(result.data.visibility).toBe("private");
    expect(result.data.pages.every(page => page.assetSources.text.providerId === "openai" && !page.approvals.text && page.translation === null)).toBe(true);
    expect(result.usage.tokens).toEqual({ input: 100, output: 100 });
    expect(result.usage.actualUsd).toBeCloseTo(.0014);
  });
  it("validates consent, language, format and text before reserving or sending", async () => {
    const transport = fakeTransport(); const send = vi.spyOn(transport, "transcribe"); const guard = contractGuard(); const reserve = vi.spyOn(guard, "reserve");
    const adapter = protectProvider(createOpenAIAdapter({ transport }), guard);
    await expect(adapter.transcribe({ bytes: new Uint8Array(), language: "st", apiConsent: true })).rejects.toMatchObject({ code: "INVALID_INPUT" });
    await expect(adapter.transcribe({ bytes: new Uint8Array(), language: "en", apiConsent: false })).rejects.toMatchObject({ code: "CONSENT_REQUIRED" });
    await expect(adapter.transcribe({ bytes: new Uint8Array(), language: "en", apiConsent: true })).rejects.toMatchObject({ code: "INVALID_INPUT" });
    await expect(adapter.structureStory({ ...input, idea: "" })).rejects.toThrow();
    expect(send).not.toHaveBeenCalled(); expect(reserve).not.toHaveBeenCalled();
  });
  it("retains the reservation on refused, incomplete or malformed stories", async () => {
    for (const reply of [{ status: "incomplete", output_text: "" }, { status: "completed", output_text: "not json" }, { status: "completed", output_text: JSON.stringify({ ...wireStory(), pages: [] }) }]) {
      const transport = fakeTransport(); transport.respond = vi.fn(async () => reply);
      const guard = contractGuard(); const retained = vi.spyOn(guard, "retainUnknown");
      await expect(protectProvider(createOpenAIAdapter({ transport }), guard).structureStory(input)).rejects.toThrow();
      expect(retained).toHaveBeenCalled();
      expect(transport.respond).toHaveBeenCalledTimes(1);
    }
  });
  it("redacts authentication/quota/timeout details without retry or fallback", async () => {
    for (const status of [401, 403, 404, 429, undefined]) {
      const transport = fakeTransport(); const respond = vi.spyOn(transport, "respond").mockRejectedValue({ status, message: "private-key raw-recording-transcript" });
      const log = vi.spyOn(console, "log"); const error = vi.spyOn(console, "error");
      try {
        await expect(protectProvider(createOpenAIAdapter({ transport }), contractGuard()).structureStory(input)).rejects.toMatchObject({ code: status === 429 ? "RATE_LIMITED" : "API_UNAVAILABLE" });
        expect(respond).toHaveBeenCalledTimes(1); expect(log).not.toHaveBeenCalled(); expect(error).not.toHaveBeenCalled();
      } finally { log.mockRestore(); error.mockRestore(); }
    }
  });
  it("reports unknown usage honestly and uses actual audio duration when supplied", async () => {
    const transport = fakeTransport(); const guard = contractGuard(); const retained = vi.spyOn(guard, "retainUnknown");
    transport.respond = async () => ({ status: "completed", output_text: JSON.stringify(wireStory()) });
    const adapter = protectProvider(createOpenAIAdapter({ transport }), guard);
    expect((await adapter.structureStory(input)).usage.actualUsd).toBeNull(); expect(retained).toHaveBeenCalled();
    const audio = await adapter.transcribe({ bytes: encodeCaptureWav(new Float32Array(16000), 16000), language: "en", apiConsent: true });
    expect(audio.usage.actualUsd).toBeCloseTo(.0045 / 60); expect(audio.usage.tokens).toBeNull();
  });
});
