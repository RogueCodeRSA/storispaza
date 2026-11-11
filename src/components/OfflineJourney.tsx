"use client";
import type { ReaderBook } from "@/domain/reader";
import type { Story } from "@/domain/story";
import MockJourney from "./MockJourney";
import LocalLibrary from "./LocalLibrary";

export default function OfflineJourney({ book, story }: { book?: ReaderBook; story?: Story }) {
  if (!book || !story) return <MockJourney />;
  return <LocalLibrary book={book} story={story} startInReader />;
}
