import { encodeCaptureWav, MAX_AUDIO_SECONDS } from "@/domain/capture";

export async function normalizeBrowserAudio(blob: Blob): Promise<Uint8Array> {
  if (!blob.size || blob.size > 10 * 1024 * 1024) throw new Error("Choose a nonempty audio file smaller than 10 MB.");
  if (!window.AudioContext) throw new Error("Audio decoding is unavailable. Use manual text instead.");
  const context = new AudioContext();
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    if (decoded.duration > MAX_AUDIO_SECONDS) throw new Error("Use an English recording of two minutes or less.");
    const mono = new Float32Array(decoded.length);
    for (let channel = 0; channel < decoded.numberOfChannels; channel++) {
      const samples = decoded.getChannelData(channel);
      for (let i = 0; i < mono.length; i++) mono[i] += samples[i] / decoded.numberOfChannels;
    }
    return encodeCaptureWav(mono, decoded.sampleRate);
  } finally { await context.close(); }
}
