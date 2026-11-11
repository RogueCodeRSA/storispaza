import { readFileSync } from "node:fs";
import { reviewedSpeechPack } from "../../../scripts/reviewed-speech.mjs";
import LocalLibrary from "@/components/LocalLibrary";
export const dynamic = "force-dynamic";
export default function LibraryPage() {
  const { book, manifest } = reviewedSpeechPack(readFileSync);
  return <LocalLibrary book={book} story={manifest.story} />;
}
