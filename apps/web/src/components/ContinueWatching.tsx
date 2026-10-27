"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Row } from "@/components/Row";
import { watchHref } from "@/lib/catalog";
import { thumbnailUrl } from "@/lib/stream";
import { supabase } from "@/lib/supabase";
import type { TitleWithEpisodes, WatchProgress } from "@/lib/types";
import { useSession } from "@/lib/useSession";

type Item = WatchProgress & { title: TitleWithEpisodes; label: string };

export function ContinueWatching({ titles }: { titles: TitleWithEpisodes[] }) {
  const { session } = useSession();
  const userId = session?.user.id;
  const [progress, setProgress] = useState<WatchProgress[]>([]);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("watch_progress")
      .select("video_uid, position_seconds, duration_seconds")
      .order("updated_at", { ascending: false })
      .limit(30)
      .then(({ data }) => setProgress(data ?? []));
  }, [userId]);

  const items: Item[] = [];
  const seenTitles = new Set<string>();
  for (const p of progress) {
    // Bitmiş videoları gösterme
    if (p.duration_seconds && p.position_seconds > p.duration_seconds - 30) continue;
    for (const title of titles) {
      const episode = title.episodes.find((e) => e.video_uid === p.video_uid);
      if (title.video_uid !== p.video_uid && !episode) continue;
      // Her diziden sadece en son izlenen bölüm
      if (seenTitles.has(title.id)) break;
      seenTitles.add(title.id);
      items.push({ ...p, title, label: episode ? `S${episode.season}:B${episode.number}` : "" });
      break;
    }
  }

  if (!userId || items.length === 0) return null;

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
