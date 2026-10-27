"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { VideoPlayer } from "@/components/VideoPlayer";
import { watchHref } from "@/lib/catalog";
import { thumbnailUrl } from "@/lib/stream";
import type { WatchContext } from "@/lib/watchContext";

// Dikey diziler için kısa video uygulamaları gibi tam ekran akış:
// yukarı kaydırınca sonraki bölüm gelir, bölüm bitince kendiliğinden geçer.
export function VerticalFeed({ context, startUid }: { context: WatchContext; startUid: string }) {
  const { title } = context;
  const episodes = useMemo(
    () =>
      context.episodes.length
        ? context.episodes
        : [{ id: title.id, video_uid: startUid, season: 1, number: 1, name: null }],
    [context.episodes, title.id, startUid],
  );
  const startIndex = Math.max(0, episodes.findIndex((e) => e.video_uid === startUid));
  const [active, setActive] = useState(startIndex);
  const slides = useRef<(HTMLDivElement | null)[]>([]);

  // Başlangıç bölümüne atla
  useEffect(() => {
    slides.current[startIndex]?.scrollIntoView();
  }, [startIndex]);

  // Ekranda görünen bölümü etkin yap
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.index);
          setActive(index);
          window.history.replaceState(null, "", watchHref(episodes[index].video_uid));
        }
      },
      { threshold: 0.6 },
    );
    slides.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [episodes]);

  const goTo = (index: number) => slides.current[index]?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="no-scrollbar fixed inset-0 snap-y snap-mandatory overflow-y-scroll bg-black">
      <Link href={`/title/${title.id}`} className="fixed left-4 top-4 z-20 text-3xl drop-shadow" aria-label="Geri">
        ←
      </Link>

      {episodes.map((episode, index) => (
        <div
          key={episode.video_uid}
          ref={(el) => {
            slides.current[index] = el;
          }}
          data-index={index}
          className="relative flex h-dvh snap-start snap-always items-center justify-center"
        >
          <div className="relative aspect-[9/16] h-full max-w-full">
            {index === active ? (
              <VideoPlayer
                key={episode.video_uid}
                videoUid={episode.video_uid}
                onEnded={() => goTo(index + 1)}
                className="h-full w-full"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbnailUrl(episode.video_uid)} alt="" loading="lazy" className="h-full w-full object-cover" />
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-16 px-4">
              <p className="font-bold drop-shadow">{title.name}</p>
              <p className="text-sm text-white/80 drop-shadow">
                Bölüm {episode.number} / {episodes.length}
              </p>
            </div>
          </div>

          <div className="absolute right-4 top-1/2 hidden -translate-y-1/2 flex-col gap-3 md:flex">
            <button
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
              className="h-12 w-12 rounded-full bg-white/15 text-xl transition hover:scale-110 hover:bg-white/25 disabled:opacity-30"
              aria-label="Önceki bölüm"
            >
              ↑
            </button>
            <button
              onClick={() => goTo(index + 1)}
              disabled={index === episodes.length - 1}
              className="bg-brand h-12 w-12 rounded-full text-xl shadow-lg shadow-accent/40 transition hover:scale-110 disabled:opacity-30"
              aria-label="Sonraki bölüm"
            >
              ↓
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
