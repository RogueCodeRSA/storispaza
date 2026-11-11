"use client";
import { useState } from "react";
import type { ReaderBook } from "@/domain/reader";
import type { Story } from "@/domain/story";
import MockJourney from "./MockJourney";
import StoryPlayer from "./StoryPlayer";

export default function OfflineJourney({ book, story }: { book?: ReaderBook; story?: Story }) {
  const [editing, setEditing] = useState(false);
  if (!book) return <MockJourney />;
  if (editing) return <MockJourney seed={story} onReturn={() => setEditing(false)} />;
  return <StoryPlayer mode="real" initialBook={book} onCreateCopy={() => setEditing(true)} />;
}
