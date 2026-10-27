"use client";

import Link from "next/link";
import { Row } from "@/components/Row";
import { resumeTarget, watchHref } from "@/lib/catalog";
import { thumbnailUrl } from "@/lib/stream";
import type { TitleWithEpisodes, WatchProgress } from "@/lib/types";

type Item = WatchProgress & { title: TitleWithEpisodes; label: string };

export function ContinueWatching({ titles, progress }: { titles: TitleWithEpisodes[]; progress: WatchProgress[] }) {
  const items: Item[] = [];
  const seenTitles = new Set<string>();
  for (const p of progress) {
    const title = titles.find((t) => t.video_uid === p.video_uid || t.episodes.some((e) => e.video_uid === p.video_uid));
    if (!title || seenTitles.has(title.id)) continue;
    seenTitles.add(title.id);
    // Bölüm bittiyse sıradaki bölümü göster
    const target = resumeTarget(title, progress);
    if (!target?.resumed) continue;
    const episode = title.episodes.find((e) => e.video_uid === target.videoUid);
    const own = progress.find((x) => x.video_uid === target.videoUid);
    items.push({
      video_uid: target.videoUid,
      position_seconds: own?.position_seconds ?? 0,
      duration_seconds: own?.duration_seconds ?? null,
      title,
      label: episode ? `S${episode.season}:B${episode.number}` : "",
    });
  }

  if (items.length === 0) return null;

  return (
    <Row heading="▶️ İzlemeye devam et">
      {items.map((item) => {
        const percent = item.duration_seconds ? (item.position_seconds / item.duration_seconds) * 100 : 0;
        return (
          <Link
            key={item.video_uid}
            href={watchHref(item.video_uid)}
            className="group relative aspect-video w-56 shrink-0 snap-start overflow-hidden rounded-2xl bg-surface ring-2 ring-transparent transition duration-300 hover:-translate-y-1 hover:ring-accent sm:w-72"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnailUrl(item.video_uid)}
              alt=""
              loading="lazy"
              className={`h-full w-full transition duration-300 group-hover:scale-105 ${
                item.title.orientation === "vertical" ? "object-contain bg-black" : "object-cover"
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
            <span className="absolute inset-0 m-auto flex h-12 w-12 items-center justify-center bg-brand rounded-full text-xl shadow-lg opacity-0 transition group-hover:opacity-100">
              ▶
            </span>
            <p className="absolute inset-x-2 bottom-3 truncate text-sm font-semibold">
              {item.title.name} {item.label && <span className="font-normal text-white/70">{item.label}</span>}
            </p>
            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-white/20">
              <div className="bg-brand h-full rounded-full" style={{ width: `${percent}%` }} />
            </div>
          </Link>
        );
      })}
    </Row>
  );
}
