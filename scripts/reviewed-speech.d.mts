import type { ReaderBook } from "../src/domain/reader";
import type { Story } from "../src/domain/story";
export function reviewedSpeechPack(read: (path: string) => Buffer): { manifest: { story: Story; [key: string]: unknown }; book: ReaderBook; files: Map<string, Buffer> };
