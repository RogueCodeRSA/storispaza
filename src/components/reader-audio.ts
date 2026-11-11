"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReaderTrack } from "@/domain/reader";

export type AudioPhase = "idle" | "loading" | "playing" | "paused" | "buffering" | "ended" | "error";
// One media element owns narration, word taps and interaction clips. Switching
// tracks saves position and cancels the earlier completion callback.
export function useReaderAudio() {
  const element = useRef<HTMLAudioElement | null>(null);
  const active = useRef<ReaderTrack | null>(null);
  const positions = useRef(new Map<string, number>());
  const cleanup = useRef<(() => void) | null>(null);
  const generation = useRef(0);
  const wanted = useRef(false);
  const [phase, setPhase] = useState<AudioPhase>("idle");
  const [track, setTrack] = useState<ReaderTrack | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [notice, setNotice] = useState("Audio stopped. Choose a page or read silently.");
  const remember = useCallback(() => {
    if (active.current && element.current && element.current.readyState >= 1 && Number.isFinite(element.current.currentTime)) positions.current.set(active.current.id, element.current.currentTime);
  }, []);
  const stop = useCallback(() => {
    generation.current++; wanted.current = false; remember(); cleanup.current?.(); cleanup.current = null;
    element.current?.pause();
    if (element.current) { element.current.removeAttribute("src"); element.current.load(); }
    active.current = null; setTrack(null); setPhase("idle"); setElapsed(0); setNotice("Audio stopped. You can continue reading.");
  }, [remember]);
  useEffect(() => {
    const media = element.current;
    return () => { wanted.current = false; cleanup.current?.(); media?.pause(); media?.removeAttribute("src"); };
  }, []);
  async function play(next: ReaderTrack, label: string, finished?: () => void, failed?: () => void) {
    const media = element.current; if (!media) return;
    remember(); cleanup.current?.(); cleanup.current = null; media.pause();
    const token = ++generation.current; wanted.current = true;
    const savedPosition = positions.current.get(next.id) ?? 0;
    const same = active.current?.id === next.id && media.getAttribute("src") === next.url && !media.error;
    active.current = next; setTrack(next); setPhase("loading"); setNotice(`Loading ${label}. Reading can continue while audio loads.`);
    let completed = false;
    const current = () => token === generation.current;
    const restore = () => {
      if (!current()) return;
      if (savedPosition > 0 && Number.isFinite(media.duration)) media.currentTime = Math.min(savedPosition, Math.max(0, media.duration - .05));
    };
    const time = () => { if (current() && media.readyState >= 1) { setElapsed(media.currentTime); positions.current.set(next.id, media.currentTime); } };
    const playing = () => { if (current() && wanted.current && !media.paused) { setPhase("playing"); setNotice(`Playing ${label}.`); } };
    const waiting = () => { if (current() && wanted.current) { setPhase("buffering"); setNotice(`Buffering ${label}. Your position is kept; you can pause or read silently.`); } };
    const ended = () => { if (current() && !completed) { completed = true; wanted.current = false; positions.current.set(next.id, 0); setElapsed(next.seconds); setPhase("ended"); setNotice(`Finished ${label}.`); finished?.(); } };
    const error = () => { if (current() && !completed) { completed = true; wanted.current = false; remember(); setPhase("error"); setNotice(`Audio unavailable for ${label}. Continue with text, or retry from the saved position.`); failed?.(); } };
    media.addEventListener("loadedmetadata", restore); media.addEventListener("timeupdate", time); media.addEventListener("playing", playing);
    media.addEventListener("waiting", waiting); media.addEventListener("stalled", waiting); media.addEventListener("ended", ended); media.addEventListener("error", error);
    cleanup.current = () => { media.removeEventListener("loadedmetadata", restore); media.removeEventListener("timeupdate", time); media.removeEventListener("playing", playing); media.removeEventListener("waiting", waiting); media.removeEventListener("stalled", waiting); media.removeEventListener("ended", ended); media.removeEventListener("error", error); };
    if (!same) { media.src = next.url; media.preload = "metadata"; media.load(); } else if (media.ended) { media.currentTime = 0; }
    setElapsed(positions.current.get(next.id) ?? 0);
    try { await media.play(); } catch { if (current() && wanted.current) error(); }
  }
  function pause() {
    wanted.current = false; remember(); element.current?.pause(); setPhase("paused"); setNotice("Audio paused. Your position is kept; choose Resume when ready.");
  }
  function seek(seconds: number) {
    const media = element.current;
    if (media && active.current && Number.isFinite(media.duration)) {
      media.currentTime = Math.max(0, Math.min(seconds, media.duration)); remember(); setElapsed(media.currentTime);
    }
  }
  return { element, phase, track, elapsed, notice, play, pause, stop, seek };
}
