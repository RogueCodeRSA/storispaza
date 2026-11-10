import { z } from "zod";
import { languageSchema } from "./story";

export const storyInputSchema = z.object({
  idea: z.string().trim().min(3).max(3000),
  title: z.string().trim().max(200).optional(),
  culturalContext: z.string().trim().min(1).max(3000),
  educationalObjective: z.string().trim().min(1).max(1000),
  sourceLanguage: languageSchema,
});
export type CaptureInput = z.infer<typeof storyInputSchema>;
export const MAX_AUDIO_SECONDS = 120;
export const MAX_AUDIO_BYTES = 44 + 16000 * MAX_AUDIO_SECONDS * 2;

// Only canonical mono PCM WAV from the browser normalizer crosses the server
// boundary. Its exact frame count provides a trustworthy duration bound.
export function validateCaptureWav(bytes: Uint8Array): number {
  if (bytes.length < 46 || bytes.length > MAX_AUDIO_BYTES) throw new Error("Audio must be a nonempty recording of at most two minutes.");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const text = (start: number, length: number) => String.fromCharCode(...bytes.subarray(start, start + length));
  if (text(0, 4) !== "RIFF" || text(8, 4) !== "WAVE" || text(12, 4) !== "fmt " || text(36, 4) !== "data" ||
    view.getUint32(4, true) !== bytes.length - 8 || view.getUint32(16, true) !== 16 || view.getUint16(20, true) !== 1 ||
    view.getUint16(22, true) !== 1 || view.getUint32(24, true) !== 16000 || view.getUint32(28, true) !== 32000 ||
    view.getUint16(32, true) !== 2 || view.getUint16(34, true) !== 16 || view.getUint32(40, true) !== bytes.length - 44 ||
    (bytes.length - 44) % 2) throw new Error("Use a normalized 16 kHz mono PCM recording.");
  return (bytes.length - 44) / 32000;
}

export function encodeCaptureWav(samples: Float32Array, inputRate: number): Uint8Array {
  if (!Number.isFinite(inputRate) || inputRate < 8000 || samples.length / inputRate > MAX_AUDIO_SECONDS || !samples.length) throw new Error("Use a recording of at most two minutes.");
  const frames = Math.floor(samples.length * 16000 / inputRate);
  const bytes = new Uint8Array(44 + frames * 2);
  const view = new DataView(bytes.buffer);
  const text = (at: number, value: string) => [...value].forEach((char, i) => { bytes[at + i] = char.charCodeAt(0); });
  text(0, "RIFF"); view.setUint32(4, bytes.length - 8, true); text(8, "WAVE"); text(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, 16000, true); view.setUint32(28, 32000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  text(36, "data"); view.setUint32(40, frames * 2, true);
  for (let i = 0; i < frames; i++) {
    const sample = Math.max(-1, Math.min(1, samples[Math.min(samples.length - 1, Math.floor(i * inputRate / 16000))] || 0));
    view.setInt16(44 + i * 2, Math.round(sample * 32767), true);
  }
  validateCaptureWav(bytes);
  return bytes;
}
