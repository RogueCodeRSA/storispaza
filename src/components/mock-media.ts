// Small deterministic symbols/tones, not AI illustrations, voices or pronunciation.
export function placeholderImage(pageNumber: number, revision = 0): string {
  const page = Math.max(1, Math.min(6, Math.trunc(pageNumber)));
  const color = revision % 2 ? "#d9b384" : "#e1ad4e";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400"><rect width="640" height="400" rx="24" fill="#f1e4c9"/><circle cx="320" cy="185" r="120" fill="${color}"/><path d="M180 190Q250 165 320 205Q390 165 460 190V305Q390 280 320 320Q250 280 180 305Z" fill="#fffaf0" stroke="#203e35" stroke-width="7"/><path d="M320 205V320M325 75L300 125H325L310 160L350 110H325Z" stroke="#203e35" stroke-width="5" fill="#203e35"/><text x="320" y="365" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#203e35">Page ${page} · placeholder ${revision + 1}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function placeholderTone(): string {
  const rate = 8000;
  const samples = rate * 6;
  const bytes = new Uint8Array(44 + samples * 2);
  const view = new DataView(bytes.buffer);
  const text = (offset: number, value: string) => [...value].forEach((char, i) => bytes[offset + i] = char.charCodeAt(0));
  text(0, "RIFF"); view.setUint32(4, 36 + samples * 2, true); text(8, "WAVE"); text(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  text(36, "data"); view.setUint32(40, samples * 2, true);
  for (let i = 0; i < samples; i++) {
    const beat = i % rate;
    const envelope = beat < rate * .45 ? Math.sin(Math.PI * beat / (rate * .45)) : 0;
    view.setInt16(44 + i * 2, Math.round(Math.sin(2 * Math.PI * (330 + Math.floor(i / rate) % 3 * 55) * i / rate) * envelope * 1500), true);
  }
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `data:audio/wav;base64,${btoa(binary)}`;
}
